"use client";

import { useSession } from "@/lib/session";
import {
  getEmployee,
  ROLE_LABEL,
  CONTRACT_LABEL,
  STORE,
} from "@/lib/mock-data";
import { won } from "@/lib/format";
import { PageHeader, Card, Avatar, LogoutButton } from "@/components/ui";

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-800">{value}</span>
    </div>
  );
}

export default function ProfilePage() {
  const { account, logout } = useSession();
  if (!account) return null;
  const emp = getEmployee(account.id);

  return (
    <>
      <PageHeader title="내 정보" right={<LogoutButton />} />

      <div className="px-4 pt-4">
        <Card className="flex items-center gap-4">
          <Avatar name={account.name} color={account.avatarColor} size={56} />
          <div>
            <p className="text-lg font-bold text-slate-900">{account.name}</p>
            <p className="text-sm text-slate-500">
              {ROLE_LABEL[account.role]} · {account.position}
            </p>
          </div>
        </Card>

        <h2 className="mb-1 mt-5 px-1 text-sm font-bold text-slate-500">
          근무 정보
        </h2>
        <Card className="!py-2 divide-y divide-slate-100">
          <InfoRow label="소속 매장" value={STORE.name} />
          {emp && <InfoRow label="시급" value={won(emp.hourlyWage)} />}
          {emp && <InfoRow label="연락처" value={emp.phone} />}
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
                    emp?.contractStatus === "signed"
                      ? "font-semibold text-green-600"
                      : emp?.contractStatus === "pending"
                      ? "font-semibold text-amber-600"
                      : "font-semibold text-red-500"
                  }
                >
                  {emp ? CONTRACT_LABEL[emp.contractStatus] : "-"}
                </span>
              </p>
            </div>
            <button className="rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white">
              {emp?.contractStatus === "pending" ? "서명하기" : "열람"}
            </button>
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
