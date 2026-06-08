import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "./config";

// 매 요청마다 Supabase 세션 토큰을 갱신해 쿠키에 반영
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  // env 미설정 시(데모 모드) 아무것도 하지 않음
  if (!isSupabaseConfigured) return response;

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // getUser() 호출로 토큰 갱신 (getSession 대신 권장)
  await supabase.auth.getUser();

  return response;
}
