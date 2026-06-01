"use client";

import { useSession } from "@/lib/session";
import { STORE, ROLE_LABEL } from "@/lib/mock-data";
import { PageHeader, Card, LogoutButton } from "@/components/ui";

function MenuRow({ icon, label, desc }: { icon: string; label: string; desc?: string }) {
  return (
    <button className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition active:bg-slate-50">
      <span className="text-lg">{icon}</span>
      <span className="flex-1">
        <span className="block text-sm font-semibold text-slate-800">{label}</span>
        {desc && <span className="block text-xs text-slate-400">{desc}</span>}
      </span>
      <span className="text-slate-300">›</span>
    </button>
  );
}

export default function SettingsPage() {
  const { account, logout } = useSession();

  return (
    <>
      <PageHeader title="매장 설정" right={<LogoutButton />} />

      <div className="px-4 pt-4">
        {/* 매장 정보 */}
        <Card>
          <p className="text-base font-bold text-slate-900">{STORE.name}</p>
          <p className="mt-1 text-xs text-slate-500">사업자번호 {STORE.bizNo}</p>
          <p className="text-xs text-slate-500">{STORE.address}</p>
          {account && (
            <p className="mt-2 text-xs text-brand">
              로그인: {account.name} ({ROLE_LABEL[account.role]})
            </p>
          )}
        </Card>

        <h2 className="mb-1 mt-5 px-1 text-sm font-bold text-slate-500">매장 관리</h2>
        <Card className="!p-0 divide-y divide-slate-100">
          <MenuRow icon="🏪" label="매장 정보 수정" desc="상호·주소·사업자번호" />
          <MenuRow icon="📍" label="출퇴근 위치 설정" desc="GPS 반경, QR/PIN 방식" />
          <MenuRow icon="🗓" label="스케줄 편성" desc="주간 근무표 관리" />
          <MenuRow icon="📄" label="근로계약서 발행" desc="표준계약서 템플릿" />
        </Card>

        <h2 className="mb-1 mt-5 px-1 text-sm font-bold text-slate-500">권한 / 알림</h2>
        <Card className="!p-0 divide-y divide-slate-100">
          <MenuRow icon="🔑" label="권한 관리" desc="점장 임명, 역할별 권한" />
          <MenuRow icon="💬" label="카카오 알림톡 설정" desc="출퇴근 누락·급여 알림" />
          <MenuRow icon="🔔" label="푸시 알림" desc="앱 푸시 (추후 지원)" />
        </Card>

        <h2 className="mb-1 mt-5 px-1 text-sm font-bold text-slate-500">계정</h2>
        <Card className="!p-0 divide-y divide-slate-100">
          <MenuRow icon="🏬" label="매장 추가/전환" desc="다중 매장 지원" />
          <MenuRow icon="📑" label="개인정보처리방침" />
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
