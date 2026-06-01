"use client";

import { useSession } from "@/lib/session";
import { getEmployee, getPayroll } from "@/lib/mock-data";
import { won, netPay, grossPay } from "@/lib/format";
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

export default function MyPayrollPage() {
  const { account } = useSession();
  if (!account) return null;

  const emp = getEmployee(account.id);
  const p = getPayroll(account.id);

  return (
    <>
      <PageHeader
        title="내 급여"
        subtitle="2026년 5월 급여명세"
        right={<LogoutButton />}
      />

      <div className="px-4 pt-4">
        {p && emp ? (
          <>
            {/* 실지급액 강조 */}
            <Card className="bg-brand text-white !ring-0">
              <p className="text-xs text-blue-100">실지급 예상액</p>
              <p className="mt-1 text-3xl font-extrabold">{won(netPay(p))}</p>
              <p className="mt-1 text-xs text-blue-100">
                {p.status === "confirmed" ? "✓ 확정됨" : "정산 진행 중"} · 총{" "}
                {p.totalHours}시간 · {won(emp.hourlyWage)}/시간
              </p>
            </Card>

            <h2 className="mb-1 mt-5 px-1 text-sm font-bold text-slate-500">
              지급 내역
            </h2>
            <Card className="!py-2">
              <Row label="기본급" value={won(p.basePay)} />
              <Row label="주휴수당" value={won(p.weeklyAllowance)} />
              <Row
                label="야간·연장 가산"
                value={won(p.nightAllowance)}
              />
              <div className="border-t border-slate-100" />
              <Row label="지급 합계" value={won(grossPay(p))} strong />
            </Card>

            <h2 className="mb-1 mt-5 px-1 text-sm font-bold text-slate-500">
              공제 내역
            </h2>
            <Card className="!py-2">
              <Row label="4대보험·소득세" value={won(p.deduction)} minus />
              <div className="border-t border-slate-100" />
              <Row label="실지급액" value={won(netPay(p))} strong />
            </Card>

            <button className="mt-4 w-full rounded-xl border border-slate-300 bg-white py-3 text-sm font-semibold text-slate-700 transition active:scale-[0.98]">
              📄 급여명세서 PDF 받기
            </button>
          </>
        ) : (
          <Card>
            <p className="text-center text-sm text-slate-400">
              급여 내역이 없습니다.
            </p>
          </Card>
        )}
      </div>
    </>
  );
}
