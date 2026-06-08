"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/client";
import { ROLE_LABEL, type Role } from "@/lib/mock-data";
import { Avatar } from "@/components/ui";
import { PinPad } from "@/components/pin-pad";

interface BoardMember {
  user_id: string;
  name: string;
  avatar_color: string;
  role: Role;
  position: string | null;
  clock_in_at: string | null;
  clock_out_at: string | null;
}

interface Task {
  id: string;
  title: string;
  done: boolean;
}

function hhmm(iso: string | null): string {
  if (!iso) return "--:--";
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}`;
}

function todayStr(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export default function KioskPage() {
  const { currentStoreId, currentMembership } = useSession();
  const router = useRouter();
  const [board, setBoard] = useState<BoardMember[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [now, setNow] = useState<Date | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [exitOpen, setExitOpen] = useState(false);
  const [pinError, setPinError] = useState("");

  // 실시간 시계
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const load = useCallback(async () => {
    if (!currentStoreId || currentStoreId === "demo-store") return;
    const supabase = createClient();
    const [{ data: b }, { data: t }] = await Promise.all([
      supabase.rpc("kiosk_board", { p_store_id: currentStoreId }),
      supabase
        .from("tasks")
        .select("id, title, done")
        .eq("store_id", currentStoreId)
        .eq("work_date", todayStr())
        .order("created_at"),
    ]);
    setBoard((b as BoardMember[]) ?? []);
    setTasks((t as Task[]) ?? []);
  }, [currentStoreId]);

  useEffect(() => {
    load();
    const t = setInterval(load, 20000); // 20초마다 새로고침
    return () => clearInterval(t);
  }, [load]);

  const clock = async (userId: string, action: "in" | "out") => {
    if (!currentStoreId) return;
    setBusy(userId + action);
    const supabase = createClient();
    await supabase.rpc("kiosk_clock", {
      p_store_id: currentStoreId,
      p_user_id: userId,
      p_action: action,
    });
    await load();
    setBusy(null);
  };

  const toggleTask = async (task: Task) => {
    const supabase = createClient();
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, done: !t.done } : t))
    );
    await supabase
      .from("tasks")
      .update({ done: !task.done })
      .eq("id", task.id);
  };

  const handleExit = async (pin: string) => {
    if (!currentStoreId) return;
    const supabase = createClient();
    const { data } = await supabase.rpc("verify_kiosk_pin", {
      p_store_id: currentStoreId,
      p_pin: pin,
    });
    if (data === true) {
      router.replace("/admin");
    } else {
      setPinError("PIN이 올바르지 않습니다.");
    }
  };

  const statusOf = (m: BoardMember) =>
    m.clock_out_at ? "done" : m.clock_in_at ? "working" : "off";

  const workingCount = board.filter((m) => statusOf(m) === "working").length;
  const doneTasks = tasks.filter((t) => t.done).length;

  return (
    <main className="min-h-screen bg-slate-100">
      {/* 상단 바 */}
      <header className="bg-brand px-6 py-4 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-100">
              {currentMembership?.storeName ?? "매장"} · 근무 현황판
            </p>
            <p className="text-2xl font-extrabold tabular-nums">
              {now
                ? `${now.getHours().toString().padStart(2, "0")}:${now
                    .getMinutes()
                    .toString()
                    .padStart(2, "0")}`
                : "--:--"}
              <span className="ml-2 text-sm font-normal text-blue-100">
                {now
                  ? `${now.getMonth() + 1}월 ${now.getDate()}일 (${
                      ["일", "월", "화", "수", "목", "금", "토"][now.getDay()]
                    })`
                  : ""}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/15 px-4 py-2 text-center backdrop-blur">
              <p className="text-xs text-blue-100">근무 중</p>
              <p className="text-xl font-bold">{workingCount}명</p>
            </div>
            <button
              onClick={() => {
                setPinError("");
                setExitOpen(true);
              }}
              className="rounded-xl bg-white/15 px-4 py-2.5 text-sm font-semibold backdrop-blur transition active:scale-95"
            >
              🔒 나가기
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-5 p-5 lg:grid-cols-[320px_1fr]">
        {/* 오늘의 할일 */}
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-crew-dark">오늘의 할일</h2>
            <span className="text-sm font-semibold text-slate-400">
              {doneTasks}/{tasks.length}
            </span>
          </div>
          <div className="mt-3 space-y-2">
            {tasks.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">
                등록된 할일이 없어요.
              </p>
            ) : (
              tasks.map((t) => (
                <button
                  key={t.id}
                  onClick={() => toggleTask(t)}
                  className="flex w-full items-center gap-3 rounded-xl border border-slate-100 p-3 text-left transition active:scale-[0.99]"
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-sm ${
                      t.done
                        ? "bg-brand text-white"
                        : "border-2 border-slate-300"
                    }`}
                  >
                    {t.done ? "✓" : ""}
                  </span>
                  <span
                    className={`text-sm ${
                      t.done
                        ? "text-slate-400 line-through"
                        : "font-medium text-slate-700"
                    }`}
                  >
                    {t.title}
                  </span>
                </button>
              ))
            )}
          </div>
        </section>

        {/* 직원/알바 출퇴근 */}
        <section>
          <h2 className="mb-3 px-1 text-lg font-bold text-crew-dark">
            직원 출퇴근
          </h2>
          {board.length === 0 ? (
            <div className="rounded-2xl bg-white p-10 text-center text-sm text-slate-400 shadow-sm ring-1 ring-slate-100">
              합류한 직원이 없어요. 관리자 화면에서 초대하세요.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {board.map((m) => {
                const status = statusOf(m);
                return (
                  <div
                    key={m.user_id}
                    className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar name={m.name} color={m.avatar_color} size={48} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-base font-bold text-slate-900">
                            {m.name}
                          </p>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                              status === "working"
                                ? "bg-green-100 text-green-700"
                                : status === "done"
                                ? "bg-slate-200 text-slate-600"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {status === "working"
                              ? "근무 중"
                              : status === "done"
                              ? "퇴근"
                              : "근무 전"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          {ROLE_LABEL[m.role]}
                          {m.position ? ` · ${m.position}` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex gap-4 rounded-xl bg-slate-50 px-3 py-2 text-xs">
                      <span className="text-slate-500">
                        출근{" "}
                        <b className="text-slate-800">{hhmm(m.clock_in_at)}</b>
                      </span>
                      <span className="text-slate-500">
                        퇴근{" "}
                        <b className="text-slate-800">{hhmm(m.clock_out_at)}</b>
                      </span>
                    </div>

                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => clock(m.user_id, "in")}
                        disabled={status !== "off" || busy === m.user_id + "in"}
                        className="flex-1 rounded-xl bg-brand py-3 text-base font-bold text-white transition active:scale-[0.98] disabled:bg-slate-200 disabled:text-slate-400"
                      >
                        출근
                      </button>
                      <button
                        onClick={() => clock(m.user_id, "out")}
                        disabled={
                          status !== "working" || busy === m.user_id + "out"
                        }
                        className="flex-1 rounded-xl border border-slate-300 bg-white py-3 text-base font-bold text-slate-700 transition active:scale-[0.98] disabled:border-slate-200 disabled:text-slate-300"
                      >
                        퇴근
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {exitOpen && (
        <PinPad
          title="키오스크 종료"
          subtitle="관리자 PIN을 입력하세요"
          error={pinError}
          onSubmit={handleExit}
          onCancel={() => setExitOpen(false)}
        />
      )}
    </main>
  );
}
