// 근로계약서 공유 타입/헬퍼 (표준근로계약서 기반)

export interface ContractContent {
  startDate: string; // 근로개시일 YYYY-MM-DD
  endDate?: string; // 근로종료일(기간제, 없으면 기간의 정함 없음)
  workplace: string; // 근무장소
  jobDesc: string; // 업무내용
  workDays: string; // 근무일 (예: 주 5일 (월~금))
  workStart: string; // 근로 시작 HH:MM
  workEnd: string; // 근로 종료 HH:MM
  breakMinutes: number; // 휴게시간(분)
  wageType: "hourly" | "monthly";
  wage: number; // 시급 또는 월급
  weeklyHoliday: boolean; // 주휴수당 지급
  weeklyHolidayIncluded?: boolean; // 주휴수당이 시급(임금)에 포함됨 (포괄)
  insurance: boolean; // 4대보험 가입
  payday: string; // 임금 지급일 (예: 매월 10일)
  employerName: string; // 사용자(대표) 성명
  employeeName: string; // 근로자 성명 (발행 시점 스냅샷)
}

export type ContractStatus = "none" | "pending" | "signed" | "expired";

export const CONTRACT_STATUS_LABEL: Record<ContractStatus, string> = {
  none: "미작성",
  pending: "서명 대기",
  signed: "서명 완료",
  expired: "만료",
};

export function defaultContract(opts: {
  workplace: string;
  wage: number;
  employerName: string;
  employeeName: string;
}): ContractContent {
  const today = new Date().toISOString().slice(0, 10);
  return {
    startDate: today,
    workplace: opts.workplace,
    jobDesc: "",
    workDays: "주 5일 (월~금)",
    workStart: "09:00",
    workEnd: "18:00",
    breakMinutes: 60,
    wageType: "hourly",
    wage: opts.wage,
    weeklyHoliday: true,
    weeklyHolidayIncluded: false,
    insurance: true,
    payday: "매월 10일",
    employerName: opts.employerName,
    employeeName: opts.employeeName,
  };
}
