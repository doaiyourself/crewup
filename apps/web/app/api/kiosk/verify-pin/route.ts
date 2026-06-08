import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveKioskStore } from "@/lib/kiosk";

// 키오스크 "기기 연결 해제" 보호용 PIN 검증 (토큰 기반, 세션 불필요)
export async function POST(request: Request) {
  const { token, pin } = await request.json().catch(() => ({}));
  const storeId = await resolveKioskStore(token);
  if (!storeId) {
    return NextResponse.json({ ok: false, reason: "INVALID_TOKEN" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("stores")
    .select("kiosk_pin")
    .eq("id", storeId)
    .single();

  const ok = !!data?.kiosk_pin && data.kiosk_pin === String(pin ?? "").trim();
  return NextResponse.json({ ok });
}
