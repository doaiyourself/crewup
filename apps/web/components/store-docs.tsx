"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Doc {
  id: string;
  title: string;
  file_path: string;
  file_name: string | null;
  created_at: string;
}

const BUCKET = "store-docs";

function safeName(name: string) {
  const dot = name.lastIndexOf(".");
  const ext = dot >= 0 ? name.slice(dot).replace(/[^.a-zA-Z0-9]/g, "") : "";
  return `${Date.now()}${ext || ""}`;
}

// 기타문서(매장 사업 서류): 임대차계약서·사업자등록증 등.
// 열람=관리자, 업로드/삭제=사장님(canManage). 업로드 팝업에서 제목(필수)+파일.
export function StoreDocs({
  storeId,
  canManage = false,
}: {
  storeId: string;
  canManage?: boolean;
}) {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [picked, setPicked] = useState<File | null>(null);
  const isReal = !!storeId && storeId !== "demo-store";

  const load = useCallback(async () => {
    if (!isReal) {
      setLoading(false);
      return;
    }
    const supabase = createClient();
    const { data } = await supabase
      .from("store_docs")
      .select("id, title, file_path, file_name, created_at")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false });
    setDocs((data as Doc[]) ?? []);
    setLoading(false);
  }, [storeId, isReal]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async () => {
    setError("");
    if (!title.trim()) {
      setError("문서 제목을 입력하세요.");
      return;
    }
    if (!picked) {
      setError("파일을 첨부하세요.");
      return;
    }
    if (picked.size > 20 * 1024 * 1024) {
      setError("파일은 20MB 이하만 올릴 수 있어요.");
      return;
    }
    setBusy(true);
    const supabase = createClient();
    const path = `${storeId}/${safeName(picked.name)}`;
    const up = await supabase.storage.from(BUCKET).upload(path, picked, {
      cacheControl: "3600",
      upsert: false,
    });
    if (up.error) {
      setBusy(false);
      setError("업로드에 실패했어요. 다시 시도해 주세요.");
      return;
    }
    const { error: e2 } = await supabase.from("store_docs").insert({
      store_id: storeId,
      title: title.trim(),
      file_path: path,
      file_name: picked.name,
    });
    setBusy(false);
    if (e2) {
      setError("저장에 실패했어요. 권한을 확인해 주세요.");
      return;
    }
    setOpen(false);
    setTitle("");
    setPicked(null);
    await load();
  };

  const view = async (d: Doc) => {
    const supabase = createClient();
    const { data } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(d.file_path, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener");
  };

  const remove = async (d: Doc) => {
    if (!confirm(`'${d.title}' 문서를 삭제할까요?`)) return;
    const supabase = createClient();
    await supabase.storage.from(BUCKET).remove([d.file_path]);
    await supabase.from("store_docs").delete().eq("id", d.id);
    await load();
  };

  return (
    <div className="space-y-2">
      {loading ? (
        <p className="py-3 text-center text-xs text-slate-400">불러오는 중…</p>
      ) : docs.length === 0 ? (
        <p className="rounded-lg bg-slate-50 py-4 text-center text-xs text-slate-400">
          등록된 문서가 없어요.
        </p>
      ) : (
        docs.map((d) => (
          <div
            key={d.id}
            className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white px-3 py-2.5"
          >
            <span className="text-lg">📁</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-700">
                {d.title}
              </p>
              <p className="truncate text-[11px] text-slate-400">
                {d.file_name} ·{" "}
                {new Date(d.created_at).toLocaleDateString("ko-KR")}
              </p>
            </div>
            <button
              onClick={() => view(d)}
              className="shrink-0 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600"
            >
              열기
            </button>
            {canManage && (
              <button
                onClick={() => remove(d)}
                className="shrink-0 text-xs font-semibold text-red-400"
              >
                삭제
              </button>
            )}
          </div>
        ))
      )}

      {canManage && (
        <button
          onClick={() => {
            setOpen(true);
            setError("");
            setTitle("");
            setPicked(null);
          }}
          className="w-full rounded-xl border border-dashed border-brand/40 bg-blue-50/40 py-2.5 text-sm font-semibold text-brand transition active:scale-[0.98]"
        >
          ＋ 문서 등록
        </button>
      )}

      {/* 업로드 팝업 */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-5">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <p className="text-base font-bold text-slate-900">기타문서 등록</p>
            <p className="mt-0.5 text-xs text-slate-400">
              임대차계약서·사업자등록증 등 매장 서류를 올려요.
            </p>

            <label className="mt-4 block">
              <span className="mb-1 block text-[11px] font-semibold text-slate-500">
                문서 제목 <span className="text-red-400">*</span>
              </span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="예: 임대차계약서, 사업자등록증"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand"
              />
            </label>

            <div className="mt-3">
              <span className="mb-1 block text-[11px] font-semibold text-slate-500">
                파일 첨부 <span className="text-red-400">*</span>
              </span>
              <input
                ref={fileRef}
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setPicked(e.target.files?.[0] ?? null)}
                className="hidden"
              />
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full truncate rounded-lg border border-slate-200 px-3 py-2.5 text-left text-sm text-slate-600"
              >
                {picked ? `📎 ${picked.name}` : "파일 선택 (사진·PDF)"}
              </button>
            </div>

            {error && (
              <p className="mt-2 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-500">
                {error}
              </p>
            )}

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-slate-500"
              >
                취소
              </button>
              <button
                onClick={submit}
                disabled={busy}
                className="flex-1 rounded-lg bg-brand py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {busy ? "등록 중…" : "등록"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
