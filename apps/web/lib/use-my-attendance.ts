"use client";

// 본인 출퇴근 — 실제 attendance 테이블 (키오스크와 동일 테이블).
// 출퇴근 로직은 @crewup/core 의 공유 service 를 사용(클라이언트 주입).

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { createAttendanceService, type TodayAttendance } from "@crewup/core";

export interface DayRecord {
  date: string; // "YYYY-MM-DD"
  clockIn: string | null; // ISO
  clockOut: string | null; // ISO
}

export interface MonthStats {
  workedDays: number;
  totalMinutes: number;
}

const emptyToday: TodayAttendance = {
  status: "off",
  clockInAt: null,
  clockOutAt: null,
};

function minutesBetween(inIso: string | null, outIso: string | null): number {
  if (!inIso || !outIso) return 0;
  return Math.max(0, Math.round((+new Date(outIso) - +new Date(inIso)) / 60000));
}

export function useMyAttendance(storeId: string | null) {
  const [today, setToday] = useState<TodayAttendance>(emptyToday);
  const [history, setHistory] = useState<DayRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const real = !!storeId && storeId !== "demo-store";

  const load = useCallback(async () => {
    if (!real) {
      setLoading(false);
      return;
    }
    const supabase = createClient();
    const svc = createAttendanceService(supabase as any);
    const t = await svc.getToday(storeId as string);
    setToday(t);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("attendance")
        .select("work_date, clock_in_at, clock_out_at")
        .eq("store_id", storeId)
        .eq("user_id", user.id)
        .order("work_date", { ascending: false })
        .limit(31);
      setHistory(
        (data ?? []).map((r: any) => ({
          date: r.work_date,
          clockIn: r.clock_in_at,
          clockOut: r.clock_out_at,
        }))
      );
    }
    setLoading(false);
  }, [storeId, real]);

  useEffect(() => {
    load();
  }, [load]);

  const clockIn = useCallback(async () => {
    if (!real) return;
    setBusy(true);
    const supabase = createClient();
    await createAttendanceService(supabase as any).clockIn(storeId as string);
    await load();
    setBusy(false);
  }, [real, storeId, load]);

  const clockOut = useCallback(async () => {
    if (!real) return;
    setBusy(true);
    const supabase = createClient();
    await createAttendanceService(supabase as any).clockOut(storeId as string);
    await load();
    setBusy(false);
  }, [real, storeId, load]);

  // 이번 달 통계
  const ym = new Date().toISOString().slice(0, 7); // YYYY-MM (UTC 근사)
  const monthRecords = history.filter((r) => r.date.startsWith(ym));
  const stats: MonthStats = {
    workedDays: monthRecords.filter((r) => r.clockIn).length,
    totalMinutes: monthRecords.reduce(
      (a, r) => a + minutesBetween(r.clockIn, r.clockOut),
      0
    ),
  };

  return { today, history, stats, loading, busy, clockIn, clockOut, reload: load };
}

export { minutesBetween };
