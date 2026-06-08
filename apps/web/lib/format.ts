// 포맷 유틸

export const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;

export const wonShort = (n: number) => {
  if (n >= 10000) {
    const man = n / 10000;
    return `${man % 1 === 0 ? man : man.toFixed(1)}만원`;
  }
  return `${n.toLocaleString("ko-KR")}원`;
};

export function nowHHMM(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}`;
}

export function todayLabel(): string {
  const d = new Date();
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`;
}

// "09:00" ~ "15:00" → 6 (시간)
export function shiftHours(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return (eh * 60 + em - (sh * 60 + sm)) / 60;
}

// 급여 실지급액
export function netPay(p: {
  basePay: number;
  weeklyAllowance: number;
  nightAllowance: number;
  deduction: number;
}): number {
  return p.basePay + p.weeklyAllowance + p.nightAllowance - p.deduction;
}

export function grossPay(p: {
  basePay: number;
  weeklyAllowance: number;
  nightAllowance: number;
}): number {
  return p.basePay + p.weeklyAllowance + p.nightAllowance;
}
