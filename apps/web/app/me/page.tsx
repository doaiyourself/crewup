"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "@/lib/session";
import { useMyAttendance } from "@/lib/use-my-attendance";
import {
  getEmployee,
  getSchedule,
  getPayroll,
  DAY_LABEL,
} from "@/lib/mock-data";
import { todayLabel, shiftHours, won, netPay } from "@/lib/format";
import { PageHeader, Card, Avatar, LogoutButton } from "@/components/ui";

function hhmm(iso: string | null): string {
  if (!iso) return "--:--";
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}`;
}

export default function MeHome() {
  const { account, currentStoreId } = useSession();
  const emp = account ? getEmployee(account.id) : undefined;
  const { today: att, clockIn, clockOut, busy } = useMyAttendance(currentStoreId);
  const [today, setToday] = useState("");
  const [dow, setDow] = useState<number | null>(null);

  useEffect(() => {
    setToday(todayLabel());
    setDow(new Date().getDay());
  }, []);

  if (!account) return null;

  const schedule = getSchedule(account.id);
  const todayShift =
    dow !== null ? schedule?.shifts.find((s) => s.day === dow) : undefined;
  const payroll = getPayroll(account.id);

  return (
    <>
      <PageHeader title={`안녕하세요, ${account.name}님`} subtitle={today} right={<LogoutButton />} />

      <div className="px-4">
        {/* 출퇴근 카드 */}
        <Card className="mt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-slate-700">오늘 근무</p>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                att.status === "working"
                  ? "bg-green-100 text-green-700"
                  : att.status === "done"
                  ? "bg-slate-200 text-slate-600"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {att.status === "working"
                ? "근무 중"
                : att.status === "done"
                ? "퇴근 완료"
                : "근무 전"}
            </span>
          </div>

          {todayShift ? (
            <p className="mt-1 text-xs text-slate-500">
              오늘 스케줄 {todayShift.start} ~ {todayShift.end}
            </p>
          ) : (
            <p className="mt-1 text-xs text-slate-400">오늘은 휴무일이에요</p>
          )}

          <div className="mt-3 flex gap-4 rounded-xl bg-slate-50 px-3 py-2.5 text-sm">
            <span className="text-slate-500">
              출근 <b className="text-slate-800">{hhmm(att.clockInAt)}</b>
            </span>
            <span className="text-slate-500">
              퇴근 <b className="text-slate-800">{hhmm(att.clockOutAt)}</b>
            </span>
          </div>

          <div className="mt-3 flex gap-2">
            <button
              onClick={clockIn}
              disabled={busy || att.status === "working" || att.status === "done"}
              className="flex-1 rounded-xl bg-brand py-3 text-sm font-bold text-white transition active:scale-[0.98] disabled:bg-slate-200 disabled:text-slate-400"
            >
              출근하기
            </button>
            <button
              onClick={clockOut}
              disabled={busy || att.status !== "working"}
              className="flex-1 rounded-xl border border-slate-300 bg-white py-3 text-sm font-bold text-slate-700 transition active:scale-[0.98] disabled:border-slate-200 disabled:text-slate-300"
            >
              퇴근하기
            </button>
          </div>
        </Card>

        {/* 요약 2개 */}
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Link href="/me/schedule">
            <Card className="h-full">
              <p className="text-xs text-slate-500">이번 주 근무</p>
              <p className="mt-1 text-lg font-bold text-slate-900">
                {schedule
                  ? schedule.shifts.reduce(
                      (a, s) => a + shiftHours(s.start, s.end),
                      0
                    )
                  : 0}
                <span className="text-sm font-normal text-slate-400"> 시간</span>
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {schedule?.shifts.map((s) => DAY_LABEL[s.day]).join("·") ||
                  "스케줄 없음"}
              </p>
            </Card>
          </Link>
          <Link href="/me/payroll">
            <Card className="h-full">
              <p className="text-xs text-slate-500">5월 예상 급여</p>
              <p className="mt-1 text-lg font-bold text-slate-900">
                {payroll ? won(netPay(payroll)) : "-"}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {payroll?.status === "confirmed" ? "확정" : "정산 중"}
              </p>
            </Card>
          </Link>
        </div>

        {/* 내 정보 요약 */}
        {emp && (
          <Card className="mt-3">
            <div className="flex items-center gap-3">
              <Avatar name={emp.name} color={emp.avatarColor} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900">{emp.name}</p>
                <p className="text-xs text-slate-500">
                  {emp.position} · {won(emp.hourlyWage)}/시간
                </p>
              </div>
              <Link
                href="/me/profile"
                className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600"
              >
                더보기
              </Link>
            </div>
          </Card>
        )}
      </div>
    </>
  );
}
