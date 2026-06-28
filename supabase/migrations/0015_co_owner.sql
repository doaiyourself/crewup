-- Crew Up 0015 — 공동 사장(co-owner)
-- 동업 매장: 여러 명이 owner 권한을 가질 수 있게. stores.owner_id = 최초 대표(founder).
-- 공동 사장 = memberships.role='owner' 멤버십(여러 개 허용).
-- 안전장치: (1) 대표(founder) 계정은 역할/상태 변경·삭제 불가
--           (2) 공동 사장 지정/해제는 대표(founder)만 — 동업자 간 강등/탈취 방지

-- =========================================================
-- 1) is_owner 재정의 — owner_id(대표) 또는 role='owner' 멤버십이면 사장
-- =========================================================
create or replace function public.is_owner(p_store_id uuid)
returns boolean
language sql security definer set search_path = public stable
as $$
  select exists (
    select 1 from public.stores s
    where s.id = p_store_id and s.owner_id = auth.uid()
  )
  or exists (
    select 1 from public.memberships m
    where m.store_id = p_store_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role = 'owner'
  );
$$;

-- =========================================================
-- 2) guard_membership 보강 — 대표 보호 + 공동 사장 지정은 대표만
-- =========================================================
create or replace function public.guard_membership()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_owner   boolean;
  v_founder uuid;
begin
  -- 서버(service_role)는 통과
  if coalesce(auth.role(), '') = 'service_role' then
    return coalesce(new, old);
  end if;

  select owner_id into v_founder from public.stores
    where id = coalesce(new.store_id, old.store_id);

  if tg_op = 'INSERT' then
    -- 관리자(owner/manager) 임명은 사장(공동 포함)만
    if new.role in ('owner','manager') and not public.is_owner(new.store_id) then
      raise exception 'ROLE_PROTECTED: 관리자 임명은 사장님만 가능합니다';
    end if;
    -- 공동 사장 지정은 대표(founder)만
    if new.role = 'owner' and auth.uid() is distinct from v_founder then
      raise exception 'OWNER_PROTECTED: 공동 사장 지정은 대표만 가능합니다';
    end if;
    return new;

  elsif tg_op = 'UPDATE' then
    v_owner := public.is_owner(new.store_id);
    -- 역할 변경은 사장만
    if new.role is distinct from old.role and not v_owner then
      raise exception 'ROLE_PROTECTED: 역할 변경은 사장님만 가능합니다';
    end if;
    -- 관리자(owner/manager) 계정 변경은 사장만
    if old.role in ('owner','manager') and not v_owner then
      raise exception 'ADMIN_PROTECTED: 관리자 계정 변경은 사장님만 가능합니다';
    end if;
    -- 대표(founder) 계정의 역할/상태는 변경 불가
    if old.user_id = v_founder
       and (new.role is distinct from old.role
            or new.status is distinct from old.status) then
      raise exception 'FOUNDER_PROTECTED: 대표 계정은 변경할 수 없습니다';
    end if;
    -- 공동 사장 지정/해제(owner로/owner에서)는 대표만
    if (new.role = 'owner' or old.role = 'owner')
       and new.role is distinct from old.role
       and auth.uid() is distinct from v_founder then
      raise exception 'OWNER_PROTECTED: 공동 사장 지정/해제는 대표만 가능합니다';
    end if;
    return new;

  elsif tg_op = 'DELETE' then
    if old.role in ('owner','manager') and not public.is_owner(old.store_id) then
      raise exception 'ADMIN_PROTECTED: 관리자 계정 삭제는 사장님만 가능합니다';
    end if;
    -- 대표(founder)는 삭제 불가
    if old.user_id = v_founder then
      raise exception 'FOUNDER_PROTECTED: 대표 계정은 삭제할 수 없습니다';
    end if;
    -- 공동 사장 해제는 대표만
    if old.role = 'owner' and auth.uid() is distinct from v_founder then
      raise exception 'OWNER_PROTECTED: 공동 사장 해제는 대표만 가능합니다';
    end if;
    return old;
  end if;

  return coalesce(new, old);
end;
$$;
