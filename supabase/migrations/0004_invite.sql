-- Crew Up 0004 — 직원 초대 (멤버 목록 + 코드로 매장 조회)

-- 1) 매장 멤버 목록 (관리자만) — profiles RLS 우회 위해 SECURITY DEFINER
create or replace function public.list_store_members(p_store_id uuid)
returns table (
  user_id     uuid,
  name        text,
  avatar_color text,
  phone       text,
  role        public.role_type,
  "position"  text,
  hourly_wage integer,
  status      public.membership_status,
  joined_at   timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin(p_store_id) then
    raise exception 'FORBIDDEN';
  end if;

  return query
    select m.user_id, p.name, p.avatar_color, p.phone,
           m.role, m.position, m.hourly_wage, m.status, m.created_at
    from public.memberships m
    join public.profiles p on p.id = m.user_id
    where m.store_id = p_store_id
    order by
      case m.role
        when 'owner' then 0 when 'manager' then 1
        when 'employee' then 2 else 3 end,
      m.created_at;
end;
$$;

grant execute on function public.list_store_members(uuid) to authenticated;

-- 2) 초대 코드로 매장 기본정보 조회 (합류 전 매장명 표시용)
create or replace function public.get_store_by_code(p_code text)
returns table (id uuid, name text, status public.store_status)
language sql
security definer
set search_path = public
stable
as $$
  select id, name, status
  from public.stores
  where join_code = upper(trim(p_code));
$$;

grant execute on function public.get_store_by_code(text) to anon, authenticated;
