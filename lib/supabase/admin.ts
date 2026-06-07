import { createClient as createSbClient } from "@supabase/supabase-js";

// 서버 전용 service_role 클라이언트 (RLS 우회).
// 사업자 검증 통과 후 매장 status를 active로 바꾸는 등 신뢰된 서버 작업에만 사용.
// 절대 클라이언트 컴포넌트에서 import 하지 말 것.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY 미설정");
  }
  return createSbClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
