"use client";

import { useEffect, useState } from "react";

// 카카오 JS 키가 있으면 Kakao.Share(리치 카드), 없으면 기기 공유시트/복사로 폴백.
// ⚠️ iOS Safari: 탭한 뒤 await로 SDK를 로드하면 "사용자 제스처"가 풀려 카카오톡 열기가 차단된다.
//    → SDK를 미리(useEffect) 로드·초기화하고, 클릭 시 동기적으로 sendDefault 호출한다.
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
  const [ready, setReady] = useState(false);

  // SDK를 미리 로드·초기화 (탭 시점에 await 없이 바로 공유하기 위함)
  useEffect(() => {
    let alive = true;
    loadKakao().then((k) => {
      if (alive) setReady(!!k?.Share);
    });
    return () => {
      alive = false;
    };
  }, []);

  const share = () => {
    // 1) 카카오 SDK 준비됨 → 제스처 안에서 동기 호출 (iOS 차단 회피)
    if (ready && window.Kakao?.Share) {
      try {
        window.Kakao.Share.sendDefault({
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
      } catch {
        /* 폴백으로 진행 */
      }
    }
    // 2) 폴백: 기기 공유시트 (모바일 → 카카오톡 선택 가능)
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ title, text: description, url: link }).catch(() => {});
      return;
    }
    // 3) 폴백: 링크 복사
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard
        .writeText(link)
        .then(() =>
          alert("링크를 복사했어요. 카카오톡에 붙여넣어 공유하세요.")
        )
        .catch(() => {});
    }
  };

  return (
    <button
      onClick={share}
      className={
        className ??
        "flex w-full items-center justify-center gap-2 rounded-xl bg-[#FEE500] py-3 text-sm font-bold text-[#191600] transition active:scale-[0.98]"
      }
    >
      <span>💬</span>
      {label}
    </button>
  );
}
