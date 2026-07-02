"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { type Role } from "@/lib/mock-data";

// 관리자: 멤버 직책(=역할)/시급 수정 + 퇴사 처리.
// 직책은 사장/점장/직원/알바 4개 중 선택. 변경은 사장(owner)만.
const ROLE_OPTS: { key: Role; label: string }[] = [
  { key: "owner", label: "사장" },
  { key: "manager", label: "점장" },
  { key: "employee", label: "직원" },
  { key: "parttimer", label: "알바" },
];
const ROLE_LABEL_MAP: Record<Role, string> = {
  owner: "사장",
  manager: "점장",
  employee: "직원",
  parttimer: "알바",
};

export function MemberEditor({
  storeId,
  userId,
  initialRole,
  initialWage,
  initialWageType = "hourly",
  initialWeeklyIncluded = false,
  initialInsurance = false,
  canChangeRole,
  isFounder = false,
  targetIsFounder = false,
  onSaved,
}: {
  storeId: string;
  userId: string;
  initialRole: Role;
  initialWage: number;
  initialPosition: string;
  initialWageType?: "hourly" | "monthly";
  initialWeeklyIncluded?: boolean;
  initialInsurance?: boolean;
  canChangeRole: boolean;
  isFounder?: boolean; // 현재 로그인이 최초 대표인가 (공동 사장 지정 권한)
  targetIsFounder?: boolean; // 이 멤버가 최초 대표인가 (변경 불가)
  onSaved: () => void;
}) {
  const [role, setRole] = useState<Role>(initialRole);
  const [wage, setWage] = useState(initialWage);
  const [wageType, setWageType] = useState<"hourly" | "monthly">(
    initialWageType
  );
  const [weeklyIncl, setWeeklyIncl] = useState(initialWeeklyIncluded);
  const [insurance, setInsurance] = useState(initialInsurance);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const targetIsOwner = initialRole === "owner";
  // 직책 변경 가능 여부 (백엔드 트리거와 일치)
  // - 대표 계정: 누구도 변경 불가
  // - 공동 사장 계정: 대표(founder)만 관리
  // - 점장 계정: 사장(공동 포함)만 관리
  const lockedReason = targetIsFounder
    ? "대표 계정은 변경할 수 없어요."
    : targetIsOwner && !isFounder
    ? "공동 사장 계정은 대표만 관리할 수 있어요."
    : !canChangeRole && initialRole === "manager"
    ? "점장 계정은 사장님만 관리할 수 있어요."
    : "";
  const locked = !!lockedReason;

  const save = async () => {
    setSaving(true);
    setError("");
    const supabase = createClient();
    const patch: any = {
      hourly_wage: wage,
      wage_type: wageType,
      weekly_included: weeklyIncl,
      insurance,
    };
    // 직책(역할) 변경 가능 시: role + 직책 라벨 동기화
    if (canChangeRole) {
      patch.role = role;
      patch.position = ROLE_LABEL_MAP[role];
    }
    const { error: e } = await supabase
      .from("memberships")
      .update(patch)
      .eq("store_id", storeId)
      .eq("user_id", userId);
    setSaving(false);
    if (e) {
      setError("저장하지 못했어요. 권한을 확인해 주세요.");
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
    onSaved();
  };

  const resign = async () => {
    if (!confirm("이 직원을 퇴사 처리할까요? 매장 접근이 즉시 중단됩니다."))
      return;
    setError("");
    const supabase = createClient();
    const { error: e } = await supabase
      .from("memberships")
      .update({ status: "resigned" })
      .eq("store_id", storeId)
      .eq("user_id", userId);
    if (e) {
      setError("퇴사 처리에 실패했어요. 권한을 확인해 주세요.");
      return;
    }
    onSaved();
  };

  if (locked) {
    return (
      <p className="rounded-lg bg-slate-50 px-3 py-2.5 text-xs text-slate-500">
        {lockedReason}
      </p>
    );
  }

  return (
    <div className="space-y-2.5 text-sm">
      {/* 직책 (사장/점장/직원/알바 중 선택) */}
      <label className="block">
        <span className="mb-1 block text-[11px] font-semibold text-slate-500">
          직책
        </span>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
          disabled={!canChangeRole}
          className="me-i"
        >
          {ROLE_OPTS.map((o) => (
            <option
              key={o.key}
              value={o.key}
              // '사장(공동대표)' 지정은 대표(founder)만
              disabled={o.key === "owner" && !isFounder}
            >
              {o.key === "owner" ? "사장 (공동대표)" : o.label}
            </option>
          ))}
        </select>
        {!canChangeRole ? (
          <span className="mt-1 block text-[11px] text-slate-400">
            직책 변경은 사장님만 가능해요.
          </span>
        ) : (
          isFounder &&
          !targetIsOwner && (
            <span className="mt-1 block text-[11px] text-slate-400">
              ‘사장(공동대표)’으로 지정하면 발주·승인 등 사장 권한을 함께
              갖습니다.
            </span>
          )
        )}
      </label>

      {/* 임금 형태 + 금액 */}
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold text-slate-500">
            임금 형태
          </span>
          <select
            value={wageType}
            onChange={(e) =>
              setWageType(e.target.value as "hourly" | "monthly")
            }
            className="me-i"
          >
            <option value="hourly">시급</option>
            <option value="monthly">월급</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold text-slate-500">
            {wageType === "monthly" ? "월급(원)" : "시급(원)"}
          </span>
          <input
            type="number"
            value={wage}
            onChange={(e) => setWage(Number(e.target.value))}
            className="me-i"
          />
        </label>
      </div>

      {/* 주휴수당 포함 / 4대보험 (급여 계산에 반영) */}
      <div className="space-y-1.5 rounded-lg bg-slate-50 px-3 py-2.5">
        <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
          <input
            type="checkbox"
            checked={weeklyIncl}
            onChange={(e) => setWeeklyIncl(e.target.checked)}
          />
          주휴수당 시급에 포함 (포괄)
        </label>
        <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
          <input
            type="checkbox"
            checked={insurance}
            onChange={(e) => setInsurance(e.target.checked)}
          />
          4대보험 가입
        </label>
        <p className="text-[11px] leading-relaxed text-slate-400">
          급여 계산에 반영돼요. 기본값은 근로계약서에서 가져옵니다.
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-500">
          {error}
        </p>
      )}

      <div className="flex gap-2 pt-1">
        <button
          onClick={save}
          disabled={saving}
          className="flex-1 rounded-lg bg-brand py-2 text-sm font-semibold text-white transition active:scale-[0.98] disabled:opacity-60"
        >
          {saving ? "저장 중…" : saved ? "저장됨 ✓" : "저장"}
        </button>
        {!targetIsOwner && (
          <button
            onClick={resign}
            className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-500"
          >
            퇴사 처리
          </button>
        )}
      </div>
      <style>{`.me-i{box-sizing:border-box;width:100%;height:40px;border:1px solid #e2e8f0;border-radius:0.5rem;padding:0 0.625rem;font-size:0.8125rem;line-height:1.2;color:#0f172a;background:#fff;outline:none;-webkit-appearance:none;appearance:none}.me-i:focus{border-color:#2F6BFF}.me-i:disabled{background:#f8fafc;color:#64748b}select.me-i{padding-right:1.5rem;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 20 20' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='M5 7l5 5 5-5'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 0.5rem center}`}</style>
    </div>
  );
}
