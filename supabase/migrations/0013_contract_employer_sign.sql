-- Crew Up 0013 — 근로계약서 사용자(사장) 서명
-- 서명 순서: 사장(사용자)이 먼저 전자서명 → 그 다음 근로자가 서명.
-- 기존 signed_at = 근로자 서명 시각.  employer_signed_at = 사용자(사장) 서명 시각.

alter table public.contracts
  add column if not exists employer_signed_at timestamptz;
