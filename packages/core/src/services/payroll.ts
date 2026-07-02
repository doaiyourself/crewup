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

export interface PayrollOptions {
  nightMinutes?: number;
  weeklyIncluded?: boolean; // 주휴수당이 시급(임금)에 포함 (포괄)
  wageType?: "hourly" | "monthly"; // 시급 / 월급
  insurance?: boolean; // 4대보험 가입 여부 (공제율 결정)
}

export function computePayroll(
  minutes: number,
  wage: number, // 시급 또는 (월급일 때) 월 고정급
  opts: PayrollOptions = {}
): PayrollResult {
  const {
    nightMinutes = 0,
    weeklyIncluded = false,
    wageType = "hourly",
    insurance = false,
  } = opts;
  const monthly = wageType === "monthly";
  const totalHours = Math.round((minutes / 60) * 10) / 10;
  // 월급: 고정급. 시급: 시간×시급.
  const basePay = monthly ? Math.round(wage) : Math.round((minutes / 60) * wage);
  // 주휴수당: 시급제이고 미포함이며 주 15시간 이상일 때만 ~8.3% (간이 추정).
  const weeklyAllowance =
    monthly || weeklyIncluded || totalHours < 15
      ? 0
      : Math.round(basePay * 0.083);
  // 야간 가산 50% (시급제에만)
  const nightAllowance = monthly
    ? 0
    : Math.round((nightMinutes / 60) * wage * 0.5);
  const gross = basePay + weeklyAllowance + nightAllowance;
  // 공제: 4대보험 가입 시 근로자 부담 ~9.4%, 미가입 시 사업소득세 3.3% (간이 추정)
  const deduction = Math.round(gross * (insurance ? 0.094 : 0.033));
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
