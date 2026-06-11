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
  canChangeRole,
  onSaved,
}: {
  storeId: string;
  userId: string;
  initialRole: Role;
  initialWage: number;
  initialPosition: string;
  canChangeRole: boolean;
  onSaved: () => void;
}) {
  const [role, setRole] = useState<Role>(initialRole);
  const [wage, setWage] = useState(initialWage);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const isOwnerMember = initialRole === "owner";
  const targetIsAdmin = initialRole === "owner" || initialRole === "manager";
  // 관리자(사장/점장) 계정은 사장님만 관리 가능 (백엔드 트리거와 일치).
  // canChangeRole=true 는 현재 로그인이 사장님일 때만 전달된다.
  const locked = !canChangeRole && targetIsAdmin;

  const save = async () => {
    setSaving(true);
    setError("");
    const supabase = createClient();
    const patch: any = { hourly_wage: wage };
    // 직책(역할) 변경 가능 시: role + 직책 라벨 동기화
    if (canChangeRole && !isOwnerMember) {
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
        관리자(사장님·점장) 계정은 <b>사장님만</b> 관리할 수 있어요.
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
          disabled={isOwnerMember || !canChangeRole}
          className="me-i"
        >
          {ROLE_OPTS.map((o) => (
            <option
              key={o.key}
              value={o.key}
              disabled={o.key === "owner" && !isOwnerMember}
            >
              {o.label}
            </option>
          ))}
        </select>
        {(isOwnerMember || !canChangeRole) && (
          <span className="mt-1 block text-[11px] text-slate-400">
            {isOwnerMember
              ? "사장님 계정은 직책을 변경할 수 없어요."
              : "직책 변경은 사장님만 가능해요."}
          </span>
        )}
      </label>

      {/* 시급 */}
      <label className="block">
        <span className="mb-1 block text-[11px] font-semibold text-slate-500">
          시급(원)
        </span>
        <input
          type="number"
          value={wage}
          onChange={(e) => setWage(Number(e.target.value))}
          className="me-i"
        />
      </label>

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
        {!isOwnerMember && (
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
