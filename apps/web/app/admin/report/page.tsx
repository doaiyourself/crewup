"use client";

// 통계 리포트: 최근 6개월 인건비/근무시간 추이 + 선택 월 직원별 상세
import { useCallback, useEffect, useState } from "react";
import { useSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/client";
import { computePayroll } from "@crewup/core";
import { won, wonShort } from "@/lib/format";
import { PageHeader, Card, LogoutButton, Avatar } from "@/components/ui";

interface Member {
  user_id: string;
  name: string;
  avatar_color: string;
  hourly_wage: number;
}
interface Att {
  user_id: string;
  work_date: string;
  clock_in_at: string | null;
  clock_out_at: string | null;
}

function mins(a: string | null, b: string | null) {
  if (!a || !b) return 0;
  return Math.max(0, Math.round((+new Date(b) - +new Date(a)) / 60000));
}
function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function lastMonths(n: number): string[] {
  const out: string[] = [];
  const d = new Date();
  for (let i = n - 1; i >= 0; i--) {
    out.push(monthKey(new Date(d.getFullYear(), d.getMonth() - i, 1)));
  }
  return out;
}

export default function ReportPage() {
  const { currentStoreId } = useSession();
  const [members, setMembers] = useState<Member[]>([]);
  const [att, setAtt] = useState<Att[]>([]);
  const [loading, setLoading] = useState(true);
  const months = lastMonths(6);
  const [selected, setSelected] = useState(months[months.length - 1]);

  const load = useCallback(async () => {
    if (!currentStoreId || currentStoreId === "demo-store") {
      setLoading(false);
      return;
    }
    const supabase = createClient();
    const since = months[0] + "-01";
    const [{ data: m }, { data: a }] = await Promise.all([
      supabase.rpc("list_store_members", { p_store_id: currentStoreId }),
      supabase
        .from("attendance")
        .select("user_id, work_date, clock_in_at, clock_out_at")
        .eq("store_id", currentStoreId)
        .gte("work_date", since),
    ]);
    setMembers((m as Member[]) ?? []);
    setAtt((a as Att[]) ?? []);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStoreId]);

  useEffect(() => {
    load();
  }, [load]);

  const wage = new Map(members.map((m) => [m.user_id, m.hourly_wage]));

  // 월별 집계
  const monthly = months.map((mk) => {
    const rows = att.filter((r) => r.work_date.startsWith(mk));
    const totalMin = rows.reduce((s, r) => s + mins(r.clock_in_at, r.clock_out_at), 0);
    const labor = rows.reduce(
      (s, r) => s + (mins(r.clock_in_at, r.clock_out_at) / 60) * (wage.get(r.user_id) ?? 0),
      0
    );
    const workers = new Set(rows.filter((r) => r.clock_in_at).map((r) => r.user_id))
      .size;
    return { mk, labor: Math.round(labor), hours: Math.round(totalMin / 60), workers };
  });
  const maxLabor = Math.max(...monthly.map((x) => x.labor), 1);

  // 선택 월 직원별
  const selRows = att.filter((r) => r.work_date.startsWith(selected));
  const perMember = members
    .map((m) => {
      const min = selRows
        .filter((r) => r.user_id === m.user_id)
        .reduce((s, r) => s + mins(r.clock_in_at, r.clock_out_at), 0);
      const days = new Set(
        selRows.filter((r) => r.user_id === m.user_id && r.clock_in_at).map((r) => r.work_date)
      ).size;
      return { ...m, min, days, pay: computePayroll(min, m.hourly_wage) };
    })
    .filter((x) => x.min > 0)
    .sort((a, b) => b.min - a.min);

  const selData = monthly.find((x) => x.mk === selected);

  return (
    <>
      <PageHeader title="통계 리포트" subtitle="최근 6개월" right={<LogoutButton light />} />

      <div className="px-4 pt-4">
        {loading ? (
          <Card className="py-10 text-center text-sm text-slate-400">불러오는 중…</Card>
        ) : (
          <>
            {/* 월별 인건비 추이 */}
            <h2 className="mb-2 px-1 text-sm font-bold text-slate-500">
              월별 인건비 추이
            </h2>
            <Card className="space-y-2.5">
              {monthly.map((x) => (
                <button
                  key={x.mk}
                  onClick={() => setSelected(x.mk)}
                  className="flex w-full items-center gap-3"
                >
                  <span
                    className={`w-10 shrink-0 text-xs font-medium ${
                      x.mk === selected ? "text-brand" : "text-slate-500"
                    }`}
                  >
                    {Number(x.mk.slice(5))}월
                  </span>
                  <div className="h-6 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`flex h-full items-center justify-end rounded-full pr-2 text-[10px] font-bold text-white ${
                        x.mk === selected ? "bg-brand" : "bg-brand/50"
                      }`}
                      style={{ width: `${Math.max((x.labor / maxLabor) * 100, 8)}%` }}
                    >
                      {x.labor > 0 ? wonShort(x.labor) : ""}
                    </div>
                  </div>
                </button>
              ))}
            </Card>

            {/* 선택 월 요약 */}
            <h2 className="mb-2 mt-5 px-1 text-sm font-bold text-slate-500">
              {Number(selected.slice(5))}월 요약
            </h2>
            <div className="grid grid-cols-3 gap-3">
              <Card className="text-center">
                <p className="text-xs text-slate-500">인건비</p>
                <p className="mt-1 text-lg font-extrabold text-slate-900">
                  {wonShort(selData?.labor ?? 0)}
                </p>
              </Card>
              <Card className="text-center">
                <p className="text-xs text-slate-500">총 근무</p>
                <p className="mt-1 text-lg font-extrabold text-slate-900">
                  {selData?.hours ?? 0}
                  <span className="text-xs font-normal text-slate-400">시간</span>
                </p>
              </Card>
              <Card className="text-center">
                <p className="text-xs text-slate-500">근무 인원</p>
                <p className="mt-1 text-lg font-extrabold text-slate-900">
                  {selData?.workers ?? 0}
                  <span className="text-xs font-normal text-slate-400">명</span>
                </p>
              </Card>
            </div>

            {/* 직원별 상세 */}
            <h2 className="mb-2 mt-5 px-1 text-sm font-bold text-slate-500">
              직원별 ({Number(selected.slice(5))}월)
            </h2>
            <div className="space-y-2.5 pb-2">
              {perMember.length === 0 ? (
                <Card className="py-8 text-center text-sm text-slate-400">
                  해당 월 근무 기록이 없어요.
                </Card>
              ) : (
                perMember.map((m) => (
                  <Card key={m.user_id} className="flex items-center gap-3">
                    <Avatar name={m.name} color={m.avatar_color} />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900">{m.name}</p>
                      <p className="text-xs text-slate-500">
                        {m.days}일 · {m.pay.totalHours}시간
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-bold text-slate-900">
                      {wonShort(m.pay.net)}
                    </p>
                  </Card>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
