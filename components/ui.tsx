"use client";

import { useSession } from "@/lib/session";
import { ROLE_LABEL, STORE } from "@/lib/mock-data";

// 페이지 상단 브랜드 헤더 (매장명 + 타이틀)
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
    <header className="sticky top-0 z-10 bg-brand px-5 pb-4 pt-6 text-white shadow-md">
      <div className="mx-auto flex max-w-md items-end justify-between">
        <div>
          <p className="text-xs font-medium text-blue-100">{STORE.name}</p>
          <h1 className="mt-0.5 text-xl font-bold">{title}</h1>
          {subtitle && (
            <p className="mt-0.5 text-sm text-blue-100">{subtitle}</p>
          )}
        </div>
        {right}
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
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 ${className}`}
    >
      {children}
    </div>
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
