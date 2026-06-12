"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Cert {
  id: string;
  file_path: string;
  file_name: string | null;
  expires_on: string | null;
  created_at: string;
}

const BUCKET = "health-certs";

// 파일명 안전화 (스토리지 키용). 표시는 원본 파일명 사용.
function safeName(name: string) {
  const dot = name.lastIndexOf(".");
  const ext = dot >= 0 ? name.slice(dot).replace(/[^.a-zA-Z0-9]/g, "") : "";
  return `${Date.now()}${ext || ""}`;
}

// 보건증 목록 + (본인) 업로드/삭제. 열람은 서명 URL.
// 본인과 사장님만 RLS로 접근 가능.
export function HealthCerts({
  storeId,
  userId,
  canUpload = false,
}: {
  storeId: string;
  userId: string;
  canUpload?: boolean;
}) {
  const [certs, setCerts] = useState<Cert[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const isReal = !!storeId && storeId !== "demo-store";

  const load = useCallback(async () => {
    if (!isReal) {
      setLoading(false);
      return;
    }
    const supabase = createClient();
    const { data } = await supabase
      .from("health_certs")
      .select("id, file_path, file_name, expires_on, created_at")
      .eq("store_id", storeId)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setCerts((data as Cert[]) ?? []);
    setLoading(false);
  }, [storeId, userId, isReal]);

  useEffect(() => {
    load();
  }, [load]);

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (e.target) e.target.value = "";
    if (!file || !isReal) return;
    if (file.size > 10 * 1024 * 1024) {
      setError("파일은 10MB 이하만 올릴 수 있어요.");
      return;
    }
    setBusy(true);
    setError("");
    const supabase = createClient();
    const path = `${storeId}/${userId}/${safeName(file.name)}`;
    const up = await supabase.storage.from(BUCKET).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (up.error) {
      setBusy(false);
      setError("업로드에 실패했어요. 다시 시도해 주세요.");
      return;
    }
    const { error: e2 } = await supabase.from("health_certs").insert({
      store_id: storeId,
      user_id: userId,
      file_path: path,
      file_name: file.name,
    });
    setBusy(false);
    if (e2) {
      setError("저장에 실패했어요. 권한을 확인해 주세요.");
      return;
    }
    await load();
  };

  const view = async (c: Cert) => {
    const supabase = createClient();
    const { data } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(c.file_path, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener");
    else setError("파일을 열 수 없어요. 권한을 확인해 주세요.");
  };

  const remove = async (c: Cert) => {
    if (!confirm("이 보건증을 삭제할까요?")) return;
    const supabase = createClient();
    await supabase.storage.from(BUCKET).remove([c.file_path]);
    await supabase.from("health_certs").delete().eq("id", c.id);
    await load();
  };

  return (
    <div className="space-y-2">
      {loading ? (
        <p className="py-3 text-center text-xs text-slate-400">불러오는 중…</p>
      ) : certs.length === 0 ? (
        <p className="rounded-lg bg-slate-50 py-4 text-center text-xs text-slate-400">
          등록된 보건증이 없어요.
        </p>
      ) : (
        certs.map((c) => (
          <div
            key={c.id}
            className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white px-3 py-2.5"
          >
            <span className="text-lg">📄</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-700">
                {c.file_name || "보건증"}
              </p>
              <p className="text-[11px] text-slate-400">
                {new Date(c.created_at).toLocaleDateString("ko-KR")} 등록
              </p>
            </div>
            <button
              onClick={() => view(c)}
              className="shrink-0 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600"
            >
              열기
            </button>
            {canUpload && (
              <button
                onClick={() => remove(c)}
                className="shrink-0 text-xs font-semibold text-red-400"
              >
                삭제
              </button>
            )}
          </div>
        ))
      )}

      {error && (
        <p className="rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-500">
          {error}
        </p>
      )}

      {canUpload && (
        <>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,application/pdf"
            onChange={onPick}
            className="hidden"
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="w-full rounded-xl border border-dashed border-brand/40 bg-blue-50/40 py-2.5 text-sm font-semibold text-brand transition active:scale-[0.98] disabled:opacity-60"
          >
            {busy ? "업로드 중…" : "＋ 보건증 올리기 (사진·PDF)"}
          </button>
          <p className="text-[11px] leading-relaxed text-slate-400">
            🔒 보건증은 <b>본인과 사장님만</b> 열람할 수 있어요. (점장·동료 비공개)
          </p>
        </>
      )}
    </div>
  );
}
