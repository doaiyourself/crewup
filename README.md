# Crew Up — 모노레포

알바 출퇴근·근로계약·급여 관리 서비스. 웹(Next.js)과 모바일(Expo)이 같은 Supabase
백엔드를 공유한다.

## 구조

```
crewup/
├─ apps/
│  ├─ web/      Next.js 14 (App Router) 웹앱  — 포트 3001
│  └─ mobile/   Expo + Expo Router 모바일앱 (Step 1 스캐폴딩)
├─ packages/
│  └─ core/     공유 로직 (브랜드·역할 상수, 출퇴근 service 등) — TS 소스
├─ supabase/    DB 마이그레이션 (양쪽 공유 백엔드)
├─ scripts/     운영 스크립트 (마이그레이션 실행 등)
├─ package.json npm workspaces
└─ turbo.json
```

## 핵심 패턴

`packages/core`의 service는 **Supabase 클라이언트를 주입받아** 순수 로직만 공유한다.
플랫폼별 클라이언트는 따로 생성:
- 웹: `@supabase/ssr` (쿠키 기반)
- 모바일: `@supabase/supabase-js` + AsyncStorage

## 설치 & 실행

```bash
# 루트에서 전체 워크스페이스 설치
npm install

# 웹 (http://localhost:3001)
npm run web

# 모바일 — 네이티브 의존성 정렬 후 실행
cd apps/mobile && npx expo install --fix
cd ../.. && npm run mobile
```

> 웹 환경변수: `apps/web/.env.local` (`apps/web/.env.local.example` 참고)
> 모바일 환경변수: `apps/mobile/.env` (`apps/mobile/.env.example` 참고)
> 백엔드 셋업: `SETUP.md`

## 로드맵

- ✅ **Step 1** — 모노레포 골격 + Expo 스캐폴딩 + `packages/core`
- ⏭ **Step 2** — 모바일 Supabase 클라이언트 + 카카오 로그인 + 보호 라우트
- ⏭ **Step 3** — 출퇴근 → 대시보드 → 계약/급여 화면 이식 (core service 재사용)
- ⏭ **Step 4** — EAS Build/Submit (Apple $99/년, Google $25 1회)
