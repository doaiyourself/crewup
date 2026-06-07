-- Crew Up 0003 — 매장 사업자 인증 상태
-- 남의 사업자번호 도용 방지: 매장은 pending(미인증)으로 생성되고,
-- 서버에서 국세청 진위확인을 통과해야만 active(운영가능)로 전환된다.
-- status는 service_role(서버)만 바꿀 수 있게 트리거로 잠근다.

-- 1) 매장 상태 + 검증 메타
do $$ begin
  create type public.store_status as enum ('pending', 'active', 'suspended');
exception when duplicate_object then null; end $$;

alter table public.stores
  add column if not exists status         public.store_status not null default 'pending',
  add column if not exists biz_owner_name text,
  add column if not exists biz_open_date  date,
  add column if not exists verified_at    timestamptz,
  add column if not exists verify_method  text;

-- 기존 매장(있다면)은 일단 pending 유지

-- 2) status 변경 보호: service_role 만 변경 가능
create or replace function public.guard_store_status()
returns trigger
language plpgsql
as $$
begin
  if new.status is distinct from old.status
     and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'STATUS_PROTECTED: 매장 상태는 서버 검증을 통해서만 변경됩니다';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_store_status on public.stores;
create trigger trg_guard_store_status
  before update on public.stores
  for each row execute function public.guard_store_status();

-- 3) create_store: 대표자명·개업일자 받고 pending 으로 생성
drop function if exists public.create_store(text, text, text);

create or replace function public.create_store(
  p_name       text,
  p_biz_no     text default null,
  p_address    text default null,
  p_owner_name text default null,
  p_open_date  date default null
)
returns table (store_id uuid, join_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id   uuid;
  v_code text;
begin
  if coalesce(trim(p_name), '') = '' then
    raise exception 'NAME_REQUIRED';
  end if;

  insert into public.stores
    (name, biz_no, address, owner_id, biz_owner_name, biz_open_date, status)
  values
    (trim(p_name), nullif(trim(p_biz_no), ''), nullif(trim(p_address), ''),
     auth.uid(), nullif(trim(p_owner_name), ''), p_open_date, 'pending')
  returning id, stores.join_code into v_id, v_code;

  insert into public.memberships (store_id, user_id, role, position, status)
  values (v_id, auth.uid(), 'owner', '대표', 'active');

  return query select v_id, v_code;
end;
$$;

grant execute on function public.create_store(text, text, text, text, date) to authenticated;
