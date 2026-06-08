"use client";

import { useState } from "react";

// 숫자 PIN 입력 패드 (모달). 키오스크 시작/종료/설정에 재사용.
export function PinPad({
  title,
  subtitle,
  onSubmit,
  onCancel,
  length = 4,
  error,
}: {
  title: string;
  subtitle?: string;
  onSubmit: (pin: string) => void;
  onCancel?: () => void;
  length?: number;
  error?: string;
}) {
  const [pin, setPin] = useState("");

  const push = (d: string) => {
    if (pin.length >= length) return;
    const next = pin + d;
    setPin(next);
    if (next.length === length) {
      onSubmit(next);
      setTimeout(() => setPin(""), 300);
    }
  };
  const back = () => setPin((p) => p.slice(0, -1));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6 backdrop-blur-sm">
      <div className="w-full max-w-xs rounded-3xl bg-white p-6 text-center shadow-2xl">
        <h2 className="text-lg font-extrabold text-crew-dark">{title}</h2>
        {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}

        {/* 점 표시 */}
        <div className="my-5 flex justify-center gap-3">
          {Array.from({ length }).map((_, i) => (
            <span
              key={i}
              className={`h-3.5 w-3.5 rounded-full ${
                i < pin.length ? "bg-brand" : "bg-slate-200"
              }`}
            />
          ))}
        </div>

        {error && <p className="mb-3 text-xs font-medium text-red-500">{error}</p>}

        {/* 키패드 */}
        <div className="grid grid-cols-3 gap-2.5">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
            <button
              key={d}
              onClick={() => push(d)}
              className="rounded-2xl bg-slate-100 py-4 text-xl font-bold text-slate-800 transition active:scale-95 active:bg-slate-200"
            >
              {d}
            </button>
          ))}
          <button
            onClick={onCancel}
            className="rounded-2xl py-4 text-sm font-semibold text-slate-400 transition active:scale-95"
          >
            취소
          </button>
          <button
            onClick={() => push("0")}
            className="rounded-2xl bg-slate-100 py-4 text-xl font-bold text-slate-800 transition active:scale-95 active:bg-slate-200"
          >
            0
          </button>
          <button
            onClick={back}
            className="rounded-2xl py-4 text-xl font-bold text-slate-400 transition active:scale-95"
          >
            ⌫
          </button>
        </div>
      </div>
    </div>
  );
}
