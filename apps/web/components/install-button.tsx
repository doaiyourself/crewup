"use client";

import { useEffect, useState } from "react";

// "앱 설치" 버튼 — Android/데스크톱은 beforeinstallprompt, iOS는 안내.
export function InstallButton() {
  const [deferred, setDeferred] = useState<any>(null);
  const [iosHint, setIosHint] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onPrompt = (e: any) => {
      e.preventDefault();
      setDeferred(e);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    // 이미 설치(standalone)면 숨김
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setInstalled(standalone);

    // iOS Safari 판별 (beforeinstallprompt 미지원)
    const ua = window.navigator.userAgent;
    const isIos = /iphone|ipad|ipod/i.test(ua);
    const isSafari = /safari/i.test(ua) && !/crios|fxios/i.test(ua);
    if (isIos && isSafari && !standalone) setIosHint(true);

    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (installed) return null;

  if (deferred) {
    return (
      <button
        onClick={async () => {
          deferred.prompt();
          await deferred.userChoice;
          setDeferred(null);
        }}
        className="w-full rounded-xl bg-white/15 py-3 text-sm font-semibold text-white backdrop-blur transition active:scale-[0.98]"
      >
        📲 홈 화면에 앱 설치하기
      </button>
    );
  }

  if (iosHint) {
    return (
      <p className="text-center text-xs text-blue-100/80">
        📲 앱처럼 쓰려면: 공유 버튼 → <b>홈 화면에 추가</b>
      </p>
    );
  }

  return null;
}
