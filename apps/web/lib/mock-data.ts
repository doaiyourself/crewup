// 백엔드(Supabase) 연동 전 임시 목업 데이터.
// 추후 supabase-js 쿼리로 교체 예정. (PRD §5.2)

export type Role = "owner" | "manager" | "employee" | "parttimer";

export type WorkStatus = "off" | "working" | "done";

export const ROLE_LABEL: Record<Role, string> = {
  owner: "사장님",
  manager: "점장",
  employee: "직원",
  parttimer: "알바",
};

// 관리자 권한(사장님·점장) 여부
export const isAdminRole = (role: Role) =>
  role === "owner" || role === "manager";

export interface Store {
  id: string;
  name: string;
  bizNo: string; // 사업자번호
  address: string;
}

export interface Employee {
  id: string;
  name: string;
  role: Role;
  position: string; // 직책/직무
  hourlyWage: number; // 시급(원)
  phone: string;
  avatarColor: string;
  status: WorkStatus;
  clockInAt?: string | null; // "HH:MM"
  clockOutAt?: string | null; // "HH:MM"
  contractStatus: ContractStatus;
}

export type ContractStatus = "signed" | "pending" | "expired" | "none";

export const CONTRACT_LABEL: Record<ContractStatus, string> = {
  signed: "서명완료",
  pending: "서명대기",
  expired: "만료",
  none: "미작성",
};

// 주간 스케줄: 요일별 근무시간 (없으면 휴무)
export interface Shift {
  day: number; // 0=일 ~ 6=토
  start: string; // "HH:MM"
  end: string; // "HH:MM"
}

export interface Schedule {
  employeeId: string;
  shifts: Shift[];
}

// 급여 정산(월별)
export interface Payroll {
  employeeId: string;
  period: string; // "2026-05"
  totalHours: number; // 총 근무시간
  basePay: number; // 기본급(시급×시간)
  weeklyAllowance: number; // 주휴수당
  nightAllowance: number; // 야간/연장 가산
  deduction: number; // 4대보험·세금 공제
  status: "confirmed" | "draft";
}

export const STORE: Store = {
  id: "store-1",
  name: "Crew Up 1호점",
  bizNo: "123-45-67890",
  address: "서울특별시 강남구 테헤란로 123",
};

export const STORE_NAME = STORE.name;

const COLORS = [
  "#2563eb", "#16a34a", "#db2777", "#ea580c", "#7c3aed",
  "#0891b2", "#ca8a04", "#dc2626", "#059669", "#4f46e5",
];

const NAMES = [
  "김민준", "이서연", "박도윤", "최지우", "정하준",
  "강서아", "조은우", "윤지호", "임수빈", "한예준",
];

const POSITIONS = [
  "점장", "홀 서빙", "주방", "카운터", "바리스타",
  "홀 서빙", "주방 보조", "배달", "카운터", "홀 서빙",
];

const ROLES: Role[] = [
  "manager", "parttimer", "employee", "parttimer", "parttimer",
  "employee", "parttimer", "parttimer", "parttimer", "employee",
];

const CONTRACTS: ContractStatus[] = [
  "signed", "signed", "signed", "pending", "signed",
  "signed", "pending", "expired", "signed", "none",
];

export const MOCK_EMPLOYEES: Employee[] = NAMES.map((name, i) => ({
  id: `emp-${i + 1}`,
  name,
  role: ROLES[i],
  position: POSITIONS[i],
  hourlyWage: 10030 + (i % 4) * 500, // 2025 최저시급 부근
  phone: `010-${String(1000 + i * 7).slice(0, 4)}-${String(2000 + i * 13).slice(0, 4)}`,
  avatarColor: COLORS[i],
  status: "off",
  clockInAt: null,
  clockOutAt: null,
  contractStatus: CONTRACTS[i],
}));

// 데모용 로그인 가능한 계정(역할별 1명씩) — 카카오 SSO 연동 전 임시
export interface Account {
  id: string;
  name: string;
  role: Role;
  position: string;
  avatarColor: string;
}

export const DEMO_ACCOUNTS: Account[] = [
  { id: "acc-owner", name: "사장님", role: "owner", position: "대표", avatarColor: "#2563eb" },
  { id: "emp-1", name: "김민준", role: "manager", position: "점장", avatarColor: "#16a34a" },
  { id: "emp-3", name: "박도윤", role: "employee", position: "주방", avatarColor: "#db2777" },
  { id: "emp-2", name: "이서연", role: "parttimer", position: "홀 서빙", avatarColor: "#ea580c" },
];

// 주간 스케줄 목업 — 평일/주말 패턴 섞어서 생성
export const MOCK_SCHEDULES: Schedule[] = MOCK_EMPLOYEES.map((e, i) => {
  const shifts: Shift[] = [];
  const startHour = 9 + (i % 3) * 3; // 9/12/15시 시작
  const start = `${String(startHour).padStart(2, "0")}:00`;
  const end = `${String(startHour + 6).padStart(2, "0")}:00`;
  // 짝수 인덱스는 월·수·금, 홀수는 화·목·토 + 일부 주말
  const days = i % 2 === 0 ? [1, 3, 5] : [2, 4, 6];
  if (i % 3 === 0) days.push(0); // 일부는 일요일도
  for (const day of days) shifts.push({ day, start, end });
  return { employeeId: e.id, shifts };
});

// 급여 목업 (2026-05)
export const MOCK_PAYROLLS: Payroll[] = MOCK_EMPLOYEES.map((e, i) => {
  const totalHours = 60 + (i % 5) * 14;
  const basePay = totalHours * e.hourlyWage;
  const weeklyAllowance = Math.round(basePay * 0.08);
  const nightAllowance = i % 3 === 0 ? Math.round(basePay * 0.05) : 0;
  const gross = basePay + weeklyAllowance + nightAllowance;
  const deduction = Math.round(gross * 0.089); // 4대보험 근로자부담 ~8.9%
  return {
    employeeId: e.id,
    period: "2026-05",
    totalHours,
    basePay,
    weeklyAllowance,
    nightAllowance,
    deduction,
    status: i % 4 === 0 ? "draft" : "confirmed",
  };
});

export const getEmployee = (id: string) =>
  MOCK_EMPLOYEES.find((e) => e.id === id);

export const getSchedule = (id: string) =>
  MOCK_SCHEDULES.find((s) => s.employeeId === id);

export const getPayroll = (id: string, period = "2026-05") =>
  MOCK_PAYROLLS.find((p) => p.employeeId === id && p.period === period);

export const DAY_LABEL = ["일", "월", "화", "수", "목", "금", "토"];
