// @crewup/core — 웹(Next)·모바일(Expo) 공유 로직.
// 플랫폼 의존성 없음(순수 TS). Supabase 클라이언트는 "주입"받아 사용.

export type Role = "owner" | "manager" | "employee" | "parttimer";

export const ROLE_LABELS: Record<Role, string> = {
  owner: "사장님",
  manager: "점장",
  employee: "직원",
  parttimer: "알바",
};

export const isAdminRole = (role: Role): boolean =>
  role === "owner" || role === "manager";

// 공식 BI
export const BRAND = {
  name: "Crew Up",
  tagline: "출근부터 급여까지, 우리 가게 크루를 한 팀으로.",
  primary: "#2F6BFF",
  dark: "#111827",
} as const;

export type StoreStatus = "pending" | "active" | "suspended";

export * from "./services/attendance";
export * from "./services/payroll";
