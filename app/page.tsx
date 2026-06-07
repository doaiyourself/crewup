"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session";
import { isAdminRole } from "@/lib/mock-data";

// 진입점: 세션 상태에 따라 로그인 / 온보딩 / 관리자 / 직원 홈으로 분기
export default function Index() {
  const { account, ready, needsOnboarding } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (needsOnboarding) {
      router.replace("/onboarding");
    } else if (!account) {
      router.replace("/login");
    } else if (isAdminRole(account.role)) {
      router.replace("/admin");
    } else {
      router.replace("/me");
    }
  }, [account, ready, needsOnboarding, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100">
      <div className="animate-pulse text-sm font-medium text-slate-400">
        Crew Up 불러오는 중…
      </div>
    </main>
  );
}
