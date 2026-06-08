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
    <header className="sticky top-0 z-10 rounded-b-[28px] bg-gradient-to-br from-brand to-brand-dark px-5 pb-7 pt-5 text-white shadow-lg shadow-brand/20">
      <div className="mx-auto max-w-md">
        <div className="flex items-center justify-between">
          <StoreSwitcher />
          {right}
        </div>
        <div className="mt-3.5">
          <h1 className="text-[22px] font-extrabold tracking-tight">{title}</h1>
          {subtitle && (
            <p className="mt-0.5 text-sm text-blue-100">{subtitle}</p>
          )}
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
export function LogoutButton() {
  const { account, logout } = useSession();
  if (!account) return null;
  return (
    <button
      onClick={logout}
      className="flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold backdrop-blur transition active:scale-95"
    >
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/25 text-[11px]">
        {account.name.charAt(0)}
      </span>
      <span>{ROLE_LABEL[account.role]}</span>
    </button>
  );
}
