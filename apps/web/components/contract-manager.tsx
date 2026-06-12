"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  defaultContract,
  CONTRACT_STATUS_LABEL,
  type ContractContent,
  type ContractStatus,
} from "@/lib/contract";

// 관리자: 멤버 근로계약서 발행/상태 (직원관리에서 펼쳐서 사용)
export function ContractManager({
  storeId,
  userId,
  memberName,
  defaultWage,
  workplace,
  employerName,
}: {
  storeId: string;
  userId: string;
  memberName: string;
  defaultWage: number;
  workplace: string;
  employerName: string;
}) {
  const [loading, setLoading] = useState(true);
  const [contract, setContract] = useState<{
    id: string;
    status: ContractStatus;
  } | null>(null);
  const [form, setForm] = useState<ContractContent>(
    defaultContract({
      workplace,
      wage: defaultWage,
      employerName,
      employeeName: memberName,
    })
  );
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("contracts")
      .select("id, status")
      .eq("store_id", storeId)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setContract(data as any);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, userId]);

  const issue = async () => {
    setSaving(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("contracts")
      .insert({
        store_id: storeId,
        user_id: userId,
        status: "pending",
        content: form,
        expires_at: form.endDate || null,
      })
      .select("id, status")
      .single();
    setContract(data as any);
    setSaving(false);
    setShowForm(false);
  };

  const set = (patch: Partial<ContractContent>) =>
    setForm((f) => ({ ...f, ...patch }));

  if (loading)
    return <p className="py-3 text-center text-xs text-slate-400">불러오는 중…</p>;

  return (
    <div className="space-y-3 text-sm">
      {contract && (
        <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
          <span className="text-sm text-slate-600">
            계약서 상태:{" "}
            <b
              className={
                contract.status === "signed"
                  ? "text-green-600"
                  : contract.status === "pending"
                  ? "text-amber-600"
                  : "text-slate-500"
              }
            >
              {CONTRACT_STATUS_LABEL[contract.status]}
            </b>
          </span>
          <Link
            href={`/contract/${contract.id}`}
            className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white"
          >
            계약서 보기
          </Link>
        </div>
      )}
      {contract && !showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full rounded-lg border border-dashed border-brand/40 bg-blue-50/40 py-2.5 text-sm font-semibold text-brand transition active:scale-[0.98]"
        >
          ＋ 새 근로계약서 작성
        </button>
      )}
      {(!contract || showForm) && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
        <Field label="근로개시일">
          <input
            type="date"
            value={form.startDate}
            onChange={(e) => set({ startDate: e.target.value })}
            className="ci"
          />
        </Field>
        <Field label="근로종료일(선택)">
          <input
            type="date"
            value={form.endDate ?? ""}
            onChange={(e) => set({ endDate: e.target.value || undefined })}
            className="ci"
          />
        </Field>
      </div>
      <Field label="업무내용">
        <input
          value={form.jobDesc}
          onChange={(e) => set({ jobDesc: e.target.value })}
          placeholder="예: 홀 서빙, 매장 청소"
          className="ci"
        />
      </Field>
      <Field label="근무일">
        <input
          value={form.workDays}
          onChange={(e) => set({ workDays: e.target.value })}
          className="ci"
        />
      </Field>
      <div className="grid grid-cols-3 gap-2">
        <Field label="시작">
          <input
            type="time"
            value={form.workStart}
            onChange={(e) => set({ workStart: e.target.value })}
            className="ci"
          />
        </Field>
        <Field label="종료">
          <input
            type="time"
            value={form.workEnd}
            onChange={(e) => set({ workEnd: e.target.value })}
            className="ci"
          />
        </Field>
        <Field label="휴게(분)">
          <input
            type="number"
            value={form.breakMinutes}
            onChange={(e) => set({ breakMinutes: Number(e.target.value) })}
            className="ci"
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field label="임금 형태">
          <select
            value={form.wageType}
            onChange={(e) =>
              set({ wageType: e.target.value as "hourly" | "monthly" })
            }
            className="ci"
          >
            <option value="hourly">시급</option>
            <option value="monthly">월급</option>
          </select>
        </Field>
        <Field label={form.wageType === "hourly" ? "시급(원)" : "월급(원)"}>
          <input
            type="number"
            value={form.wage}
            onChange={(e) => set({ wage: Number(e.target.value) })}
            className="ci"
          />
        </Field>
      </div>
      <Field label="임금 지급일">
        <input
          value={form.payday}
          onChange={(e) => set({ payday: e.target.value })}
          className="ci"
        />
      </Field>
      <div className="flex gap-4 py-1">
        <label className="flex items-center gap-1.5 text-xs text-slate-600">
          <input
            type="checkbox"
            checked={form.weeklyHoliday}
            onChange={(e) => set({ weeklyHoliday: e.target.checked })}
          />
          주휴수당
        </label>
        <label className="flex items-center gap-1.5 text-xs text-slate-600">
          <input
            type="checkbox"
            checked={form.insurance}
            onChange={(e) => set({ insurance: e.target.checked })}
          />
          4대보험
        </label>
      </div>
          <button
            onClick={issue}
            disabled={saving}
            className="w-full rounded-lg bg-brand py-2 text-sm font-semibold text-white transition active:scale-[0.98] disabled:opacity-60"
          >
            {saving ? "발행 중…" : "계약서 발행 (서명 요청)"}
          </button>
          {contract && showForm && (
            <button
              onClick={() => setShowForm(false)}
              className="w-full rounded-lg py-2 text-sm font-semibold text-slate-400"
            >
              취소
            </button>
          )}
        </div>
      )}
      <style>{`.ci{box-sizing:border-box;width:100%;height:40px;border:1px solid #e2e8f0;border-radius:0.5rem;padding:0 0.625rem;font-size:0.8125rem;line-height:1.2;color:#0f172a;background:#fff;outline:none;-webkit-appearance:none;appearance:none;text-align:left}.ci:focus{border-color:#2F6BFF}select.ci{padding-right:1.5rem;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 20 20' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='M5 7l5 5 5-5'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 0.5rem center}`}</style>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-0.5 block text-[11px] font-semibold text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}
