// 마이그레이션 실행기 (1회성).
// 사용: DATABASE_URL="postgresql://..." node scripts/run-migration.mjs [sqlPath]
import { readFileSync } from "node:fs";
import { Client } from "pg";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL 환경변수가 필요합니다.");
  process.exit(1);
}

const sqlPath = process.argv[2] ?? "supabase/migrations/0001_init.sql";
const sql = readFileSync(sqlPath, "utf8");

const client = new Client({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  await client.query(sql);
  console.log(`✅ 마이그레이션 실행 완료: ${sqlPath}`);

  const { rows } = await client.query(
    `select table_name from information_schema.tables
     where table_schema='public' order by table_name`
  );
  console.log("생성된 테이블:", rows.map((r) => r.table_name).join(", "));
} catch (e) {
  console.error("❌ 실행 실패:", e.message);
  process.exit(1);
} finally {
  await client.end();
}
