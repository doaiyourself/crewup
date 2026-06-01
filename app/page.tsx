"use client";

import { useEffect, useState } from "react";
import {
  MOCK_EMPLOYEES,
  ROLE_LABEL,
  STORE_NAME,
  type Employee,
} from "@/lib/mock-data";

function nowHHMM(): string {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function todayLabel(): string {
  const d = new Date();
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`;
}

function Avatar({ name, color }: { name: string; color: string }) {
  return (
    <div
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-base font-bold text-white"
      style={{ backgroundColor: color }}
    >
      {name.charAt(0)}
    </div>
  );
}

function StatusBadge({ status }: { status: Employee["status"] }) {
  const map = {
    off: { label: "근무 전", cls: "bg-slate-100 text-slate-500" },
    working: { label: "근무 중", cls: "bg-green-100 text-green-700" },
    done: { label: "퇴근", cls: "bg-slate-200 text-slate-600" },
  } as const;
  const s = map[status];
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.cls}`}>
      {s.label}
    </span>
  );
}

export default function Home() {
  const [employees, setEmployees] = useState<Employee[]>(MOCK_EMPLOYEES);
  const [today, setToday] = useState("");

  useEffect(() => {
    setToday(todayLabel());
  }, []);

  const handleClockIn = (id: string) => {
    setEmployees((prev) =>
      prev.map((e) =>
        e.id === id
          ? { ...e, status: "working", clockInAt: nowHHMM(), clockOutAt: null }
          : e
      )
    );
  };

  const handleClockOut = (id: string) => {
    setEmployees((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, status: "done", clockOutAt: nowHHMM() } : e
      )
    );
  };

  const workingCount = employees.filter((e) => e.status === "working").length;
  const doneCount = employees.filter((e) => e.status === "done").length;

  return (
    <main className="mx-auto min-h-screen max-w-md bg-slate-100 pb-10">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 bg-brand px-5 pb-5 pt-6 text-white shadow-md">
        <p className="text-xs font-medium text-blue-100">{STORE_NAME}</p>
        <div className="mt-0.5 flex items-baseline gap-2">
          <h1 className="text-xl font-bold">출퇴근 관리</h1>
          <span className="text-sm font-medium text-blue-100">{today}</span>
        </div>
        <div className="mt-4 flex gap-3">
          <div className="flex-1 rounded-xl bg-white/15 px-3 py-2.5 backdrop-blur">
            <p className="text-xs text-blue-100">근무 중</p>
            <p className="text-lg font-bold">
              {workingCount}
              <span className="text-sm font-normal text-blue-100"> 명</span>
            </p>
          </div>
          <div className="flex-1 rounded-xl bg-white/15 px-3 py-2.5 backdrop-blur">
            <p className="text-xs text-blue-100">퇴근</p>
            <p className="text-lg font-bold">
              {doneCount}
              <span className="text-sm font-normal text-blue-100"> 명</span>
            </p>
          </div>
          <div className="flex-1 rounded-xl bg-white/15 px-3 py-2.5 backdrop-blur">
            <p className="text-xs text-blue-100">전체</p>
            <p className="text-lg font-bold">
              {employees.length}
              <span className="text-sm font-normal text-blue-100"> 명</span>
            </p>
          </div>
        </div>
      </header>

      {/* 직원 목록 */}
      <section className="space-y-2.5 px-4 pt-4">
        {employees.map((e) => (
          <div
            key={e.id}
            className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100"
          >
            <div className="flex items-center gap-3">
              <Avatar name={e.name} color={e.avatarColor} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-semibold text-slate-900">
                    {e.name}
                  </p>
                  <StatusBadge status={e.status} />
                </div>
                <p className="mt-0.5 text-xs text-slate-500">
                  {ROLE_LABEL[e.role]} · {e.position} ·{" "}
                  {e.hourlyWage.toLocaleString()}원/h
                </p>
              </div>
            </div>

            {/* 시간 표시 */}
            {(e.clockInAt || e.clockOutAt) && (
              <div className="mt-3 flex gap-4 rounded-xl bg-slate-50 px-3 py-2 text-xs">
                <span className="text-slate-500">
                  출근{" "}
                  <b className="text-slate-800">{e.clockInAt ?? "--:--"}</b>
                </span>
                <span className="text-slate-500">
                  퇴근{" "}
                  <b className="text-slate-800">{e.clockOutAt ?? "--:--"}</b>
                </span>
              </div>
            )}

            {/* 출퇴근 버튼 */}
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => handleClockIn(e.id)}
                disabled={e.status === "working"}
                className="flex-1 rounded-xl bg-brand py-2.5 text-sm font-semibold text-white transition active:scale-[0.98] disabled:bg-slate-200 disabled:text-slate-400"
              >
                출근
              </button>
              <button
                onClick={() => handleClockOut(e.id)}
                disabled={e.status !== "working"}
                className="flex-1 rounded-xl border border-slate-300 bg-white py-2.5 text-sm font-semibold text-slate-700 transition active:scale-[0.98] disabled:border-slate-200 disabled:text-slate-300"
              >
                퇴근
              </button>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
