import { Guard } from "@/components/guard";

// 키오스크 전용 레이아웃: 관리자만, 하단 네비 없음(전체화면 공용 화면).
export default function KioskLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Guard need="admin">{children}</Guard>;
}
