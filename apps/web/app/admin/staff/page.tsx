"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/client";
import { ROLE_LABEL, isAdminRole, type Role } from "@/lib/mock-data";
import { won } from "@/lib/format";
import { PageHeader, Card, Avatar, AccountBadge } from "@/components/ui";
import { ScheduleEditor } from "@/components/schedule-editor";
import { ContractManager } from "@/components/contract-manager";
import { MemberEditor } from "@/components/member-editor";
import { KakaoShareButton } from "@/components/kakao-share";

interface Member {
  user_id: string;
  name: string;
  avatar_color: string;
  phone: string | null;
  role: Role;
  position: string | null;
  hourly_wage: number;
  status: string;
  joined_at: string;
}

const FILTERS: { key: "all" | Role; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "manager", label: "점장" },
  { key: "employee", label: "직원" },
  { key: "parttimer", label: "알바" },
];

export default function StaffPage() {
  const { currentStoreId, currentMembership, account } = useSession();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | Role>("all");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [copied, setCopied] = useState<"code" | "link" | null>(null);
  const [schedFor, setSchedFor] = useState<string | null>(null);
  const [contractFor, setContractFor] = useState<string | null>(null);
  const [editFor, setEditFor] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!currentStoreId || currentStoreId === "demo-store") {
      setLoading(false);
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase.rpc("list_store_members", {
      p_store_id: currentStoreId,
    });
    setMembers((data as Member[]) ?? []);
    setLoading(false);
  }, [currentStoreId]);

  useEffect(() => {
    load();
  }, [load]);

  const joinCode = currentMembership?.joinCode ?? "";
  // 공유 링크는 항상 대표 도메인(crewup.kr)으로 — www/vercel 주소 노출 방지
  const siteBase =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (typeof window !== "undefined" ? window.location.origin : "");
  const inviteLink = joinCode ? `${siteBase}/join?code=${joinCode}` : "";

  const copy = async (text: string, which: "code" | "link") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* ignore */
    }
  };

  const active = members.filter((m) => m.status === "active");
  const list = active.filter((m) => filter === "all" || m.role === filter);
  const isOwner = account?.role === "owner";

  return (
    <>
      <PageHeader
        title="직원 관리"
        subtitle={`총 ${active.length}명`}
        right={<AccountBadge light />}
      />

      <div className="px-4 pt-4">
        {/* 초대 버튼 */}
        <button
          onClick={() => setInviteOpen((v) => !v)}
          className="mb-3 w-full rounded-xl bg-brand py-3 text-sm font-bold text-white transition active:scale-[0.99]"
        >
          ＋ 직원·알바 초대하기
        </button>

        {/* 초대 시트 */}
        {inviteOpen && (
          <Card className="mb-3 space-y-3">
            <div>
              <p className="text-xs font-semibold text-slate-500">매장 코드</p>
              <div className="mt-1 flex items-center gap-2">
                <p className="flex-1 rounded-lg bg-slate-50 py-2 text-center text-xl font-extrabold tracking-[0.25em] text-crew-dark">
                  {joinCode || "------"}
                </p>
                <button
                  onClick={() => copy(joinCode, "code")}
                  className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600"
                >
                  {copied === "code" ? "복사됨!" : "복사"}
                </button>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">초대 링크</p>
              <div className="mt-1 flex items-center gap-2">
                <p className="flex-1 truncate rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                  {inviteLink || "-"}
                </p>
                <button
                  onClick={() => copy(inviteLink, "link")}
                  className="shrink-0 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600"
                >
                  {copied === "link" ? "복사됨!" : "복사"}
                </button>
              </div>
            </div>
            {inviteLink && (
              <KakaoShareButton
                title={`${currentMembership?.storeName ?? "매장"} 합류 초대`}
                description="Crew Up에서 출퇴근·급여를 관리해요. 눌러서 합류하기"
                link={inviteLink}
                label="카카오톡으로 초대하기"
              />
            )}
            <p className="text-[11px] leading-relaxed text-slate-400">
              직원·알바에게 코드나 링크를 공유하세요. 링크를 열면 카카오 로그인
              후 자동으로 매장에 합류합니다.
            </p>
          </Card>
        )}

        {/* 필터 */}
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

        {/* 명단 */}
        {loading ? (
          <Card className="py-10 text-center text-sm text-slate-400">
            불러오는 중…
          </Card>
        ) : list.length === 0 ? (
          <Card className="py-10 text-center">
            <p className="text-3xl">👥</p>
            <p className="mt-2 text-sm text-slate-500">
              아직 합류한 직원이 없어요.
            </p>
            <p className="text-xs text-slate-400">
              위 버튼으로 코드·링크를 공유해 초대하세요.
            </p>
          </Card>
        ) : (
          <div className="space-y-2.5">
            {list.map((m) => (
              <Card key={m.user_id}>
                <div className="flex items-center gap-3">
                  <Avatar name={m.name} color={m.avatar_color} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate font-semibold text-slate-900">
                        {m.name}
                      </p>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                          isAdminRole(m.role)
                            ? "bg-brand/10 text-brand"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {ROLE_LABEL[m.role]}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {m.position || "-"} · {won(m.hourly_wage)}/h
                      {m.phone ? ` · ${m.phone}` : ""}
                    </p>
                  </div>
                  <div className="grid shrink-0 grid-cols-1 gap-1">
                    <button
                      onClick={() => {
                        setContractFor(null);
                        setEditFor(null);
                        setSchedFor((id) => (id === m.user_id ? null : m.user_id));
                      }}
                      className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                        schedFor === m.user_id
                          ? "bg-brand text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      스케줄
                    </button>
                    <button
                      onClick={() => {
                        setSchedFor(null);
                        setEditFor(null);
                        setContractFor((id) =>
                          id === m.user_id ? null : m.user_id
                        );
                      }}
                      className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                        contractFor === m.user_id
                          ? "bg-brand text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      계약서
                    </button>
                    <button
                      onClick={() => {
                        setSchedFor(null);
                        setContractFor(null);
                        setEditFor((id) => (id === m.user_id ? null : m.user_id));
                      }}
                      className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                        editFor === m.user_id
                          ? "bg-brand text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      관리
                    </button>
                  </div>
                </div>
                {schedFor === m.user_id && currentStoreId && (
                  <div className="mt-3 border-t border-slate-100 pt-3">
                    <ScheduleEditor storeId={currentStoreId} userId={m.user_id} />
                  </div>
                )}
                {contractFor === m.user_id && currentStoreId && (
                  <div className="mt-3 border-t border-slate-100 pt-3">
                    <ContractManager
                      storeId={currentStoreId}
                      userId={m.user_id}
                      memberName={m.name}
                      defaultWage={m.hourly_wage}
                      workplace={currentMembership?.storeName ?? ""}
                      employerName={currentMembership?.storeName ?? "사업주"}
                    />
                  </div>
                )}
                {editFor === m.user_id && currentStoreId && (
                  <div className="mt-3 border-t border-slate-100 pt-3">
                    <MemberEditor
                      storeId={currentStoreId}
                      userId={m.user_id}
                      initialRole={m.role}
                      initialWage={m.hourly_wage}
                      initialPosition={m.position ?? ""}
                      canChangeRole={isOwner}
                      onSaved={load}
                    />
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
