-- Crew Up 0006 — 키오스크 기기 토큰
-- 키오스크 단말기는 "기기 토큰"만 보유한다(관리자 로그인 없음).
-- 토큰은 그 매장의 출퇴근/할일 단말 권한만 가지며, 서버 라우트(service_role)에서 검증한다.

create table if not exists public.kiosk_devices (
  id           uuid primary key default gen_random_uuid(),
  store_id     uuid not null references public.stores(id) on delete cascade,
  token        text not null unique,
  label        text,
  revoked      boolean not null default false,
  last_used_at timestamptz,
  created_at   timestamptz not null default now()
);
create index if not exists kiosk_devices_store_idx on public.kiosk_devices (store_id);

alter table public.kiosk_devices enable row level security;

-- 관리자만 자기 매장 기기 조회/관리 (생성·폐기는 RPC로)
create policy "kiosk_devices_admin_select" on public.kiosk_devices
  for select using (public.is_admin(store_id));

-- 기기 연결 토큰 발급 (관리자)
create or replace function public.create_kiosk_device(p_store_id uuid, p_label text default null)
returns table (id uuid, token text)
language plpgsql security definer set search_path = public as $$
declare
  v_id    uuid;
  v_token text;
begin
  if not public.is_admin(p_store_id) then raise exception 'FORBIDDEN'; end if;
  v_token := md5(gen_random_uuid()::text) || md5(gen_random_uuid()::text);
  insert into public.kiosk_devices (store_id, token, label)
  values (p_store_id, v_token, nullif(trim(p_label), ''))
  returning kiosk_devices.id, kiosk_devices.token into v_id, v_token;
  return query select v_id, v_token;
end $$;

-- 기기 폐기 (관리자)
create or replace function public.revoke_kiosk_device(p_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare v_store uuid;
begin
  select store_id into v_store from public.kiosk_devices where id = p_id;
  if v_store is null or not public.is_admin(v_store) then raise exception 'FORBIDDEN'; end if;
  update public.kiosk_devices set revoked = true where id = p_id;
end $$;

grant execute on function public.create_kiosk_device(uuid, text) to authenticated;
grant execute on function public.revoke_kiosk_device(uuid) to authenticated;
