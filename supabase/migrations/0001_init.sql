-- Crew Up 초기 스키마 + RLS (Phase 0-BE)
-- Supabase 대시보드 → SQL Editor 에 붙여넣고 실행하세요.
-- PRD §7 데이터 모델 기준.

-- =========================================================
-- 0. 확장 / ENUM
-- =========================================================
create type public.role_type as enum ('owner', 'manager', 'employee', 'parttimer');
create type public.work_status as enum ('off', 'working', 'done');
create type public.attendance_status as enum ('normal', 'late', 'early_leave', 'absent', 'pending');
create type public.contract_status as enum ('none', 'pending', 'signed', 'expired');
create type public.payroll_status as enum ('draft', 'confirmed');
create type public.membership_status as enum ('active', 'invited', 'resigned');

-- =========================================================
-- 1. 테이블
-- =========================================================

-- 사용자 프로필 (auth.users 1:1 미러)
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  name         text not null default '사용자',
  phone        text,
  avatar_color text not null default '#2563eb',
  kakao_id     text,
  created_at   timestamptz not null default now()
);

-- 매장(사업장)
create table public.stores (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  biz_no     text,
  address    text,
  lat        double precision,
  lng        double precision,
  owner_id   uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

-- 매장 ↔ 사용자 소속 (역할/급여조건)
create table public.memberships (
  id          uuid primary key default gen_random_uuid(),
  store_id    uuid not null references public.stores(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  role        public.role_type not null default 'parttimer',
  position    text,
  hourly_wage integer not null default 10030,
  status      public.membership_status not null default 'active',
  created_at  timestamptz not null default now(),
  unique (store_id, user_id)
);

-- 출퇴근 기록
create table public.attendance (
  id            uuid primary key default gen_random_uuid(),
  store_id      uuid not null references public.stores(id) on delete cascade,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  work_date     date not null default current_date,
  clock_in_at   timestamptz,
  clock_out_at  timestamptz,
  break_minutes integer not null default 0,
  status        public.attendance_status not null default 'normal',
  approved_by   uuid references public.profiles(id),
  created_at    timestamptz not null default now(),
  unique (store_id, user_id, work_date)
);

-- 근무 스케줄 (요일 기반 주간 반복)
create table public.schedules (
  id          uuid primary key default gen_random_uuid(),
  store_id    uuid not null references public.stores(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6), -- 0=일
  start_time  time not null,
  end_time    time not null,
  created_at  timestamptz not null default now()
);

-- 근로계약서
create table public.contracts (
  id         uuid primary key default gen_random_uuid(),
  store_id   uuid not null references public.stores(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  status     public.contract_status not null default 'none',
  content    jsonb not null default '{}'::jsonb,
  pdf_url    text,
  signed_at  timestamptz,
  expires_at date,
  created_at timestamptz not null default now()
);

-- 급여 정산
create table public.payrolls (
  id               uuid primary key default gen_random_uuid(),
  store_id         uuid not null references public.stores(id) on delete cascade,
  user_id          uuid not null references public.profiles(id) on delete cascade,
  period           text not null, -- 'YYYY-MM'
  total_hours      numeric(6,2) not null default 0,
  base_pay         integer not null default 0,
  weekly_allowance integer not null default 0,
  night_allowance  integer not null default 0,
  deduction        integer not null default 0,
  status           public.payroll_status not null default 'draft',
  created_at       timestamptz not null default now(),
  unique (store_id, user_id, period)
);

-- 알림 기록
create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  type       text not null,
  title      text not null,
  body       text,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);

-- 인덱스
create index on public.memberships (user_id);
create index on public.memberships (store_id);
create index on public.attendance (store_id, work_date);
create index on public.schedules (store_id, user_id);
create index on public.payrolls (store_id, period);
create index on public.notifications (user_id, read);

-- =========================================================
-- 2. RLS 헬퍼 함수 (SECURITY DEFINER → memberships RLS 재귀 방지)
-- =========================================================

-- 현재 로그인 사용자가 해당 매장의 멤버인가?
create or replace function public.is_member(p_store_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.memberships m
    where m.store_id = p_store_id
      and m.user_id = auth.uid()
      and m.status = 'active'
  );
$$;

-- 현재 로그인 사용자가 해당 매장의 관리자(사장님/점장)인가?
create or replace function public.is_admin(p_store_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.memberships m
    where m.store_id = p_store_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role in ('owner', 'manager')
  );
$$;

-- =========================================================
-- 3. RLS 활성화 + 정책
-- =========================================================
alter table public.profiles      enable row level security;
alter table public.stores         enable row level security;
alter table public.memberships    enable row level security;
alter table public.attendance     enable row level security;
alter table public.schedules      enable row level security;
alter table public.contracts      enable row level security;
alter table public.payrolls       enable row level security;
alter table public.notifications  enable row level security;

-- profiles: 본인 읽기/수정. (가입 시 트리거가 생성)
create policy "profiles_select_own" on public.profiles
  for select using (id = auth.uid());
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid());

-- stores: 멤버는 조회, 사장님은 본인 매장 관리
create policy "stores_select_member" on public.stores
  for select using (is_member(id) or owner_id = auth.uid());
create policy "stores_insert_owner" on public.stores
  for insert with check (owner_id = auth.uid());
create policy "stores_update_admin" on public.stores
  for update using (is_admin(id) or owner_id = auth.uid());
create policy "stores_delete_owner" on public.stores
  for delete using (owner_id = auth.uid());

-- memberships: 본인 것 조회 + 관리자는 매장 전체 관리
create policy "memberships_select_self_or_admin" on public.memberships
  for select using (user_id = auth.uid() or is_admin(store_id));
create policy "memberships_admin_write" on public.memberships
  for all using (is_admin(store_id)) with check (is_admin(store_id));

-- attendance: 본인 CRUD + 관리자 매장 전체
create policy "attendance_select" on public.attendance
  for select using (user_id = auth.uid() or is_admin(store_id));
create policy "attendance_insert_self" on public.attendance
  for insert with check (user_id = auth.uid() and is_member(store_id));
create policy "attendance_update_self_or_admin" on public.attendance
  for update using (user_id = auth.uid() or is_admin(store_id));
create policy "attendance_admin_delete" on public.attendance
  for delete using (is_admin(store_id));

-- schedules: 멤버 조회 + 관리자 편성
create policy "schedules_select_member" on public.schedules
  for select using (user_id = auth.uid() or is_admin(store_id));
create policy "schedules_admin_write" on public.schedules
  for all using (is_admin(store_id)) with check (is_admin(store_id));

-- contracts: 본인 조회/서명 + 관리자 발행
create policy "contracts_select" on public.contracts
  for select using (user_id = auth.uid() or is_admin(store_id));
create policy "contracts_update_self_or_admin" on public.contracts
  for update using (user_id = auth.uid() or is_admin(store_id));
create policy "contracts_admin_write" on public.contracts
  for insert with check (is_admin(store_id));

-- payrolls: 본인 조회 + 관리자 관리
create policy "payrolls_select" on public.payrolls
  for select using (user_id = auth.uid() or is_admin(store_id));
create policy "payrolls_admin_write" on public.payrolls
  for all using (is_admin(store_id)) with check (is_admin(store_id));

-- notifications: 본인 것만
create policy "notifications_select_own" on public.notifications
  for select using (user_id = auth.uid());
create policy "notifications_update_own" on public.notifications
  for update using (user_id = auth.uid());

-- =========================================================
-- 4. 신규 가입 시 프로필 자동 생성 트리거
-- =========================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, kakao_id)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'name',
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'nickname',
      '사용자'
    ),
    new.raw_user_meta_data->>'provider_id'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
