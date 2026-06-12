"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/client";
import { CONTRACT_STATUS_LABEL, type ContractStatus } from "@/lib/contract";
import { PageHeader, Card, AccountBadge } from "@/components/ui";
import { HealthCerts } from "@/components/health-certs";

interface ContractRow {
  id: string;
  status: ContractStatus;
  created_at: string;
}

const STATUS_CLS: Record<string, string> = {
  signed: "bg-green-100 text-green-700",
  pending: "bg-amber-100 text-amber-700",
  expired: "bg-slate-100 text-slate-500",
  none: "bg-slate-100 text-slate-500",
};

export default function DocumentsPage() {
  const { account, currentStoreId } = useSession();
  const [contracts, setContracts] = useState<ContractRow[]>([]);
  const [loading, setLoading] = useState(true);
  const uid = account?.id ?? "";
  const isReal = !!currentStoreId && currentStoreId !== "demo-store";

  const load = useCallback(async () => {
    if (!isReal || !uid) {
      setLoading(false);
      return;
    }
    const supabase = createClient();
    const { data } = await supabase
      .from("contracts")
      .select("id, status, created_at")
      .eq("store_id", currentStoreId)
      .eq("user_id", uid)
      .order("created_at", { ascending: false });
    setContracts((data as ContractRow[]) ?? []);
    setLoading(false);
  }, [currentStoreId, uid, isReal]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <PageHeader title="문서함" subtitle="계약서 · 보건증" right={<AccountBadge light />} />

      <div className="px-4 pt-4">
        {/* 근로계약서 */}
        <h2 className="mb-2 px-1 text-sm font-bold text-slate-700">근로계약서</h2>
        <Card className="!p-0">
          {loading ? (
            <p className="px-4 py-6 text-center text-sm text-slate-400">
              불러오는 중…
            </p>
          ) : contracts.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-slate-400">
              발행된 근로계약서가 없어요.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {contracts.map((c) => (
                <Link
                  key={c.id}
                  href={`/contract/${c.id}`}
                  className="flex items-center gap-3 px-4 py-3 transition active:bg-slate-50"
                >
                  <span className="text-lg">📄</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800">
                      표준근로계약서
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {new Date(c.created_at).toLocaleDateString("ko-KR")} 발행
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                      STATUS_CLS[c.status] ?? STATUS_CLS.none
                    }`}
                  >
                    {CONTRACT_STATUS_LABEL[c.status]}
                  </span>
                  <span className="text-slate-300">›</span>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* 보건증 */}
        <h2 className="mb-2 mt-5 px-1 text-sm font-bold text-slate-700">보건증</h2>
        <Card>
          {isReal && uid ? (
            <HealthCerts storeId={currentStoreId as string} userId={uid} canUpload />
          ) : (
            <p className="py-4 text-center text-xs text-slate-400">
              매장에 합류하면 보건증을 올릴 수 있어요.
            </p>
          )}
        </Card>
      </div>
    </>
  );
}
