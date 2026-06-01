"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session";
import {
  DEMO_ACCOUNTS,
  ROLE_LABEL,
  isAdminRole,
  type Account,
} from "@/lib/mock-data";

export default function LoginPage() {
  const { login } = useSession();
  const router = useRouter();
  const [picking, setPicking] = useState(false);

  const handleKakao = () => {
    // 추후 Supabase Auth 카카오 OAuth로 교체. 지금은 데모 계정 선택.
    setPicking(true);
  };

  const handleSelect = (acc: Account) => {
    login(acc);
    router.replace(isAdminRole(acc.role) ? "/admin" : "/me");
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between bg-gradient-to-b from-brand to-brand-dark px-6 py-14 text-white">
      {/* 로고/브랜드 */}
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/15 text-4xl shadow-lg backdrop-blur">
          👥
        </div>
        <h1 className="mt-5 text-3xl font-extrabold tracking-tight">Crew Up</h1>
        <p className="mt-2 text-sm text-blue-100">
          알바 출퇴근 · 근로계약 · 급여 관리
        </p>
      </div>

      {/* 로그인 영역 */}
      <div className="w-full max-w-md">
        {!picking ? (
          <>
            <button
              onClick={handleKakao}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FEE500] py-3.5 text-base font-bold text-[#191600] shadow-md transition active:scale-[0.98]"
            >
              <span className="text-lg">💬</span>
              카카오로 시작하기
            </button>
            <p className="mt-4 text-center text-xs text-blue-100/80">
              로그인 시 이용약관 및 개인정보처리방침에 동의합니다.
            </p>
          </>
        ) : (
          <div className="rounded-2xl bg-white p-4 text-slate-900 shadow-xl">
            <p className="mb-1 text-sm font-bold">데모 계정 선택</p>
            <p className="mb-3 text-xs text-slate-500">
              카카오 SSO 연동 전 임시 화면입니다. 역할을 골라 둘러보세요.
            </p>
            <div className="space-y-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.id}
                  onClick={() => handleSelect(acc)}
                  className="flex w-full items-center gap-3 rounded-xl border border-slate-200 p-3 text-left transition active:scale-[0.99] hover:border-brand hover:bg-blue-50"
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{ backgroundColor: acc.avatarColor }}
                  >
                    {acc.name.charAt(0)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{acc.name}</span>
                    <span className="block text-xs text-slate-500">
                      {ROLE_LABEL[acc.role]} · {acc.position}
                    </span>
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      isAdminRole(acc.role)
                        ? "bg-brand/10 text-brand"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {isAdminRole(acc.role) ? "관리자" : "근무자"}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
