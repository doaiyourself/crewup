# Crew Up 배포 가이드 (Vercel · PWA)

모노레포(`apps/web` = Next.js)를 Vercel에 배포해 HTTPS 도메인을 얻고 PWA로 공개한다.

## 1. Vercel 프로젝트 생성

1. https://vercel.com → GitHub 계정으로 로그인 → **Add New → Project**
2. `doaiyourself/crewup` 저장소 Import
3. **Root Directory: `apps/web`** 로 지정 (⭐ 모노레포 핵심)
   - Vercel이 모노레포를 감지하고 루트에서 워크스페이스(@crewup/core 포함)를 설치합니다.
4. Framework Preset: **Next.js** (자동 감지)
5. Build/Install 명령은 기본값 그대로 두면 됩니다.

## 2. 환경변수 (Project Settings → Environment Variables)

`apps/web/.env.local` 과 동일하게 입력 (Production + Preview 모두):

```
NEXT_PUBLIC_SUPABASE_URL=https://lmjyoeckfwjimflsdoky.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon 키>
NEXT_PUBLIC_SITE_URL=https://<배포도메인>        # 배포 후 실제 도메인으로
SUPABASE_SERVICE_ROLE_KEY=<service_role 키>      # 서버 전용 (사업자검증·키오스크·출퇴근 라우트)
DATA_GO_KR_SERVICE_KEY=<국세청 진위확인 키>
```

> 🔒 `SUPABASE_SERVICE_ROLE_KEY`, `DATA_GO_KR_SERVICE_KEY` 는 `NEXT_PUBLIC_` 접두사 없이(서버 전용) 넣으세요.

## 3. 배포 → 도메인 확보

- Deploy 누르면 `https://crewup-xxxx.vercel.app` 도메인이 생깁니다.
- (선택) 커스텀 도메인 연결: Settings → Domains.
- `NEXT_PUBLIC_SITE_URL` 을 이 도메인으로 업데이트 후 재배포.

## 4. 배포 후 외부 서비스 URL 갱신 (⭐ 중요)

**Supabase → Authentication → URL Configuration**
- Site URL: `https://<배포도메인>`
- Redirect URLs 추가: `https://<배포도메인>/auth/callback`

**카카오 developers → 카카오 로그인**
- (웹 OAuth는 Supabase 콜백을 쓰므로 카카오 Redirect URI는 그대로:
  `https://lmjyoeckfwjimflsdoky.supabase.co/auth/v1/callback`)
- 앱 설정 → 플랫폼 → Web 사이트 도메인에 `https://<배포도메인>` 추가

## 5. PWA 설치 확인

- 배포 도메인(HTTPS)에서 서비스워커가 등록되고 설치 가능해집니다.
- **Android/Chrome**: 주소창 설치 아이콘 또는 로그인 화면 “홈 화면에 설치” 버튼
- **iOS/Safari**: 공유 → 홈 화면에 추가
- 설치 후 앱 아이콘으로 전체화면 실행(standalone) 확인.

## 6. 출시 전 체크리스트

- [ ] `/privacy`, `/terms` 내용의 [대괄호] 항목(상호·담당자·연락처) 채우기
- [ ] 위치(GPS) 기능 사용 시 위치기반서비스사업 신고 검토
- [ ] 카카오 동의항목/비즈앱 검수 상태 확인
- [ ] (유료화 시) 사업자등록 + 통신판매업 신고

## 참고
- 백엔드(Supabase) 셋업: `SETUP.md`
- 모바일(추후 네이티브): `apps/mobile/MOBILE_SETUP.md`
