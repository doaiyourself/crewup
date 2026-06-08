"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/client";
import { ROLE_LABEL } from "@/lib/mock-data";
import { PageHeader, Card, LogoutButton } from "@/components/ui";
import { PinPad } from "@/components/pin-pad";

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
  const { account, logout, currentMembership, currentStoreId } = useSession();
  const router = useRouter();
  const [hasPin, setHasPin] = useState<boolean | null>(null);
  const [pinMode, setPinMode] = useState<null | "set" | "start">(null);
  const [pinError, setPinError] = useState("");

  useEffect(() => {
    if (!currentStoreId || currentStoreId === "demo-store") return;
    const supabase = createClient();
    supabase
      .rpc("has_kiosk_pin", { p_store_id: currentStoreId })
      .then(({ data }) => setHasPin(data === true));
  }, [currentStoreId]);

  const handleSetPin = async (pin: string) => {
    if (!currentStoreId) return;
    const supabase = createClient();
    const { error } = await supabase.rpc("set_kiosk_pin", {
      p_store_id: currentStoreId,
      p_pin: pin,
    });
    if (error) {
      setPinError("PIN 설정 실패 (4자리 이상)");
      return;
    }
    setHasPin(true);
    setPinMode(null);
  };

  const handleStart = async (pin: string) => {
    if (!currentStoreId) return;
    const supabase = createClient();
    const { data } = await supabase.rpc("verify_kiosk_pin", {
      p_store_id: currentStoreId,
      p_pin: pin,
    });
    if (data === true) {
      router.push("/kiosk");
    } else {
      setPinError("PIN이 올바르지 않습니다.");
    }
  };

  return (
    <>
      <PageHeader title="매장 설정" right={<LogoutButton />} />

      <div className="px-4 pt-4">
        {/* 매장 정보 */}
        <Card>
          <p className="text-base font-bold text-slate-900">
            {currentMembership?.storeName ?? "매장"}
          </p>
          {account && (
            <p className="mt-1 text-xs text-brand">
              로그인: {account.name} ({ROLE_LABEL[account.role]})
            </p>
          )}
        </Card>

        {/* 매장 초대 코드 */}
        {currentMembership?.joinCode && (
          <Card className="mt-3 bg-brand text-white !ring-0">
            <p className="text-xs text-blue-100">매장 초대 코드</p>
            <div className="mt-1 flex items-center justify-between">
              <p className="text-2xl font-extrabold tracking-[0.25em]">
                {currentMembership.joinCode}
              </p>
              <span className="rounded-lg bg-white/20 px-3 py-1.5 text-xs font-semibold">
                직원에게 공유
              </span>
            </div>
            <p className="mt-1.5 text-xs text-blue-100">
              직원·알바가 이 코드로 매장에 합류할 수 있어요.
            </p>
          </Card>
        )}

        {/* 키오스크(매장 대시보드) */}
        <h2 className="mb-1 mt-5 px-1 text-sm font-bold text-slate-500">
          매장 대시보드 (키오스크)
        </h2>
        <Card>
          <p className="text-sm text-slate-600">
            매장의 태블릿·PC에 띄워두는 공용 출퇴근 화면이에요. 직원들이 직접
            출퇴근을 찍고, 오늘의 할일을 확인합니다.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => {
                setPinError("");
                setPinMode("start");
              }}
              disabled={!hasPin}
              className="flex-1 rounded-xl bg-brand py-3 text-sm font-bold text-white transition active:scale-[0.98] disabled:bg-slate-200 disabled:text-slate-400"
            >
              📺 키오스크 시작
            </button>
            <button
              onClick={() => {
                setPinError("");
                setPinMode("set");
              }}
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition active:scale-[0.98]"
            >
              {hasPin ? "PIN 변경" : "PIN 설정"}
            </button>
          </div>
          {!hasPin && (
            <p className="mt-2 text-xs text-amber-600">
              먼저 4자리 이상 PIN을 설정하세요. (시작·종료 시 필요)
            </p>
          )}
          <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
            🔒 완전 잠금을 원하면 태블릿의 가이드 액세스(아이패드)·화면 고정(안드로이드)도 함께 켜세요.
          </p>
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

      {pinMode === "set" && (
        <PinPad
          title={hasPin ? "새 PIN 설정" : "키오스크 PIN 설정"}
          subtitle="4자리 숫자를 입력하세요"
          error={pinError}
          onSubmit={handleSetPin}
          onCancel={() => setPinMode(null)}
        />
      )}
      {pinMode === "start" && (
        <PinPad
          title="키오스크 시작"
          subtitle="관리자 PIN을 입력하세요"
          error={pinError}
          onSubmit={handleStart}
          onCancel={() => setPinMode(null)}
        />
      )}
    </>
  );
}
