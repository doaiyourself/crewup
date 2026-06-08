import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// 카카오 OAuth 리다이렉트 콜백: code → 세션 교환
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const errParam = searchParams.get("error");
  const errDesc = searchParams.get("error_description");

  console.log("[auth/callback] code?", !!code, "error:", errParam, errDesc);

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      console.log("[auth/callback] 세션 교환 성공, user:", data.user?.id);
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error("[auth/callback] 교환 실패:", error.message);
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
