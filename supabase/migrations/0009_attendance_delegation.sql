-- Crew Up 0009 — 출퇴근 권한 위임 (점장)
-- 기본: 출퇴근 수정·승인·추가·삭제는 사장(owner)만.
-- 사장이 매장 설정에서 토글로 위임하면 점장(manager)도 가능.
-- (직원 본인 출퇴근은 /api/clock(service_role)·키오스크(SECURITY DEFINER) 경유라 영향 없음)

alter table public.stores
  add column if not exists attendance_delegated boolean not null default false;

-- 출퇴근 관리 권한: 사장은 항상, 점장은 위임(attendance_delegated)된 경우만
create or replace function public.can_manage_attendance(p_store_id uuid)
returns boolean
language sql security definer set search_path = public stable
as $$
  select public.is_owner(p_store_id)
    or exists (
      select 1
      from public.memberships m
      join public.stores s on s.id = m.store_id
      where m.store_id = p_store_id
        and m.user_id = auth.uid()
        and m.status = 'active'
        and m.role = 'manager'
        and s.attendance_delegated
    );
$$;
grant execute on function public.can_manage_attendance(uuid) to authenticated;

-- 출퇴근 쓰기 정책을 위임 기반으로 교체 (기존 is_admin → can_manage_attendance)
drop policy if exists "attendance_admin_insert" on public.attendance;
drop policy if exists "attendance_admin_update" on public.attendance;
drop policy if exists "attendance_admin_delete" on public.attendance;

create policy "attendance_manage_insert" on public.attendance
  for insert with check (public.can_manage_attendance(store_id));
create policy "attendance_manage_update" on public.attendance
  for update using (public.can_manage_attendance(store_id));
create policy "attendance_manage_delete" on public.attendance
  for delete using (public.can_manage_attendance(store_id));

-- 위임 토글 (사장만)
create or replace function public.set_attendance_delegation(p_store_id uuid, p_on boolean)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_owner(p_store_id) then
    raise exception 'FORBIDDEN: 출퇴근 권한 위임은 사장님만 설정할 수 있습니다';
  end if;
  update public.stores set attendance_delegated = coalesce(p_on, false)
  where id = p_store_id;
end $$;
grant execute on function public.set_attendance_delegation(uuid, boolean) to authenticated;
