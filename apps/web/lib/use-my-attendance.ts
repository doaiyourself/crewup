"use client";

// 본인 출퇴근 — 실제 attendance 테이블 (키오스크와 동일 테이블).
// 매장의 검증 방식(GPS/QR)에 따라 /api/clock 에서 서버 검증.

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { createAttendanceService, type TodayAttendance } from "@crewup/core";

export interface DayRecord {
  date: string;
  clockIn: string | null;
  clockOut: string | null;
}
export interface MonthStats {
  workedDays: number;
  totalMinutes: number;
}
export type AttMethod = "none" | "gps" | "qr" | "both";

const emptyToday: TodayAttendance = {
  status: "off",
  clockInAt: null,
  clockOutAt: null,
};

function minutesBetween(inIso: string | null, outIso: string | null): number {
  if (!inIso || !outIso) return 0;
  return Math.max(0, Math.round((+new Date(outIso) - +new Date(inIso)) / 60000));
}

// 브라우저 현재 위치
function getPosition(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("NO_GEO"));
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => reject(new Error("GEO_DENIED")),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

export function useMyAttendance(storeId: string | null) {
  const [today, setToday] = useState<TodayAttendance>(emptyToday);
  const [history, setHistory] = useState<DayRecord[]>([]);
  const [method, setMethod] = useState<AttMethod>("none");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>("");

  const real = !!storeId && storeId !== "demo-store";
  const requiresQr = method === "qr" || method === "both";
  const requiresGps = method === "gps" || method === "both";

  const load = useCallback(async () => {
    if (!real) {
      setLoading(false);
      return;
    }
    const supabase = createClient();
    const svc = createAttendanceService(supabase as any);
    setToday(await svc.getToday(storeId as string));

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const [{ data: att }, { data: store }] = await Promise.all([
        supabase
          .from("attendance")
          .select("work_date, clock_in_at, clock_out_at")
          .eq("store_id", storeId)
          .eq("user_id", user.id)
          .order("work_date", { ascending: false })
          .limit(31),
        supabase
          .from("stores")
          .select("attendance_method")
          .eq("id", storeId)
          .maybeSingle(),
      ]);
      setHistory(
        (att ?? []).map((r: any) => ({
          date: r.work_date,
          clockIn: r.clock_in_at,
          clockOut: r.clock_out_at,
        }))
      );
      setMethod(((store?.attendance_method as AttMethod) ?? "none"));
    }
    setLoading(false);
  }, [storeId, real]);

  useEffect(() => {
    load();
  }, [load]);

  // 서버 검증 경유 출퇴근 (action: in/out)
  const punch = useCallback(
    async (action: "in" | "out") => {
      if (!real) return;
      setBusy(true);
      setError("");
      try {
        const payload: any = { storeId, action };
        if (requiresGps) {
          try {
            const pos = await getPosition();
            payload.lat = pos.lat;
            payload.lng = pos.lng;
          } catch {
            setError("위치 권한이 필요해요. 위치를 허용한 뒤 다시 시도하세요.");
            return;
          }
        }
        const res = await fetch("/api/clock", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!data.ok) {
          if (data.reason === "OUT_OF_RANGE")
            setError(`매장에서 약 ${data.distance}m 떨어져 있어요. 매장 근처에서 시도하세요.`);
          else if (data.reason === "NEEDS_QR")
            setError("QR 코드를 스캔해서 출퇴근하세요.");
          else if (data.reason === "NO_STORE_LOCATION")
            setError("매장 위치가 설정되지 않았어요. 사장님께 문의하세요.");
          else setError("출퇴근 처리에 실패했어요.");
          return;
        }
        await load();
      } finally {
        setBusy(false);
      }
    },
    [real, storeId, requiresGps, load]
  );

  const clockIn = useCallback(() => punch("in"), [punch]);
  const clockOut = useCallback(() => punch("out"), [punch]);

  const ym = new Date().toISOString().slice(0, 7);
  const monthRecords = history.filter((r) => r.date.startsWith(ym));
  const stats: MonthStats = {
    workedDays: monthRecords.filter((r) => r.clockIn).length,
    totalMinutes: monthRecords.reduce(
      (a, r) => a + minutesBetween(r.clockIn, r.clockOut),
      0
    ),
  };

  return {
    today,
    history,
    stats,
    method,
    requiresQr,
    requiresGps,
    loading,
    busy,
    error,
    clockIn,
    clockOut,
    reload: load,
  };
}

export { minutesBetween };
