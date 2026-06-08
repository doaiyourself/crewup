"use client";

import { useCallback, useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui";

type Method = "none" | "gps" | "qr" | "both";
const METHODS: { key: Method; label: string; desc: string }[] = [
  { key: "none", label: "없음", desc: "버튼으로 바로 기록" },
  { key: "gps", label: "GPS", desc: "매장 반경 안에서만" },
  { key: "qr", label: "QR", desc: "매장 QR 스캔" },
  { key: "both", label: "둘 다", desc: "QR + 위치" },
];

export function AttendanceConfig({ storeId }: { storeId: string }) {
  const [method, setMethod] = useState<Method>("none");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [radius, setRadius] = useState(150);
  const [secret, setSecret] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [geoMsg, setGeoMsg] = useState("");
  const [showQr, setShowQr] = useState(false);

  const load = useCallback(async () => {
    const supabase = createClient();
    const [{ data: store }, { data: sec }] = await Promise.all([
      supabase
        .from("stores")
        .select("attendance_method, lat, lng, geo_radius")
        .eq("id", storeId)
        .maybeSingle(),
      supabase.rpc("get_qr_secret", { p_store_id: storeId }),
    ]);
    if (store) {
      setMethod((store.attendance_method as Method) ?? "none");
      setLat(store.lat);
      setLng(store.lng);
      setRadius(store.geo_radius ?? 150);
    }
    if (typeof sec === "string") setSecret(sec);
    setLoading(false);
  }, [storeId]);

  useEffect(() => {
    load();
  }, [load]);

  const useCurrentLocation = () => {
    setGeoMsg("위치 확인 중…");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLat(p.coords.latitude);
        setLng(p.coords.longitude);
        setGeoMsg("현재 위치를 매장 위치로 설정했어요. 저장을 눌러주세요.");
      },
      () => setGeoMsg("위치 권한이 필요해요."),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const ensureSecret = async () => {
    const supabase = createClient();
    const { data } = await supabase.rpc("rotate_qr_secret", {
      p_store_id: storeId,
    });
    if (typeof data === "string") setSecret(data);
  };

  const save = async () => {
    setSaving(true);
    const supabase = createClient();
    await supabase.rpc("set_attendance_config", {
      p_store_id: storeId,
      p_method: method,
      p_lat: lat,
      p_lng: lng,
      p_radius: radius,
    });
    // QR 방식인데 시크릿이 없으면 생성
    if ((method === "qr" || method === "both") && !secret) await ensureSecret();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const origin =
    typeof window !== "undefined" ? window.location.origin : "";
  const qrValue = `${origin}/checkin?s=${storeId}&k=${secret}`;

  if (loading)
    return (
      <Card className="py-6 text-center text-sm text-slate-400">불러오는 중…</Card>
    );

  return (
    <Card className="space-y-3">
      <p className="text-sm text-slate-600">
        직원이 출퇴근할 때 위치(GPS)나 매장 QR로 본인 확인을 할 수 있어요.
      </p>

      {/* 방식 선택 */}
      <div className="grid grid-cols-4 gap-1.5">
        {METHODS.map((m) => (
          <button
            key={m.key}
            onClick={() => setMethod(m.key)}
            className={`rounded-xl py-2 text-center transition ${
              method === m.key
                ? "bg-brand text-white"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            <span className="block text-sm font-bold">{m.label}</span>
          </button>
        ))}
      </div>
      <p className="text-center text-xs text-slate-400">
        {METHODS.find((m) => m.key === method)?.desc}
      </p>

      {/* GPS 설정 */}
      {(method === "gps" || method === "both") && (
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs font-semibold text-slate-600">📍 매장 위치</p>
          <p className="mt-1 text-xs text-slate-500">
            {lat != null && lng != null
              ? `설정됨 (${lat.toFixed(5)}, ${lng.toFixed(5)})`
              : "아직 설정되지 않음"}
          </p>
          <button
            onClick={useCurrentLocation}
            className="mt-2 w-full rounded-lg bg-white py-2 text-xs font-semibold text-brand ring-1 ring-brand/30"
          >
            현재 위치를 매장 위치로 설정
          </button>
          {geoMsg && <p className="mt-1 text-[11px] text-slate-500">{geoMsg}</p>}
          <label className="mt-2 block text-xs text-slate-500">
            허용 반경: <b className="text-slate-700">{radius}m</b>
            <input
              type="range"
              min={50}
              max={500}
              step={10}
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="mt-1 w-full accent-brand"
            />
          </label>
          <p className="text-[11px] text-slate-400">
            ※ 휴대폰 GPS 기준. PC 브라우저는 위치가 부정확할 수 있어요.
          </p>
        </div>
      )}

      {/* QR 설정 */}
      {(method === "qr" || method === "both") && (
        <div className="rounded-xl bg-slate-50 p-3 text-center">
          <p className="text-xs font-semibold text-slate-600">📷 매장 QR</p>
          {secret ? (
            <>
              <div className="mx-auto mt-2 w-fit rounded-xl bg-white p-3">
                <QRCodeSVG value={qrValue} size={showQr ? 220 : 120} />
              </div>
              <p className="mt-2 text-[11px] text-slate-400">
                이 QR을 매장에 비치하세요. 직원이 스캔하면 출퇴근됩니다.
              </p>
              <div className="mt-2 flex justify-center gap-2">
                <button
                  onClick={() => setShowQr((v) => !v)}
                  className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200"
                >
                  {showQr ? "작게" : "크게 보기"}
                </button>
                <button
                  onClick={ensureSecret}
                  className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-red-500 ring-1 ring-slate-200"
                >
                  QR 재발급
                </button>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                재발급하면 기존 QR(사진)은 즉시 무효화돼요.
              </p>
            </>
          ) : (
            <button
              onClick={ensureSecret}
              className="mt-2 rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-white"
            >
              QR 생성
            </button>
          )}
        </div>
      )}

      <button
        onClick={save}
        disabled={saving}
        className="w-full rounded-xl bg-brand py-2.5 text-sm font-bold text-white transition active:scale-[0.98] disabled:opacity-60"
      >
        {saving ? "저장 중…" : saved ? "저장됨 ✓" : "출퇴근 방식 저장"}
      </button>
    </Card>
  );
}
