import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveKioskStore, kstToday } from "@/lib/kiosk";

// 키오스크 출퇴근 기록: 토큰 검증 → 해당 매장 멤버 확인 → attendance 기록
export async function POST(request: Request) {
  const { token, userId, action } = await request.json().catch(() => ({}));
  const storeId = await resolveKioskStore(token);
  if (!storeId) {
    return NextResponse.json({ ok: false, reason: "INVALID_TOKEN" }, { status: 401 });
  }
  if (!userId || (action !== "in" && action !== "out")) {
    return NextResponse.json({ ok: false, reason: "BAD_REQUEST" }, { status: 400 });
  }

  const admin = createAdminClient();

  // 이 매장 소속 멤버인지 확인 (토큰 매장 한정)
  const { data: member } = await admin
    .from("memberships")
    .select("id")
    .eq("store_id", storeId)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();
  if (!member) {
    return NextResponse.json({ ok: false, reason: "NOT_MEMBER" }, { status: 403 });
  }

  const today = kstToday();
  const nowIso = new Date().toISOString();

  if (action === "in") {
    const { error } = await admin.from("attendance").upsert(
      {
        store_id: storeId,
        user_id: userId,
        work_date: today,
        clock_in_at: nowIso,
        clock_out_at: null,
        status: "normal",
      },
      { onConflict: "store_id,user_id,work_date" }
    );
    if (error)
      return NextResponse.json({ ok: false, detail: error.message }, { status: 500 });
  } else {
    const { error } = await admin
      .from("attendance")
      .update({ clock_out_at: nowIso })
      .eq("store_id", storeId)
      .eq("user_id", userId)
      .eq("work_date", today);
    if (error)
      return NextResponse.json({ ok: false, detail: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
