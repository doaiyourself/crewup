"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui";

interface Task {
  id: string;
  title: string;
  done: boolean;
}

function todayStr(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// 관리자 대시보드용 "오늘의 할일" 관리 (추가/삭제/체크). 키오스크에 그대로 표시됨.
export function TodayTasks() {
  const { currentStoreId } = useSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const isReal = !!currentStoreId && currentStoreId !== "demo-store";

  const load = useCallback(async () => {
    if (!isReal) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("tasks")
      .select("id, title, done")
      .eq("store_id", currentStoreId)
      .eq("work_date", todayStr())
      .order("created_at");
    setTasks((data as Task[]) ?? []);
  }, [currentStoreId, isReal]);

  useEffect(() => {
    load();
  }, [load]);

  const add = async () => {
    if (!title.trim() || !isReal) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("tasks")
      .insert({
        store_id: currentStoreId,
        title: title.trim(),
        work_date: todayStr(),
      })
      .select("id, title, done")
      .single();
    if (data) setTasks((prev) => [...prev, data as Task]);
    setTitle("");
  };

  const remove = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    const supabase = createClient();
    await supabase.from("tasks").delete().eq("id", id);
  };

  return (
    <Card>
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-slate-700">오늘의 할일</p>
        <span className="text-xs text-slate-400">
          키오스크 화면에 표시돼요
        </span>
      </div>

      <div className="mt-3 flex gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="예: 오픈 청소, 재료 발주"
          className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
        />
        <button
          onClick={add}
          className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition active:scale-95"
        >
          추가
        </button>
      </div>

      <div className="mt-3 space-y-1.5">
        {tasks.length === 0 ? (
          <p className="py-4 text-center text-xs text-slate-400">
            오늘 등록된 할일이 없어요.
          </p>
        ) : (
          tasks.map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2"
            >
              <span
                className={`text-sm ${
                  t.done ? "text-slate-400 line-through" : "text-slate-700"
                }`}
              >
                {t.done ? "✓ " : ""}
                {t.title}
              </span>
              <button
                onClick={() => remove(t.id)}
                className="ml-auto text-xs text-slate-400 hover:text-red-500"
              >
                삭제
              </button>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
