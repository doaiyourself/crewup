-- Crew Up 0014 — 근무시간 수정·추가 요청
-- 직원·알바·점장이 본인 근무시간 수정(edit) 또는 다른 날 근무 추가(add)를 요청하면
-- 사장(또는 출퇴근 권한을 위임받은 점장)이 확인 후 승인 → 출퇴근 기록에 반영.

create table if not exists public.attendance_requests (
  id           uuid primary key default gen_random_uuid(),
  store_id     uuid not null references public.stores(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade, -- 요청자(=대상 본인)
  kind         text not null default 'add',     -- edit(수정) / add(추가)
  target_id    uuid references public.attendance(id) on delete set null, -- 수정 대상(있으면)
  work_date    date not null,
  clock_in_at  timestamptz,
  clock_out_at timestamptz,
  reason       text,
  status       text not null default 'pending', -- pending / approved / rejected
  reviewed_by  uuid references public.profiles(id),
  reviewed_at  timestamptz,
  created_at   timestamptz not null default now()
);
create index if not exists attendance_requests_store_idx
  on public.attendance_requests (store_id, status, created_at desc);
create index if not exists attendance_requests_user_idx
  on public.attendance_requests (user_id, created_at desc);

alter table public.attendance_requests enable row level security;

-- 조회: 본인 + 출퇴근 관리자(사장/위임 점장)
create policy "ar_select" on public.attendance_requests
  for select using (
    user_id = auth.uid() or public.can_manage_attendance(store_id)
  );
-- 생성: 본인 것만(활성 멤버)
create policy "ar_insert_self" on public.attendance_requests
  for insert with check (
    user_id = auth.uid() and public.is_member(store_id)
  );
-- 취소/삭제: 본인 대기중 요청 또는 관리자
create policy "ar_delete" on public.attendance_requests
  for delete using (
    (user_id = auth.uid() and status = 'pending')
    or public.can_manage_attendance(store_id)
  );
-- (승인/거절은 아래 SECURITY DEFINER RPC 로만 처리 — UPDATE 정책 없음)

-- =========================================================
-- 요청 처리 RPC — 승인 시 출퇴근 기록에 반영(없으면 추가, 있으면 수정)
-- =========================================================
create or replace function public.review_attendance_request(
  p_request_id uuid,
  p_approve boolean
)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  r public.attendance_requests%rowtype;
begin
  select * into r from public.attendance_requests where id = p_request_id;
  if not found then
    raise exception 'NOT_FOUND: 요청을 찾을 수 없습니다';
  end if;
  if not public.can_manage_attendance(r.store_id) then
    raise exception 'FORBIDDEN: 출퇴근 요청 처리 권한이 없습니다';
  end if;
  if r.status <> 'pending' then
    raise exception 'ALREADY_REVIEWED: 이미 처리된 요청입니다';
  end if;

  if p_approve then
    insert into public.attendance (
      store_id, user_id, work_date, clock_in_at, clock_out_at, status, approved_by
    )
    values (
      r.store_id, r.user_id, r.work_date, r.clock_in_at, r.clock_out_at, 'normal', auth.uid()
    )
    on conflict (store_id, user_id, work_date)
    do update set
      clock_in_at  = excluded.clock_in_at,
      clock_out_at = excluded.clock_out_at,
      approved_by  = excluded.approved_by;

    update public.attendance_requests
      set status = 'approved', reviewed_by = auth.uid(), reviewed_at = now()
      where id = r.id;
  else
    update public.attendance_requests
      set status = 'rejected', reviewed_by = auth.uid(), reviewed_at = now()
      where id = r.id;
  end if;
end;
$$;

grant execute on function public.review_attendance_request(uuid, boolean) to authenticated;
