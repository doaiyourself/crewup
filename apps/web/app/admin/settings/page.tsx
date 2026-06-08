"use client";

import { useEffect, useState } from "react";
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
  const [hasPin, setHasPin] = useState<boolean | null>(null);
  const [pinMode, setPinMode] = useState(false);
  const [pinError, setPinError] = useState("");
  const [devices, setDevices] = useState<
    { id: string; label: string | null; last_used_at: string | null }[]
  >([]);
  const [newLink, setNewLink] = useState("");
  const [copied, setCopied] = useState(false);
  // 매장 정보 수정
  const [editStore, setEditStore] = useState(false);
  const [storeName, setStoreName] = useState("");
  const [storeAddr, setStoreAddr] = useState("");
  const [bizNo, setBizNo] = useState("");
  const [savingStore, setSavingStore] = useState(false);

  const loadKiosk = async () => {
    if (!currentStoreId || currentStoreId === "demo-store") return;
    const supabase = createClient();
    const [{ data: pin }, { data: devs }, { data: store }] = await Promise.all([
      supabase.rpc("has_kiosk_pin", { p_store_id: currentStoreId }),
      supabase
        .from("kiosk_devices")
        .select("id, label, last_used_at")
        .eq("store_id", currentStoreId)
        .eq("revoked", false)
        .order("created_at"),
      supabase
        .from("stores")
        .select("name, address, biz_no")
        .eq("id", currentStoreId)
        .maybeSingle(),
    ]);
    setHasPin(pin === true);
    setDevices(devs ?? []);
    if (store) {
      setStoreName(store.name ?? "");
      setStoreAddr(store.address ?? "");
      setBizNo(store.biz_no ?? "");
    }
  };

  const saveStore = async () => {
    if (!currentStoreId || !storeName.trim()) return;
    setSavingStore(true);
    const supabase = createClient();
    await supabase
      .from("stores")
      .update({ name: storeName.trim(), address: storeAddr.trim() || null })
      .eq("id", currentStoreId);
    setSavingStore(false);
    setEditStore(false);
  };

  useEffect(() => {
    loadKiosk();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    setPinMode(false);
  };

  const createDevice = async () => {
    if (!currentStoreId) return;
    const supabase = createClient();
    const { data } = await supabase.rpc("create_kiosk_device", {
      p_store_id: currentStoreId,
      p_label: "매장 태블릿",
    });
    const row = Array.isArray(data) ? data[0] : data;
    if (row?.token) {
      setNewLink(`${window.location.origin}/kiosk?token=${row.token}`);
      loadKiosk();
    }
  };

  const revokeDevice = async (id: string) => {
    const supabase = createClient();
    await supabase.rpc("revoke_kiosk_device", { p_id: id });
    loadKiosk();
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(newLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <>
      <PageHeader title="매장 설정" right={<LogoutButton />} />

      <div className="px-4 pt-4">
        {/* 매장 정보 */}
        <Card>
          {editStore ? (
            <div className="space-y-2">
              <label className="block">
                <span className="mb-0.5 block text-[11px] font-semibold text-slate-500">
                  매장 이름
                </span>
                <input
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
                />
              </label>
              <label className="block">
                <span className="mb-0.5 block text-[11px] font-semibold text-slate-500">
                  매장 주소
                </span>
                <input
                  value={storeAddr}
                  onChange={(e) => setStoreAddr(e.target.value)}
                  placeholder="서울특별시 강남구 …"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
                />
              </label>
              <p className="text-[11px] text-slate-400">
                사업자번호 {bizNo || "-"} (인증 정보라 변경 불가)
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={saveStore}
                  disabled={savingStore}
                  className="flex-1 rounded-lg bg-brand py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {savingStore ? "저장 중…" : "저장"}
                </button>
                <button
                  onClick={() => setEditStore(false)}
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-400"
                >
                  취소
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between">
              <div>
                <p className="text-base font-bold text-slate-900">
                  {storeName || currentMembership?.storeName || "매장"}
                </p>
                {storeAddr && (
                  <p className="mt-0.5 text-xs text-slate-500">{storeAddr}</p>
                )}
                {account && (
                  <p className="mt-1 text-xs text-brand">
                    로그인: {account.name} ({ROLE_LABEL[account.role]})
                  </p>
                )}
              </div>
              <button
                onClick={() => setEditStore(true)}
                className="shrink-0 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600"
              >
                정보 수정
              </button>
            </div>
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
            매장 태블릿·PC에 띄우는 공용 출퇴근 화면이에요. <b>기기 연결 링크</b>를
            만들어 그 기기에서 한 번 열면 연결됩니다. 키오스크에는 관리자 로그인이
            남지 않아 안전합니다.
          </p>

          {/* PIN (연결 해제 보호) */}
          <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
            <span className="text-sm text-slate-600">
              연결 해제 PIN {hasPin ? "✅ 설정됨" : "⚠️ 미설정"}
            </span>
            <button
              onClick={() => {
                setPinError("");
                setPinMode(true);
              }}
              className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200"
            >
              {hasPin ? "변경" : "설정"}
            </button>
          </div>

          {/* 기기 연결 링크 생성 */}
          <button
            onClick={createDevice}
            disabled={!hasPin}
            className="mt-3 w-full rounded-xl bg-brand py-3 text-sm font-bold text-white transition active:scale-[0.98] disabled:bg-slate-200 disabled:text-slate-400"
          >
            ＋ 새 기기 연결 링크 만들기
          </button>
          {!hasPin && (
            <p className="mt-2 text-xs text-amber-600">
              먼저 연결 해제 PIN을 설정하세요.
            </p>
          )}

          {newLink && (
            <div className="mt-3 rounded-xl border border-brand/30 bg-blue-50/50 p-3">
              <p className="text-xs font-semibold text-brand">연결 링크 생성됨</p>
              <p className="mt-1 break-all rounded-lg bg-white px-3 py-2 text-xs text-slate-500">
                {newLink}
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={copyLink}
                  className="flex-1 rounded-lg bg-brand py-2 text-xs font-semibold text-white"
                >
                  {copied ? "복사됨!" : "링크 복사"}
                </button>
                <a
                  href={newLink}
                  target="_blank"
                  rel="noopener"
                  className="flex-1 rounded-lg border border-slate-300 bg-white py-2 text-center text-xs font-semibold text-slate-600"
                >
                  이 기기에서 열기
                </a>
              </div>
              <p className="mt-2 text-[11px] text-slate-400">
                ⚠️ 링크에는 기기 토큰이 들어있어요. 매장 기기에서만 열고 외부에
                공유하지 마세요.
              </p>
            </div>
          )}

          {/* 연결된 기기 목록 */}
          {devices.length > 0 && (
            <div className="mt-3 border-t border-slate-100 pt-3">
              <p className="mb-1 text-xs font-semibold text-slate-500">
                연결된 기기 ({devices.length})
              </p>
              {devices.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between py-1.5 text-sm"
                >
                  <span className="text-slate-700">
                    {d.label ?? "기기"}
                    <span className="ml-2 text-xs text-slate-400">
                      {d.last_used_at
                        ? `최근 사용 ${new Date(d.last_used_at).toLocaleDateString("ko-KR")}`
                        : "미사용"}
                    </span>
                  </span>
                  <button
                    onClick={() => revokeDevice(d.id)}
                    className="text-xs font-semibold text-red-500"
                  >
                    연결 끊기
                  </button>
                </div>
              ))}
            </div>
          )}

          <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
            🔒 완전 잠금을 원하면 태블릿의 가이드 액세스(아이패드)·화면 고정(안드로이드)도 함께 켜세요.
          </p>
        </Card>

        <h2 className="mb-1 mt-5 px-1 text-sm font-bold text-slate-500">매장 관리</h2>
        <Card className="!p-0 divide-y divide-slate-100">
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

      {pinMode && (
        <PinPad
          title={hasPin ? "연결 해제 PIN 변경" : "연결 해제 PIN 설정"}
          subtitle="4자리 숫자를 입력하세요"
          error={pinError}
          onSubmit={handleSetPin}
          onCancel={() => setPinMode(false)}
        />
      )}
    </>
  );
}
