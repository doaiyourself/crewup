"use client";

import { useState } from "react";
import { MOCK_EMPLOYEES } from "@/lib/mock-data";
import { PageHeader, Card, Avatar, LogoutButton } from "@/components/ui";

interface Pending {
  id: string;
  empId: string;
  type: "정정요청" | "지각" | "조퇴";
  detail: string;
}

const INITIAL: Pending[] = [
  { id: "p1", empId: "emp-2", type: "정정요청", detail: "5/30 퇴근 15:05 → 15:30 수정 요청" },
  { id: "p2", empId: "emp-4", type: "지각", detail: "5/30 출근 09:14 (14분 지각)" },
  { id: "p3", empId: "emp-7", type: "조퇴", detail: "5/29 13:00 조퇴 (사유: 병원)" },
  { id: "p4", empId: "emp-9", type: "정정요청", detail: "5/28 출근 누락 → 09:00 추가 요청" },
];

export default function AdminAttendancePage() {
  const [pending, setPending] = useState<Pending[]>(INITIAL);

  const resolve = (id: string) =>
    setPending((prev) => prev.filter((p) => p.id !== id));

  return (
    <>
      <PageHeader
        title="출퇴근 승인"
        subtitle={`승인 대기 ${pending.length}건`}
        right={<LogoutButton />}
      />

      <div className="px-4 pt-4">
        {pending.length === 0 ? (
          <Card className="py-10 text-center">
            <p className="text-3xl">🎉</p>
            <p className="mt-2 text-sm font-medium text-slate-500">
              모든 요청을 처리했어요!
            </p>
          </Card>
        ) : (
          <div className="space-y-2.5">
            {pending.map((p) => {
              const emp = MOCK_EMPLOYEES.find((e) => e.id === p.empId)!;
              return (
                <Card key={p.id}>
                  <div className="flex items-center gap-3">
                    <Avatar name={emp.name} color={emp.avatarColor} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-900">
                          {emp.name}
                        </p>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                            p.type === "지각"
                              ? "bg-amber-100 text-amber-700"
                              : p.type === "조퇴"
                              ? "bg-orange-100 text-orange-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {p.type}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">{p.detail}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => resolve(p.id)}
                      className="flex-1 rounded-xl bg-brand py-2.5 text-sm font-semibold text-white transition active:scale-[0.98]"
                    >
                      승인
                    </button>
                    <button
                      onClick={() => resolve(p.id)}
                      className="flex-1 rounded-xl border border-slate-300 bg-white py-2.5 text-sm font-semibold text-slate-600 transition active:scale-[0.98]"
                    >
                      반려
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
