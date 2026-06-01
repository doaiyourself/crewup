"use client";

// 본인 출퇴근 상태(오늘) — 목업용 localStorage 훅.
// 추후 Supabase Attendance 테이블 + Realtime으로 교체. (PRD §4.1)

import { useCallback, useEffect, useState } from "react";
import { nowHHMM } from "./format";
import type { WorkStatus } from "./mock-data";

export interface MyAttendance {
  status: WorkStatus;
  clockInAt: string | null;
  clockOutAt: string | null;
}

const empty: MyAttendance = {
  status: "off",
  clockInAt: null,
  clockOutAt: null,
};

const key = (id: string) => `crewup.att.${id}`;

export function useMyAttendance(employeeId: string | null) {
  const [att, setAtt] = useState<MyAttendance>(empty);

  useEffect(() => {
    if (!employeeId) return;
    try {
      const raw = localStorage.getItem(key(employeeId));
      if (raw) setAtt(JSON.parse(raw));
      else setAtt(empty);
    } catch {
      setAtt(empty);
    }
  }, [employeeId]);

  const persist = useCallback(
    (next: MyAttendance) => {
      setAtt(next);
      if (!employeeId) return;
      try {
        localStorage.setItem(key(employeeId), JSON.stringify(next));
      } catch {
        // ignore
      }
    },
    [employeeId]
  );

  const clockIn = useCallback(
    () =>
      persist({ status: "working", clockInAt: nowHHMM(), clockOutAt: null }),
    [persist]
  );

  const clockOut = useCallback(
    () =>
      setAtt((prev) => {
        const next: MyAttendance = {
          ...prev,
          status: "done",
          clockOutAt: nowHHMM(),
        };
        if (employeeId) {
          try {
            localStorage.setItem(key(employeeId), JSON.stringify(next));
          } catch {
            // ignore
          }
        }
        return next;
      }),
    [employeeId]
  );

  return { att, clockIn, clockOut };
}
