"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DAY_LABEL } from "@/lib/mock-data";

interface DayShift {
  on: boolean;
  start: string;
  end: string;
}

const defaultDay: DayShift = { on: false, start: "09:00", end: "15:00" };

// 관리자: 한 멤버의 주간 시프트 편성 (요일별 근무/휴무 + 시간). 저장 시 교체.
export function ScheduleEditor({
  storeId,
  userId,
  onSaved,
}: {
  storeId: string;
  userId: string;
  onSaved?: () => void;
}) {
  const [days, setDays] = useState<DayShift[]>(
    Array.from({ length: 7 }, () => ({ ...defaultDay }))
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("schedules")
      .select("day_of_week, start_time, end_time")
      .eq("store_id", storeId)
      .eq("user_id", userId)
      .then(({ data }) => {
        const next = Array.from({ length: 7 }, () => ({ ...defaultDay }));
        (data ?? []).forEach((s: any) => {
          next[s.day_of_week] = {
            on: true,
            start: s.start_time.slice(0, 5),
            end: s.end_time.slice(0, 5),
          };
        });
        setDays(next);
        setLoading(false);
      });
  }, [storeId, userId]);

  const update = (i: number, patch: Partial<DayShift>) =>
    setDays((prev) => prev.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));

  const save = async () => {
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from("schedules")
      .delete()
      .eq("store_id", storeId)
      .eq("user_id", userId);
    const rows = days
      .map((d, i) =>
        d.on
          ? {
              store_id: storeId,
              user_id: userId,
              day_of_week: i,
              start_time: d.start,
              end_time: d.end,
            }
          : null
      )
      .filter(Boolean);
    if (rows.length) await supabase.from("schedules").insert(rows as any);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
    onSaved?.();
  };

  if (loading)
    return <p className="py-3 text-center text-xs text-slate-400">불러오는 중…</p>;

  return (
    <div className="space-y-1.5">
      {days.map((d, i) => (
        <div key={i} className="flex items-center gap-2">
          <button
            onClick={() => update(i, { on: !d.on })}
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
              d.on ? "bg-brand text-white" : "bg-slate-100 text-slate-400"
            }`}
          >
            {DAY_LABEL[i]}
          </button>
          {d.on ? (
            <div className="flex flex-1 items-center gap-1.5">
              <input
                type="time"
                value={d.start}
                onChange={(e) => update(i, { start: e.target.value })}
                className="flex-1 rounded-lg border border-slate-200 px-2 py-1 text-xs"
              />
              <span className="text-xs text-slate-400">~</span>
              <input
                type="time"
                value={d.end}
                onChange={(e) => update(i, { end: e.target.value })}
                className="flex-1 rounded-lg border border-slate-200 px-2 py-1 text-xs"
              />
            </div>
          ) : (
            <span className="flex-1 text-xs text-slate-400">휴무</span>
          )}
        </div>
      ))}
      <button
        onClick={save}
        disabled={saving}
        className="mt-1 w-full rounded-lg bg-brand py-2 text-sm font-semibold text-white transition active:scale-[0.98] disabled:opacity-60"
      >
        {saving ? "저장 중…" : saved ? "저장됨 ✓" : "스케줄 저장"}
      </button>
    </div>
  );
}
