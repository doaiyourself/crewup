"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui";

interface Req {
  id: string;
  work_date: string;
  clock_in_at: string | null;
  clock_out_at: string | null;
  kind: string; // edit | add
  status: string; // pending | approved | rejected
  reason: string | null;
  created_at: string;
}

function localYmd() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
function toTime(iso: string | null) {
  if (!iso) return "--:--";
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}`;
}
function timeToIso(date: string, hm: string): string | null {
  if (!hm) return null;
  return new Date(`${date}T${hm}:00`).toISOString();
}
const DOW = ["일", "월", "화", "수", "목", "금", "토"];
function dateLabel(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  return `${m}/${d}(${DOW[new Date(y, m - 1, d).getDay()]})`;
}

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  pending: { label: "검토중", cls: "bg-amber-100 text-amber-700" },
  approved: { label: "승인됨", cls: "bg-green-100 text-green-700" },
  rejected: { label: "거절됨", cls: "bg-slate-100 text-slate-500" },
};

// 직원·알바·점장이 본인 근무시간 수정/추가를 요청 → 사장 승인 시 반영
export function AttendanceRequest({
  storeId,
  userId,
}: {
  storeId: string;
  userId: string;
}) {
  const isReal = !!storeId && storeId !== "demo-store";
  const [open, setOpen] = useState(false);
  const [reqs, setReqs] = useState<Req[]>([]);
  const [date, setDate] = useState(localYmd());
  const [cin, setCin] = useState("");
  const [cout, setCout] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!isReal) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("attendance_requests")
      .select(
        "id, work_date, clock_in_at, clock_out_at, kind, status, reason, created_at"
      )
      .eq("store_id", storeId)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);
    setReqs((data as Req[]) ?? []);
  }, [isReal, storeId, userId]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async () => {
    setError("");
    if (!cin && !cout) {
      setError("출근 또는 퇴근 시각을 입력하세요.");
      return;
    }
    setBusy(true);
    const supabase = createClient();
    // 해당 날짜 기존 기록 → 수정/추가 판별
    const { data: ex } = await supabase
      .from("attendance")
      .select("id")
      .eq("store_id", storeId)
      .eq("user_id", userId)
      .eq("work_date", date)
      .maybeSingle();
    const { error: e } = await supabase.from("attendance_requests").insert({
      store_id: storeId,
      user_id: userId,
      work_date: date,
      clock_in_at: timeToIso(date, cin),
      clock_out_at: timeToIso(date, cout),
      kind: ex ? "edit" : "add",
      target_id: (ex as any)?.id ?? null,
      reason: reason.trim() || null,
    });
    setBusy(false);
    if (e) {
      setError("요청에 실패했어요. 다시 시도해 주세요.");
      return;
    }
    setOpen(false);
    setCin("");
    setCout("");
    setReason("");
    setDate(localYmd());
    await load();
  };

  const cancel = async (id: string) => {
    if (!confirm("요청을 취소할까요?")) return;
    const supabase = createClient();
    await supabase.from("attendance_requests").delete().eq("id", id);
    await load();
  };

  if (!isReal) return null;

  const field =
    "w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand";

  return (
    <Card className="mt-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-slate-700">근무시간 수정·추가 요청</p>
        <button
          onClick={() => {
            setOpen(true);
            setError("");
          }}
          className="rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white transition active:scale-95"
        >
          ＋ 요청하기
        </button>
      </div>
      <p className="mt-1 text-xs text-slate-400">
        다른 날 근무 추가나 시간 수정을 요청하면 사장님 확인 후 반영돼요.
      </p>

      {reqs.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {reqs.map((r) => {
            const b = STATUS_BADGE[r.status] ?? STATUS_BADGE.pending;
            return (
              <div
                key={r.id}
                className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-700">
                    {dateLabel(r.work_date)} · {toTime(r.clock_in_at)}~
                    {toTime(r.clock_out_at)}
                    <span className="ml-1 text-slate-400">
                      ({r.kind === "edit" ? "수정" : "추가"})
                    </span>
                  </p>
                  {r.reason && (
                    <p className="truncate text-[11px] text-slate-400">
                      {r.reason}
                    </p>
                  )}
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${b.cls}`}
                >
                  {b.label}
                </span>
                {r.status === "pending" && (
                  <button
                    onClick={() => cancel(r.id)}
                    className="shrink-0 text-[11px] font-semibold text-slate-400"
                  >
                    취소
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-5">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <p className="text-base font-bold text-slate-900">
              근무시간 수정·추가 요청
            </p>
            <p className="mt-0.5 text-xs text-slate-400">
              해당 날짜에 기록이 있으면 수정, 없으면 추가로 요청돼요.
            </p>

            <label className="mt-4 block">
              <span className="mb-1 block text-[11px] font-semibold text-slate-500">
                날짜
              </span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={field}
              />
            </label>
            <div className="mt-3 flex gap-2">
              <label className="block flex-1">
                <span className="mb-1 block text-[11px] font-semibold text-slate-500">
                  출근
                </span>
                <input
                  type="time"
                  value={cin}
                  onChange={(e) => setCin(e.target.value)}
                  className={field}
                />
              </label>
              <label className="block flex-1">
                <span className="mb-1 block text-[11px] font-semibold text-slate-500">
                  퇴근
                </span>
                <input
                  type="time"
                  value={cout}
                  onChange={(e) => setCout(e.target.value)}
                  className={field}
                />
              </label>
            </div>
            <label className="mt-3 block">
              <span className="mb-1 block text-[11px] font-semibold text-slate-500">
                사유 (선택)
              </span>
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="예: 깜빡하고 출근 체크를 못 했어요"
                className={field}
              />
            </label>

            {error && (
              <p className="mt-2 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-500">
                {error}
              </p>
            )}

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-slate-500"
              >
                취소
              </button>
              <button
                onClick={submit}
                disabled={busy}
                className="flex-1 rounded-lg bg-brand py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {busy ? "요청 중…" : "요청 보내기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
