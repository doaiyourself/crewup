"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session";
import { isAdminRole } from "@/lib/mock-data";

// 섹션 진입 가드: 로그인/역할 확인 후 부적합하면 리다이렉트
export function Guard({
  need,
  children,
}: {
  need: "admin" | "worker";
  children: React.ReactNode;
}) {
  const { account, ready } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (!account) {
      router.replace("/login");
      return;
    }
    const admin = isAdminRole(account.role);
    if (need === "admin" && !admin) router.replace("/me");
    if (need === "worker" && admin) router.replace("/admin");
  }, [account, ready, need, router]);

  if (!ready || !account) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="animate-pulse text-sm font-medium text-slate-400">
          불러오는 중…
        </div>
      </main>
    );
  }

  const admin = isAdminRole(account.role);
  if ((need === "admin") !== admin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="animate-pulse text-sm font-medium text-slate-400">
          이동 중…
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
