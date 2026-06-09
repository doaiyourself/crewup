"use client";

import { useState } from "react";

// 카카오 JS 키가 있으면 Kakao.Share(리치 카드), 없으면 기기 공유시트/복사로 폴백.
const JS_KEY = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
const SDK_SRC = "https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js";
const OG_IMAGE = "https://crewup.kr/og.png";

declare global {
  interface Window {
    Kakao?: any;
  }
}

function loadKakao(): Promise<any | null> {
  return new Promise((resolve) => {
    if (!JS_KEY || typeof window === "undefined") return resolve(null);
    const init = () => {
      try {
        if (!window.Kakao.isInitialized()) window.Kakao.init(JS_KEY);
        resolve(window.Kakao);
      } catch {
        resolve(null);
      }
    };
    if (window.Kakao) return init();
    const s = document.createElement("script");
    s.src = SDK_SRC;
    s.async = true;
    s.onload = init;
    s.onerror = () => resolve(null);
    document.head.appendChild(s);
  });
}

export function KakaoShareButton({
  title,
  description,
  link,
  label = "카카오톡으로 공유",
  className,
}: {
  title: string;
  description: string;
  link: string;
  label?: string;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);

  const share = async () => {
    setBusy(true);
    try {
      const Kakao = await loadKakao();
      if (Kakao?.Share) {
        Kakao.Share.sendDefault({
          objectType: "feed",
          content: {
            title,
            description,
            imageUrl: OG_IMAGE,
            link: { mobileWebUrl: link, webUrl: link },
          },
          buttons: [
            { title: "열기", link: { mobileWebUrl: link, webUrl: link } },
          ],
        });
        return;
      }
      // 폴백 1: 기기 공유시트 (모바일 → 카카오톡 선택 가능)
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title, text: description, url: link });
        return;
      }
      // 폴백 2: 링크 복사
      await navigator.clipboard.writeText(link);
      alert("링크를 복사했어요. 카카오톡에 붙여넣어 공유하세요.");
    } catch {
      /* 사용자가 공유 취소 등 — 무시 */
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={share}
      disabled={busy}
      className={
        className ??
        "flex w-full items-center justify-center gap-2 rounded-xl bg-[#FEE500] py-3 text-sm font-bold text-[#191600] transition active:scale-[0.98] disabled:opacity-70"
      }
    >
      <span>💬</span>
      {busy ? "공유 중…" : label}
    </button>
  );
}
