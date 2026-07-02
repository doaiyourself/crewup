"use client";
import { setCachedMembers } from "@/lib/members-cache";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/client";
import { computePayroll } from "@crewup/core";
import { won, wonShort } from "@/lib/format";
import { PageHeader, Card, Avatar, AccountBadge } from "@/components/ui";

interface Line {
  user_id: string;
  name: string;
  color: string;
  wage: number;
  minutes: number;
  weeklyIncluded: boolean;
  wageType: "hourly" | "monthly";
  insurance: boolean;
}

function minutesBetween(a: string | null, b: string | null): number {
  if (!a || !b) return 0;
  return Math.max(0, Math.round((+new Date(b) - +new Date(a)) / 60000));
}
function curYm() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function ymLabel(ym: string) {
  const [y, m] = ym.split("-");
  return `${y}년 ${Number(m)}월`;
}
function shiftYm(ym: string, delta: number) {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function monthStartOf(ym: string) {
  return `${ym}-01`;
}
function nextMonthStartOf(ym: string) {
  return `${shiftYm(ym, 1)}-01`;
}

export default function AdminPayrollPage() {
  const { currentStoreId } = useSession();
  const [lines, setLines] = useState<Line[]>([]);
  const [loading, setLoading] = useState(true);
  const [ym, setYm] = useState(curYm());
  const isCurrent = ym === curYm();

  const load = useCallback(async () => {
    if (!currentStoreId || currentStoreId === "demo-store") {
      setLoading(false);
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const monthStart = monthStartOf(ym);
    const [{ data: members }, { data: att }] = await Promise.all([
      supabase.rpc("list_store_members", { p_store_id: currentStoreId }),
      supabase
        .from("attendance")
        .select("user_id, clock_in_at, clock_out_at")
        .eq("store_id", currentStoreId)
        .gte("work_date", monthStart)
        .lt("work_date", nextMonthStartOf(ym)),
    ]);
    setCachedMembers(currentStoreId, (members as any[]) ?? []);
    const minByUser = new Map<string, number>();
    ((att as any[]) ?? []).forEach((r) =>
      minByUser.set(
        r.user_id,
        (minByUser.get(r.user_id) ?? 0) +
          minutesBetween(r.clock_in_at, r.clock_out_at)
      )
    );
    setLines(
      ((members as any[]) ?? []).map((m) => ({
        user_id: m.user_id,
        name: m.name,
        color: m.avatar_color,
        wage: m.hourly_wage,
        minutes: minByUser.get(m.user_id) ?? 0,
        weeklyIncluded: !!m.weekly_included,
        wageType: (m.wage_type as "hourly" | "monthly") ?? "hourly",
        insurance: !!m.insurance,
      }))
    );
    setLoading(false);
  }, [currentStoreId, ym]);

  useEffect(() => {
    load();
  }, [load]);

  const computed = lines.map((l) => ({
    ...l,
    pay: computePayroll(l.minutes, l.wage, {
      weeklyIncluded: l.weeklyIncluded,
      wageType: l.wageType,
      insurance: l.insurance,
    }),
  }));
  const totalGross = computed.reduce((a, c) => a + c.pay.gross, 0);
  const totalNet = computed.reduce((a, c) => a + c.pay.net, 0);

  return (
    <>
      <PageHeader title="급여 산정" subtitle={ymLabel(ym)} right={<AccountBadge light />} />

      <div className="px-4 pt-4">
        {/* 월 선택 */}
        <div className="mb-3 flex items-center justify-between rounded-xl bg-white px-2 py-1.5 ring-1 ring-slate-100">
          <button
            onClick={() => setYm((v) => shiftYm(v, -1))}
            className="rounded-lg px-3 py-1.5 text-lg font-bold text-slate-500 active:bg-slate-100"
            aria-label="이전 달"
          >
            ‹
          </button>
          <span className="text-sm font-bold text-slate-800">{ymLabel(ym)}</span>
          <button
            onClick={() => !isCurrent && setYm((v) => shiftYm(v, 1))}
            disabled={isCurrent}
            className="rounded-lg px-3 py-1.5 text-lg font-bold text-slate-500 active:bg-slate-100 disabled:text-slate-200"
            aria-label="다음 달"
          >
            ›
          </button>
        </div>

        {loading ? (
          <Card className="py-10 text-center text-sm text-slate-400">
            불러오는 중…
          </Card>
        ) : (
          <>
            <Card tone="brand">
              <p className="text-xs text-blue-100">
                {ymLabel(ym)} 총 인건비 (지급액 합계, 추정)
              </p>
              <p className="mt-1 text-3xl font-extrabold">{won(totalGross)}</p>
              <p className="mt-3 text-xs text-blue-100">
                실지급 합계 {wonShort(totalNet)} · 실근무 기록 기준
              </p>
            </Card>

            <h2 className="mb-2 mt-5 px-1 text-sm font-bold text-slate-500">
              직원별 급여 (추정)
            </h2>
            <div className="space-y-2.5 pb-2">
              {computed.map((c) => (
                <Link
                  key={c.user_id}
                  href={`/payslip?user=${c.user_id}&period=${ym}`}
                  className="block"
                >
                  <Card className="flex items-center gap-3">
                    <Avatar name={c.name} color={c.color} />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900">{c.name}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {c.wageType === "monthly"
                          ? `월급 ${wonShort(c.wage)}`
                          : `${c.pay.totalHours}시간 · ${won(c.wage)}/h · 주휴 ${
                              c.weeklyIncluded
                                ? "포함"
                                : wonShort(c.pay.weeklyAllowance)
                            }`}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-extrabold text-slate-900">
                        {wonShort(c.pay.net)}
                      </p>
                      <p className="text-[10px] text-slate-400">명세서 ›</p>
                    </div>
                  </Card>
                </Link>
              ))}
              {computed.length === 0 && (
                <Card className="py-8 text-center text-sm text-slate-400">
                  직원이 없습니다.
                </Card>
              )}
            </div>

            <p className="px-1 pb-2 text-center text-[11px] text-slate-400">
              실근무 기록 기반 추정치입니다. 주휴·공제는 간이 계산이며 확정 정산과 다를 수 있어요.
            </p>
          </>
        )}
      </div>
    </>
  );
}
