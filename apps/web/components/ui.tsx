"use client";

import { useSession } from "@/lib/session";
import { ROLE_LABEL } from "@/lib/mock-data";
import { StoreSwitcher } from "@/components/store-switcher";

// 페이지 상단 브랜드 헤더 (매장 전환기 + 타이틀)
export function PageHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-10 bg-slate-100/90 px-4 pb-2 pt-4 backdrop-blur">
      <div className="mx-auto max-w-md">
        <div className="flex items-center justify-between">
          <StoreSwitcher light />
          {right ?? <LogoutButton light />}
        </div>
        <div className="mt-2 flex items-baseline gap-2 px-1">
          <h1 className="text-lg font-extrabold tracking-tight text-slate-900">
            {title}
          </h1>
          {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
        </div>
      </div>
    </header>
  );
}

export function Avatar({
  name,
  color,
  size = 44,
}: {
  name: string;
  color: string;
  size?: number;
}) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-bold text-white"
      style={{
        backgroundColor: color,
        width: size,
        height: size,
        fontSize: size * 0.4,
      }}
    >
      {name.charAt(0)}
    </div>
  );
}

export function Card({
  children,
  className = "",
  tone = "default",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "default" | "brand";
}) {
  const toneCls =
    tone === "brand"
      ? "bg-gradient-to-br from-brand to-brand-dark text-white shadow-md shadow-brand/20"
      : "bg-white ring-1 ring-slate-100/80 shadow-[0_1px_3px_rgba(15,23,42,0.04)]";
  return (
    <div className={`rounded-2xl p-4 ${toneCls} ${className}`}>{children}</div>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2 mt-5 px-1 text-sm font-bold text-slate-500">
      {children}
    </h2>
  );
}

// 로그아웃 버튼 (헤더 우측)
export function LogoutButton({ light = false }: { light?: boolean }) {
  const { account, logout } = useSession();
  if (!account) return null;
  return (
    <button
      onClick={logout}
      className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${
        light
          ? "bg-white text-slate-600 shadow-sm ring-1 ring-slate-200"
          : "bg-white/15 backdrop-blur"
      }`}
    >
      <span
        className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold text-white ${
          light ? "" : "bg-white/25"
        }`}
        style={light ? { backgroundColor: account.avatarColor } : undefined}
      >
        {account.name.charAt(0)}
      </span>
      <span>{ROLE_LABEL[account.role]}</span>
    </button>
  );
}
