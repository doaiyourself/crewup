"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/client";
import { ROLE_LABEL } from "@/lib/mock-data";
import { CONTRACT_STATUS_LABEL, type ContractStatus } from "@/lib/contract";
import { won } from "@/lib/format";
import { PageHeader, Card, Avatar, AccountBadge } from "@/components/ui";

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-800">{value}</span>
    </div>
  );
}

export default function ProfilePage() {
  const { account, logout, currentMembership, currentStoreId } = useSession();
  const [wage, setWage] = useState<number | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [contract, setContract] = useState<{
    id: string;
    status: ContractStatus;
  } | null>(null);

  useEffect(() => {
    if (!account || !currentStoreId || currentStoreId === "demo-store") return;
    const supabase = createClient();
    supabase
      .from("memberships")
      .select("hourly_wage")
      .eq("store_id", currentStoreId)
      .eq("user_id", account.id)
      .maybeSingle()
      .then(({ data }) => setWage(data?.hourly_wage ?? null));
    supabase
      .from("profiles")
      .select("phone")
      .eq("id", account.id)
      .maybeSingle()
      .then(({ data }) => setPhone(data?.phone ?? null));
    supabase
      .from("contracts")
      .select("id, status")
      .eq("store_id", currentStoreId)
      .eq("user_id", account.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setContract(data as any));
  }, [account, currentStoreId]);

  if (!account) return null;

  return (
    <>
      <PageHeader title="내 정보" right={<AccountBadge light />} />

      <div className="px-4 pt-4">
        <Card className="flex items-center gap-4">
          <Avatar name={account.name} color={account.avatarColor} size={56} />
          <div>
            <p className="text-lg font-bold text-slate-900">{account.name}</p>
            <p className="text-sm text-slate-500">
              {ROLE_LABEL[account.role]}
              {account.position ? ` · ${account.position}` : ""}
            </p>
          </div>
        </Card>

        <Link href="/me/documents" className="mt-3 block">
          <Card className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-xl">
              🗂
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-800">문서함</p>
              <p className="text-xs text-slate-400">
                근로계약서 · 보건증 업로드
              </p>
            </div>
            <span className="text-slate-300">›</span>
          </Card>
        </Link>

        <h2 className="mb-1 mt-5 px-1 text-sm font-bold text-slate-500">
          근무 정보
        </h2>
        <Card className="!py-2 divide-y divide-slate-100">
          <InfoRow label="소속 매장" value={currentMembership?.storeName ?? "-"} />
          {wage != null && <InfoRow label="시급" value={won(wage)} />}
          {phone && <InfoRow label="연락처" value={phone} />}
        </Card>

        <h2 className="mb-1 mt-5 px-1 text-sm font-bold text-slate-500">
          근로계약서
        </h2>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-900">표준근로계약서</p>
              <p className="mt-0.5 text-xs text-slate-500">
                상태:{" "}
                <span
                  className={
                    contract?.status === "signed"
                      ? "font-semibold text-green-600"
                      : contract?.status === "pending"
                      ? "font-semibold text-amber-600"
                      : "font-semibold text-slate-400"
                  }
                >
                  {contract
                    ? CONTRACT_STATUS_LABEL[contract.status]
                    : "발급된 계약서 없음"}
                </span>
              </p>
            </div>
            {contract && (
              <Link
                href={`/contract/${contract.id}`}
                className="rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white"
              >
                {contract.status === "pending" ? "서명하기" : "열람"}
              </Link>
            )}
          </div>
        </Card>

        <button
          onClick={logout}
          className="mt-6 w-full rounded-xl border border-slate-300 bg-white py-3 text-sm font-semibold text-slate-600 transition active:scale-[0.98]"
        >
          로그아웃
        </button>
        <p className="mt-3 pb-2 text-center text-xs text-slate-400">
          Crew Up v0.1 · 알바 관리 서비스
        </p>
      </div>
    </>
  );
}
