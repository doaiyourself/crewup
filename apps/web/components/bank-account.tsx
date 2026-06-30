"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Bank {
  bank_name: string | null;
  account_no: string | null;
  holder: string | null;
  pending_bank: string | null;
  pending_account: string | null;
  pending_holder: string | null;
  status: string; // none | pending | approved
}

const fmtAcc = (b: {
  bank_name: string | null;
  account_no: string | null;
  holder: string | null;
}) =>
  [b.bank_name, b.account_no].filter(Boolean).join(" ") +
  (b.holder ? ` (${b.holder})` : "");

// 급여 계좌: 직원이 입력(제출) → 사장이 승인해야 적용.
// mode="self": 직원 본인 입력/상태.  mode="admin": 사장 승인/거절.
export function BankAccount({
  storeId,
  userId,
  mode,
  canApprove = false,
}: {
  storeId: string;
  userId: string;
  mode: "self" | "admin";
  canApprove?: boolean;
}) {
  const isReal = !!storeId && storeId !== "demo-store";
  const [row, setRow] = useState<Bank | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [bank, setBank] = useState("");
  const [acc, setAcc] = useState("");
  const [holder, setHolder] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!isReal) {
      setLoading(false);
      return;
    }
    const supabase = createClient();
    const { data } = await supabase
      .from("bank_accounts")
      .select(
        "bank_name, account_no, holder, pending_bank, pending_account, pending_holder, status"
      )
      .eq("store_id", storeId)
      .eq("user_id", userId)
      .maybeSingle();
    setRow((data as Bank) ?? null);
    setLoading(false);
  }, [isReal, storeId, userId]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async () => {
    setError("");
    if (!bank.trim() || !acc.trim()) {
      setError("은행과 계좌번호를 입력하세요.");
      return;
    }
    setBusy(true);
    const supabase = createClient();
    const { error: e } = await supabase.rpc("submit_bank_account", {
      p_store_id: storeId,
      p_bank: bank,
      p_account: acc,
      p_holder: holder,
    });
    setBusy(false);
    if (e) {
      setError("제출에 실패했어요. 다시 시도해 주세요.");
      return;
    }
    setEditing(false);
    await load();
  };

  const review = async (approve: boolean) => {
    const supabase = createClient();
    const { error: e } = await supabase.rpc("review_bank_account", {
      p_store_id: storeId,
      p_user_id: userId,
      p_approve: approve,
    });
    if (e) {
      alert("처리에 실패했어요. 권한을 확인해 주세요.");
      return;
    }
    await load();
  };

  if (!isReal) return null;
  if (loading)
    return <p className="py-2 text-center text-xs text-slate-400">불러오는 중…</p>;

  const hasApproved = !!row?.account_no;
  const hasPending = row?.status === "pending";
  const field =
    "w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand";

  // ---------- 사장(승인) ----------
  if (mode === "admin") {
    return (
      <div className="space-y-2 text-sm">
        <div className="rounded-xl bg-slate-50 px-3 py-2.5">
          <p className="text-[11px] font-semibold text-slate-400">급여 계좌</p>
          <p className="mt-0.5 font-semibold text-slate-800">
            {hasApproved ? fmtAcc(row!) : "등록된 계좌 없음"}
          </p>
        </div>
        {hasPending && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
            <p className="text-[11px] font-bold text-amber-700">
              승인 대기 — 직원이 제출한 계좌
            </p>
            <p className="mt-0.5 font-semibold text-slate-800">
              {fmtAcc({
                bank_name: row!.pending_bank,
                account_no: row!.pending_account,
                holder: row!.pending_holder,
              })}
            </p>
            {canApprove ? (
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => review(true)}
                  className="flex-1 rounded-lg bg-brand py-2 text-xs font-bold text-white"
                >
                  승인
                </button>
                <button
                  onClick={() => review(false)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-500"
                >
                  거절
                </button>
              </div>
            ) : (
              <p className="mt-1 text-[11px] text-amber-600">
                승인은 사장님만 가능해요.
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  // ---------- 직원(본인 입력) ----------
  return (
    <div className="space-y-2 text-sm">
      <div className="rounded-xl bg-slate-50 px-3 py-2.5">
        <p className="text-[11px] font-semibold text-slate-400">
          내 급여 계좌
        </p>
        <p className="mt-0.5 font-semibold text-slate-800">
          {hasApproved ? fmtAcc(row!) : "아직 등록된 계좌가 없어요"}
        </p>
        {hasPending && (
          <p className="mt-1 text-[11px] font-semibold text-amber-600">
            ⏳ 사장님 승인 대기중:{" "}
            {fmtAcc({
              bank_name: row!.pending_bank,
              account_no: row!.pending_account,
              holder: row!.pending_holder,
            })}
          </p>
        )}
      </div>

      {!editing ? (
        <button
          onClick={() => {
            setEditing(true);
            setError("");
            setBank("");
            setAcc("");
            setHolder("");
          }}
          className="w-full rounded-lg border border-dashed border-brand/40 bg-blue-50/40 py-2 text-sm font-semibold text-brand"
        >
          {hasApproved || hasPending ? "계좌 변경 요청" : "계좌 등록하기"}
        </button>
      ) : (
        <div className="space-y-2">
          <input
            value={bank}
            onChange={(e) => setBank(e.target.value)}
            placeholder="은행 (예: 국민은행)"
            className={field}
          />
          <input
            value={acc}
            onChange={(e) => setAcc(e.target.value)}
            inputMode="numeric"
            placeholder="계좌번호 (- 없이)"
            className={field}
          />
          <input
            value={holder}
            onChange={(e) => setHolder(e.target.value)}
            placeholder="예금주 (선택)"
            className={field}
          />
          {error && (
            <p className="rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-500">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => setEditing(false)}
              className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-semibold text-slate-500"
            >
              취소
            </button>
            <button
              onClick={submit}
              disabled={busy}
              className="flex-1 rounded-lg bg-brand py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {busy ? "제출 중…" : "제출 (승인 요청)"}
            </button>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-400">
            제출하면 사장님 승인 후 급여 계좌로 적용됩니다.
          </p>
        </div>
      )}
    </div>
  );
}
