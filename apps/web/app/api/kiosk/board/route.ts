import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveKioskStore, kstToday } from "@/lib/kiosk";

// 키오스크 보드: 토큰 검증 → 매장명 + 멤버(오늘 출퇴근) + 오늘 할일
export async function POST(request: Request) {
  const { token } = await request.json().catch(() => ({}));
  const storeId = await resolveKioskStore(token);
  if (!storeId) {
    return NextResponse.json({ ok: false, reason: "INVALID_TOKEN" }, { status: 401 });
  }

  const admin = createAdminClient();
  const today = kstToday();

  const [storeRes, memRes, attRes, taskRes] = await Promise.all([
    admin.from("stores").select("name").eq("id", storeId).single(),
    admin
      .from("memberships")
      .select("user_id, role, position, profiles(name, avatar_color)")
      .eq("store_id", storeId)
      .eq("status", "active"),
    admin
      .from("attendance")
      .select("user_id, clock_in_at, clock_out_at")
      .eq("store_id", storeId)
      .eq("work_date", today),
    admin
      .from("tasks")
      .select("id, title, done")
      .eq("store_id", storeId)
      .eq("work_date", today)
      .order("created_at"),
  ]);

  const attByUser = new Map(
    (attRes.data ?? []).map((a: any) => [a.user_id, a])
  );

  const roleOrder: Record<string, number> = {
    owner: 0,
    manager: 1,
    employee: 2,
    parttimer: 3,
  };

  const members = (memRes.data ?? [])
    .map((m: any) => {
      const a = attByUser.get(m.user_id);
      return {
        user_id: m.user_id,
        name: m.profiles?.name ?? "사용자",
        avatar_color: m.profiles?.avatar_color ?? "#2F6BFF",
        role: m.role,
        position: m.position,
        clock_in_at: a?.clock_in_at ?? null,
        clock_out_at: a?.clock_out_at ?? null,
      };
    })
    .sort(
      (x: any, y: any) =>
        (roleOrder[x.role] ?? 9) - (roleOrder[y.role] ?? 9) ||
        x.name.localeCompare(y.name)
    );

  return NextResponse.json({
    ok: true,
    storeName: storeRes.data?.name ?? "매장",
    members,
    tasks: taskRes.data ?? [],
  });
}
