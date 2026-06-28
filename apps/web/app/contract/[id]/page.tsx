"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/client";
import { won } from "@/lib/format";
import { CONTRACT_STATUS_LABEL, type ContractContent } from "@/lib/contract";
import { isAdminRole } from "@/lib/mock-data";

interface Contract {
  id: string;
  store_id: string;
  user_id: string;
  status: "none" | "pending" | "signed" | "expired";
  content: ContractContent;
  signed_at: string | null;
  employer_signed_at: string | null;
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <tr className="border-b border-slate-100">
      <th className="w-32 bg-slate-50 px-3 py-2.5 text-left text-xs font-semibold text-slate-500">
        {label}
      </th>
      <td className="px-3 py-2.5 text-sm text-slate-800">{value}</td>
    </tr>
  );
}

export default function ContractPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { account, ready } = useSession();
  const [contract, setContract] = useState<Contract | null>(null);
  const [storeName, setStoreName] = useState("");
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [agree, setAgree] = useState(false);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("contracts")
      .select(
        "id, store_id, user_id, status, content, signed_at, employer_signed_at"
      )
      .eq("id", id)
      .maybeSingle();
    if (data) {
      setContract(data as Contract);
      const { data: s } = await supabase
        .from("stores")
        .select("name")
        .eq("id", (data as Contract).store_id)
        .maybeSingle();
      setStoreName(s?.name ?? "");
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // 근로자 서명 (사장 서명 이후에만 가능) → 계약 완료
  const sign = async () => {
    if (!agree || !contract) return;
    setSigning(true);
    const supabase = createClient();
    await supabase
      .from("contracts")
      .update({ status: "signed", signed_at: new Date().toISOString() })
      .eq("id", contract.id);
    await load();
    setSigning(false);
    setAgree(false);
  };

  // 사용자(사장) 서명 — 가장 먼저 진행
  const signEmployer = async () => {
    if (!agree || !contract) return;
    setSigning(true);
    const supabase = createClient();
    await supabase
      .from("contracts")
      .update({ employer_signed_at: new Date().toISOString() })
      .eq("id", contract.id);
    await load();
    setSigning(false);
    setAgree(false);
  };

  if (loading || !ready) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="animate-pulse text-sm text-slate-400">불러오는 중…</div>
      </main>
    );
  }
  if (!contract) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-slate-100 px-6 text-center">
        <p className="text-sm text-slate-500">계약서를 찾을 수 없거나 접근 권한이 없어요.</p>
        <button
          onClick={() => router.back()}
          className="mt-4 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600"
        >
          돌아가기
        </button>
      </main>
    );
  }

  const c = contract.content;
  const isWorker = account?.id === contract.user_id;
  const isEmployer = !isWorker && isAdminRole(account?.role ?? "parttimer");
  const employerSigned = !!contract.employer_signed_at;
  // 서명 순서: 사장(사용자) 먼저 → 근로자
  const canEmployerSign =
    isEmployer && contract.status === "pending" && !employerSigned;
  const canWorkerSign =
    isWorker && contract.status === "pending" && employerSigned;
  const wageLabel =
    c.wageType === "hourly" ? `시급 ${won(c.wage)}` : `월급 ${won(c.wage)}`;

  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-white">
      {/* 상단 바 (인쇄 시 숨김) */}
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3 print:hidden">
        <button
          onClick={() => router.back()}
          className="text-sm font-semibold text-slate-500"
        >
          ‹ 뒤로
        </button>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            contract.status === "signed"
              ? "bg-green-100 text-green-700"
              : "bg-amber-100 text-amber-700"
          }`}
        >
          {CONTRACT_STATUS_LABEL[contract.status]}
        </span>
        <button
          onClick={() => window.print()}
          className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600"
        >
          인쇄 / PDF
        </button>
      </div>

      {/* 문서 */}
      <div className="px-6 py-8">
        <h1 className="text-center text-2xl font-extrabold text-crew-dark">
          표준 근로계약서
        </h1>
        <p className="mt-1 text-center text-sm text-slate-400">{storeName}</p>

        <table className="mt-6 w-full border-t-2 border-slate-800">
          <tbody>
            <Item label="사업장" value={c.workplace || storeName} />
            <Item label="사용자(대표)" value={c.employerName} />
            <Item label="근로자" value={c.employeeName} />
            <Item
              label="근로계약기간"
              value={
                c.endDate
                  ? `${c.startDate} ~ ${c.endDate}`
                  : `${c.startDate} ~ (기간의 정함 없음)`
              }
            />
            <Item label="업무내용" value={c.jobDesc || "-"} />
            <Item label="근무일" value={c.workDays} />
            <Item
              label="근로시간"
              value={`${c.workStart} ~ ${c.workEnd} (휴게 ${c.breakMinutes}분)`}
            />
            <Item label="임금" value={wageLabel} />
            <Item label="임금지급일" value={c.payday} />
            <Item label="주휴수당" value={c.weeklyHoliday ? "지급" : "미지급"} />
            <Item label="4대보험" value={c.insurance ? "가입" : "미가입"} />
          </tbody>
        </table>

        <p className="mt-6 text-xs leading-relaxed text-slate-500">
          본 계약은 근로기준법 등 관계 법령에 따라 체결되며, 명시되지 않은 사항은
          관계 법령 및 취업규칙에 따른다. 전자적 방식의 동의·서명은 「전자문서 및
          전자거래 기본법」에 따라 서면과 동일한 효력을 가진다.
        </p>

        {/* 서명란 */}
        <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
          <div className="rounded-xl border border-slate-200 p-3">
            <p className="text-xs text-slate-400">사용자</p>
            <p className="mt-1 font-semibold text-slate-800">{c.employerName}</p>
            <p
              className={`mt-2 text-xs ${
                employerSigned ? "text-green-600" : "text-slate-400"
              }`}
            >
              {employerSigned
                ? `✓ 전자서명 ${new Date(
                    contract.employer_signed_at!
                  ).toLocaleString("ko-KR")}`
                : "(서명 대기)"}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 p-3">
            <p className="text-xs text-slate-400">근로자</p>
            <p className="mt-1 font-semibold text-slate-800">{c.employeeName}</p>
            <p
              className={`mt-2 text-xs ${
                contract.status === "signed" ? "text-green-600" : "text-slate-400"
              }`}
            >
              {contract.status === "signed" && contract.signed_at
                ? `✓ 전자서명 ${new Date(contract.signed_at).toLocaleString("ko-KR")}`
                : employerSigned
                ? "(서명 대기)"
                : "(사장님 서명 후 진행)"}
            </p>
          </div>
        </div>
      </div>

      {/* 서명 액션 (인쇄 시 숨김) — 사장 먼저, 그 다음 근로자 */}
      {canEmployerSign && (
        <div className="sticky bottom-0 border-t border-slate-100 bg-white px-6 py-4 print:hidden">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
            />
            사용자(대표)로서 위 근로계약 내용에 동의합니다.
          </label>
          <button
            onClick={signEmployer}
            disabled={!agree || signing}
            className="mt-3 w-full rounded-xl bg-brand py-3.5 text-base font-bold text-white transition active:scale-[0.98] disabled:bg-slate-200 disabled:text-slate-400"
          >
            {signing ? "서명 중…" : "사용자(대표) 전자서명"}
          </button>
          <p className="mt-2 text-center text-xs text-slate-400">
            사장님이 먼저 서명하면 근로자가 서명할 수 있어요.
          </p>
        </div>
      )}

      {canWorkerSign && (
        <div className="sticky bottom-0 border-t border-slate-100 bg-white px-6 py-4 print:hidden">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
            />
            위 근로계약 내용을 확인했으며 이에 동의합니다.
          </label>
          <button
            onClick={sign}
            disabled={!agree || signing}
            className="mt-3 w-full rounded-xl bg-brand py-3.5 text-base font-bold text-white transition active:scale-[0.98] disabled:bg-slate-200 disabled:text-slate-400"
          >
            {signing ? "서명 중…" : "동의하고 전자서명"}
          </button>
        </div>
      )}

      {/* 근로자인데 아직 사장 서명 전 */}
      {isWorker && contract.status === "pending" && !employerSigned && (
        <div className="sticky bottom-0 border-t border-slate-100 bg-white px-6 py-4 text-center text-sm text-slate-500 print:hidden">
          사장님의 서명을 기다리고 있어요. 서명이 완료되면 알려드릴게요.
        </div>
      )}
    </main>
  );
}
