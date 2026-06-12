// 라인 SVG 아이콘 세트 (하단 네비 등). currentColor 사용.
import type { ReactNode } from "react";

export type IconName =
  | "dashboard"
  | "staff"
  | "attendance"
  | "payroll"
  | "settings"
  | "home"
  | "schedule"
  | "profile"
  | "doc";

const PATHS: Record<IconName, ReactNode> = {
  // 우상향 막대 (로고 모티프)
  dashboard: (
    <>
      <path d="M3 21h18" />
      <path d="M6 21v-6" />
      <path d="M12 21V9" />
      <path d="M18 21V4" />
    </>
  ),
  staff: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 20c0-3.3 2.7-5 5.5-5s5.5 1.7 5.5 5" />
      <path d="M16 5.4a3.2 3.2 0 0 1 0 6.2" />
      <path d="M20.5 20c0-2.8-1.6-4.3-3.8-4.8" />
    </>
  ),
  attendance: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12 2.4 2.4L15.5 9.5" />
    </>
  ),
  payroll: (
    <>
      <rect x="3" y="6" width="18" height="13" rx="2.5" />
      <path d="M3 10h18" />
      <circle cx="12" cy="14.5" r="2" />
    </>
  ),
  settings: (
    <>
      <path d="M4 7h10" />
      <path d="M18 7h2" />
      <path d="M4 12h2" />
      <path d="M10 12h10" />
      <path d="M4 17h7" />
      <path d="M15 17h5" />
      <circle cx="16" cy="7" r="2" />
      <circle cx="8" cy="12" r="2" />
      <circle cx="13" cy="17" r="2" />
    </>
  ),
  home: (
    <>
      <path d="M3.5 11 12 4l8.5 7" />
      <path d="M5.5 9.5V20h13V9.5" />
    </>
  ),
  schedule: (
    <>
      <rect x="3.5" y="5" width="17" height="16" rx="2.5" />
      <path d="M3.5 9.5h17" />
      <path d="M8 3v4M16 3v4" />
    </>
  ),
  profile: (
    <>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M5 20c0-3.6 3.1-5.5 7-5.5s7 1.9 7 5.5" />
    </>
  ),
  doc: (
    <>
      <path d="M13 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9z" />
      <path d="M13 3v6h6" />
      <path d="M9 13h6M9 17h6" />
    </>
  ),
};

export function Icon({
  name,
  size = 24,
  className = "",
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}
