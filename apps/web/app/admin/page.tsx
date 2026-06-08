"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  MOCK_EMPLOYEES,
  MOCK_PAYROLLS,
  MOCK_SCHEDULES,
  ROLE_LABEL,
} from "@/lib/mock-data";
import { wonShort, grossPay, shiftHours, todayLabel } from "@/lib/format";
import { PageHeader, Card, LogoutButton } from "@/components/ui";

// 데모용 현재 근무 현황 (목업) — 처음 3명 근무 중, 2명 퇴근
const WORKING_IDS = ["emp-2", "emp-4", "emp-5"];
const DONE_IDS = ["emp-8", "emp-10"];

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <Card tone={accent ? "brand" : "default"}>
      <p className={`text-xs ${accent ? "text-blue-100" : "text-slate-500"}`}>
        {label}
      </p>
      <p className="mt-1 text-2xl font-extrabold">{value}</p>
      {sub && (
        <p className={`mt-0.5 text-xs ${accent ? "text-blue-100" : "text-slate-400"}`}>
          {sub}
        </p>
      )}
    </Card>
  );
}

export default function AdminDashboard() {
  const [today, setToday] = useState("");
  useEffect(() => setToday(todayLabel()), []);

  const total = MOCK_EMPLOYEES.length;
  const working = WORKING_IDS.length;
  const done = DONE_IDS.length;
  const attended = working + done;
  const attendRate = Math.round((attended / total) * 100);

  const laborCost = MOCK_PAYROLLS.reduce((a, p) => a + grossPay(p), 0);

  // 주간 근무시간 상위 5명 (간단 바차트)
  const ranking = MOCK_SCHEDULES.map((s) => {
    const emp = MOCK_EMPLOYEES.find((e) => e.id === s.employeeId)!;
    const hours = s.shifts.reduce((a, sh) => a + shiftHours(sh.start, sh.end), 0);
    return { name: emp.name, color: emp.avatarColor, hours };
  })
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 5);
  const maxHours = Math.max(...ranking.map((r) => r.hours), 1);

  return (
    <>
      <PageHeader
        title="관리 대시보드"
        subtitle={today}
        right={<LogoutButton />}
      />

      <div className="px-4 pt-4">
        {/* 핵심 지표 */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="현재 근무 중"
            value={`${working}명`}
            sub={`전체 ${total}명`}
            accent
          />
          <StatCard
            label="오늘 출근율"
            value={`${attendRate}%`}
            sub={`${attended}/${total}명 출근`}
          />
          <StatCard
            label="이번 달 인건비"
            value={wonShort(laborCost)}
            sub="2026년 5월 누계"
          />
          <StatCard
            label="퇴근 완료"
            value={`${done}명`}
            sub="근무 종료"
          />
        </div>

        {/* 실시간 근무 현황 */}
        <h2 className="mb-2 mt-5 px-1 text-sm font-bold text-slate-500">
          실시간 근무 현황
        </h2>
        <Card className="!p-0 divide-y divide-slate-100">
          {MOCK_EMPLOYEES.filter((e) => WORKING_IDS.includes(e.id)).map((e) => (
            <div key={e.id} className="flex items-center gap-3 px-4 py-3">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
              </span>
              <span className="flex-1 text-sm font-medium text-slate-800">
                {e.name}
                <span className="ml-2 text-xs text-slate-400">
                  {ROLE_LABEL[e.role]} · {e.position}
                </span>
              </span>
              <span className="text-xs font-semibold text-green-600">
                근무 중
              </span>
            </div>
          ))}
          {working === 0 && (
            <p className="px-4 py-6 text-center text-sm text-slate-400">
              현재 근무 중인 직원이 없습니다.
            </p>
          )}
        </Card>

        {/* 주간 근무시간 차트 */}
        <h2 className="mb-2 mt-5 px-1 text-sm font-bold text-slate-500">
          주간 근무시간 TOP 5
        </h2>
        <Card className="space-y-3">
          {ranking.map((r) => (
            <div key={r.name} className="flex items-center gap-3">
              <span className="w-12 shrink-0 text-xs font-medium text-slate-600">
                {r.name}
              </span>
              <div className="h-5 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="flex h-full items-center justify-end rounded-full pr-2 text-[10px] font-bold text-white"
                  style={{
                    width: `${Math.max((r.hours / maxHours) * 100, 18)}%`,
                    backgroundColor: r.color,
                  }}
                >
                  {r.hours}h
                </div>
              </div>
            </div>
          ))}
        </Card>

        {/* 빠른 메뉴 */}
        <h2 className="mb-2 mt-5 px-1 text-sm font-bold text-slate-500">
          빠른 메뉴
        </h2>
        <div className="grid grid-cols-2 gap-3 pb-2">
          <Link href="/admin/staff">
            <Card className="text-center">👥<p className="mt-1 text-sm font-semibold text-slate-700">직원 관리</p></Card>
          </Link>
          <Link href="/admin/attendance">
            <Card className="text-center">✅<p className="mt-1 text-sm font-semibold text-slate-700">출퇴근 승인</p></Card>
          </Link>
          <Link href="/admin/payroll">
            <Card className="text-center">💰<p className="mt-1 text-sm font-semibold text-slate-700">급여 산정</p></Card>
          </Link>
          <Link href="/admin/settings">
            <Card className="text-center">⚙️<p className="mt-1 text-sm font-semibold text-slate-700">매장 설정</p></Card>
          </Link>
        </div>
      </div>
    </>
  );
}
