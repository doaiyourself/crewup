"use client";

import { useSession } from "@/lib/session";
import { getSchedule, DAY_LABEL } from "@/lib/mock-data";
import { shiftHours } from "@/lib/format";
import { PageHeader, Card, LogoutButton } from "@/components/ui";

export default function MySchedulePage() {
  const { account } = useSession();
  if (!account) return null;

  const schedule = getSchedule(account.id);
  const byDay = new Map<number, { start: string; end: string }>();
  schedule?.shifts.forEach((s) => byDay.set(s.day, s));
  const totalHours =
    schedule?.shifts.reduce((a, s) => a + shiftHours(s.start, s.end), 0) ?? 0;

  return (
    <>
      <PageHeader
        title="내 스케줄"
        subtitle="이번 주 근무표"
        right={<LogoutButton />}
      />

      <div className="px-4 pt-4">
        <Card className="mb-3 flex items-center justify-between">
          <span className="text-sm text-slate-500">이번 주 총 근무</span>
          <span className="text-lg font-bold text-brand">{totalHours}시간</span>
        </Card>

        <div className="space-y-2">
          {DAY_LABEL.map((label, day) => {
            const shift = byDay.get(day);
            const isWeekend = day === 0 || day === 6;
            return (
              <Card
                key={day}
                className={`flex items-center gap-4 ${
                  shift ? "" : "opacity-60"
                }`}
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    shift
                      ? "bg-brand text-white"
                      : isWeekend
                      ? "bg-red-50 text-red-400"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {label}
                </div>
                <div className="flex-1">
                  {shift ? (
                    <>
                      <p className="font-semibold text-slate-900">
                        {shift.start} ~ {shift.end}
                      </p>
                      <p className="text-xs text-slate-400">
                        {shiftHours(shift.start, shift.end)}시간 근무
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-slate-400">휴무</p>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        <p className="mt-4 px-1 text-center text-xs text-slate-400">
          희망 근무시간 신청은 점장님께 요청하세요. (신청 기능 준비 중)
        </p>
      </div>
    </>
  );
}
