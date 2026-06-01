// 임의의 직원 10명 목업 데이터 (백엔드 연동 전 임시 데이터)

export type Role = "owner" | "manager" | "employee" | "parttimer";

export type WorkStatus = "off" | "working" | "done";

export interface Employee {
  id: string;
  name: string;
  role: Role;
  position: string; // 직책/직무
  hourlyWage: number; // 시급(원)
  avatarColor: string;
  status: WorkStatus;
  clockInAt?: string | null; // "HH:MM"
  clockOutAt?: string | null; // "HH:MM"
}

export const ROLE_LABEL: Record<Role, string> = {
  owner: "사장님",
  manager: "점장",
  employee: "직원",
  parttimer: "알바",
};

const COLORS = [
  "#2563eb",
  "#16a34a",
  "#db2777",
  "#ea580c",
  "#7c3aed",
  "#0891b2",
  "#ca8a04",
  "#dc2626",
  "#059669",
  "#4f46e5",
];

const NAMES = [
  "김민준",
  "이서연",
  "박도윤",
  "최지우",
  "정하준",
  "강서아",
  "조은우",
  "윤지호",
  "임수빈",
  "한예준",
];

const POSITIONS = [
  "매니저",
  "홀 서빙",
  "주방",
  "카운터",
  "바리스타",
  "홀 서빙",
  "주방 보조",
  "배달",
  "카운터",
  "홀 서빙",
];

const ROLES: Role[] = [
  "manager",
  "parttimer",
  "employee",
  "parttimer",
  "parttimer",
  "employee",
  "parttimer",
  "parttimer",
  "parttimer",
  "employee",
];

export const MOCK_EMPLOYEES: Employee[] = NAMES.map((name, i) => ({
  id: `emp-${i + 1}`,
  name,
  role: ROLES[i],
  position: POSITIONS[i],
  hourlyWage: 10030 + (i % 4) * 500, // 2024 최저시급 부근
  avatarColor: COLORS[i],
  status: "off",
  clockInAt: null,
  clockOutAt: null,
}));

export const STORE_NAME = "Crew Up 1호점";
