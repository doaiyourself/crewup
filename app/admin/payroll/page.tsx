"use client";

import { MOCK_EMPLOYEES, MOCK_PAYROLLS } from "@/lib/mock-data";
import { won, wonShort, netPay, grossPay } from "@/lib/format";
import { PageHeader, Card, Avatar, LogoutButton } from "@/components/ui";

export default function AdminPayrollPage() {
  const totalGross = MOCK_PAYROLLS.reduce((a, p) => a + grossPay(p), 0);
  const totalNet = MOCK_PAYROLLS.reduce((a, p) => a + netPay(p), 0);
  const confirmed = MOCK_PAYROLLS.filter((p) => p.status === "confirmed").length;
  const draft = MOCK_PAYROLLS.length - confirmed;

  return (
    <>
      <PageHeader
        title="급여 산정"
        subtitle="2026년 5월"
        right={<LogoutButton />}
      />

      <div className="px-4 pt-4">
        {/* 총 인건비 */}
        <Card tone="brand">
          <p className="text-xs text-blue-100">이번 달 총 인건비 (지급액 합계)</p>
          <p className="mt-1 text-3xl font-extrabold">{won(totalGross)}</p>
          <div className="mt-3 flex gap-4 text-xs text-blue-100">
            <span>실지급 합계 {wonShort(totalNet)}</span>
            <span>확정 {confirmed} · 미확정 {draft}</span>
          </div>
        </Card>

        {/* 일괄 확정 */}
        {draft > 0 && (
          <button className="mt-3 w-full rounded-xl bg-slate-900 py-3 text-sm font-bold text-white transition active:scale-[0.98]">
            미확정 {draft}건 급여 일괄 확정
          </button>
        )}

        {/* 직원별 급여 */}
        <h2 className="mb-2 mt-5 px-1 text-sm font-bold text-slate-500">
          직원별 급여
        </h2>
        <div className="space-y-2.5 pb-2">
          {MOCK_PAYROLLS.map((p) => {
            const emp = MOCK_EMPLOYEES.find((e) => e.id === p.employeeId)!;
            return (
              <Card key={p.employeeId} className="flex items-center gap-3">
                <Avatar name={emp.name} color={emp.avatarColor} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-900">{emp.name}</p>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                        p.status === "confirmed"
                          ? "bg-green-100 text-green-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {p.status === "confirmed" ? "확정" : "미확정"}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {p.totalHours}시간 · 기본 {wonShort(p.basePay)} · 주휴{" "}
                    {wonShort(p.weeklyAllowance)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-extrabold text-slate-900">
                    {wonShort(netPay(p))}
                  </p>
                  <p className="text-[10px] text-slate-400">실지급</p>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </>
  );
}
