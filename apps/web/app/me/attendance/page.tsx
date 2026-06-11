"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/session";
import {
  useMyAttendance,
  minutesBetween,
  type DayRecord,
} from "@/lib/use-my-attendance";
import { getSchedule } from "@/lib/mock-data";
import { todayLabel } from "@/lib/format";
import { PageHeader, Card, AccountBadge } from "@/components/ui";

const DOW = ["일", "월", "화", "수", "목", "금", "토"];

function hhmm(iso: string | null): string {
  if (!iso) return "--:--";
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}`;
}

function dateLabel(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const dow = new Date(y, m - 1, d).getDay();
  return `${m}/${d} (${DOW[dow]})`;
}

function hoursLabel(min: number): string {
  if (min <= 0) return "";
  const h = Math.floor(min / 60);
  const mm = min % 60;
  return mm ? `${h}시간 ${mm}분` : `${h}시간`;
}

function RecordRow({ r }: { r: DayRecord }) {
  const worked = minutesBetween(r.clockIn, r.clockOut);
  const status = r.clockOut ? "정상" : r.clockIn ? "근무중" : "기록없음";
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="w-16 text-sm font-medium text-slate-700">
        {dateLabel(r.date)}
      </span>
      <span className="flex-1 text-center text-sm tabular-nums text-slate-500">
        {hhmm(r.clockIn)} ~ {hhmm(r.clockOut)}
      </span>
      <span className="w-16 text-right text-xs text-slate-500">
        {hoursLabel(worked)}
      </span>
      <span
        className={`ml-2 w-10 text-right text-xs font-semibold ${
          status === "정상"
            ? "text-green-600"
            : status === "근무중"
            ? "text-brand"
            : "text-slate-400"
        }`}
      >
        {status}
      </span>
    </div>
  );
}

export default function AttendancePage() {
  const { account, currentStoreId } = useSession();
  const {
    today: att,
    history,
    stats,
    loading,
    busy,
    error,
    method,
    requiresQr,
    clockIn,
    clockOut,
  } = useMyAttendance(currentStoreId);
  const [todayStr, setTodayStr] = useState("");
  const [dow, setDow] = useState<number | null>(null);

  useEffect(() => {
    setTodayStr(todayLabel());
    setDow(new Date().getDay());
  }, []);

  if (!account) return null;

  const schedule = getSchedule(account.id);
  const todayShift =
    dow !== null ? schedule?.shifts.find((s) => s.day === dow) : undefined;

  return (
    <>
      <PageHeader title="출퇴근" subtitle={todayStr} right={<AccountBadge light />} />

      <div className="px-4 pt-4">
        {/* 큰 출퇴근 버튼 */}
        <Card>
          <p className="text-center text-sm text-slate-500">
            {todayShift
              ? `오늘 스케줄 ${todayShift.start} ~ ${todayShift.end}`
              : "오늘 근무를 기록하세요"}
          </p>
          <div className="my-4 flex items-center justify-center gap-8 text-center">
            <div>
              <p className="text-xs text-slate-400">출근</p>
              <p className="text-2xl font-extrabold text-slate-900">
                {hhmm(att.clockInAt)}
              </p>
            </div>
            <div className="h-10 w-px bg-slate-200" />
            <div>
              <p className="text-xs text-slate-400">퇴근</p>
              <p className="text-2xl font-extrabold text-slate-900">
                {hhmm(att.clockOutAt)}
              </p>
            </div>
          </div>
          {requiresQr ? (
            <div className="rounded-2xl bg-slate-50 py-5 text-center">
              <p className="text-3xl">📷</p>
              <p className="mt-2 text-sm font-semibold text-slate-700">
                매장 QR을 스캔해 출퇴근하세요
              </p>
              <p className="mt-0.5 text-xs text-slate-400">
                매장에 비치된 Crew Up QR을 휴대폰 카메라로 찍으면 됩니다.
              </p>
            </div>
          ) : att.status !== "working" ? (
            <button
              onClick={clockIn}
              disabled={busy || att.status === "done"}
              className="w-full rounded-2xl bg-brand py-4 text-base font-bold text-white transition active:scale-[0.98] disabled:bg-slate-200 disabled:text-slate-400"
            >
              {busy ? "처리 중…" : att.status === "done" ? "오늘 근무 완료" : "출근하기"}
            </button>
          ) : (
            <button
              onClick={clockOut}
              disabled={busy}
              className="w-full rounded-2xl bg-slate-800 py-4 text-base font-bold text-white transition active:scale-[0.98] disabled:opacity-60"
            >
              {busy ? "처리 중…" : "퇴근하기"}
            </button>
          )}
          {error && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-center text-xs font-medium text-red-600">
              {error}
            </p>
          )}
          <p className="mt-3 text-center text-xs text-slate-400">
            {method === "gps" || method === "both"
              ? "📍 매장 반경 안에서만 출퇴근할 수 있어요"
              : method === "qr"
              ? "🔒 QR 스캔으로 위치를 확인합니다"
              : "기록은 사장님이 확인·정정할 수 있어요"}
          </p>
        </Card>

        {/* 이번 달 통계 */}
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Card>
            <p className="text-xs text-slate-500">이번 달 근무일</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">
              {stats.workedDays}
              <span className="text-sm font-normal text-slate-400"> 일</span>
            </p>
          </Card>
          <Card>
            <p className="text-xs text-slate-500">이번 달 근무시간</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">
              {Math.floor(stats.totalMinutes / 60)}
              <span className="text-sm font-normal text-slate-400">
                시간 {stats.totalMinutes % 60}분
              </span>
            </p>
          </Card>
        </div>

        {/* 내역 */}
        <h2 className="mb-2 mt-5 px-1 text-sm font-bold text-slate-500">
          출퇴근 내역
        </h2>
        {loading ? (
          <Card className="py-8 text-center text-sm text-slate-400">
            불러오는 중…
          </Card>
        ) : history.length === 0 ? (
          <Card className="py-8 text-center text-sm text-slate-400">
            아직 출퇴근 기록이 없어요.
          </Card>
        ) : (
          <Card className="divide-y divide-slate-100 !p-0">
            {history.map((r) => (
              <RecordRow key={r.date} r={r} />
            ))}
          </Card>
        )}
      </div>
    </>
  );
}
