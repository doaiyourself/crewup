"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { type Role } from "@/lib/mock-data";

// 관리자: 멤버 역할/시급/직책 수정 + 퇴사 처리.
// 역할 변경(점장 임명 등)은 사장(owner)만.
const ROLE_OPTS: { key: Role; label: string }[] = [
  { key: "manager", label: "점장" },
  { key: "employee", label: "직원" },
  { key: "parttimer", label: "알바" },
];

export function MemberEditor({
  storeId,
  userId,
  initialRole,
  initialWage,
  initialPosition,
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
  const [position, setPosition] = useState(initialPosition);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const isOwnerMember = initialRole === "owner";

  const save = async () => {
    setSaving(true);
    const supabase = createClient();
    const patch: any = { hourly_wage: wage, position: position.trim() };
    if (canChangeRole && !isOwnerMember) patch.role = role;
    await supabase
      .from("memberships")
      .update(patch)
      .eq("store_id", storeId)
      .eq("user_id", userId);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
    onSaved();
  };

  const resign = async () => {
    if (!confirm("이 직원을 퇴사 처리할까요? 매장 접근이 즉시 중단됩니다."))
      return;
    const supabase = createClient();
    await supabase
      .from("memberships")
      .update({ status: "resigned" })
      .eq("store_id", storeId)
      .eq("user_id", userId);
    onSaved();
  };

  return (
    <div className="space-y-2.5 text-sm">
      {/* 역할 */}
      {canChangeRole && !isOwnerMember ? (
        <div>
          <span className="mb-1 block text-[11px] font-semibold text-slate-500">
            역할
          </span>
          <div className="flex gap-1.5">
            {ROLE_OPTS.map((o) => (
              <button
                key={o.key}
                onClick={() => setRole(o.key)}
                className={`flex-1 rounded-lg py-1.5 text-xs font-semibold ${
                  role === o.key
                    ? "bg-brand text-white"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        isOwnerMember && (
          <p className="text-xs text-slate-400">사장님 계정은 역할 변경 불가</p>
        )
      )}

      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="mb-0.5 block text-[11px] font-semibold text-slate-500">
            시급(원)
          </span>
          <input
            type="number"
            value={wage}
            onChange={(e) => setWage(Number(e.target.value))}
            className="me-i"
          />
        </label>
        <label className="block">
          <span className="mb-0.5 block text-[11px] font-semibold text-slate-500">
            직책
          </span>
          <input
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            placeholder="예: 홀 서빙"
            className="me-i"
          />
        </label>
      </div>

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
      <style>{`.me-i{width:100%;border:1px solid #e2e8f0;border-radius:0.5rem;padding:0.375rem 0.5rem;font-size:0.8125rem;outline:none}.me-i:focus{border-color:#2F6BFF}`}</style>
    </div>
  );
}
