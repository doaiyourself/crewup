"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/client";
import { CONTRACT_STATUS_LABEL, type ContractStatus } from "@/lib/contract";
import { won } from "@/lib/format";
import { Card, Avatar } from "@/components/ui";
import { HealthCerts } from "@/components/health-certs";
import { StoreDocs } from "@/components/store-docs";

type Tab = "store" | "contract" | "payslip" | "health";

interface Member {
  user_id: string;
  name: string;
  avatar_color: string;
}
interface ContractRow {
  id: string;
  user_id: string;
  status: ContractStatus;
  created_at: string;
}
interface PayRow {
  id: string;
  user_id: string;
  period: string;
  base_pay: number;
  weekly_allowance: number;
  night_allowance: number;
  deduction: number;
  status: string;
}

const C_CLS: Record<string, string> = {
  signed: "bg-green-100 text-green-700",
  pending: "bg-amber-100 text-amber-700",
  expired: "bg-slate-100 text-slate-500",
  none: "bg-slate-100 text-slate-500",
};
const net = (p: PayRow) =>
  p.base_pay + p.weekly_allowance + p.night_allowance - p.deduction;

export default function DocumentsPage() {
  const { account, currentStoreId, ready } = useSession();
  const router = useRouter();
  const isOwner = account?.role === "owner";
  const uid = account?.id ?? "";
  const storeId = currentStoreId ?? "";
  const isReal = !!storeId && storeId !== "demo-store";

  const [tab, setTab] = useState<Tab>("contract");
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [contracts, setContracts] = useState<ContractRow[]>([]);
  const [pays, setPays] = useState<PayRow[]>([]);

  useEffect(() => {
    if (ready && !account) router.replace("/login");
  }, [ready, account, router]);

  const TABS = useMemo(
    () =>
      [
        ...(isOwner ? [{ key: "store" as Tab, label: "매장서류" }] : []),
        { key: "contract" as Tab, label: "근로계약서" },
        { key: "payslip" as Tab, label: "급여명세서" },
        { key: "health" as Tab, label: "보건증" },
      ],
    [isOwner]
  );

  const load = useCallback(async () => {
    if (!isReal || !uid) {
      setLoading(false);
      return;
    }
    const supabase = createClient();
    // 사장님은 전 직원, 그 외는 본인만
    let cQ = supabase
      .from("contracts")
      .select("id, user_id, status, created_at")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false });
    let pQ = supabase
      .from("payrolls")
      .select(
        "id, user_id, period, base_pay, weekly_allowance, night_allowance, deduction, status"
      )
      .eq("store_id", storeId)
      .order("period", { ascending: false });
    if (!isOwner) {
      cQ = cQ.eq("user_id", uid);
      pQ = pQ.eq("user_id", uid);
    }
    const mQ: Promise<any> = isOwner
      ? (supabase.rpc("list_store_members", { p_store_id: storeId }) as any)
      : Promise.resolve({ data: [] });
    const [cRes, pRes, mRes] = await Promise.all([cQ, pQ, mQ]);
    const cs = cRes.data;
    const ps = pRes.data;
    const ms = mRes.data;
    setContracts((cs as ContractRow[]) ?? []);
    setPays((ps as PayRow[]) ?? []);
    setMembers(
      ((ms as any[]) ?? [])
        .filter((m) => m.status === "active")
        .map((m) => ({
          user_id: m.user_id,
          name: m.name,
          avatar_color: m.avatar_color,
        }))
    );
    setLoading(false);
  }, [isReal, uid, storeId, isOwner]);

  useEffect(() => {
    load();
  }, [load]);

  // 사장님용: 직원별 그룹
  const latestContractByUser = useMemo(() => {
    const m = new Map<string, ContractRow>();
    contracts.forEach((c) => {
      if (!m.has(c.user_id)) m.set(c.user_id, c); // 정렬돼 있어 첫번째가 최신
    });
    return m;
  }, [contracts]);
  const paysByUser = useMemo(() => {
    const m = new Map<string, PayRow[]>();
    pays.forEach((p) => {
      const arr = m.get(p.user_id) ?? [];
      arr.push(p);
      m.set(p.user_id, arr);
    });
    return m;
  }, [pays]);

  const contractRow = (c: ContractRow) => (
    <Link
      key={c.id}
      href={`/contract/${c.id}`}
      className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2.5 transition active:bg-slate-50"
    >
      <span className="text-lg">📄</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-800">표준근로계약서</p>
        <p className="text-[11px] text-slate-400">
          {new Date(c.created_at).toLocaleDateString("ko-KR")} 발행
        </p>
      </div>
      <span
        className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
          C_CLS[c.status] ?? C_CLS.none
        }`}
      >
        {CONTRACT_STATUS_LABEL[c.status]}
      </span>
      <span className="text-slate-300">›</span>
    </Link>
  );
  const payRow = (p: PayRow) => (
    <Link
      key={p.id}
      href={`/payslip?period=${p.period}${isOwner ? `&user=${p.user_id}` : ""}`}
      className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2.5 transition active:bg-slate-50"
    >
      <span className="text-lg">🧾</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-800">
          {p.period} 급여명세서
        </p>
        <p className="text-[11px] text-slate-400">실수령 {won(net(p))}</p>
      </div>
      <span
        className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
          p.status === "confirmed"
            ? "bg-green-100 text-green-700"
            : "bg-amber-100 text-amber-700"
        }`}
      >
        {p.status === "confirmed" ? "확정" : "작성중"}
      </span>
      <span className="text-slate-300">›</span>
    </Link>
  );

  const empty = (msg: string) => (
    <p className="rounded-xl bg-slate-50 py-8 text-center text-sm text-slate-400">
      {msg}
    </p>
  );

  return (
    <main className="min-h-screen bg-slate-100 pb-10">
      <div className="mx-auto max-w-md">
        {/* 헤더 */}
        <header className="sticky top-0 z-10 flex items-center gap-2 bg-slate-100/90 px-3 py-3 backdrop-blur">
          <button
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-slate-500 active:bg-slate-200"
            aria-label="뒤로"
          >
            ‹
          </button>
          <h1 className="text-lg font-extrabold text-slate-900">문서함</h1>
        </header>

        {/* 탭 */}
        <div className="flex gap-1.5 overflow-x-auto px-4 pb-1 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                tab === t.key
                  ? "bg-brand text-white"
                  : "bg-white text-slate-500 ring-1 ring-slate-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="px-4 pt-3">
          {!isReal ? (
            <Card className="py-8 text-center text-sm text-slate-400">
              매장에 합류하면 문서를 볼 수 있어요.
            </Card>
          ) : loading ? (
            <Card className="py-8 text-center text-sm text-slate-400">
              불러오는 중…
            </Card>
          ) : tab === "store" && isOwner ? (
            <Card>
              <StoreDocs storeId={storeId} canManage={isOwner} />
            </Card>
          ) : tab === "contract" ? (
            isOwner ? (
              <div className="space-y-2.5">
                {members.length === 0
                  ? empty("직원이 없어요.")
                  : members.map((m) => {
                      const c = latestContractByUser.get(m.user_id);
                      return (
                        <Card key={m.user_id} className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Avatar name={m.name} color={m.avatar_color} size={32} />
                            <p className="font-semibold text-slate-800">{m.name}</p>
                          </div>
                          {c ? contractRow(c) : empty("계약서 없음")}
                        </Card>
                      );
                    })}
              </div>
            ) : (
              <div className="space-y-2">
                {contracts.length === 0
                  ? empty("발행된 근로계약서가 없어요.")
                  : contracts.map(contractRow)}
              </div>
            )
          ) : tab === "payslip" ? (
            isOwner ? (
              <div className="space-y-2.5">
                {members.length === 0
                  ? empty("직원이 없어요.")
                  : members.map((m) => {
                      const list = paysByUser.get(m.user_id) ?? [];
                      return (
                        <Card key={m.user_id} className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Avatar name={m.name} color={m.avatar_color} size={32} />
                            <p className="font-semibold text-slate-800">{m.name}</p>
                          </div>
                          {list.length ? list.map(payRow) : empty("명세서 없음")}
                        </Card>
                      );
                    })}
              </div>
            ) : (
              <div className="space-y-2">
                {pays.length === 0
                  ? empty("발행된 급여명세서가 없어요.")
                  : pays.map(payRow)}
              </div>
            )
          ) : tab === "health" ? (
            isOwner ? (
              <div className="space-y-2.5">
                {members.length === 0
                  ? empty("직원이 없어요.")
                  : members.map((m) => (
                      <Card key={m.user_id} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Avatar name={m.name} color={m.avatar_color} size={32} />
                          <p className="font-semibold text-slate-800">{m.name}</p>
                        </div>
                        <HealthCerts storeId={storeId} userId={m.user_id} />
                      </Card>
                    ))}
              </div>
            ) : (
              <Card>
                <HealthCerts storeId={storeId} userId={uid} canUpload />
              </Card>
            )
          ) : null}
        </div>
      </div>
    </main>
  );
}
