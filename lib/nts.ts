// 국세청 사업자등록정보 진위확인 (data.go.kr / odcloud).
// 사업자번호 + 대표자명 + 개업일자가 국세청 등록정보와 일치하는지 검증.
// 서버에서만 호출 (API 키는 서버 env).

export interface VerifyInput {
  bizNo: string; // "123-45-67890" 또는 숫자
  ownerName: string; // 대표자 성명
  openDate: string; // "YYYY-MM-DD" 또는 YYYYMMDD
}

export type VerifyResult =
  | { ok: true; raw?: unknown }
  | {
      ok: false;
      reason: "NO_API_KEY" | "MISMATCH" | "API_ERROR";
      detail?: string;
      raw?: unknown;
    };

export async function verifyBusiness(input: VerifyInput): Promise<VerifyResult> {
  const key = process.env.DATA_GO_KR_SERVICE_KEY;
  if (!key) return { ok: false, reason: "NO_API_KEY" };

  const b_no = input.bizNo.replace(/\D/g, "");
  const start_dt = input.openDate.replace(/\D/g, ""); // YYYYMMDD
  const p_nm = input.ownerName.trim();

  const url = `https://api.odcloud.kr/api/nts-businessman/v1/validate?serviceKey=${encodeURIComponent(
    key
  )}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businesses: [{ b_no, start_dt, p_nm }],
      }),
    });
  } catch (e) {
    return { ok: false, reason: "API_ERROR", detail: String(e) };
  }

  if (!res.ok) {
    const t = await res.text();
    return { ok: false, reason: "API_ERROR", detail: `${res.status} ${t.slice(0, 200)}` };
  }

  const data = await res.json();
  const item = data?.data?.[0];
  // valid: "01" 일치(진위확인 OK) / "02" 불일치
  if (item?.valid === "01") return { ok: true, raw: item };
  return { ok: false, reason: "MISMATCH", detail: item?.valid_msg, raw: item };
}
