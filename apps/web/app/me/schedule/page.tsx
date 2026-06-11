"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/client";
import { DAY_LABEL } from "@/lib/mock-data";
import { shiftHours } from "@/lib/format";
import { PageHeader, Card, LogoutButton } from "@/components/ui";

interface Shift {
  day_of_week: number;
  start_time: string; // "HH:MM:SS"
  end_time: string;
}
const hm = (t: string) => t?.slice(0, 5) ?? "";

export default function MySchedulePage() {
  const { account, currentStoreId } = useSession();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentStoreId || currentStoreId === "demo-store" || !account) {
      setLoading(false);
      return;
    }
    const supabase = createClient();
    supabase
      .from("schedules")
      .select("day_of_week, start_time, end_time")
      .eq("store_id", currentStoreId)
      .eq("user_id", account.id)
      .then(({ data }) => {
        setShifts((data as Shift[]) ?? []);
        setLoading(false);
      });
  }, [currentStoreId, account]);

  if (!account) return null;

  const byDay = new Map<number, Shift>();
  shifts.forEach((s) => byDay.set(s.day_of_week, s));
  const totalHours = shifts.reduce(
    (a, s) => a + shiftHours(hm(s.start_time), hm(s.end_time)),
    0
  );

  return (
    <>
      <PageHeader title="내 스케줄" subtitle="주간 근무표" right={<LogoutButton light />} />

      <div className="px-4 pt-4">
        <Card className="mb-3 flex items-center justify-between">
          <span className="text-sm text-slate-500">주간 총 근무</span>
          <span className="text-lg font-bold text-brand">{totalHours}시간</span>
        </Card>

        {loading ? (
          <Card className="py-8 text-center text-sm text-slate-400">
            불러오는 중…
          </Card>
        ) : (
          <div className="space-y-2">
            {DAY_LABEL.map((label, day) => {
              const shift = byDay.get(day);
              const isWeekend = day === 0 || day === 6;
              return (
                <Card
                  key={day}
                  className={`flex items-center gap-4 ${shift ? "" : "opacity-60"}`}
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
                          {hm(shift.start_time)} ~ {hm(shift.end_time)}
                        </p>
                        <p className="text-xs text-slate-400">
                          {shiftHours(hm(shift.start_time), hm(shift.end_time))}시간 근무
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
        )}

        <p className="mt-4 px-1 text-center text-xs text-slate-400">
          스케줄은 점장·사장님이 편성합니다.
        </p>
      </div>
    </>
  );
}
