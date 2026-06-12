"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "@/lib/session";
import { useAdminStats, type RosterStatus } from "@/lib/use-admin-stats";
import { ROLE_LABEL } from "@/lib/mock-data";
import { wonShort, todayLabel } from "@/lib/format";
import { Card, Avatar } from "@/components/ui";
import { StoreSwitcher } from "@/components/store-switcher";
import { TodayTasks } from "@/components/today-tasks";
import { Icon, type IconName } from "@/components/icons";

function hhmm(iso: string | null): string {
  if (!iso) return "--:--";
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}`;
}

// 가로 스크롤 요약 카드
function SummaryCard({
  icon,
  label,
  value,
  unit,
  tint,
}: {
  icon: IconName;
  label: string;
  value: string;
  unit?: string;
  tint: string;
}) {
  return (
    <div className="flex min-w-[44%] flex-1 snap-start flex-col gap-1.5 rounded-2xl bg-white p-3.5 shadow-[0_1px_3px_rgba(15,23,42,0.05)] ring-1 ring-slate-100/80">
      <div className="flex items-center gap-2">
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${tint}1a`, color: tint }}
        >
          <Icon name={icon} size={16} />
        </span>
        <p className="truncate text-xs text-slate-400">{label}</p>
      </div>
      <p className="text-xl font-extrabold text-slate-900">
        {value}
        {unit && (
          <span className="ml-1 text-xs font-semibold text-slate-400">
            {unit}
          </span>
        )}
      </p>
    </div>
  );
}

const STATUS_STYLE: Record<RosterStatus, { label: string; cls: string }> = {
  working: { label: "근무중", cls: "bg-green-100 text-green-700" },
  done: { label: "퇴근", cls: "bg-slate-100 text-slate-500" },
  scheduled: { label: "출근전", cls: "bg-slate-100 text-slate-400" },
};

function QuickIcon({
  href,
  icon,
  label,
}: {
  href: string;
  icon: IconName;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-1.5 rounded-2xl bg-white py-3.5 shadow-[0_1px_3px_rgba(15,23,42,0.05)] ring-1 ring-slate-100/80 transition active:scale-[0.97]"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/10 text-brand">
        <Icon name={icon} size={20} />
      </span>
      <span className="text-xs font-semibold text-slate-600">{label}</span>
    </Link>
  );
}

export default function AdminDashboard() {
  const { currentStoreId } = useSession();
  const stats = useAdminStats(currentStoreId);
  const [today, setToday] = useState("");
  useEffect(() => setToday(todayLabel()), []);

  return (
    <>
      {/* 헤더: 왼쪽 메뉴명+날짜, 오른쪽 매장 전환기 */}
      <header className="sticky top-0 z-10 bg-slate-100/90 px-4 pb-2 pt-4 backdrop-blur">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <h1 className="text-lg font-extrabold tracking-tight text-slate-900">
              대시보드
            </h1>
            <p className="text-xs text-slate-400">{today}</p>
          </div>
          <StoreSwitcher light />
        </div>
      </header>

      <div className="px-4 pb-4">

        {/* 요약 카드 — 가로 스크롤 */}
        <div className="flex snap-x gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <SummaryCard
            icon="staff"
            label="현재 근무자"
            value={`${stats.working}`}
            unit={`/ ${stats.total}명`}
            tint="#16a34a"
          />
          <SummaryCard
            icon="payroll"
            label="이번 달 인건비"
            value={stats.laborCost > 0 ? wonShort(stats.laborCost) : "-"}
            tint="#2F6BFF"
          />
          <SummaryCard
            icon="attendance"
            label="오늘 출근율"
            value={`${stats.attendedRate}%`}
            tint="#f59e0b"
          />
        </div>

        {/* 오늘 근무자 */}
        <h2 className="mb-2 mt-5 px-1 text-sm font-bold text-slate-700">
          오늘 근무자
        </h2>
        <Card className="!p-0">
          {stats.loading ? (
            <p className="px-4 py-8 text-center text-sm text-slate-400">
              불러오는 중…
            </p>
          ) : stats.roster.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-400">
              오늘 근무 예정자가 없어요.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {stats.roster.map((r) => {
                const s = STATUS_STYLE[r.status];
                const time =
                  r.start && r.end
                    ? `${r.start}~${r.end}`
                    : r.clock_in_at
                    ? `${hhmm(r.clock_in_at)}~`
                    : "시간 미정";
                return (
                  <div
                    key={r.user_id}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <Avatar name={r.name} color={r.avatar_color} size={38} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${s.cls}`}
                        >
                          {s.label}
                        </span>
                        <p className="truncate font-semibold text-slate-900">
                          {r.name}
                        </p>
                        <span className="text-xs text-slate-400">
                          {ROLE_LABEL[r.role]}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {time}
                        {r.offSchedule && r.clock_in_at ? " · 변경근무" : ""}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* 오늘의 할일 (TodayTasks 자체 제목 보유) */}
        <div className="mt-5">
          <TodayTasks />
        </div>

        {/* 바로가기 */}
        <h2 className="mb-2 mt-5 px-1 text-sm font-bold text-slate-700">
          바로가기
        </h2>
        <div className="grid grid-cols-5 gap-2">
          <QuickIcon href="/admin/staff" icon="staff" label="직원" />
          <QuickIcon
            href="/admin/attendance"
            icon="attendance"
            label="출퇴근"
          />
          <QuickIcon href="/admin/payroll" icon="payroll" label="급여" />
          <QuickIcon href="/documents" icon="doc" label="문서함" />
          <QuickIcon href="/admin/report" icon="dashboard" label="통계" />
        </div>
      </div>
    </>
  );
}
