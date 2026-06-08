-- Crew Up 0007 — 출퇴근 검증 방식 (GPS / QR, 사장 선택)
-- stores.attendance_method: none | gps | qr | both
-- GPS: stores.lat/lng(매장 좌표) + geo_radius(m)
-- QR: store_qr.secret (직원에게 노출 금지 → 별도 테이블/관리자 전용 + 서버 검증)

alter table public.stores
  add column if not exists attendance_method text not null default 'none',
  add column if not exists geo_radius integer not null default 150;

create table if not exists public.store_qr (
  store_id   uuid primary key references public.stores(id) on delete cascade,
  secret     text not null,
  updated_at timestamptz not null default now()
);
alter table public.store_qr enable row level security;
-- 관리자만 조회 (직원은 접근 불가 — 시크릿 보호). 쓰기는 RPC로.
create policy "store_qr_admin_select" on public.store_qr
  for select using (public.is_admin(store_id));

-- 출퇴근 방식 설정 (관리자)
create or replace function public.set_attendance_config(
  p_store_id uuid,
  p_method   text,
  p_lat      double precision,
  p_lng      double precision,
  p_radius   integer
)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin(p_store_id) then raise exception 'FORBIDDEN'; end if;
  if p_method not in ('none', 'gps', 'qr', 'both') then
    raise exception 'BAD_METHOD';
  end if;
  update public.stores set
    attendance_method = p_method,
    lat = p_lat,
    lng = p_lng,
    geo_radius = coalesce(p_radius, 150)
  where id = p_store_id;
end $$;

-- QR 시크릿 발급/재발급 (관리자) → 새 시크릿 반환
create or replace function public.rotate_qr_secret(p_store_id uuid)
returns text
language plpgsql security definer set search_path = public as $$
declare v text;
begin
  if not public.is_admin(p_store_id) then raise exception 'FORBIDDEN'; end if;
  v := replace(gen_random_uuid()::text, '-', '');
  insert into public.store_qr (store_id, secret) values (p_store_id, v)
    on conflict (store_id) do update set secret = v, updated_at = now();
  return v;
end $$;

-- 현재 QR 시크릿 조회 (관리자, 표시용)
create or replace function public.get_qr_secret(p_store_id uuid)
returns text
language plpgsql security definer set search_path = public stable as $$
begin
  if not public.is_admin(p_store_id) then raise exception 'FORBIDDEN'; end if;
  return (select secret from public.store_qr where store_id = p_store_id);
end $$;

grant execute on function public.set_attendance_config(uuid, text, double precision, double precision, integer) to authenticated;
grant execute on function public.rotate_qr_secret(uuid) to authenticated;
grant execute on function public.get_qr_secret(uuid) to authenticated;
