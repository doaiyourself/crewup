import { Guard } from "@/components/guard";
import { BottomNav, type NavItem } from "@/components/bottom-nav";
import { VerificationGate } from "@/components/verification-gate";
import { AppBadge } from "@/components/app-badge";

const NAV: NavItem[] = [
  { href: "/admin", label: "대시보드", icon: "dashboard" },
  { href: "/admin/staff", label: "직원", icon: "staff" },
  { href: "/admin/attendance", label: "출퇴근", icon: "attendance" },
  { href: "/admin/payroll", label: "급여", icon: "payroll" },
  { href: "/admin/settings", label: "설정", icon: "settings" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Guard need="admin">
      <AppBadge />
      <VerificationGate>
        <div className="min-h-screen bg-slate-100 pb-20">
          <div className="mx-auto max-w-md">{children}</div>
        </div>
        <BottomNav items={NAV} />
      </VerificationGate>
    </Guard>
  );
}
