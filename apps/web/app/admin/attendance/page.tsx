"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/client";
import { PageHeader, Card, Avatar, LogoutButton } from "@/components/ui";

const STATUS: { key: string; label: string; cls: string }[] = [
  { key: "normal", label: "정상", cls: "text-green-600" },
  { key: "late", label: "지각", cls: "text-amber-600" },
  { key: "early_leave", label: "조퇴", cls: "text-orange-600" },
  { key: "absent", label: "결근", cls: "text-red-500" },
];
const statusLabel = (s: string) => STATUS.find((x) => x.key === s)?.label ?? s;
const statusCls = (s: string) =>
  STATUS.find((x) => x.key === s)?.cls ?? "text-slate-500";

interface Row {
  id: string;
  user_id: string;
  work_date: string;
  clock_in_at: string | null;
  clock_out_at: string | null;
  status: string;
  approved_by: string | null;
  name: string;
  avatar_color: string;
}

const DOW = ["일", "월", "화", "수", "목", "금", "토"];
function dateLabel(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  return `${m}/${d} (${DOW[new Date(y, m - 1, d).getDay()]})`;
}
function toTimeInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}`;
}
function timeToIso(workDate: string, hhmm: string): string | null {
  if (!hhmm) return null;
  return new Date(`${workDate}T${hhmm}:00`).toISOString();
}

export default function AdminAttendancePage() {
  const { currentStoreId, account } = useSession();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ in: string; out: string; status: string }>({
    in: "",
    out: "",
    status: "normal",
  });

  const load = useCallback(async () => {
    if (!currentStoreId || currentStoreId === "demo-store") {
      setLoading(false);
      return;
    }
    const supabase = createClient();
    const since = new Date(Date.now() - 13 * 86400000).toISOString().slice(0, 10);
    const [{ data: members }, { data: att }] = await Promise.all([
      supabase.rpc("list_store_members", { p_store_id: currentStoreId }),
      supabase
        .from("attendance")
        .select(
          "id, user_id, work_date, clock_in_at, clock_out_at, status, approved_by"
        )
        .eq("store_id", currentStoreId)
        .gte("work_date", since)
        .order("work_date", { ascending: false }),
    ]);
    const nameMap = new Map(
      ((members as any[]) ?? []).map((m) => [
        m.user_id,
        { name: m.name, color: m.avatar_color },
      ])
    );
    setRows(
      ((att as any[]) ?? []).map((r) => ({
        ...r,
        name: nameMap.get(r.user_id)?.name ?? "직원",
        avatar_color: nameMap.get(r.user_id)?.color ?? "#94a3b8",
      }))
    );
    setLoading(false);
  }, [currentStoreId]);

  useEffect(() => {
    load();
  }, [load]);

  const startEdit = (r: Row) => {
    setEditing(r.id);
    setDraft({
      in: toTimeInput(r.clock_in_at),
      out: toTimeInput(r.clock_out_at),
      status: r.status,
    });
  };

  const save = async (r: Row, approve: boolean) => {
    const supabase = createClient();
    const patch: any = {
      clock_in_at: timeToIso(r.work_date, draft.in),
      clock_out_at: timeToIso(r.work_date, draft.out),
      status: draft.status,
    };
    if (approve) patch.approved_by = account?.id ?? null;
    await supabase.from("attendance").update(patch).eq("id", r.id);
    setEditing(null);
    await load();
  };

  const approve = async (r: Row) => {
    const supabase = createClient();
    await supabase
      .from("attendance")
      .update({ approved_by: account?.id ?? null })
      .eq("id", r.id);
    await load();
  };

  const pending = rows.filter((r) => !r.approved_by).length;

  return (
    <>
      <PageHeader
        title="출퇴근 승인"
        subtitle={`최근 2주 · 미승인 ${pending}건`}
        right={<LogoutButton />}
      />

      <div className="px-4 pt-4">
        {loading ? (
          <Card className="py-10 text-center text-sm text-slate-400">
            불러오는 중…
          </Card>
        ) : rows.length === 0 ? (
          <Card className="py-10 text-center">
            <p className="text-3xl">🗓</p>
            <p className="mt-2 text-sm text-slate-500">
              최근 출퇴근 기록이 없어요.
            </p>
          </Card>
        ) : (
          <div className="space-y-2.5">
            {rows.map((r) => (
              <Card key={r.id}>
                <div className="flex items-center gap-3">
                  <Avatar name={r.name} color={r.avatar_color} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-900">{r.name}</p>
                      <span className="text-xs text-slate-400">
                        {dateLabel(r.work_date)}
                      </span>
                      <span className={`text-xs font-semibold ${statusCls(r.status)}`}>
                        {statusLabel(r.status)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      출근 {toTimeInput(r.clock_in_at) || "--:--"} · 퇴근{" "}
                      {toTimeInput(r.clock_out_at) || "--:--"}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      r.approved_by
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {r.approved_by ? "승인됨" : "미승인"}
                  </span>
                </div>

                {editing === r.id ? (
                  <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                    <div className="flex gap-2">
                      <label className="flex-1 text-xs text-slate-500">
                        출근
                        <input
                          type="time"
                          value={draft.in}
                          onChange={(e) =>
                            setDraft((d) => ({ ...d, in: e.target.value }))
                          }
                          className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                        />
                      </label>
                      <label className="flex-1 text-xs text-slate-500">
                        퇴근
                        <input
                          type="time"
                          value={draft.out}
                          onChange={(e) =>
                            setDraft((d) => ({ ...d, out: e.target.value }))
                          }
                          className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                        />
                      </label>
                    </div>
                    <div className="flex gap-1.5">
                      {STATUS.map((s) => (
                        <button
                          key={s.key}
                          onClick={() => setDraft((d) => ({ ...d, status: s.key }))}
                          className={`flex-1 rounded-lg py-1.5 text-xs font-semibold ${
                            draft.status === s.key
                              ? "bg-brand text-white"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => save(r, true)}
                        className="flex-1 rounded-lg bg-brand py-2 text-sm font-semibold text-white"
                      >
                        저장 + 승인
                      </button>
                      <button
                        onClick={() => save(r, false)}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-600"
                      >
                        저장
                      </button>
                      <button
                        onClick={() => setEditing(null)}
                        className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-400"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => startEdit(r)}
                      className="flex-1 rounded-xl border border-slate-300 bg-white py-2 text-sm font-semibold text-slate-600 transition active:scale-[0.98]"
                    >
                      수정
                    </button>
                    {!r.approved_by && (
                      <button
                        onClick={() => approve(r)}
                        className="flex-1 rounded-xl bg-brand py-2 text-sm font-semibold text-white transition active:scale-[0.98]"
                      >
                        승인
                      </button>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
