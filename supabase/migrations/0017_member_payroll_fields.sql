-- Crew Up 0017 — 멤버별 급여 옵션 (임금형태·주휴포함·4대보험)
-- 관리(직원관리)에서 편집, 급여 계산의 소스. 기본값은 근로계약서에서 seed.

alter table public.memberships
  add column if not exists wage_type       text    not null default 'hourly', -- hourly / monthly
  add column if not exists weekly_included boolean not null default false,    -- 주휴수당 시급 포함
  add column if not exists insurance       boolean not null default false;    -- 4대보험 가입

-- 기존 계약서 값으로 1회 backfill (직원별 최신 계약서 기준)
-- guard_membership 트리거는 관리자 계정 변경을 막으므로 backfill 동안만 비활성화
alter table public.memberships disable trigger trg_guard_membership;
update public.memberships m set
  wage_type       = coalesce(c.content->>'wageType', 'hourly'),
  weekly_included = coalesce((c.content->>'weeklyHolidayIncluded')::boolean, false),
  insurance       = coalesce((c.content->>'insurance')::boolean, false)
from (
  select distinct on (store_id, user_id) store_id, user_id, content
  from public.contracts
  order by store_id, user_id, created_at desc
) c
where c.store_id = m.store_id and c.user_id = m.user_id;
alter table public.memberships enable trigger trg_guard_membership;

-- list_store_members 확장 (반환 컬럼 추가 → drop 후 재생성)
drop function if exists public.list_store_members(uuid);
create function public.list_store_members(p_store_id uuid)
returns table (
  user_id     uuid,
  name        text,
  avatar_color text,
  phone       text,
  role        public.role_type,
  "position"  text,
  hourly_wage integer,
  status      public.membership_status,
  joined_at   timestamptz,
  wage_type       text,
  weekly_included boolean,
  insurance       boolean
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
           m.role, m.position, m.hourly_wage, m.status, m.created_at,
           m.wage_type, m.weekly_included, m.insurance
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
