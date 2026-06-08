import { createAdminClient } from "@/lib/supabase/admin";

// 키오스크 토큰 → 매장 해석 (서버 전용).
// 유효하지 않거나 폐기된 토큰이면 null.
export async function resolveKioskStore(
  token: string | undefined | null
): Promise<string | null> {
  if (!token) return null;
  const admin = createAdminClient();
  const { data } = await admin
    .from("kiosk_devices")
    .select("store_id, revoked")
    .eq("token", token)
    .maybeSingle();
  if (!data || data.revoked) return null;
  // 마지막 사용시각 갱신 (실패 무시)
  void admin
    .from("kiosk_devices")
    .update({ last_used_at: new Date().toISOString() })
    .eq("token", token);
  return data.store_id as string;
}

// 매장 영업일 기준 오늘 (KST). 키오스크/대시보드 날짜 통일용.
export function kstToday(): string {
  const kst = new Date(Date.now() + 9 * 3600 * 1000);
  return kst.toISOString().slice(0, 10);
}
