"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/client";
import { PageHeader, Card } from "@/components/ui";

type View = "stock" | "orders";

interface Item {
  id: string;
  name: string;
  category: string;
  unit: string | null;
  current_qty: number;
  min_qty: number;
  note: string | null;
  updated_at: string;
}
interface Order {
  id: string;
  item_id: string | null;
  item_name: string;
  qty: number;
  status: string; // ordered | received
  note: string | null;
  ordered_at: string;
  received_at: string | null;
}

const CATEGORIES = ["원두", "소스", "부자재", "기타"];
const CAT_STYLE: Record<string, string> = {
  원두: "bg-amber-100 text-amber-700",
  소스: "bg-rose-100 text-rose-700",
  부자재: "bg-sky-100 text-sky-700",
  기타: "bg-slate-100 text-slate-500",
};

const fmt = (n: number) => n.toLocaleString("ko-KR");
const hhmm = (iso: string) => {
  const d = new Date(iso);
  return `${d.getMonth() + 1}.${d.getDate()} ${String(d.getHours()).padStart(
    2,
    "0"
  )}:${String(d.getMinutes()).padStart(2, "0")}`;
};

export default function InventoryPage() {
  const { account, currentStoreId } = useSession();
  const isOwner = account?.role === "owner";
  const storeId = currentStoreId ?? "";
  const isReal = !!storeId && storeId !== "demo-store";

  const [view, setView] = useState<View>("stock");
  const [filter, setFilter] = useState<string>("전체");
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Item[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // 품목 추가/수정 팝업
  const [editing, setEditing] = useState<Item | "new" | null>(null);
  // 발주 팝업
  const [ordering, setOrdering] = useState<Item | null>(null);

  const load = useCallback(async () => {
    if (!isReal) {
      setLoading(false);
      return;
    }
    const supabase = createClient();
    const [iRes, oRes] = await Promise.all([
      supabase
        .from("inventory_items")
        .select("id, name, category, unit, current_qty, min_qty, note, updated_at")
        .eq("store_id", storeId)
        .order("category")
        .order("name"),
      supabase
        .from("inventory_orders")
        .select(
          "id, item_id, item_name, qty, status, note, ordered_at, received_at"
        )
        .eq("store_id", storeId)
        .order("ordered_at", { ascending: false }),
    ]);
    setItems((iRes.data as Item[]) ?? []);
    setOrders((oRes.data as Order[]) ?? []);
    setLoading(false);
  }, [isReal, storeId]);

  useEffect(() => {
    load();
  }, [load]);

  // 발주중(미입고) 품목 id
  const orderingIds = useMemo(
    () =>
      new Set(
        orders.filter((o) => o.status === "ordered" && o.item_id).map((o) => o.item_id!)
      ),
    [orders]
  );

  const lowCount = items.filter((i) => i.current_qty < i.min_qty).length;
  const pendingOrders = orders.filter((o) => o.status === "ordered").length;

  const shown = items.filter((i) => filter === "전체" || i.category === filter);

  // 현재고 ±조정 (점장·사장)
  const adjust = async (item: Item, delta: number) => {
    const next = Math.max(0, item.current_qty + delta);
    setItems((prev) =>
      prev.map((x) => (x.id === item.id ? { ...x, current_qty: next } : x))
    );
    const supabase = createClient();
    const { error } = await supabase
      .from("inventory_items")
      .update({ current_qty: next })
      .eq("id", item.id);
    if (error) load();
  };

  // 발주 입고완료 (사장) → 현재고에 발주수량 반영
  const receive = async (o: Order) => {
    if (!confirm(`'${o.item_name}' ${fmt(o.qty)} 입고 완료 처리할까요?`)) return;
    const supabase = createClient();
    await supabase
      .from("inventory_orders")
      .update({ status: "received", received_at: new Date().toISOString() })
      .eq("id", o.id);
    if (o.item_id) {
      const it = items.find((x) => x.id === o.item_id);
      if (it) {
        await supabase
          .from("inventory_items")
          .update({ current_qty: it.current_qty + o.qty })
          .eq("id", it.id);
      }
    }
    load();
  };

  return (
    <>
      <PageHeader title="재고 관리" subtitle="사장·점장 전용" />

      <div className="px-4 pt-2">
        {/* 요약 */}
        <div className="grid grid-cols-3 gap-2">
          <Card className="!p-3 text-center">
            <p className="text-xs text-slate-400">전체 품목</p>
            <p className="mt-0.5 text-lg font-extrabold text-slate-900">
              {items.length}
            </p>
          </Card>
          <Card className="!p-3 text-center">
            <p className="text-xs text-slate-400">부족</p>
            <p
              className={`mt-0.5 text-lg font-extrabold ${
                lowCount ? "text-red-500" : "text-slate-900"
              }`}
            >
              {lowCount}
            </p>
          </Card>
          <Card className="!p-3 text-center">
            <p className="text-xs text-slate-400">발주중</p>
            <p className="mt-0.5 text-lg font-extrabold text-slate-900">
              {pendingOrders}
            </p>
          </Card>
        </div>

        {/* 뷰 토글 */}
        <div className="mt-3 flex rounded-xl bg-slate-200/60 p-1 text-sm font-semibold">
          {(
            [
              ["stock", "재고 현황"],
              ["orders", "발주 내역"],
            ] as [View, string][]
          ).map(([v, label]) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`flex-1 rounded-lg py-1.5 transition ${
                view === v ? "bg-white text-brand shadow-sm" : "text-slate-500"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {!isReal ? (
          <Card className="mt-3 py-8 text-center text-sm text-slate-400">
            매장에 합류하면 재고를 관리할 수 있어요.
          </Card>
        ) : loading ? (
          <Card className="mt-3 py-8 text-center text-sm text-slate-400">
            불러오는 중…
          </Card>
        ) : view === "stock" ? (
          <>
            {/* 카테고리 필터 */}
            <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {["전체", ...CATEGORIES].map((c) => (
                <button
                  key={c}
                  onClick={() => setFilter(c)}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                    filter === c
                      ? "bg-brand text-white"
                      : "bg-white text-slate-500 ring-1 ring-slate-200"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            <div className="mt-3 space-y-2">
              {shown.length === 0 ? (
                <Card className="py-8 text-center text-sm text-slate-400">
                  등록된 품목이 없어요. 아래에서 품목을 추가하세요.
                </Card>
              ) : (
                shown.map((it) => {
                  const low = it.current_qty < it.min_qty;
                  const onOrder = orderingIds.has(it.id);
                  return (
                    <Card key={it.id} className="!p-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditing(it)}
                          className="min-w-0 flex-1 text-left"
                        >
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                CAT_STYLE[it.category] ?? CAT_STYLE["기타"]
                              }`}
                            >
                              {it.category}
                            </span>
                            <p className="truncate font-semibold text-slate-900">
                              {it.name}
                            </p>
                            {low && (
                              <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-600">
                                부족
                              </span>
                            )}
                            {onOrder && (
                              <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-brand">
                                발주중
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-[11px] text-slate-400">
                            적정 {fmt(it.min_qty)}
                            {it.unit ? ` ${it.unit}` : ""} · {hhmm(it.updated_at)}{" "}
                            업데이트
                          </p>
                        </button>

                        {/* 현재고 스테퍼 */}
                        <div className="flex shrink-0 items-center gap-1.5 rounded-xl bg-slate-100 px-1.5 py-1">
                          <button
                            onClick={() => adjust(it, -1)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-lg font-bold text-slate-500 active:bg-slate-50"
                            aria-label="감소"
                          >
                            −
                          </button>
                          <span
                            className={`min-w-[2.2rem] text-center text-base font-extrabold ${
                              low ? "text-red-500" : "text-slate-900"
                            }`}
                          >
                            {fmt(it.current_qty)}
                          </span>
                          <button
                            onClick={() => adjust(it, 1)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-lg font-bold text-slate-500 active:bg-slate-50"
                            aria-label="증가"
                          >
                            ＋
                          </button>
                        </div>
                      </div>

                      {/* 발주 버튼 — 사장만 */}
                      {isOwner && !onOrder && (
                        <button
                          onClick={() => setOrdering(it)}
                          className={`mt-2 w-full rounded-lg py-2 text-sm font-bold transition active:scale-[0.99] ${
                            low
                              ? "bg-brand text-white"
                              : "bg-blue-50 text-brand ring-1 ring-blue-100"
                          }`}
                        >
                          발주 넣기
                        </button>
                      )}
                    </Card>
                  );
                })
              )}
            </div>

            <button
              onClick={() => setEditing("new")}
              className="mt-3 w-full rounded-xl border border-dashed border-brand/40 bg-blue-50/40 py-2.5 text-sm font-semibold text-brand transition active:scale-[0.98]"
            >
              ＋ 품목 추가
            </button>
          </>
        ) : (
          /* 발주 내역 */
          <div className="mt-3 space-y-2">
            {orders.length === 0 ? (
              <Card className="py-8 text-center text-sm text-slate-400">
                발주 내역이 없어요.
              </Card>
            ) : (
              orders.map((o) => (
                <Card key={o.id} className="!p-3">
                  <div className="flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate font-semibold text-slate-900">
                          {o.item_name}
                        </p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            o.status === "received"
                              ? "bg-green-100 text-green-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {o.status === "received" ? "입고완료" : "발주중"}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        {fmt(o.qty)} · {hhmm(o.ordered_at)} 발주
                        {o.note ? ` · ${o.note}` : ""}
                      </p>
                    </div>
                    {isOwner && o.status === "ordered" && (
                      <button
                        onClick={() => receive(o)}
                        className="shrink-0 rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white"
                      >
                        입고완료
                      </button>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </div>

      {editing && (
        <ItemEditor
          storeId={storeId}
          item={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
      {ordering && (
        <OrderDialog
          storeId={storeId}
          item={ordering}
          onClose={() => setOrdering(null)}
          onSaved={() => {
            setOrdering(null);
            load();
          }}
        />
      )}
    </>
  );
}

// ── 품목 추가/수정 ──────────────────────────────────────────
function ItemEditor({
  storeId,
  item,
  onClose,
  onSaved,
}: {
  storeId: string;
  item: Item | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(item?.name ?? "");
  const [category, setCategory] = useState(item?.category ?? "원두");
  const [unit, setUnit] = useState(item?.unit ?? "");
  const [current, setCurrent] = useState(String(item?.current_qty ?? 0));
  const [min, setMin] = useState(String(item?.min_qty ?? 0));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    setError("");
    if (!name.trim()) {
      setError("품목 이름을 입력하세요.");
      return;
    }
    setBusy(true);
    const supabase = createClient();
    const payload = {
      store_id: storeId,
      name: name.trim(),
      category,
      unit: unit.trim() || null,
      current_qty: Number(current) || 0,
      min_qty: Number(min) || 0,
    };
    const { error: e } = item
      ? await supabase.from("inventory_items").update(payload).eq("id", item.id)
      : await supabase.from("inventory_items").insert(payload);
    setBusy(false);
    if (e) {
      setError("저장에 실패했어요. 권한을 확인해 주세요.");
      return;
    }
    onSaved();
  };

  const remove = async () => {
    if (!item) return;
    if (!confirm(`'${item.name}' 품목을 삭제할까요?`)) return;
    const supabase = createClient();
    await supabase.from("inventory_items").delete().eq("id", item.id);
    onSaved();
  };

  const field =
    "w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-5">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
        <p className="text-base font-bold text-slate-900">
          {item ? "품목 수정" : "품목 추가"}
        </p>

        <label className="mt-4 block">
          <span className="mb-1 block text-[11px] font-semibold text-slate-500">
            품목 이름 <span className="text-red-400">*</span>
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 에티오피아 원두, 카라멜 시럽"
            className={field}
          />
        </label>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold text-slate-500">
              분류
            </span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={`${field} bg-white`}
            >
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold text-slate-500">
              단위
            </span>
            <input
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="kg, 개, 병"
              className={field}
            />
          </label>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold text-slate-500">
              현재 재고
            </span>
            <input
              type="number"
              inputMode="decimal"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              className={field}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold text-slate-500">
              적정 재고(발주 기준)
            </span>
            <input
              type="number"
              inputMode="decimal"
              value={min}
              onChange={(e) => setMin(e.target.value)}
              className={field}
            />
          </label>
        </div>

        {error && (
          <p className="mt-2 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-500">
            {error}
          </p>
        )}

        <div className="mt-4 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-slate-500"
          >
            취소
          </button>
          <button
            onClick={save}
            disabled={busy}
            className="flex-1 rounded-lg bg-brand py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy ? "저장 중…" : "저장"}
          </button>
        </div>
        {item && (
          <button
            onClick={remove}
            className="mt-2 w-full py-1.5 text-xs font-semibold text-red-400"
          >
            품목 삭제
          </button>
        )}
      </div>
    </div>
  );
}

// ── 발주 (사장) ─────────────────────────────────────────────
function OrderDialog({
  storeId,
  item,
  onClose,
  onSaved,
}: {
  storeId: string;
  item: Item;
  onClose: () => void;
  onSaved: () => void;
}) {
  const suggested = Math.max(item.min_qty - item.current_qty, 1);
  const [qty, setQty] = useState(String(suggested));
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");
    const q = Number(qty);
    if (!q || q <= 0) {
      setError("발주 수량을 입력하세요.");
      return;
    }
    setBusy(true);
    const supabase = createClient();
    const { error: e } = await supabase.from("inventory_orders").insert({
      store_id: storeId,
      item_id: item.id,
      item_name: item.name,
      qty: q,
      note: note.trim() || null,
    });
    setBusy(false);
    if (e) {
      setError("발주에 실패했어요. 사장님만 발주할 수 있어요.");
      return;
    }
    onSaved();
  };

  const field =
    "w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-5">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
        <p className="text-base font-bold text-slate-900">발주 넣기</p>
        <p className="mt-0.5 text-xs text-slate-400">
          {item.category} · {item.name} (현재 {fmt(item.current_qty)}
          {item.unit ? ` ${item.unit}` : ""})
        </p>

        <label className="mt-4 block">
          <span className="mb-1 block text-[11px] font-semibold text-slate-500">
            발주 수량 <span className="text-red-400">*</span>
          </span>
          <input
            type="number"
            inputMode="decimal"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            className={field}
          />
        </label>
        <label className="mt-3 block">
          <span className="mb-1 block text-[11px] font-semibold text-slate-500">
            메모
          </span>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="거래처·요청사항 등 (선택)"
            className={field}
          />
        </label>

        {error && (
          <p className="mt-2 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-500">
            {error}
          </p>
        )}

        <div className="mt-4 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-slate-500"
          >
            취소
          </button>
          <button
            onClick={submit}
            disabled={busy}
            className="flex-1 rounded-lg bg-brand py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy ? "발주 중…" : "발주하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
