-- Crew Up 0012 — 재고 관리 (원두·소스·부자재 등)
-- 흐름: 점장이 재고를 입력하면 → 사장이 확인하고 발주.
-- 접근: 사장·점장(is_admin)만 열람.  품목/재고 입력 = 사장·점장.  발주 = 사장(is_owner)만.

-- =========================================================
-- 1) 품목 + 현재 재고
-- =========================================================
create table if not exists public.inventory_items (
  id          uuid primary key default gen_random_uuid(),
  store_id    uuid not null references public.stores(id) on delete cascade,
  name        text not null,
  category    text not null default '기타',   -- 원두 / 소스 / 부자재 / 기타
  unit        text,                            -- 단위 (kg, 개, 병 …)
  current_qty numeric not null default 0,      -- 현재 재고 (점장 입력)
  min_qty     numeric not null default 0,      -- 적정 재고(발주 기준선) — current < min ⇒ 부족
  note        text,
  updated_by  uuid,
  updated_at  timestamptz not null default now(),
  created_at  timestamptz not null default now()
);
create index if not exists inventory_items_store_idx on public.inventory_items (store_id);

-- =========================================================
-- 2) 발주 기록 (사장만 생성/입고처리)
-- =========================================================
create table if not exists public.inventory_orders (
  id          uuid primary key default gen_random_uuid(),
  store_id    uuid not null references public.stores(id) on delete cascade,
  item_id     uuid references public.inventory_items(id) on delete set null,
  item_name   text not null,                   -- 스냅샷 (품목 삭제돼도 내역 유지)
  qty         numeric not null,
  status      text not null default 'ordered', -- ordered / received
  note        text,
  ordered_by  uuid,
  ordered_at  timestamptz not null default now(),
  received_at timestamptz
);
create index if not exists inventory_orders_store_idx on public.inventory_orders (store_id, ordered_at desc);

-- =========================================================
-- 3) 감사 스탬프 — updated_at/updated_by 자동 기록
-- =========================================================
create or replace function public.stamp_inventory_item()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  new.updated_at := now();
  if coalesce(auth.role(), '') <> 'service_role' then
    new.updated_by := auth.uid();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_stamp_inventory_item on public.inventory_items;
create trigger trg_stamp_inventory_item
  before insert or update on public.inventory_items
  for each row execute function public.stamp_inventory_item();

-- =========================================================
-- 4) RLS
-- =========================================================
alter table public.inventory_items  enable row level security;
alter table public.inventory_orders enable row level security;

-- 품목/재고: 사장·점장 모두 열람·관리
create policy "inv_items_admin_all" on public.inventory_items
  for all using (public.is_admin(store_id)) with check (public.is_admin(store_id));

-- 발주: 열람은 사장·점장, 생성/수정/삭제는 사장만
create policy "inv_orders_select_admin" on public.inventory_orders
  for select using (public.is_admin(store_id));
create policy "inv_orders_insert_owner" on public.inventory_orders
  for insert with check (public.is_owner(store_id));
create policy "inv_orders_update_owner" on public.inventory_orders
  for update using (public.is_owner(store_id)) with check (public.is_owner(store_id));
create policy "inv_orders_delete_owner" on public.inventory_orders
  for delete using (public.is_owner(store_id));
