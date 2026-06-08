"use client";

// 급여명세서 (인쇄 가능). /payslip?user=<id>&period=<YYYY-MM>
// 본인은 자기 명세서, 관리자는 직원 명세서 조회.

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/client";
import { computePayroll, type PayrollResult } from "@crewup/core";
import { won } from "@/lib/format";

function minutesBetween(a: string | null, b: string | null): number {
  if (!a || !b) return 0;
  return Math.max(0, Math.round((+new Date(b) - +new Date(a)) / 60000));
}
function nextMonthStart(period: string): string {
  const [y, m] = period.split("-").map(Number);
  const d = new Date(y, m, 1); // m은 0-index 기준 다음달
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function PayRow({
  label,
  value,
  minus,
  strong,
}: {
  label: string;
  value: string;
  minus?: boolean;
  strong?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between px-3 py-2 ${
        strong ? "bg-slate-50" : ""
      }`}
    >
      <span className={`text-sm ${strong ? "font-bold text-slate-900" : "text-slate-600"}`}>
        {label}
      </span>
      <span
        className={`tabular-nums ${strong ? "text-base font-extrabold" : "text-sm"} ${
          minus ? "text-red-500" : "text-slate-800"
        }`}
      >
        {minus ? "-" : ""}
        {value}
      </span>
    </div>
  );
}

function PayslipInner() {
  const params = useSearchParams();
  const router = useRouter();
  const { account, currentStoreId, currentMembership, ready } = useSession();

  const nowYm = new Date().toISOString().slice(0, 7);
  const period = params.get("period") || nowYm;
  const targetUser = params.get("user") || account?.id || "";

  const [name, setName] = useState("");
  const [wage, setWage] = useState<number | null>(null);
  const [minutes, setMinutes] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!ready || !currentStoreId || currentStoreId === "demo-store" || !account)
      return;
    const supabase = createClient();
    const isSelf = targetUser === account.id;

    // 이름
    if (isSelf) setName(account.name);
    else {
      const { data } = await supabase.rpc("list_store_members", {
        p_store_id: currentStoreId,
      });
      const m = ((data as any[]) ?? []).find((x) => x.user_id === targetUser);
      setName(m?.name ?? "직원");
    }

    // 시급
    const { data: mem } = await supabase
      .from("memberships")
      .select("hourly_wage")
      .eq("store_id", currentStoreId)
      .eq("user_id", targetUser)
      .maybeSingle();
    setWage(mem?.hourly_wage ?? null);

    // 근무시간
    const { data: att } = await supabase
      .from("attendance")
      .select("clock_in_at, clock_out_at")
      .eq("store_id", currentStoreId)
      .eq("user_id", targetUser)
      .gte("work_date", `${period}-01`)
      .lt("work_date", nextMonthStart(period));
    setMinutes(
      ((att as any[]) ?? []).reduce(
        (s, r) => s + minutesBetween(r.clock_in_at, r.clock_out_at),
        0
      )
    );
    setLoading(false);
  }, [ready, currentStoreId, account, targetUser, period]);

  useEffect(() => {
    load();
  }, [load]);

  if (!ready || loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="animate-pulse text-sm text-slate-400">불러오는 중…</div>
      </main>
    );
  }

  const p: PayrollResult | null =
    wage != null ? computePayroll(minutes, wage) : null;
  const [py, pm] = period.split("-");

  return (
    <main className="mx-auto min-h-screen max-w-xl bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3 print:hidden">
        <button
          onClick={() => router.back()}
          className="text-sm font-semibold text-slate-500"
        >
          ‹ 뒤로
        </button>
        <button
          onClick={() => window.print()}
          className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600"
        >
          인쇄 / PDF
        </button>
      </div>

      <div className="px-6 py-8">
        <h1 className="text-center text-2xl font-extrabold text-crew-dark">
          급여명세서
        </h1>
        <p className="mt-1 text-center text-sm text-slate-400">
          {py}년 {Number(pm)}월 · 지급예정
        </p>

        <div className="mt-5 flex justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm">
          <div>
            <p className="text-xs text-slate-400">사업장</p>
            <p className="font-semibold text-slate-800">
              {currentMembership?.storeName ?? "-"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">성명</p>
            <p className="font-semibold text-slate-800">{name}</p>
          </div>
        </div>

        {p === null ? (
          <p className="mt-8 text-center text-sm text-slate-400">
            급여 정보를 계산할 수 없어요 (시급 미설정).
          </p>
        ) : (
          <>
            <h2 className="mb-1 mt-6 text-sm font-bold text-slate-500">지급 내역</h2>
            <div className="overflow-hidden rounded-xl border border-slate-100">
              <PayRow label={`기본급 (${p.totalHours}시간 × ${won(wage!)})`} value={won(p.basePay)} />
              <PayRow label="주휴수당" value={won(p.weeklyAllowance)} />
              <PayRow label="야간·연장 가산" value={won(p.nightAllowance)} />
              <PayRow label="지급 합계" value={won(p.gross)} strong />
            </div>

            <h2 className="mb-1 mt-5 text-sm font-bold text-slate-500">공제 내역</h2>
            <div className="overflow-hidden rounded-xl border border-slate-100">
              <PayRow label="4대보험·소득세 (추정)" value={won(p.deduction)} minus />
              <PayRow label="실지급액" value={won(p.net)} strong />
            </div>

            <div className="mt-6 rounded-xl bg-brand px-4 py-4 text-white">
              <p className="text-xs text-blue-100">실지급액</p>
              <p className="text-3xl font-extrabold">{won(p.net)}</p>
            </div>

            <p className="mt-4 text-center text-[11px] text-slate-400">
              본 명세서는 실근무 기록 기반 추정치이며, 주휴·공제는 간이 계산입니다.
            </p>
          </>
        )}
      </div>
    </main>
  );
}

export default function PayslipPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-100">
          <div className="animate-pulse text-sm text-slate-400">불러오는 중…</div>
        </main>
      }
    >
      <PayslipInner />
    </Suspense>
  );
}
