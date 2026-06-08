"use client";

// 초대 링크 합류: /join?code=XXXXXX
// 미로그인 → 카카오 로그인(로그인 후 다시 이 링크로) → 매장 확인 → 역할 선택 → 합류

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/client";
import { signInWithKakao } from "@/lib/supabase/auth";
import { LogoMark } from "@/components/logo";

export default function JoinPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-100">
          <div className="animate-pulse text-sm text-slate-400">불러오는 중…</div>
        </main>
      }
    >
      <JoinInner />
    </Suspense>
  );
}

function JoinInner() {
  const params = useSearchParams();
  const code = (params.get("code") ?? "").toUpperCase();
  const router = useRouter();
  const { ready, isAuthed, memberships, refresh, switchStore } = useSession();

  const [store, setStore] = useState<{ id: string; name: string } | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [joinRole, setJoinRole] = useState<"parttimer" | "employee">("parttimer");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // 코드로 매장 조회
  useEffect(() => {
    if (!code) {
      setNotFound(true);
      return;
    }
    const supabase = createClient();
    supabase
      .rpc("get_store_by_code", { p_code: code })
      .then(({ data }) => {
        const row = Array.isArray(data) ? data[0] : data;
        if (row) setStore({ id: row.id, name: row.name });
        else setNotFound(true);
      });
  }, [code]);

  const alreadyMember = !!store && memberships.some((m) => m.storeId === store.id);

  const handleLogin = () => signInWithKakao(`/join?code=${code}`);

  const handleJoin = async () => {
    setSaving(true);
    setError("");
    const supabase = createClient();
    const { data, error: e } = await supabase.rpc("join_store_by_code", {
      p_code: code,
      p_role: joinRole,
    });
    setSaving(false);
    if (e) {
      if (e.message.includes("ALREADY_MEMBER")) setError("이미 합류한 매장이에요.");
      else if (e.message.includes("INVALID_CODE")) setError("유효하지 않은 코드예요.");
      else setError("합류에 실패했어요. 다시 시도해 주세요.");
      return;
    }
    await refresh();
    if (typeof data === "string") switchStore(data);
    router.replace("/me");
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center bg-slate-100 px-5 py-10">
      <div className="rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-100">
        <LogoMark size={48} variant="icon" className="mx-auto" />

        {notFound ? (
          <>
            <h1 className="mt-4 text-lg font-extrabold text-crew-dark">
              유효하지 않은 초대예요
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              초대 코드/링크를 다시 확인해 주세요.
            </p>
            <button
              onClick={() => router.replace("/")}
              className="mt-5 w-full rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600"
            >
              홈으로
            </button>
          </>
        ) : !store || !ready ? (
          <p className="mt-6 animate-pulse text-sm text-slate-400">
            매장 정보 확인 중…
          </p>
        ) : (
          <>
            <p className="mt-4 text-sm text-brand">매장 초대</p>
            <h1 className="text-xl font-extrabold text-crew-dark">{store.name}</h1>

            {alreadyMember ? (
              <>
                <p className="mt-3 text-sm text-slate-500">
                  이미 이 매장에 합류해 있어요.
                </p>
                <button
                  onClick={() => {
                    switchStore(store.id);
                    router.replace("/me");
                  }}
                  className="mt-5 w-full rounded-xl bg-brand py-3 text-sm font-bold text-white"
                >
                  매장으로 이동
                </button>
              </>
            ) : !isAuthed ? (
              <>
                <p className="mt-3 text-sm text-slate-500">
                  카카오로 로그인하면 이 매장에 합류합니다.
                </p>
                <button
                  onClick={handleLogin}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#FEE500] py-3.5 text-base font-bold text-[#191600]"
                >
                  💬 카카오로 로그인하고 합류
                </button>
              </>
            ) : (
              <>
                <p className="mt-3 text-sm text-slate-500">
                  어떤 유형으로 합류할까요?
                </p>
                <div className="mt-4 flex gap-2">
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
                {error && (
                  <p className="mt-3 text-xs font-medium text-red-500">{error}</p>
                )}
                <button
                  onClick={handleJoin}
                  disabled={saving}
                  className="mt-4 w-full rounded-xl bg-brand py-3 text-sm font-bold text-white transition active:scale-[0.98] disabled:opacity-60"
                >
                  {saving ? "합류 중…" : `${store.name}에 합류하기`}
                </button>
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}
