import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { kstToday } from "@/lib/kiosk";

// 개인 출퇴근 — 매장의 검증 방식(GPS/QR/둘 다)을 서버에서 강제.
// 본인 세션으로 호출, 기록은 service_role로 수행(방식 검증 통과 후).
function distMeters(a: number, b: number, c: number, d: number): number {
  const R = 6371000;
  const r = (x: number) => (x * Math.PI) / 180;
  const dLat = r(c - a);
  const dLng = r(d - b);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(r(a)) * Math.cos(r(c)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { storeId, action, k, lat, lng } = body ?? {};
  if (!storeId) {
    return NextResponse.json({ ok: false, reason: "BAD_REQUEST" }, { status: 400 });
  }

  // 1) 로그인
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, reason: "UNAUTHORIZED" }, { status: 401 });
  }

  const admin = createAdminClient();

  // 2) 매장 소속 확인
  const { data: member } = await admin
    .from("memberships")
    .select("id")
    .eq("store_id", storeId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();
  if (!member) {
    return NextResponse.json({ ok: false, reason: "NOT_MEMBER" }, { status: 403 });
  }

  // 3) 매장 검증 설정
  const { data: store } = await admin
    .from("stores")
    .select("attendance_method, lat, lng, geo_radius")
    .eq("id", storeId)
    .single();
  const method = store?.attendance_method ?? "none";
  const needsQr = method === "qr" || method === "both";
  const needsGps = method === "gps" || method === "both";

  // 4) QR 검증
  if (needsQr) {
    const { data: qr } = await admin
      .from("store_qr")
      .select("secret")
      .eq("store_id", storeId)
      .maybeSingle();
    if (!k) {
      return NextResponse.json({ ok: false, reason: "NEEDS_QR" }, { status: 403 });
    }
    if (!qr?.secret || qr.secret !== k) {
      return NextResponse.json({ ok: false, reason: "INVALID_QR" }, { status: 403 });
    }
  }

  // 5) GPS 검증
  if (needsGps) {
    if (store?.lat == null || store?.lng == null) {
      return NextResponse.json(
        { ok: false, reason: "NO_STORE_LOCATION" },
        { status: 409 }
      );
    }
    if (typeof lat !== "number" || typeof lng !== "number") {
      return NextResponse.json({ ok: false, reason: "NEEDS_GPS" }, { status: 403 });
    }
    const dist = distMeters(lat, lng, store.lat, store.lng);
    if (dist > (store.geo_radius ?? 150)) {
      return NextResponse.json(
        { ok: false, reason: "OUT_OF_RANGE", distance: Math.round(dist) },
        { status: 403 }
      );
    }
  }

  // 6) 출퇴근 기록 (action 없으면 토글)
  const today = kstToday();
  const { data: existing } = await admin
    .from("attendance")
    .select("clock_in_at, clock_out_at")
    .eq("store_id", storeId)
    .eq("user_id", user.id)
    .eq("work_date", today)
    .maybeSingle();

  let act = action;
  if (act !== "in" && act !== "out") {
    if (!existing?.clock_in_at) act = "in";
    else if (!existing.clock_out_at) act = "out";
    else return NextResponse.json({ ok: false, reason: "ALREADY_DONE" });
  }

  const nowIso = new Date().toISOString();
  if (act === "in") {
    const { error } = await admin.from("attendance").upsert(
      {
        store_id: storeId,
        user_id: user.id,
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
      .eq("user_id", user.id)
      .eq("work_date", today);
    if (error)
      return NextResponse.json({ ok: false, detail: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, action: act });
}
