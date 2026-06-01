"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/session";
import { useMyAttendance } from "@/lib/attendance";
import { getSchedule, DAY_LABEL } from "@/lib/mock-data";
import { todayLabel } from "@/lib/format";
import { PageHeader, Card, LogoutButton } from "@/components/ui";

// 최근 7일 출퇴근 내역 목업
const HISTORY = [
  { date: "5/30 (금)", in: "09:02", out: "15:05", status: "정상" },
  { date: "5/28 (수)", in: "09:00", out: "15:00", status: "정상" },
  { date: "5/26 (월)", in: "09:14", out: "15:02", status: "지각" },
  { date: "5/23 (금)", in: "08:58", out: "15:10", status: "정상" },
  { date: "5/21 (수)", in: "—", out: "—", status: "결근" },
];

export default function AttendancePage() {
  const { account } = useSession();
  const { att, clockIn, clockOut } = useMyAttendance(account?.id ?? null);
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

  return (
    <>
      <PageHeader title="출퇴근" subtitle={today} right={<LogoutButton />} />

      <div className="px-4 pt-4">
        {/* 큰 출퇴근 버튼 */}
        <Card>
          <p className="text-center text-sm text-slate-500">
            {todayShift
              ? `오늘 스케줄 ${todayShift.start} ~ ${todayShift.end}`
              : "오늘은 휴무일이에요"}
          </p>
          <div className="my-4 flex items-center justify-center gap-8 text-center">
            <div>
              <p className="text-xs text-slate-400">출근</p>
              <p className="text-2xl font-extrabold text-slate-900">
                {att.clockInAt ?? "--:--"}
              </p>
            </div>
            <div className="h-10 w-px bg-slate-200" />
            <div>
              <p className="text-xs text-slate-400">퇴근</p>
              <p className="text-2xl font-extrabold text-slate-900">
                {att.clockOutAt ?? "--:--"}
              </p>
            </div>
          </div>
          {att.status !== "working" ? (
            <button
              onClick={clockIn}
              disabled={att.status === "done"}
              className="w-full rounded-2xl bg-brand py-4 text-base font-bold text-white transition active:scale-[0.98] disabled:bg-slate-200 disabled:text-slate-400"
            >
              {att.status === "done" ? "오늘 근무 완료" : "출근하기"}
            </button>
          ) : (
            <button
              onClick={clockOut}
              className="w-full rounded-2xl bg-slate-800 py-4 text-base font-bold text-white transition active:scale-[0.98]"
            >
              퇴근하기
            </button>
          )}
          <p className="mt-3 text-center text-xs text-slate-400">
            📍 매장 반경 내에서 출퇴근할 수 있어요 (위치 검증 예정)
          </p>
        </Card>

        {/* 내역 */}
        <h2 className="mb-2 mt-5 px-1 text-sm font-bold text-slate-500">
          최근 출퇴근 내역
        </h2>
        <Card className="divide-y divide-slate-100 !p-0">
          {HISTORY.map((h, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3">
              <span className="text-sm font-medium text-slate-700">
                {h.date}
              </span>
              <span className="text-sm tabular-nums text-slate-500">
                {h.in} ~ {h.out}
              </span>
              <span
                className={`w-12 text-right text-xs font-semibold ${
                  h.status === "정상"
                    ? "text-green-600"
                    : h.status === "지각"
                    ? "text-amber-600"
                    : "text-red-500"
                }`}
              >
                {h.status}
              </span>
            </div>
          ))}
        </Card>
      </div>
    </>
  );
}
