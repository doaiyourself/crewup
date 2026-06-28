"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/client";

// PWA 앱 아이콘 뱃지 (Badging API)
// - 사장/위임 점장: 매장의 대기중 수정·추가 요청 수 (RLS로 전체)
// - 직원·알바·점장: 본인 대기중 요청 수 (RLS로 본인만)
// 앱을 열거나 포커스/탭 전환 시 갱신. iOS 16.4+ 설치 PWA·데스크톱 Chrome/Edge에서 표시.
export function AppBadge() {
  const { account, currentStoreId } = useSession();
  const pathname = usePathname();

  useEffect(() => {
    const nav = typeof navigator !== "undefined" ? (navigator as any) : null;
    if (!nav || typeof nav.setAppBadge !== "function") return; // 미지원(예: Android) → 무시

    let cancelled = false;
    const storeId = currentStoreId;

    const update = async () => {
      if (!account || !storeId || storeId === "demo-store") {
        nav.clearAppBadge?.();
        return;
      }
      const supabase = createClient();
      const { count } = await supabase
        .from("attendance_requests")
        .select("id", { count: "exact", head: true })
        .eq("store_id", storeId)
        .eq("status", "pending");
      if (cancelled) return;
      if (count && count > 0) nav.setAppBadge(count);
      else nav.clearAppBadge?.();
    };

    update();
    const onVisible = () => {
      if (document.visibilityState === "visible") update();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", update);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", update);
    };
  }, [account, currentStoreId, pathname]);

  return null;
}
