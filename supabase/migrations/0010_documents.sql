-- Crew Up 0010 — 문서함 (보건증)
-- 근로계약서는 기존 contracts 테이블(본인/관리자 조회)을 그대로 사용.
-- 보건증(health_certs)은 '본인 + 매장 사장님(owner)'만 열람 가능 (점장 불가).
-- 파일은 Storage 비공개 버킷에 보관: 경로 = {store_id}/{user_id}/{파일}

-- 1) 보건증 메타 테이블
create table if not exists public.health_certs (
  id         uuid primary key default gen_random_uuid(),
  store_id   uuid not null references public.stores(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  file_path  text not null,           -- storage object 경로
  file_name  text,
  issued_on  date,
  expires_on date,
  created_at timestamptz not null default now()
);
create index if not exists health_certs_store_user_idx
  on public.health_certs (store_id, user_id);

alter table public.health_certs enable row level security;

-- 조회: 본인 또는 매장 사장님만 (점장 불가)
create policy "hc_select_self_or_owner" on public.health_certs
  for select using (user_id = auth.uid() or public.is_owner(store_id));
-- 등록: 본인만 (자기 매장 멤버)
create policy "hc_insert_self" on public.health_certs
  for insert with check (user_id = auth.uid() and public.is_member(store_id));
-- 삭제: 본인 또는 사장님
create policy "hc_delete_self_or_owner" on public.health_certs
  for delete using (user_id = auth.uid() or public.is_owner(store_id));

-- 2) Storage 비공개 버킷
insert into storage.buckets (id, name, public)
values ('health-certs', 'health-certs', false)
on conflict (id) do nothing;

-- 3) Storage 정책 (경로 = {store_id}/{user_id}/{파일})
-- 업로드: 본인 폴더에만
drop policy if exists "hc_obj_insert_self" on storage.objects;
create policy "hc_obj_insert_self" on storage.objects
  for insert with check (
    bucket_id = 'health-certs'
    and (storage.foldername(name))[2] = auth.uid()::text
  );
-- 조회(서명URL/다운로드): 본인 또는 매장 사장님
drop policy if exists "hc_obj_select_self_or_owner" on storage.objects;
create policy "hc_obj_select_self_or_owner" on storage.objects
  for select using (
    bucket_id = 'health-certs'
    and (
      (storage.foldername(name))[2] = auth.uid()::text
      or public.is_owner((storage.foldername(name))[1]::uuid)
    )
  );
-- 삭제: 본인 또는 사장님
drop policy if exists "hc_obj_delete_self_or_owner" on storage.objects;
create policy "hc_obj_delete_self_or_owner" on storage.objects
  for delete using (
    bucket_id = 'health-certs'
    and (
      (storage.foldername(name))[2] = auth.uid()::text
      or public.is_owner((storage.foldername(name))[1]::uuid)
    )
  );
