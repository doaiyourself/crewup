"use client";

// QR 스캔 착지: /checkin?s=<storeId>&k=<qrSecret>
// 미로그인 → 카카오 로그인(복귀) → 자동 출퇴근(서버에서 QR/GPS 검증).

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "@/lib/session";
import { signInWithKakao } from "@/lib/supabase/auth";
import { LogoMark } from "@/components/logo";

export default function CheckinPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-100">
          <div className="animate-pulse text-sm text-slate-400">불러오는 중…</div>
        </main>
      }
    >
      <CheckinInner />
    </Suspense>
  );
}

function getPosition(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

type State =
  | { kind: "auth" }
  | { kind: "working" }
  | { kind: "done"; action: "in" | "out" }
  | { kind: "error"; message: string };

function CheckinInner() {
  const params = useSearchParams();
  const s = params.get("s") ?? "";
  const k = params.get("k") ?? "";
  const { isAuthed, ready } = useSession();
  const [state, setState] = useState<State>({ kind: "working" });

  const run = useCallback(async () => {
    setState({ kind: "working" });
    const pos = await getPosition();
    const res = await fetch("/api/clock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeId: s, k, lat: pos?.lat, lng: pos?.lng }),
    });
    const data = await res.json();
    if (data.ok) {
      setState({ kind: "done", action: data.action });
      return;
    }
    const msg =
      data.reason === "INVALID_QR"
        ? "유효하지 않은 QR이에요. 매장의 최신 QR을 다시 스캔하세요."
        : data.reason === "OUT_OF_RANGE"
        ? `매장에서 약 ${data.distance}m 떨어져 있어요. 매장 근처에서 스캔하세요.`
        : data.reason === "NEEDS_GPS"
        ? "위치 권한이 필요해요. 허용 후 다시 스캔하세요."
        : data.reason === "NOT_MEMBER"
        ? "이 매장 소속이 아니에요."
        : data.reason === "ALREADY_DONE"
        ? "오늘 출퇴근이 이미 완료됐어요."
        : "출퇴근 처리에 실패했어요.";
    setState({ kind: "error", message: msg });
  }, [s, k]);

  useEffect(() => {
    if (!ready) return;
    if (!s || !k) {
      setState({ kind: "error", message: "잘못된 QR이에요." });
      return;
    }
    if (!isAuthed) {
      setState({ kind: "auth" });
      return;
    }
    run();
  }, [ready, isAuthed, s, k, run]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-100 px-6 text-center">
      <LogoMark size={56} variant="icon" />

      {state.kind === "working" && (
        <p className="mt-6 animate-pulse text-sm text-slate-500">
          출퇴근 처리 중…
        </p>
      )}

      {state.kind === "auth" && (
        <>
          <h1 className="mt-5 text-lg font-extrabold text-crew-dark">
            카카오로 로그인하고 출퇴근
          </h1>
          <button
            onClick={() => signInWithKakao(`/checkin?s=${s}&k=${k}`)}
            className="mt-5 w-full max-w-xs rounded-xl bg-[#FEE500] py-3.5 text-base font-bold text-[#191600]"
          >
            💬 카카오로 로그인
          </button>
        </>
      )}

      {state.kind === "done" && (
        <>
          <p className="mt-6 text-5xl">{state.action === "in" ? "🟢" : "👋"}</p>
          <h1 className="mt-3 text-2xl font-extrabold text-crew-dark">
            {state.action === "in" ? "출근 완료!" : "퇴근 완료!"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {new Date().toLocaleTimeString("ko-KR", {
              hour: "2-digit",
              minute: "2-digit",
            })}{" "}
            기록됐어요.
          </p>
        </>
      )}

      {state.kind === "error" && (
        <>
          <p className="mt-6 text-4xl">⚠️</p>
          <p className="mt-3 max-w-xs text-sm font-medium text-slate-600">
            {state.message}
          </p>
          <button
            onClick={run}
            className="mt-5 rounded-xl bg-brand px-6 py-2.5 text-sm font-bold text-white"
          >
            다시 시도
          </button>
        </>
      )}
    </main>
  );
}
