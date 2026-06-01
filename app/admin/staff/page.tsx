"use client";

import { useState } from "react";
import {
  MOCK_EMPLOYEES,
  ROLE_LABEL,
  CONTRACT_LABEL,
  isAdminRole,
  type Role,
} from "@/lib/mock-data";
import { won } from "@/lib/format";
import { PageHeader, Card, Avatar, LogoutButton } from "@/components/ui";

const FILTERS: { key: "all" | Role; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "manager", label: "점장" },
  { key: "employee", label: "직원" },
  { key: "parttimer", label: "알바" },
];

export default function StaffPage() {
  const [filter, setFilter] = useState<"all" | Role>("all");

  const list = MOCK_EMPLOYEES.filter(
    (e) => filter === "all" || e.role === filter
  );

  return (
    <>
      <PageHeader
        title="직원 관리"
        subtitle={`총 ${MOCK_EMPLOYEES.length}명`}
        right={<LogoutButton />}
      />

      <div className="px-4 pt-4">
        {/* 필터 + 초대 */}
        <div className="mb-3 flex items-center gap-2 overflow-x-auto">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                filter === f.key
                  ? "bg-brand text-white"
                  : "bg-white text-slate-500 ring-1 ring-slate-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <button className="mb-3 w-full rounded-xl border border-dashed border-brand/40 bg-blue-50/50 py-3 text-sm font-semibold text-brand transition active:scale-[0.99]">
          ＋ 직원·알바 초대하기
        </button>

        {/* 명단 */}
        <div className="space-y-2.5">
          {list.map((e) => (
            <Card key={e.id} className="flex items-center gap-3">
              <Avatar name={e.name} color={e.avatarColor} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate font-semibold text-slate-900">
                    {e.name}
                  </p>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                      isAdminRole(e.role)
                        ? "bg-brand/10 text-brand"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {ROLE_LABEL[e.role]}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {e.position} · {won(e.hourlyWage)}/h · {e.phone}
                </p>
              </div>
              <span
                className={`shrink-0 text-xs font-semibold ${
                  e.contractStatus === "signed"
                    ? "text-green-600"
                    : e.contractStatus === "pending"
                    ? "text-amber-600"
                    : "text-red-500"
                }`}
              >
                {CONTRACT_LABEL[e.contractStatus]}
              </span>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
