"use client";

import { createClient } from "./client";
import { SITE_URL } from "./config";

// 카카오 OAuth 로그인 시작
export async function signInWithKakao(next = "/") {
  const supabase = createClient();
  const redirectTo = `${SITE_URL}/auth/callback?next=${encodeURIComponent(
    next
  )}`;
  return supabase.auth.signInWithOAuth({
    provider: "kakao",
    options: { redirectTo },
  });
}

export async function signOut() {
  const supabase = createClient();
  return supabase.auth.signOut();
}
