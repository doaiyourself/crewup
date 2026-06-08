"use client";

// 키오스크 (공개 + 기기 토큰).
// 토큰은 URL(?token=)로 한 번 들어오면 localStorage에 저장 → 기기에 "연결"된다.
// 관리자 세션이 전혀 없으므로, 나가거나 닫아도 관리자 정보가 노출되지 않는다.

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ROLE_LABEL, type Role } from "@/lib/mock-data";
import { Avatar } from "@/components/ui";
import { LogoMark } from "@/components/logo";
import { PinPad } from "@/components/pin-pad";

const TOKEN_KEY = "crewup.kioskToken";

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

export default function KioskPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-100">
          <div className="animate-pulse text-sm text-slate-400">불러오는 중…</div>
        </main>
      }
    >
      <KioskInner />
    </Suspense>
  );
}

function KioskInner() {
  const params = useSearchParams();
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [storeName, setStoreName] = useState("매장");
  const [board, setBoard] = useState<BoardMember[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [now, setNow] = useState<Date | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [exitOpen, setExitOpen] = useState(false);
  const [pinError, setPinError] = useState("");

  // 토큰 확보: URL 우선 → localStorage. URL 토큰은 저장 후 주소창에서 제거.
  useEffect(() => {
    const urlToken = params.get("token");
    let t = urlToken;
    try {
      if (urlToken) {
        localStorage.setItem(TOKEN_KEY, urlToken);
        window.history.replaceState({}, "", "/kiosk");
      } else {
        t = localStorage.getItem(TOKEN_KEY);
      }
    } catch {
      /* ignore */
    }
    setToken(t);
    setReady(true);
  }, [params]);

  // 시계
  useEffect(() => {
    setNow(new Date());
    const i = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(i);
  }, []);

  const load = useCallback(async () => {
    if (!token) return;
    const res = await fetch("/api/kiosk/board", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    if (res.status === 401) {
      setInvalid(true);
      return;
    }
    const data = await res.json();
    if (data.ok) {
      setStoreName(data.storeName);
      setBoard(data.members);
      setTasks(data.tasks);
      setInvalid(false);
    }
  }, [token]);

  useEffect(() => {
    if (!ready || !token) return;
    load();
    const i = setInterval(load, 20000);
    return () => clearInterval(i);
  }, [ready, token, load]);

  const clock = async (userId: string, action: "in" | "out") => {
    if (!token) return;
    setBusy(userId + action);
    await fetch("/api/kiosk/clock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, userId, action }),
    });
    await load();
    setBusy(null);
  };

  const toggleTask = async (task: Task) => {
    if (!token) return;
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, done: !t.done } : t))
    );
    await fetch("/api/kiosk/task", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, taskId: task.id, done: !task.done }),
    });
  };

  const handleUnlink = async (pin: string) => {
    if (!token) return;
    const res = await fetch("/api/kiosk/verify-pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, pin }),
    });
    const data = await res.json();
    if (data.ok) {
      try {
        localStorage.removeItem(TOKEN_KEY);
      } catch {
        /* ignore */
      }
      setToken(null);
      setExitOpen(false);
    } else {
      setPinError("PIN이 올바르지 않습니다.");
    }
  };

  // --- 미연결 / 무효 토큰 화면 ---
  if (ready && (!token || invalid)) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-slate-100 px-6 text-center">
        <LogoMark size={64} variant="icon" />
        <h1 className="mt-5 text-xl font-extrabold text-crew-dark">
          {invalid ? "연결이 해제된 기기예요" : "키오스크 기기 미연결"}
        </h1>
        <p className="mt-2 max-w-xs text-sm text-slate-500">
          관리자 화면의 <b>설정 → 매장 대시보드</b>에서 기기 연결 링크를 만들어
          이 기기에서 한 번 열어주세요.
        </p>
      </main>
    );
  }

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="animate-pulse text-sm text-slate-400">불러오는 중…</div>
      </main>
    );
  }

  const statusOf = (m: BoardMember) =>
    m.clock_out_at ? "done" : m.clock_in_at ? "working" : "off";
  const workingCount = board.filter((m) => statusOf(m) === "working").length;
  const doneTasks = tasks.filter((t) => t.done).length;

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="bg-brand px-6 py-4 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-100">
              {storeName} · 근무 현황판
            </p>
            <p className="text-2xl font-extrabold tabular-nums">
              {now
                ? `${String(now.getHours()).padStart(2, "0")}:${String(
                    now.getMinutes()
                  ).padStart(2, "0")}`
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
              🔒 연결 해제
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
                      t.done ? "bg-brand text-white" : "border-2 border-slate-300"
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
                        출근 <b className="text-slate-800">{hhmm(m.clock_in_at)}</b>
                      </span>
                      <span className="text-slate-500">
                        퇴근 <b className="text-slate-800">{hhmm(m.clock_out_at)}</b>
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
          title="기기 연결 해제"
          subtitle="관리자 PIN을 입력하세요"
          error={pinError}
          onSubmit={handleUnlink}
          onCancel={() => setExitOpen(false)}
        />
      )}
    </main>
  );
}
