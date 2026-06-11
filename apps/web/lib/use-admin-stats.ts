"use client";

// 관리자 대시보드 실데이터 집계 (attendance + 멤버).
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Role } from "@/lib/mock-data";

interface Member {
  user_id: string;
  name: string;
  avatar_color: string;
  role: Role;
  position: string | null;
  hourly_wage: number;
}
interface Att {
  user_id: string;
  work_date: string;
  clock_in_at: string | null;
  clock_out_at: string | null;
}

export interface RealtimeWorker {
  user_id: string;
  name: string;
  avatar_color: string;
  role: Role;
  position: string | null;
  clock_in_at: string | null;
}

interface Sched {
  user_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export type RosterStatus = "working" | "done" | "scheduled";
export interface RosterEntry {
  user_id: string;
  name: string;
  avatar_color: string;
  role: Role;
  status: RosterStatus;
  start: string | null; // "HH:MM"
  end: string | null;
  clock_in_at: string | null;
  offSchedule: boolean; // 스케줄 없이 출근(변경근무)
}

export interface AdminStats {
  loading: boolean;
  total: number;
  working: number;
  done: number;
  attendedRate: number;
  realtime: RealtimeWorker[];
  roster: RosterEntry[];
  laborCost: number;
  weekTop: { name: string; color: string; hours: number }[];
}

function ymd(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
function mins(a: string | null, b: string | null): number {
  if (!a || !b) return 0;
  return Math.max(0, Math.round((+new Date(b) - +new Date(a)) / 60000));
}

export function useAdminStats(storeId: string | null): AdminStats {
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [att, setAtt] = useState<Att[]>([]);
  const [scheds, setScheds] = useState<Sched[]>([]);

  const load = useCallback(async () => {
    if (!storeId || storeId === "demo-store") {
      setLoading(false);
      return;
    }
    const supabase = createClient();
    const monthStart = ymd(new Date()).slice(0, 8) + "01";
    const todayDow = new Date().getDay();
    const [{ data: m }, { data: a }, { data: s }] = await Promise.all([
      supabase.rpc("list_store_members", { p_store_id: storeId }),
      supabase
        .from("attendance")
        .select("user_id, work_date, clock_in_at, clock_out_at")
        .eq("store_id", storeId)
        .gte("work_date", monthStart),
      supabase
        .from("schedules")
        .select("user_id, day_of_week, start_time, end_time")
        .eq("store_id", storeId)
        .eq("day_of_week", todayDow),
    ]);
    setMembers((m as Member[]) ?? []);
    setAtt((a as Att[]) ?? []);
    setScheds((s as Sched[]) ?? []);
    setLoading(false);
  }, [storeId]);

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load]);

  const today = ymd(new Date());
  const weekAgo = ymd(new Date(Date.now() - 6 * 86400000));
  const wage = new Map(members.map((m) => [m.user_id, m.hourly_wage]));
  const byUser = new Map(members.map((m) => [m.user_id, m]));

  const todayRows = att.filter((r) => r.work_date === today);
  const workingIds = new Set(
    todayRows.filter((r) => r.clock_in_at && !r.clock_out_at).map((r) => r.user_id)
  );
  const doneIds = new Set(
    todayRows.filter((r) => r.clock_out_at).map((r) => r.user_id)
  );

  const total = members.length;
  const working = workingIds.size;
  const done = doneIds.size;
  const attended = working + done;
  const attendedRate = total ? Math.round((attended / total) * 100) : 0;

  const realtime: RealtimeWorker[] = Array.from(workingIds)
    .map((id) => {
      const m = byUser.get(id);
      const row = todayRows.find((r) => r.user_id === id);
      return m
        ? {
            user_id: id,
            name: m.name,
            avatar_color: m.avatar_color,
            role: m.role,
            position: m.position,
            clock_in_at: row?.clock_in_at ?? null,
          }
        : null;
    })
    .filter(Boolean) as RealtimeWorker[];

  // 오늘 근무자 로스터: 오늘 스케줄 있는 사람 + 오늘 출근 기록 있는 사람
  const hhmm = (t: string | null) => (t ? t.slice(0, 5) : null);
  const rosterIds = new Set<string>();
  scheds.forEach((s) => rosterIds.add(s.user_id));
  todayRows.forEach(
    (r) => (r.clock_in_at || r.clock_out_at) && rosterIds.add(r.user_id)
  );
  const statusOrder: Record<RosterStatus, number> = {
    working: 0,
    scheduled: 1,
    done: 2,
  };
  const roster: RosterEntry[] = (Array.from(rosterIds)
    .map((id) => {
      const m = byUser.get(id);
      if (!m) return null;
      const s = scheds.find((x) => x.user_id === id);
      const row = todayRows.find((r) => r.user_id === id);
      const status: RosterStatus = workingIds.has(id)
        ? "working"
        : doneIds.has(id)
        ? "done"
        : "scheduled";
      return {
        user_id: id,
        name: m.name,
        avatar_color: m.avatar_color,
        role: m.role,
        status,
        start: s ? hhmm(s.start_time) : null,
        end: s ? hhmm(s.end_time) : null,
        clock_in_at: row?.clock_in_at ?? null,
        offSchedule: !s,
      };
    })
    .filter(Boolean) as RosterEntry[]).sort(
    (a, b) =>
      statusOrder[a.status] - statusOrder[b.status] ||
      (a.start ?? "99").localeCompare(b.start ?? "99")
  );

  // 이번 달 인건비(예상): 완료된 근무시간 × 시급
  const laborCost = att.reduce(
    (sum, r) =>
      sum + (mins(r.clock_in_at, r.clock_out_at) / 60) * (wage.get(r.user_id) ?? 0),
    0
  );

  // 주간 근무시간 TOP5 (최근 7일)
  const weekMin = new Map<string, number>();
  att
    .filter((r) => r.work_date >= weekAgo)
    .forEach((r) =>
      weekMin.set(
        r.user_id,
        (weekMin.get(r.user_id) ?? 0) + mins(r.clock_in_at, r.clock_out_at)
      )
    );
  const weekTop = Array.from(weekMin.entries())
    .map(([id, mn]) => ({
      name: byUser.get(id)?.name ?? "?",
      color: byUser.get(id)?.avatar_color ?? "#94a3b8",
      hours: Math.round((mn / 60) * 10) / 10,
    }))
    .filter((x) => x.hours > 0)
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 5);

  return {
    loading,
    total,
    working,
    done,
    attendedRate,
    realtime,
    roster,
    laborCost: Math.round(laborCost),
    weekTop,
  };
}
