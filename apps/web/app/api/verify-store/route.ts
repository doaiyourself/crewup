import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyBusiness } from "@/lib/nts";

// 매장 사업자 인증: 소유자 확인 → 국세청 진위확인 → 통과 시 status=active
export async function POST(request: Request) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "BAD_REQUEST" }, { status: 400 });
  }
  const { storeId, bizNo, ownerName, openDate } = body ?? {};
  if (!storeId || !bizNo || !ownerName || !openDate) {
    return NextResponse.json({ ok: false, reason: "MISSING_FIELDS" }, { status: 400 });
  }

  // 1) 로그인 + 소유자 확인 (사용자 세션 = RLS 적용)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, reason: "UNAUTHORIZED" }, { status: 401 });
  }
  const { data: store } = await supabase
    .from("stores")
    .select("id, owner_id")
    .eq("id", storeId)
    .single();
  if (!store || store.owner_id !== user.id) {
    return NextResponse.json({ ok: false, reason: "FORBIDDEN" }, { status: 403 });
  }

  // 2) 국세청 진위확인
  const result = await verifyBusiness({ bizNo, ownerName, openDate });
  if (!result.ok) {
    return NextResponse.json(result, { status: 200 });
  }

  // 3) 통과 → service_role 로만 status 변경 (클라 위변조 차단)
  const admin = createAdminClient();
  const { error } = await admin
    .from("stores")
    .update({
      status: "active",
      verified_at: new Date().toISOString(),
      verify_method: "nts",
      biz_owner_name: ownerName,
      biz_open_date: openDate,
    })
    .eq("id", storeId);

  if (error) {
    return NextResponse.json(
      { ok: false, reason: "UPDATE_FAILED", detail: error.message },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true });
}
