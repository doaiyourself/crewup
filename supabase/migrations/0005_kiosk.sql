-- Crew Up 0005 — 키오스크(매장 대시보드) + 오늘의 할일
-- 매장 태블릿/PC에 띄우는 공용 출퇴근 화면. 켜고/끌 때 PIN 필요.
-- 사장님 세션으로 직원들의 출퇴근을 "대리 기록"하므로 SECURITY DEFINER RPC 사용.

-- 1) 키오스크 PIN (stores)
alter table public.stores
  add column if not exists kiosk_pin text;

-- 2) 오늘의 할일
create table if not exists public.tasks (
  id         uuid primary key default gen_random_uuid(),
  store_id   uuid not null references public.stores(id) on delete cascade,
  title      text not null,
  done       boolean not null default false,
  work_date  date not null default current_date,
  created_at timestamptz not null default now()
);
create index if not exists tasks_store_date_idx on public.tasks (store_id, work_date);

alter table public.tasks enable row level security;

create policy "tasks_select_member" on public.tasks
  for select using (public.is_member(store_id) or public.is_admin(store_id));
create policy "tasks_update_member" on public.tasks
  for update using (public.is_member(store_id) or public.is_admin(store_id));
create policy "tasks_admin_insert" on public.tasks
  for insert with check (public.is_admin(store_id));
create policy "tasks_admin_delete" on public.tasks
  for delete using (public.is_admin(store_id));

-- 3) 키오스크 PIN 설정/검증
create or replace function public.set_kiosk_pin(p_store_id uuid, p_pin text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin(p_store_id) then raise exception 'FORBIDDEN'; end if;
  if p_pin is null or length(trim(p_pin)) < 4 then
    raise exception 'PIN_TOO_SHORT';
  end if;
  update public.stores set kiosk_pin = trim(p_pin) where id = p_store_id;
end $$;

create or replace function public.verify_kiosk_pin(p_store_id uuid, p_pin text)
returns boolean
language plpgsql security definer set search_path = public as $$
declare v text;
begin
  if not public.is_admin(p_store_id) then raise exception 'FORBIDDEN'; end if;
  select kiosk_pin into v from public.stores where id = p_store_id;
  return v is not null and v = trim(p_pin);
end $$;

create or replace function public.has_kiosk_pin(p_store_id uuid)
returns boolean
language sql security definer set search_path = public stable as $$
  select kiosk_pin is not null from public.stores where id = p_store_id;
$$;

grant execute on function public.set_kiosk_pin(uuid, text) to authenticated;
grant execute on function public.verify_kiosk_pin(uuid, text) to authenticated;
grant execute on function public.has_kiosk_pin(uuid) to authenticated;

-- 4) 키오스크 보드: 멤버 + 오늘 출퇴근 현황
create or replace function public.kiosk_board(p_store_id uuid)
returns table (
  user_id      uuid,
  name         text,
  avatar_color text,
  role         public.role_type,
  "position"   text,
  clock_in_at  timestamptz,
  clock_out_at timestamptz
)
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin(p_store_id) then raise exception 'FORBIDDEN'; end if;
  return query
    select m.user_id, p.name, p.avatar_color, m.role, m.position,
           a.clock_in_at, a.clock_out_at
    from public.memberships m
    join public.profiles p on p.id = m.user_id
    left join public.attendance a
      on a.store_id = m.store_id and a.user_id = m.user_id
      and a.work_date = current_date
    where m.store_id = p_store_id and m.status = 'active'
    order by
      case m.role when 'owner' then 0 when 'manager' then 1
                  when 'employee' then 2 else 3 end,
      p.name;
end $$;

grant execute on function public.kiosk_board(uuid) to authenticated;

-- 5) 키오스크 출퇴근 대리 기록 (관리자만)
create or replace function public.kiosk_clock(p_store_id uuid, p_user_id uuid, p_action text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin(p_store_id) then raise exception 'FORBIDDEN'; end if;

  if p_action = 'in' then
    insert into public.attendance (store_id, user_id, work_date, clock_in_at, status)
    values (p_store_id, p_user_id, current_date, now(), 'normal')
    on conflict (store_id, user_id, work_date)
    do update set clock_in_at = excluded.clock_in_at, clock_out_at = null, status = 'normal';
  elsif p_action = 'out' then
    update public.attendance set clock_out_at = now()
    where store_id = p_store_id and user_id = p_user_id and work_date = current_date;
  else
    raise exception 'BAD_ACTION';
  end if;
end $$;

grant execute on function public.kiosk_clock(uuid, uuid, text) to authenticated;
