"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/icons";

export interface NavItem {
  href: string;
  label: string;
  icon: IconName;
}

export function BottomNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-md">
        {items.map((it) => {
          const active =
            pathname === it.href ||
            (it.href !== "/admin" &&
              it.href !== "/me" &&
              pathname.startsWith(it.href));
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`flex flex-1 flex-col items-center gap-1 pb-2 pt-2.5 text-[11px] font-semibold transition ${
                active ? "text-brand" : "text-slate-400"
              }`}
            >
              <span
                className={`flex h-7 items-center justify-center rounded-full px-4 transition-colors ${
                  active ? "bg-brand/10" : ""
                }`}
              >
                <Icon name={it.icon} size={22} />
              </span>
              {it.label}
            </Link>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
