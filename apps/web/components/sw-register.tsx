"use client";

import { useEffect } from "react";

// 서비스 워커 등록 (프로덕션만 — dev에서 캐시 방지)
export function SWRegister() {
  useEffect(() => {
    if (
      process.env.NODE_ENV === "production" &&
      "serviceWorker" in navigator
    ) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}
