"use client";

// 미인증(pending) 매장이면 관리자 화면을 잠그고 사업자 인증 화면을 띄운다.
// 사장(owner)만 인증 가능. 인증 통과(active) 시 세션 갱신 후 정상 진입.

import { useEffect, useState } from "react";
import { useSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/client";
import { LogoMark } from "@/components/logo";

export function VerificationGate({ children }: { children: React.ReactNode }) {
  const { account, currentMembership, currentStoreId, refresh, logout } =
    useSession();

  const pending = currentMembership?.storeStatus === "pending";
  const isOwner = account?.role === "owner";

  const [bizNo, setBizNo] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [openDate, setOpenDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // 매장에 저장된 사업자 정보 프리필
  useEffect(() => {
    if (!pending || !isOwner || !currentStoreId) return;
    const supabase = createClient();
    supabase
      .from("stores")
      .select("biz_no, biz_owner_name, biz_open_date")
      .eq("id", currentStoreId)
      .single()
      .then(({ data }) => {
        if (data) {
          setBizNo(data.biz_no ?? "");
          setOwnerName(data.biz_owner_name ?? "");
          setOpenDate(data.biz_open_date ?? "");
        }
      });
  }, [pending, isOwner, currentStoreId]);

  if (!pending) return <>{children}</>;

  const handleVerify = async () => {
    if (!bizNo.trim() || !ownerName.trim() || !openDate.trim()) {
      setMsg("사업자번호·대표자명·개업일자를 모두 입력해 주세요.");
      return;
    }
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch("/api/verify-store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId: currentStoreId,
          bizNo,
          ownerName,
          openDate,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        await refresh();
        return; // pending 해제 → children 렌더
      }
      if (data.reason === "NO_API_KEY")
        setMsg("아직 검증 API 키가 설정되지 않았어요. 관리자에게 문의하세요.");
      else if (data.reason === "MISMATCH")
        setMsg(
          "국세청 정보와 일치하지 않습니다. 사업자번호·대표자명·개업일자를 다시 확인해 주세요."
        );
      else setMsg("인증에 실패했어요. 잠시 후 다시 시도해 주세요.");
    } catch {
      setMsg("네트워크 오류가 발생했어요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center bg-slate-100 px-5 py-10">
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
        <div className="flex items-center gap-3">
          <LogoMark size={40} variant="icon" />
          <div>
            <p className="text-sm font-bold text-brand">사업자 인증 필요</p>
            <h1 className="text-lg font-extrabold text-crew-dark">
              {currentMembership?.storeName}
            </h1>
          </div>
        </div>

        {isOwner ? (
          <>
            <p className="mt-4 text-sm text-slate-500">
              매장 운영을 시작하려면 국세청 사업자 정보 인증이 필요합니다.
              사업자등록증의 정보와 동일하게 입력해 주세요.
            </p>
            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-600">
                  사업자번호 <span className="text-red-500">*</span>
                </span>
                <input
                  value={bizNo}
                  onChange={(e) => setBizNo(e.target.value)}
                  placeholder="123-45-67890"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-600">
                  대표자명 <span className="text-red-500">*</span>
                </span>
                <input
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="홍길동"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-600">
                  개업일자 <span className="text-red-500">*</span>
                </span>
                <input
                  type="date"
                  value={openDate}
                  onChange={(e) => setOpenDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand"
                />
              </label>
            </div>
            {msg && <p className="mt-3 text-xs font-medium text-red-500">{msg}</p>}
            <button
              onClick={handleVerify}
              disabled={loading}
              className="mt-4 w-full rounded-xl bg-brand py-3 text-sm font-bold text-white transition active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? "국세청 조회 중…" : "사업자 인증하기"}
            </button>
          </>
        ) : (
          <p className="mt-4 text-sm text-slate-500">
            사장님의 사업자 인증이 완료되면 매장을 이용할 수 있어요. 잠시만
            기다려 주세요.
          </p>
        )}

        <button
          onClick={() => logout()}
          className="mt-5 w-full text-center text-xs text-slate-400 underline"
        >
          로그아웃
        </button>
      </div>
    </main>
  );
}
