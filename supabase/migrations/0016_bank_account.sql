-- Crew Up 0016 — 직원 급여 계좌 (직원 제출 → 사장 승인 후 적용)
-- 직원이 본인 계좌를 입력하면 'pending', 사장(공동 포함)이 승인하면 적용(approved).

create table if not exists public.bank_accounts (
  store_id        uuid not null references public.stores(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  -- 승인된 현재 값
  bank_name       text,
  account_no      text,
  holder          text,
  -- 제출 대기(미승인) 값
  pending_bank    text,
  pending_account text,
  pending_holder  text,
  status          text not null default 'none', -- none / pending / approved
  submitted_at    timestamptz,
  approved_by     uuid references public.profiles(id),
  approved_at     timestamptz,
  updated_at      timestamptz not null default now(),
  primary key (store_id, user_id)
);

alter table public.bank_accounts enable row level security;

-- 조회: 본인 또는 관리자(사장·점장)
create policy "bank_select" on public.bank_accounts
  for select using (
    user_id = auth.uid() or public.is_admin(store_id)
  );
-- 쓰기는 아래 RPC(SECURITY DEFINER)로만 — 직접 INSERT/UPDATE 정책 없음

-- =========================================================
-- 직원: 본인 계좌 제출 (pending)
-- =========================================================
create or replace function public.submit_bank_account(
  p_store_id uuid,
  p_bank text,
  p_account text,
  p_holder text
)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_member(p_store_id) then
    raise exception 'FORBIDDEN: 매장 구성원만 계좌를 등록할 수 있습니다';
  end if;
  insert into public.bank_accounts (
    store_id, user_id, pending_bank, pending_account, pending_holder,
    status, submitted_at, updated_at
  )
  values (
    p_store_id, auth.uid(), nullif(trim(p_bank), ''), nullif(trim(p_account), ''),
    nullif(trim(p_holder), ''), 'pending', now(), now()
  )
  on conflict (store_id, user_id) do update set
    pending_bank    = nullif(trim(p_bank), ''),
    pending_account = nullif(trim(p_account), ''),
    pending_holder  = nullif(trim(p_holder), ''),
    status          = 'pending',
    submitted_at    = now(),
    updated_at      = now();
end;
$$;
grant execute on function public.submit_bank_account(uuid, text, text, text) to authenticated;

-- =========================================================
-- 사장: 계좌 승인/거절
-- =========================================================
create or replace function public.review_bank_account(
  p_store_id uuid,
  p_user_id uuid,
  p_approve boolean
)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  r public.bank_accounts%rowtype;
begin
  if not public.is_owner(p_store_id) then
    raise exception 'FORBIDDEN: 계좌 승인은 사장님만 가능합니다';
  end if;
  select * into r from public.bank_accounts
    where store_id = p_store_id and user_id = p_user_id;
  if not found or r.status <> 'pending' then
    raise exception 'NOT_PENDING: 승인 대기중인 계좌가 없습니다';
  end if;

  if p_approve then
    update public.bank_accounts set
      bank_name = pending_bank,
      account_no = pending_account,
      holder = pending_holder,
      pending_bank = null, pending_account = null, pending_holder = null,
      status = 'approved', approved_by = auth.uid(), approved_at = now(),
      updated_at = now()
    where store_id = p_store_id and user_id = p_user_id;
  else
    update public.bank_accounts set
      pending_bank = null, pending_account = null, pending_holder = null,
      status = case when bank_name is not null then 'approved' else 'none' end,
      updated_at = now()
    where store_id = p_store_id and user_id = p_user_id;
  end if;
end;
$$;
grant execute on function public.review_bank_account(uuid, uuid, boolean) to authenticated;
