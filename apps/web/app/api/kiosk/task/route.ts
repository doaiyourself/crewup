import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveKioskStore } from "@/lib/kiosk";

// 키오스크 할일 체크 토글: 토큰 검증 → 해당 매장 task인지 확인 → done 갱신
export async function POST(request: Request) {
  const { token, taskId, done } = await request.json().catch(() => ({}));
  const storeId = await resolveKioskStore(token);
  if (!storeId) {
    return NextResponse.json({ ok: false, reason: "INVALID_TOKEN" }, { status: 401 });
  }
  if (!taskId || typeof done !== "boolean") {
    return NextResponse.json({ ok: false, reason: "BAD_REQUEST" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: task } = await admin
    .from("tasks")
    .select("store_id")
    .eq("id", taskId)
    .maybeSingle();
  if (!task || task.store_id !== storeId) {
    return NextResponse.json({ ok: false, reason: "FORBIDDEN" }, { status: 403 });
  }

  const { error } = await admin.from("tasks").update({ done }).eq("id", taskId);
  if (error)
    return NextResponse.json({ ok: false, detail: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
