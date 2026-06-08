"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "@/lib/session";
import { useMyAttendance } from "@/lib/use-my-attendance";
import { createClient } from "@/lib/supabase/client";
import { computePayroll, type PayrollResult } from "@crewup/core";
import { won } from "@/lib/format";
import { PageHeader, Card, LogoutButton } from "@/components/ui";

function Row({
  label,
  value,
  strong,
  minus,
}: {
  label: string;
  value: string;
  strong?: boolean;
  minus?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className={`text-sm ${strong ? "font-bold text-slate-900" : "text-slate-500"}`}>
        {label}
      </span>
      <span
        className={`tabular-nums ${
          strong ? "text-base font-extrabold text-slate-900" : "text-sm font-medium"
        } ${minus ? "text-red-500" : "text-slate-800"}`}
      >
        {minus ? "-" : ""}
        {value}
      </span>
    </div>
  );
}

function ymLabel(): string {
  const d = new Date();
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
}

export default function MyPayrollPage() {
  const { account, currentStoreId } = useSession();
  const { stats, loading } = useMyAttendance(currentStoreId);
  const [wage, setWage] = useState<number | null>(null);

  useEffect(() => {
    if (!currentStoreId || currentStoreId === "demo-store" || !account) return;
    const supabase = createClient();
    supabase
      .from("memberships")
      .select("hourly_wage")
      .eq("store_id", currentStoreId)
      .eq("user_id", account.id)
      .maybeSingle()
      .then(({ data }) => setWage(data?.hourly_wage ?? null));
  }, [currentStoreId, account]);

  if (!account) return null;

  const p: PayrollResult | null =
    wage != null ? computePayroll(stats.totalMinutes, wage) : null;

  return (
    <>
      <PageHeader title="내 급여" subtitle={`${ymLabel()} 예상`} right={<LogoutButton />} />

      <div className="px-4 pt-4">
        {loading || p === null ? (
          <Card className="py-10 text-center text-sm text-slate-400">
            {loading ? "불러오는 중…" : "급여 정보를 준비 중이에요."}
          </Card>
        ) : (
          <>
            <Card tone="brand">
              <p className="text-xs text-blue-100">실지급 예상액</p>
              <p className="mt-1 text-3xl font-extrabold">{won(p.net)}</p>
              <p className="mt-1 text-xs text-blue-100">
                실근무 {p.totalHours}시간 · {won(wage ?? 0)}/시간
              </p>
            </Card>

            <h2 className="mb-1 mt-5 px-1 text-sm font-bold text-slate-500">
              지급 내역
            </h2>
            <Card className="!py-2">
              <Row label="기본급" value={won(p.basePay)} />
              <Row label="주휴수당" value={won(p.weeklyAllowance)} />
              <Row label="야간·연장 가산" value={won(p.nightAllowance)} />
              <div className="border-t border-slate-100" />
              <Row label="지급 합계" value={won(p.gross)} strong />
            </Card>

            <h2 className="mb-1 mt-5 px-1 text-sm font-bold text-slate-500">
              공제 내역
            </h2>
            <Card className="!py-2">
              <Row label="4대보험·소득세" value={won(p.deduction)} minus />
              <div className="border-t border-slate-100" />
              <Row label="실지급액" value={won(p.net)} strong />
            </Card>

            <Link
              href="/payslip"
              className="mt-4 block w-full rounded-xl border border-slate-300 bg-white py-3 text-center text-sm font-semibold text-slate-700 transition active:scale-[0.98]"
            >
              📄 급여명세서 보기 / 인쇄
            </Link>

            <p className="mt-3 px-1 text-center text-[11px] text-slate-400">
              실근무 기록 기반 추정치입니다. 확정 급여는 사장님 정산 후 안내됩니다.
            </p>
          </>
        )}
      </div>
    </>
  );
}
