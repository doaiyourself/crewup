-- Crew Up 0002 — 매장 코드 + 가입/합류 RPC
-- 가입(=카카오 로그인)과 매장 소속을 분리:
--  · 사장: create_store 로 매장 생성 + 본인 owner 멤버십
--  · 직원/알바: join_store_by_code 로 매장 코드 입력해 합류
-- 한 사용자가 여러 매장에 서로 다른 역할로 소속 가능 (memberships 다대다).

-- 1) 매장 초대 코드
alter table public.stores
  add column if not exists join_code text unique;

-- 기존 매장 백필 + 기본값
update public.stores
  set join_code = upper(substr(md5(gen_random_uuid()::text), 1, 6))
  where join_code is null;

alter table public.stores
  alter column join_code set default upper(substr(md5(gen_random_uuid()::text), 1, 6));

-- 2) 매장 생성 (사장) — 매장 + owner 멤버십을 원자적으로 생성
create or replace function public.create_store(
  p_name    text,
  p_biz_no  text default null,
  p_address text default null
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

  insert into public.stores (name, biz_no, address, owner_id)
  values (trim(p_name), nullif(trim(p_biz_no), ''), nullif(trim(p_address), ''), auth.uid())
  returning id, stores.join_code into v_id, v_code;

  insert into public.memberships (store_id, user_id, role, position, status)
  values (v_id, auth.uid(), 'owner', '대표', 'active');

  return query select v_id, v_code;
end;
$$;

-- 3) 매장 코드로 합류 (직원/알바)
create or replace function public.join_store_by_code(
  p_code text,
  p_role text default 'parttimer'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_store uuid;
  v_role  public.role_type;
begin
  -- 합류는 직원/알바만 (관리자 임명은 사장님이 별도로)
  v_role := case when p_role = 'employee' then 'employee'::public.role_type
                 else 'parttimer'::public.role_type end;

  select id into v_store from public.stores
  where join_code = upper(trim(p_code));

  if v_store is null then
    raise exception 'INVALID_CODE';
  end if;

  if exists (
    select 1 from public.memberships
    where store_id = v_store and user_id = auth.uid()
  ) then
    raise exception 'ALREADY_MEMBER';
  end if;

  insert into public.memberships (store_id, user_id, role, position, status)
  values (
    v_store, auth.uid(), v_role,
    case when v_role = 'employee' then '직원' else '알바' end,
    'active'
  );

  return v_store;
end;
$$;

grant execute on function public.create_store(text, text, text) to authenticated;
grant execute on function public.join_store_by_code(text, text) to authenticated;
