// Supabase Management API로 초기 셋업 (1회용).
// 사용: SUPABASE_PAT=sbp_xxx node scripts/setup-supabase.mjs
import { readFileSync } from "node:fs";

const PAT = process.env.SUPABASE_PAT;
const REF = process.env.SUPABASE_REF ?? "lmjyoeckfwjimflsdoky";
if (!PAT) {
  console.error("SUPABASE_PAT 환경변수 필요");
  process.exit(1);
}

const API = "https://api.supabase.com/v1";
const H = {
  Authorization: `Bearer ${PAT}`,
  "Content-Type": "application/json",
};

async function runMigration() {
  const sql = readFileSync("supabase/migrations/0001_init.sql", "utf8");
  const res = await fetch(`${API}/projects/${REF}/database/query`, {
    method: "POST",
    headers: H,
    body: JSON.stringify({ query: sql }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`마이그레이션 실패 ${res.status}: ${text}`);
  console.log("① 마이그레이션 실행 완료");
}

async function listTables() {
  const res = await fetch(`${API}/projects/${REF}/database/query`, {
    method: "POST",
    headers: H,
    body: JSON.stringify({
      query:
        "select table_name from information_schema.tables where table_schema='public' order by table_name",
    }),
  });
  const rows = await res.json();
  console.log(
    "   생성된 테이블:",
    rows.map((r) => r.table_name).join(", ")
  );
}

async function configKakao() {
  const body = {
    site_url: "http://localhost:3001",
    uri_allow_list:
      "http://localhost:3001/auth/callback,http://localhost:3001/**",
    external_kakao_enabled: true,
    external_kakao_client_id: process.env.KAKAO_CLIENT_ID,
    external_kakao_secret: process.env.KAKAO_CLIENT_SECRET,
  };
  const res = await fetch(`${API}/projects/${REF}/config/auth`, {
    method: "PATCH",
    headers: H,
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Auth 설정 실패 ${res.status}: ${text}`);
  console.log("② 카카오 Provider 활성화 + 키 입력 완료");
  console.log("③ Site URL / Redirect URL 설정 완료");
}

try {
  await runMigration();
  await listTables();
  await configKakao();
  console.log("\n✅ Supabase 셋업 완료");
} catch (e) {
  console.error("\n❌", e.message);
  process.exit(1);
}
