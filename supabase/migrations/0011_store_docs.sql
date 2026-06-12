-- Crew Up 0011 — 기타문서 (매장 사업 서류)
-- 사장님이 임대차계약서·사업자등록증 등 임의 파일을 제목과 함께 업로드.
-- 열람: 관리자(사장·점장).  업로드/삭제: 사장님만.
-- 파일 경로 = {store_id}/{파일}

create table if not exists public.store_docs (
  id         uuid primary key default gen_random_uuid(),
  store_id   uuid not null references public.stores(id) on delete cascade,
  title      text not null,
  file_path  text not null,
  file_name  text,
  created_at timestamptz not null default now()
);
create index if not exists store_docs_store_idx on public.store_docs (store_id);

alter table public.store_docs enable row level security;

-- 열람: 관리자(사장·점장)
create policy "sd_select_admin" on public.store_docs
  for select using (public.is_admin(store_id));
-- 등록: 사장님만
create policy "sd_insert_owner" on public.store_docs
  for insert with check (public.is_owner(store_id));
-- 삭제: 사장님만
create policy "sd_delete_owner" on public.store_docs
  for delete using (public.is_owner(store_id));

-- Storage 비공개 버킷
insert into storage.buckets (id, name, public)
values ('store-docs', 'store-docs', false)
on conflict (id) do nothing;

-- Storage 정책 (경로 = {store_id}/{파일})
drop policy if exists "sd_obj_insert_owner" on storage.objects;
create policy "sd_obj_insert_owner" on storage.objects
  for insert with check (
    bucket_id = 'store-docs'
    and public.is_owner((storage.foldername(name))[1]::uuid)
  );
drop policy if exists "sd_obj_select_admin" on storage.objects;
create policy "sd_obj_select_admin" on storage.objects
  for select using (
    bucket_id = 'store-docs'
    and public.is_admin((storage.foldername(name))[1]::uuid)
  );
drop policy if exists "sd_obj_delete_owner" on storage.objects;
create policy "sd_obj_delete_owner" on storage.objects
  for delete using (
    bucket_id = 'store-docs'
    and public.is_owner((storage.foldername(name))[1]::uuid)
  );
