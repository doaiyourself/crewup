// Crew Up 서비스 워커 (동일 출처만). 외부(Supabase 등)는 패스.
// 문서(HTML)는 항상 네트워크 → 배포 후 구버전 페이지가 캐시로 남지 않음.
// 정적 해시 자산만 캐시(셸).
const CACHE = "crewup-v2";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const { request } = e;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // HTML 문서 / 네비게이션: 항상 네트워크 (최신 페이지 보장)
  if (request.mode === "navigate") {
    e.respondWith(fetch(request).catch(() => caches.match(request)));
    return;
  }

  // 정적 자산(해시 파일): 캐시 우선, 없으면 네트워크 후 캐시
  e.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
          return res;
        })
    )
  );
});
