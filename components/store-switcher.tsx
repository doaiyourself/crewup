"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session";
import { ROLE_LABEL, isAdminRole } from "@/lib/mock-data";

// 헤더 좌상단 매장 전환기.
// 현재 매장명 + 역할 칩을 보여주고, 탭하면 소속 매장 목록 + "매장 추가/합류".
export function StoreSwitcher() {
  const { memberships, currentMembership, switchStore } = useSession();
  const [open, setOpen] = useState(false);
  const router = useRouter();

  if (!currentMembership) return null;

  const handleSwitch = (storeId: string, role: string) => {
    switchStore(storeId);
    setOpen(false);
    // 역할 구분(관리자/근무자)이 바뀌면 해당 섹션으로 이동
    router.replace(isAdminRole(role as any) ? "/admin" : "/me");
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-full bg-white/15 py-1 pl-2.5 pr-2 text-xs font-semibold text-white backdrop-blur transition active:scale-95"
      >
        <span className="max-w-[140px] truncate">
          {currentMembership.storeName}
        </span>
        <span className="rounded-full bg-white/25 px-1.5 py-0.5 text-[10px]">
          {ROLE_LABEL[currentMembership.role]}
        </span>
        <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
          <path d="M5 7l5 5 5-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <>
          {/* 바깥 클릭 닫기 */}
          <button
            className="fixed inset-0 z-30 cursor-default"
            onClick={() => setOpen(false)}
            aria-label="닫기"
          />
          <div className="absolute left-0 top-full z-40 mt-2 w-60 overflow-hidden rounded-2xl bg-white text-slate-800 shadow-xl ring-1 ring-slate-200">
            <p className="px-4 pb-1 pt-3 text-[11px] font-bold text-slate-400">
              내 매장 ({memberships.length})
            </p>
            <div className="max-h-72 overflow-y-auto">
              {memberships.map((m) => {
                const active = m.storeId === currentMembership.storeId;
                return (
                  <button
                    key={m.storeId}
                    onClick={() => handleSwitch(m.storeId, m.role)}
                    className={`flex w-full items-center gap-2 px-4 py-2.5 text-left transition hover:bg-slate-50 ${
                      active ? "bg-blue-50/60" : ""
                    }`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">
                        {m.storeName}
                      </span>
                      <span className="text-xs text-slate-400">
                        {ROLE_LABEL[m.role]}
                        {m.position ? ` · ${m.position}` : ""}
                      </span>
                    </span>
                    {active && <span className="text-brand">✓</span>}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => {
                setOpen(false);
                router.push("/onboarding");
              }}
              className="flex w-full items-center gap-2 border-t border-slate-100 px-4 py-3 text-sm font-semibold text-brand transition hover:bg-blue-50/60"
            >
              ＋ 매장 추가 / 합류
            </button>
          </div>
        </>
      )}
    </div>
  );
}
