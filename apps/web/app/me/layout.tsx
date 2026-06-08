import { Guard } from "@/components/guard";
import { BottomNav, type NavItem } from "@/components/bottom-nav";

const NAV: NavItem[] = [
  { href: "/me", label: "홈", icon: "home" },
  { href: "/me/attendance", label: "출퇴근", icon: "attendance" },
  { href: "/me/schedule", label: "스케줄", icon: "schedule" },
  { href: "/me/payroll", label: "급여", icon: "payroll" },
  { href: "/me/profile", label: "내정보", icon: "profile" },
];

export default function MeLayout({ children }: { children: React.ReactNode }) {
  return (
    <Guard need="worker">
      <div className="min-h-screen bg-slate-100 pb-20">
        <div className="mx-auto max-w-md">{children}</div>
      </div>
      <BottomNav items={NAV} />
    </Guard>
  );
}
