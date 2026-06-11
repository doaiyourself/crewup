"use client";

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
}

function minutesBetween(a: string | null, b: string | null): number {
  if (!a || !b) return 0;
  return Math.max(0, Math.round((+new Date(b) - +new Date(a)) / 60000));
}
function ymLabel() {
  const d = new Date();
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
}

export default function AdminPayrollPage() {
  const { currentStoreId } = useSession();
  const [lines, setLines] = useState<Line[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!currentStoreId || currentStoreId === "demo-store") {
      setLoading(false);
      return;
    }
    const supabase = createClient();
    const monthStart = new Date().toISOString().slice(0, 8) + "01";
    const [{ data: members }, { data: att }] = await Promise.all([
      supabase.rpc("list_store_members", { p_store_id: currentStoreId }),
      supabase
        .from("attendance")
        .select("user_id, clock_in_at, clock_out_at")
        .eq("store_id", currentStoreId)
        .gte("work_date", monthStart),
    ]);
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
      }))
    );
    setLoading(false);
  }, [currentStoreId]);

  useEffect(() => {
    load();
  }, [load]);

  const computed = lines.map((l) => ({ ...l, pay: computePayroll(l.minutes, l.wage) }));
  const totalGross = computed.reduce((a, c) => a + c.pay.gross, 0);
  const totalNet = computed.reduce((a, c) => a + c.pay.net, 0);

  return (
    <>
      <PageHeader title="급여 산정" subtitle={ymLabel()} right={<AccountBadge light />} />

      <div className="px-4 pt-4">
        {loading ? (
          <Card className="py-10 text-center text-sm text-slate-400">
            불러오는 중…
          </Card>
        ) : (
          <>
            <Card tone="brand">
              <p className="text-xs text-blue-100">
                이번 달 총 인건비 (지급액 합계, 추정)
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
                  href={`/payslip?user=${c.user_id}`}
                  className="block"
                >
                  <Card className="flex items-center gap-3">
                    <Avatar name={c.name} color={c.color} />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900">{c.name}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {c.pay.totalHours}시간 · {won(c.wage)}/h · 주휴{" "}
                        {wonShort(c.pay.weeklyAllowance)}
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
