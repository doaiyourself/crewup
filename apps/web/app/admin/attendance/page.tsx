"use client";
import { setCachedMembers } from "@/lib/members-cache";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/client";
import { PageHeader, Card, Avatar, AccountBadge } from "@/components/ui";
import { AttendanceRequest } from "@/components/attendance-request";

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

interface ReqRow {
  id: string;
  user_id: string;
  kind: string;
  work_date: string;
  clock_in_at: string | null;
  clock_out_at: string | null;
  reason: string | null;
  name: string;
  avatar_color: string;
}

const DOW = ["일", "월", "화", "수", "목", "금", "토"];
function dateLabel(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  return `${m}/${d} (${DOW[new Date(y, m - 1, d).getDay()]})`;
}
function dateParts(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  return { m, d, dow: DOW[new Date(y, m - 1, d).getDay()] };
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
function todMin(iso: string | null): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
}
function hmMin(hm: string): number {
  const [h, m] = hm.split(":").map(Number);
  return h * 60 + m;
}
const GRACE = 5; // 분

function localYmd(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

type Period = "week" | "month" | "lastmonth";
const PERIODS: { key: Period; label: string }[] = [
  { key: "week", label: "이번주" },
  { key: "month", label: "이번달" },
  { key: "lastmonth", label: "저번달" },
];
// 기간 → 조회 범위(YYYY-MM-DD)
function rangeFor(period: Period): { since: string; until: string } {
  const now = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  const ymd = (d: Date) =>
    `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  if (period === "week") {
    const d = new Date(now);
    const mondayOffset = (d.getDay() + 6) % 7; // 월요일 시작
    d.setDate(d.getDate() - mondayOffset);
    return { since: ymd(d), until: ymd(now) };
  }
  if (period === "lastmonth") {
    const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const last = new Date(now.getFullYear(), now.getMonth(), 0);
    return { since: ymd(first), until: ymd(last) };
  }
  // month (이번달)
  return {
    since: ymd(new Date(now.getFullYear(), now.getMonth(), 1)),
    until: ymd(now),
  };
}

export default function AdminAttendancePage() {
  const { currentStoreId, account } = useSession();
  const [rows, setRows] = useState<Row[]>([]);
  const [requests, setRequests] = useState<ReqRow[]>([]);
  const [period, setPeriod] = useState<Period>("month");
  const [memberFilter, setMemberFilter] = useState<string>("");
  const [sched, setSched] = useState<Map<string, { start: string; end: string }>>(
    new Map()
  );
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ in: string; out: string; status: string }>({
    in: "",
    out: "",
    status: "normal",
  });
  const [members, setMembers] = useState<
    { user_id: string; name: string; avatar_color: string }[]
  >([]);
  const [delegated, setDelegated] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addForm, setAddForm] = useState<{
    userId: string;
    date: string;
    in: string;
    out: string;
    status: string;
  }>({ userId: "", date: localYmd(), in: "", out: "", status: "normal" });
  const [addErr, setAddErr] = useState("");

  const load = useCallback(async () => {
    if (!currentStoreId || currentStoreId === "demo-store") {
      setLoading(false);
      return;
    }
    const supabase = createClient();
    const { since, until } = rangeFor(period);
    const [
      { data: memberData },
      { data: att },
      { data: schedules },
      { data: storeRow },
      { data: reqData },
    ] = await Promise.all([
      supabase.rpc("list_store_members", { p_store_id: currentStoreId }),
      supabase
        .from("attendance")
        .select(
          "id, user_id, work_date, clock_in_at, clock_out_at, status, approved_by"
        )
        .eq("store_id", currentStoreId)
        .gte("work_date", since)
        .lte("work_date", until)
        .order("work_date", { ascending: false }),
      supabase
        .from("schedules")
        .select("user_id, day_of_week, start_time, end_time")
        .eq("store_id", currentStoreId),
      supabase
        .from("stores")
        .select("attendance_delegated")
        .eq("id", currentStoreId)
        .maybeSingle(),
      supabase
        .from("attendance_requests")
        .select(
          "id, user_id, kind, work_date, clock_in_at, clock_out_at, reason"
        )
        .eq("store_id", currentStoreId)
        .eq("status", "pending")
        .order("created_at", { ascending: false }),
    ]);
    const memArr = ((memberData as any[]) ?? [])
      .filter((m) => m.status === "active")
      .map((m) => ({ user_id: m.user_id, name: m.name, avatar_color: m.avatar_color }));
    setMembers(memArr);
    setCachedMembers(currentStoreId, (memberData as any[]) ?? []);
    setDelegated(!!(storeRow as any)?.attendance_delegated);
    const nameMap = new Map(
      memArr.map((m) => [m.user_id, { name: m.name, color: m.avatar_color }])
    );
    const sMap = new Map<string, { start: string; end: string }>();
    ((schedules as any[]) ?? []).forEach((s) =>
      sMap.set(`${s.user_id}-${s.day_of_week}`, {
        start: s.start_time.slice(0, 5),
        end: s.end_time.slice(0, 5),
      })
    );
    setSched(sMap);
    setRows(
      ((att as any[]) ?? []).map((r) => ({
        ...r,
        name: nameMap.get(r.user_id)?.name ?? "직원",
        avatar_color: nameMap.get(r.user_id)?.color ?? "#94a3b8",
      }))
    );
    setRequests(
      ((reqData as any[]) ?? []).map((r) => ({
        ...r,
        name: nameMap.get(r.user_id)?.name ?? "직원",
        avatar_color: nameMap.get(r.user_id)?.color ?? "#94a3b8",
      }))
    );
    setLoading(false);
  }, [currentStoreId, period]);

  // 수정·추가 요청 처리 (승인 시 출퇴근 기록에 반영)
  const reviewRequest = async (id: string, approve: boolean) => {
    const supabase = createClient();
    const { error } = await supabase.rpc("review_attendance_request", {
      p_request_id: id,
      p_approve: approve,
    });
    if (error) {
      alert("처리에 실패했어요. 권한을 확인해 주세요.");
      return;
    }
    await load();
  };

  useEffect(() => {
    load();
  }, [load]);

  // 스케줄 대비 자동 판정 (지각/조퇴)
  const verdict = (r: Row): { status: string; label: string } | null => {
    const dow = new Date(`${r.work_date}T00:00:00`).getDay();
    const shift = sched.get(`${r.user_id}-${dow}`);
    if (!shift) return null;
    const inMin = todMin(r.clock_in_at);
    const outMin = todMin(r.clock_out_at);
    if (inMin == null) return { status: "absent", label: "결근(기록 없음)" };
    const late = inMin - hmMin(shift.start);
    if (late > GRACE) return { status: "late", label: `지각 ${late}분` };
    if (outMin != null) {
      const early = hmMin(shift.end) - outMin;
      if (early > GRACE) return { status: "early_leave", label: `조퇴 ${early}분` };
    }
    return { status: "normal", label: "정상" };
  };

  const startEdit = (r: Row) => {
    setEditing(r.id);
    const v = verdict(r);
    setDraft({
      in: toTimeInput(r.clock_in_at),
      out: toTimeInput(r.clock_out_at),
      // 미정정(normal) 상태면 자동 판정값을 미리 채움
      status: r.status === "normal" && v ? v.status : r.status,
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

  // 출퇴근 관리 권한: 사장 항상, 점장은 위임된 경우만 (백엔드 RLS와 일치)
  const canManage =
    account?.role === "owner" ||
    (account?.role === "manager" && delegated);

  const addRecord = async () => {
    setAddErr("");
    if (!addForm.userId) {
      setAddErr("직원을 선택하세요.");
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.from("attendance").insert({
      store_id: currentStoreId,
      user_id: addForm.userId,
      work_date: addForm.date,
      clock_in_at: timeToIso(addForm.date, addForm.in),
      clock_out_at: timeToIso(addForm.date, addForm.out),
      status: addForm.status,
      approved_by: account?.id ?? null,
    });
    if (error) {
      setAddErr(
        (error as any).code === "23505"
          ? "이미 그 날짜 기록이 있어요. 목록에서 수정하세요."
          : "추가에 실패했어요. 권한을 확인해 주세요."
      );
      return;
    }
    setAdding(false);
    setAddForm({ userId: "", date: localYmd(), in: "", out: "", status: "normal" });
    await load();
  };

  const shownRows = memberFilter
    ? rows.filter((r) => r.user_id === memberFilter)
    : rows;
  const shownRequests = memberFilter
    ? requests.filter((q) => q.user_id === memberFilter)
    : requests;
  const pending = shownRows.filter((r) => !r.approved_by).length;
  const periodLabel = PERIODS.find((p) => p.key === period)?.label ?? "";

  return (
    <>
      <PageHeader
        title="출퇴근 승인"
        subtitle={
          shownRequests.length > 0
            ? `요청 ${shownRequests.length}건 · 미승인 ${pending}건`
            : `${periodLabel} · 미승인 ${pending}건`
        }
        right={<AccountBadge light />}
      />

      <div className="px-4 pt-4">
        {/* 조회 필터: 기간 + 직원 */}
        <div className="mb-3 space-y-2">
          <div className="flex gap-1.5">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
                  period === p.key
                    ? "bg-brand text-white"
                    : "bg-white text-slate-500 ring-1 ring-slate-200"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <select
            value={memberFilter}
            onChange={(e) => setMemberFilter(e.target.value)}
            className="w-full appearance-none rounded-lg border border-slate-200 bg-white bg-[length:16px] bg-[right_0.6rem_center] bg-no-repeat px-3 py-2.5 pr-8 text-sm text-slate-700 outline-none focus:border-brand"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 20 20' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='M5 7l5 5 5-5'/%3E%3C/svg%3E\")",
            }}
          >
            <option value="">전체 직원</option>
            {members.map((m) => (
              <option key={m.user_id} value={m.user_id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        {/* 수정·추가 요청 검토 (사장/위임 점장) */}
        {canManage && shownRequests.length > 0 && (
          <div className="mb-3">
            <h2 className="mb-2 px-1 text-sm font-bold text-slate-700">
              수정·추가 요청 {shownRequests.length}건
            </h2>
            <div className="space-y-2">
              {shownRequests.map((q) => (
                <Card key={q.id} className="!bg-blue-50/50 !ring-blue-100">
                  <div className="flex items-center gap-3">
                    <Avatar name={q.name} color={q.avatar_color} size={36} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-slate-900">{q.name}</p>
                        <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] font-bold text-brand ring-1 ring-blue-100">
                          {q.kind === "edit" ? "수정" : "추가"}
                        </span>
                        <span className="text-xs text-slate-400">
                          {dateLabel(q.work_date)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-600">
                        출근 {toTimeInput(q.clock_in_at) || "--:--"} · 퇴근{" "}
                        {toTimeInput(q.clock_out_at) || "--:--"}
                      </p>
                      {q.reason && (
                        <p className="mt-0.5 text-[11px] text-slate-400">
                          “{q.reason}”
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => reviewRequest(q.id, true)}
                      className="flex-1 rounded-xl bg-brand py-2 text-sm font-bold text-white transition active:scale-[0.98]"
                    >
                      승인
                    </button>
                    <button
                      onClick={() => reviewRequest(q.id, false)}
                      className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-500 transition active:scale-[0.98]"
                    >
                      거절
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* 점장 본인 근무 수정·추가 요청 (위임 안 받은 경우) */}
        {account?.role === "manager" && !canManage && (
          <AttendanceRequest
            storeId={currentStoreId ?? ""}
            userId={account.id}
          />
        )}

        {/* 출퇴근 직접 추가 (사장 항상 · 점장은 위임 시) */}
        {canManage ? (
          <>
            <button
              onClick={() => {
                setAdding((v) => !v);
                setAddErr("");
              }}
              className="mb-3 w-full rounded-xl bg-brand py-3 text-sm font-bold text-white transition active:scale-[0.99]"
            >
              {adding ? "닫기" : "＋ 출퇴근 직접 추가"}
            </button>
            {adding && (
              <Card className="mb-3 space-y-2.5">
                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold text-slate-500">
                    직원
                  </span>
                  <select
                    value={addForm.userId}
                    onChange={(e) =>
                      setAddForm((f) => ({ ...f, userId: e.target.value }))
                    }
                    className="att-i"
                  >
                    <option value="">직원 선택</option>
                    {members.map((m) => (
                      <option key={m.user_id} value={m.user_id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold text-slate-500">
                    날짜
                  </span>
                  <input
                    type="date"
                    value={addForm.date}
                    onChange={(e) =>
                      setAddForm((f) => ({ ...f, date: e.target.value }))
                    }
                    className="att-i"
                  />
                </label>
                <div className="flex gap-2">
                  <label className="block flex-1">
                    <span className="mb-1 block text-[11px] font-semibold text-slate-500">
                      출근
                    </span>
                    <input
                      type="time"
                      value={addForm.in}
                      onChange={(e) =>
                        setAddForm((f) => ({ ...f, in: e.target.value }))
                      }
                      className="att-i"
                    />
                  </label>
                  <label className="block flex-1">
                    <span className="mb-1 block text-[11px] font-semibold text-slate-500">
                      퇴근
                    </span>
                    <input
                      type="time"
                      value={addForm.out}
                      onChange={(e) =>
                        setAddForm((f) => ({ ...f, out: e.target.value }))
                      }
                      className="att-i"
                    />
                  </label>
                </div>
                <div className="flex gap-1.5">
                  {STATUS.map((s) => (
                    <button
                      key={s.key}
                      onClick={() =>
                        setAddForm((f) => ({ ...f, status: s.key }))
                      }
                      className={`flex-1 rounded-lg py-1.5 text-xs font-semibold ${
                        addForm.status === s.key
                          ? "bg-brand text-white"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
                {addErr && (
                  <p className="rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-500">
                    {addErr}
                  </p>
                )}
                <button
                  onClick={addRecord}
                  className="w-full rounded-lg bg-brand py-2 text-sm font-semibold text-white transition active:scale-[0.98]"
                >
                  추가 (승인 처리)
                </button>
                <style>{`.att-i{box-sizing:border-box;width:100%;height:40px;border:1px solid #e2e8f0;border-radius:0.5rem;padding:0 0.625rem;font-size:0.8125rem;line-height:1.2;color:#0f172a;background:#fff;outline:none;-webkit-appearance:none;appearance:none}.att-i:focus{border-color:#2F6BFF}select.att-i{padding-right:1.5rem;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 20 20' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='M5 7l5 5 5-5'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 0.5rem center}`}</style>
              </Card>
            )}
          </>
        ) : account?.role === "manager" ? (
          <Card className="mb-3 !bg-amber-50 !ring-amber-100">
            <p className="text-xs leading-relaxed text-amber-700">
              출퇴근 관리 권한이 없어요. 사장님이{" "}
              <b>매장 설정 → 출퇴근 권한 위임</b>을 켜면 수정·승인·추가할 수
              있어요.
            </p>
          </Card>
        ) : null}

        {loading ? (
          <Card className="py-10 text-center text-sm text-slate-400">
            불러오는 중…
          </Card>
        ) : shownRows.length === 0 ? (
          <Card className="py-10 text-center">
            <p className="text-3xl">🗓</p>
            <p className="mt-2 text-sm text-slate-500">
              {periodLabel} 출퇴근 기록이 없어요.
            </p>
          </Card>
        ) : (
          <div className="space-y-2.5">
            {shownRows.map((r) => (
              <Card key={r.id}>
                <div className="flex items-center gap-3">
                  {/* 날짜 — 가장 크게, 왼쪽 */}
                  <div className="flex w-14 shrink-0 flex-col items-center border-r border-slate-100 pr-3">
                    <span className="text-[26px] font-extrabold leading-none text-slate-900">
                      {dateParts(r.work_date).d}
                    </span>
                    <span className="mt-1 text-[11px] font-medium text-slate-400">
                      {dateParts(r.work_date).m}월({dateParts(r.work_date).dow})
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <Avatar name={r.name} color={r.avatar_color} size={20} />
                      <p className="truncate font-semibold text-slate-900">
                        {r.name}
                      </p>
                      <span className={`text-xs font-semibold ${statusCls(r.status)}`}>
                        {statusLabel(r.status)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      출근 {toTimeInput(r.clock_in_at) || "--:--"} · 퇴근{" "}
                      {toTimeInput(r.clock_out_at) || "--:--"}
                      <span
                        className={`ml-1 font-semibold ${
                          r.approved_by ? "text-green-600" : "text-amber-600"
                        }`}
                      >
                        · {r.approved_by ? "승인됨" : "미승인"}
                      </span>
                    </p>
                    {(() => {
                      const v = verdict(r);
                      if (!v || v.status === "normal") return null;
                      return (
                        <p className="mt-0.5 text-[11px] font-semibold text-amber-600">
                          🤖 자동 판정: {v.label} (스케줄 대비)
                        </p>
                      );
                    })()}
                  </div>
                  {/* 액션 — 오른쪽 */}
                  {canManage && editing !== r.id && (
                    <div className="flex shrink-0 items-center gap-1.5">
                      {!r.approved_by && (
                        <button
                          onClick={() => approve(r)}
                          className="rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white transition active:scale-95"
                        >
                          승인
                        </button>
                      )}
                      <button
                        onClick={() => startEdit(r)}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition active:scale-95"
                      >
                        수정
                      </button>
                    </div>
                  )}
                </div>

                {canManage && editing === r.id && (
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
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
