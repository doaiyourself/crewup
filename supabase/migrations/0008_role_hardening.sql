-- Crew Up 0008 — 역할/소유권 권한 강화 + 출퇴근 무결성 (QA 안정화)
-- QA에서 발견한 권한 상승/우회 취약점 차단:
--  (1) 점장(manager)이 역할을 바꿔 자신을 사장으로 승격하거나 사장을 강등/퇴사시킴
--  (2) 점장이 stores.owner_id 를 바꿔 매장 소유권을 탈취
--  (3) 직원/알바가 /api/clock(서버 GPS·QR 검증)을 우회해 출퇴근을 직접 기록
-- 원칙: 역할 변경·관리자 임명·소유권 = '사장님(owner)'만.
--       관리자 계정 관리 = 사장님만.   출퇴근 기록 = 서버(service_role)만.

-- =========================================================
-- 0) 사장님 여부 헬퍼 — stores.owner_id 가 소유권의 진실원(single source of truth)
-- =========================================================
create or replace function public.is_owner(p_store_id uuid)
returns boolean
language sql security definer set search_path = public stable
as $$
  select exists (
    select 1 from public.stores s
    where s.id = p_store_id and s.owner_id = auth.uid()
  );
$$;

grant execute on function public.is_owner(uuid) to authenticated;

-- =========================================================
-- 1) 멤버십 변경 가드 — 역할 변경/관리자 임명/관리자 계정 보호
--    (memberships RLS 는 is_admin 쓰기를 허용하므로, '무엇을' 바꿀 수 있는지는 트리거로 제한)
-- =========================================================
create or replace function public.guard_membership()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_owner boolean;
begin
  -- 서버(service_role)는 통과
  if coalesce(auth.role(), '') = 'service_role' then
    return coalesce(new, old);
  end if;

  if tg_op = 'INSERT' then
    -- 관리자(owner/manager) 멤버십 신규 생성은 사장님만.
    -- (create_store 의 owner 자기삽입은 같은 트랜잭션에서 stores.owner_id 가 먼저 세팅돼 허용됨)
    if new.role in ('owner','manager') and not public.is_owner(new.store_id) then
      raise exception 'ROLE_PROTECTED: 관리자 임명은 사장님만 가능합니다';
    end if;
    return new;

  elsif tg_op = 'UPDATE' then
    v_owner := public.is_owner(new.store_id);
    -- 역할 변경은 사장님만
    if new.role is distinct from old.role and not v_owner then
      raise exception 'ROLE_PROTECTED: 역할 변경은 사장님만 가능합니다';
    end if;
    -- 관리자(owner/manager) 계정의 변경(시급·직책·퇴사 등)은 사장님만.
    -- → 점장은 직원/알바만 관리. 점장이 다른 관리자/사장을 건드릴 수 없음.
    if old.role in ('owner','manager') and not v_owner then
      raise exception 'ADMIN_PROTECTED: 관리자 계정 변경은 사장님만 가능합니다';
    end if;
    return new;

  elsif tg_op = 'DELETE' then
    if old.role in ('owner','manager') and not public.is_owner(old.store_id) then
      raise exception 'ADMIN_PROTECTED: 관리자 계정 삭제는 사장님만 가능합니다';
    end if;
    return old;
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_guard_membership on public.memberships;
create trigger trg_guard_membership
  before insert or update or delete on public.memberships
  for each row execute function public.guard_membership();

-- =========================================================
-- 2) 매장 소유권(owner_id) 불변 — 점장의 매장 탈취 차단 (서버만 이전 가능)
-- =========================================================
create or replace function public.guard_store_owner()
returns trigger
language plpgsql set search_path = public
as $$
begin
  if new.owner_id is distinct from old.owner_id
     and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'OWNER_PROTECTED: 매장 소유자는 변경할 수 없습니다';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_store_owner on public.stores;
create trigger trg_guard_store_owner
  before update on public.stores
  for each row execute function public.guard_store_owner();

-- =========================================================
-- 3) 출퇴근 무결성 — 직원 직접 기록 금지, 서버(/api/clock, service_role) 경유만
--    (GPS·QR 검증이 실제로 강제되도록. 관리자 정정/키오스크는 별도 허용)
-- =========================================================
drop policy if exists "attendance_insert_self" on public.attendance;
drop policy if exists "attendance_update_self_or_admin" on public.attendance;

-- 관리자만 직접 삽입(수기 입력)·수정(정정) 가능
create policy "attendance_admin_insert" on public.attendance
  for insert with check (public.is_admin(store_id));
create policy "attendance_admin_update" on public.attendance
  for update using (public.is_admin(store_id));

-- 참고: 직원 본인 출퇴근은 /api/clock 서버 라우트(service_role, RLS 우회)에서
--       GPS/QR 검증 후 기록한다. 키오스크는 kiosk_clock(SECURITY DEFINER)로 기록.
--       select(본인+관리자) / delete(관리자) 정책은 0001 그대로 유지된다.
