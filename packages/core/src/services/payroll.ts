// 급여 계산 — 웹·모바일 공유 (순수 함수).
// 실근무 시간(분) + 시급 기준. 주휴수당·공제는 간이 추정(추후 법정 기준 정교화).

export interface PayrollResult {
  totalHours: number; // 총 근무시간
  basePay: number; // 기본급(시급×시간)
  weeklyAllowance: number; // 주휴수당(추정)
  nightAllowance: number; // 야간/연장 가산(추정)
  deduction: number; // 4대보험·세금 공제(추정)
  gross: number; // 지급 합계
  net: number; // 실지급액
}

export function computePayroll(
  minutes: number,
  hourlyWage: number,
  nightMinutes = 0
): PayrollResult {
  const totalHours = Math.round((minutes / 60) * 10) / 10;
  const basePay = Math.round((minutes / 60) * hourlyWage);
  // 주휴수당: 주 15시간 이상 근무 시 통상 ~8.3% 수준 (간이 추정)
  const weeklyAllowance = totalHours >= 15 ? Math.round(basePay * 0.083) : 0;
  // 야간 가산 50%
  const nightAllowance = Math.round((nightMinutes / 60) * hourlyWage * 0.5);
  const gross = basePay + weeklyAllowance + nightAllowance;
  // 4대보험 근로자 부담 ~8.9% (간이 추정)
  const deduction = Math.round(gross * 0.089);
  return {
    totalHours,
    basePay,
    weeklyAllowance,
    nightAllowance,
    deduction,
    gross,
    net: gross - deduction,
  };
}
