"use client";

// 온보딩: 가입(카카오 로그인)은 끝난 상태. 여기서 매장과의 관계를 정한다.
//  · 사장님으로 시작 → 사업자 정보로 매장 생성 (create_store RPC)
//  · 직원/알바로 합류 → 매장 코드 입력 (join_store_by_code RPC)
// 이미 매장이 있어도 매장 추가/합류를 위해 다시 들어올 수 있다.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/client";
import { LogoMark } from "@/components/logo";

type Step = "choose" | "owner" | "join" | "done";

export default function OnboardingPage() {
  const { ready, account, needsOnboarding, memberships, refresh, switchStore, logout } =
    useSession();
  const router = useRouter();
  const [step, setStep] = useState<Step>("choose");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // 매장 폼
  const [name, setName] = useState("");
  const [bizNo, setBizNo] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [openDate, setOpenDate] = useState("");
  const [address, setAddress] = useState("");
  const [createdCode, setCreatedCode] = useState("");
  const [verified, setVerified] = useState(false);

  // 합류 폼
  const [code, setCode] = useState("");
  const [joinRole, setJoinRole] = useState<"parttimer" | "employee">(
    "parttimer"
  );

  const hasStores = memberships.length > 0;

  useEffect(() => {
    // 로그인 안 됐고(=user 없음) 온보딩 대상도 아니면 로그인으로.
    // needsOnboarding(로그인됨 + 매장 0개)이면 온보딩 화면을 유지해야 한다.
    if (ready && !account && !needsOnboarding && memberships.length === 0) {
      router.replace("/login");
    }
  }, [ready, account, needsOnboarding, memberships.length, router]);

  // --- 사장: 매장 생성 + 사업자 인증 ---
  const handleCreate = async () => {
    if (!name.trim()) return setError("매장 이름을 입력해 주세요.");
    if (!bizNo.trim()) return setError("사업자번호를 입력해 주세요.");
    if (!ownerName.trim()) return setError("대표자명을 입력해 주세요.");
    if (!openDate.trim()) return setError("개업일자를 입력해 주세요.");
    setSaving(true);
    setError("");
    const supabase = createClient();
    const { data, error: e } = await supabase.rpc("create_store", {
      p_name: name.trim(),
      p_biz_no: bizNo.trim(),
      p_address: address.trim(),
      p_owner_name: ownerName.trim(),
      p_open_date: openDate,
    });
    if (e) {
      setSaving(false);
      setError("매장 생성에 실패했어요. 다시 시도해 주세요.");
      return;
    }
    const row = Array.isArray(data) ? data[0] : data;
    setCreatedCode(row?.join_code ?? "");
    const sid = row?.store_id as string | undefined;

    // 국세청 진위확인
    try {
      const res = await fetch("/api/verify-store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId: sid,
          bizNo: bizNo.trim(),
          ownerName: ownerName.trim(),
          openDate,
        }),
      });
      const v = await res.json();
      setVerified(!!v.ok);
    } catch {
      setVerified(false);
    }

    await refresh();
    if (sid) switchStore(sid);
    setSaving(false);
    setStep("done");
  };

  // --- 직원/알바: 코드로 합류 ---
  const handleJoin = async () => {
    if (!code.trim()) return setError("매장 코드를 입력해 주세요.");
    setSaving(true);
    setError("");
    const supabase = createClient();
    const { data, error: e } = await supabase.rpc("join_store_by_code", {
      p_code: code.trim(),
      p_role: joinRole,
    });
    setSaving(false);
    if (e) {
      if (e.message.includes("INVALID_CODE"))
        setError("존재하지 않는 매장 코드예요. 다시 확인해 주세요.");
      else if (e.message.includes("ALREADY_MEMBER"))
        setError("이미 합류한 매장이에요.");
      else setError("합류에 실패했어요. 다시 시도해 주세요.");
      return;
    }
    await refresh();
    if (typeof data === "string") switchStore(data);
    router.replace("/me");
  };

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="animate-pulse text-sm text-slate-400">불러오는 중…</div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col bg-slate-100 px-5 py-10">
      <div className="mb-6 flex items-center gap-3">
        <LogoMark size={40} variant="icon" />
        <div>
          <p className="text-sm font-medium text-brand">환영합니다 👋</p>
          <h1 className="text-xl font-extrabold text-crew-dark">
            {step === "choose" && "어떻게 시작할까요?"}
            {step === "owner" && "매장을 등록해 주세요"}
            {step === "join" && "매장에 합류하기"}
            {step === "done" && "매장이 만들어졌어요!"}
          </h1>
        </div>
      </div>

      {/* STEP: 선택 */}
      {step === "choose" && (
        <div className="space-y-3">
          <button
            onClick={() => {
              setError("");
              setStep("owner");
            }}
            className="flex w-full items-center gap-4 rounded-2xl bg-white p-5 text-left shadow-sm ring-1 ring-slate-100 transition active:scale-[0.99] hover:ring-brand"
          >
            <span className="text-3xl">🏪</span>
            <span>
              <span className="block font-bold text-crew-dark">
                사장님으로 시작
              </span>
              <span className="text-sm text-slate-500">
                사업자 정보로 매장을 만들고 크루를 초대해요.
              </span>
            </span>
          </button>
          <button
            onClick={() => {
              setError("");
              setStep("join");
            }}
            className="flex w-full items-center gap-4 rounded-2xl bg-white p-5 text-left shadow-sm ring-1 ring-slate-100 transition active:scale-[0.99] hover:ring-brand"
          >
            <span className="text-3xl">🧑‍🍳</span>
            <span>
              <span className="block font-bold text-crew-dark">
                직원·알바로 합류
              </span>
              <span className="text-sm text-slate-500">
                사장님께 받은 매장 코드로 합류해요.
              </span>
            </span>
          </button>

          {hasStores ? (
            <button
              onClick={() => router.back()}
              className="mt-2 w-full text-center text-xs text-slate-400 underline"
            >
              취소하고 돌아가기
            </button>
          ) : (
            <button
              onClick={() => logout()}
              className="mt-2 w-full text-center text-xs text-slate-400 underline"
            >
              다른 계정으로 로그인
            </button>
          )}
        </div>
      )}

      {/* STEP: 사장 - 매장 생성 */}
      {step === "owner" && (
        <div className="space-y-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <Field label="매장 이름" required>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 뭉텅 강남점"
              className="input"
            />
          </Field>
          <Field label="사업자번호" required>
            <input
              value={bizNo}
              onChange={(e) => setBizNo(e.target.value)}
              placeholder="123-45-67890"
              className="input"
            />
          </Field>
          <Field label="대표자명" required>
            <input
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder="사업자등록증상 대표자 성명"
              className="input"
            />
          </Field>
          <Field label="개업일자" required>
            <input
              type="date"
              value={openDate}
              onChange={(e) => setOpenDate(e.target.value)}
              className="input dateinput"
            />
          </Field>
          <Field label="매장 주소">
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="서울특별시 강남구 …"
              className="input"
            />
          </Field>
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-[11px] leading-relaxed text-slate-400">
            🔒 입력한 정보는 국세청 사업자등록 진위확인에 사용됩니다.
            사업자등록증과 동일하게 입력해 주세요.
          </p>
          {error && <p className="text-xs font-medium text-red-500">{error}</p>}
          <button
            onClick={handleCreate}
            disabled={saving}
            className="w-full rounded-xl bg-brand py-3 text-sm font-bold text-white transition active:scale-[0.98] disabled:opacity-60"
          >
            {saving ? "생성 중…" : "매장 만들고 시작하기"}
          </button>
          <button
            onClick={() => {
              setError("");
              setStep("choose");
            }}
            className="w-full text-center text-xs text-slate-400 underline"
          >
            뒤로
          </button>
        </div>
      )}

      {/* STEP: 직원 - 코드 합류 */}
      {step === "join" && (
        <div className="space-y-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <Field label="매장 코드" required>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="예: A1B2C3"
              maxLength={6}
              className="input tracking-[0.3em]"
            />
          </Field>
          <div>
            <span className="mb-1 block text-xs font-semibold text-slate-600">
              합류 유형
            </span>
            <div className="flex gap-2">
              {[
                { k: "parttimer", label: "알바" },
                { k: "employee", label: "직원" },
              ].map((o) => (
                <button
                  key={o.k}
                  onClick={() => setJoinRole(o.k as "parttimer" | "employee")}
                  className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition ${
                    joinRole === o.k
                      ? "bg-brand text-white"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
          {error && <p className="text-xs font-medium text-red-500">{error}</p>}
          <button
            onClick={handleJoin}
            disabled={saving}
            className="w-full rounded-xl bg-brand py-3 text-sm font-bold text-white transition active:scale-[0.98] disabled:opacity-60"
          >
            {saving ? "합류 중…" : "합류하기"}
          </button>
          <button
            onClick={() => {
              setError("");
              setStep("choose");
            }}
            className="w-full text-center text-xs text-slate-400 underline"
          >
            뒤로
          </button>
        </div>
      )}

      {/* STEP: 완료 - 인증 상태 + 코드 안내 */}
      {step === "done" && (
        <div className="space-y-4 rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-100">
          <p className="text-4xl">{verified ? "🎉" : "📋"}</p>
          {verified ? (
            <p className="text-sm font-semibold text-green-600">
              사업자 인증 완료! 매장 운영을 시작할 수 있어요.
            </p>
          ) : (
            <p className="text-sm font-semibold text-amber-600">
              매장이 생성됐어요. 다만 <b>사업자 인증이 완료되지 않아</b> 운영
              기능이 잠겨 있습니다. 관리자 화면에서 인증을 마저 진행해 주세요.
            </p>
          )}
          <div>
            <p className="mb-1 text-xs text-slate-400">크루 초대용 매장 코드</p>
            <div className="rounded-xl bg-slate-50 py-4">
              <p className="text-2xl font-extrabold tracking-[0.3em] text-crew-dark">
                {createdCode || "------"}
              </p>
            </div>
          </div>
          <button
            onClick={() => router.replace("/admin")}
            className="w-full rounded-xl bg-brand py-3 text-sm font-bold text-white transition active:scale-[0.98]"
          >
            {verified ? "관리자 페이지로 이동" : "인증 계속하기"}
          </button>
        </div>
      )}

      <style>{`.input{width:100%;border:1px solid #e2e8f0;border-radius:0.75rem;padding:0.625rem 0.75rem;font-size:0.875rem;outline:none}.input:focus{border-color:#2F6BFF}.dateinput{-webkit-appearance:none;appearance:none;background-color:#fff;color:#0f172a;text-align:left;padding-left:2.5rem;background-repeat:no-repeat;background-position:left 0.75rem center;background-size:18px 18px;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='4.5' width='18' height='17' rx='2.5'/%3E%3Cpath d='M3 9h18M8 3v4M16 3v4'/%3E%3C/svg%3E")}.dateinput::-webkit-date-and-time-value{text-align:left}.dateinput::-webkit-calendar-picker-indicator{margin-left:auto}`}</style>
    </main>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-slate-600">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}
