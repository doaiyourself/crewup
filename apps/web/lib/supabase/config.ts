// Supabase 환경변수 + 설정 여부 헬퍼.
// env가 비어 있으면 앱은 데모(목업) 모드로 계속 동작한다.

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";

// URL/KEY 가 모두 채워져 있어야 Supabase 모드로 동작
export const isSupabaseConfigured =
  SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;
