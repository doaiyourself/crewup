# Crew Up — Supabase 연동 설정 가이드 (Phase 0-BE)

이 문서대로 따라 하면 카카오 SSO + Supabase 백엔드가 연결됩니다.
**키를 채우기 전까지 앱은 자동으로 "데모 모드"(목업)로 동작**하므로 언제든 화면을 먼저 둘러볼 수 있습니다.

---

## 1. Supabase 프로젝트 키 연결

1. Supabase 대시보드 → **Project Settings → API**
2. 다음 두 값을 복사:
   - `Project URL`
   - `anon` `public` key
3. 프로젝트 루트의 **`.env.local`** 에 채우기:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ....
NEXT_PUBLIC_SITE_URL=http://localhost:3001
```

4. 개발 서버 재시작 (`npm run dev`). 콘솔 에러 없이 로그인 화면이 "데모 모드" 문구 없이 뜨면 연결 성공.

---

## 2. DB 스키마 생성 (마이그레이션 실행)

1. Supabase 대시보드 → **SQL Editor → New query**
2. `supabase/migrations/0001_init.sql` **전체 내용을 붙여넣고 Run**
3. 생성 확인: **Table Editor** 에 `profiles / stores / memberships / attendance / schedules / contracts / payrolls / notifications` 테이블이 보이면 완료.

> 스키마는 PRD §7 데이터 모델 기준이며, 매장·역할 단위 접근을 **RLS(Row Level Security)** 로 강제합니다.

---

## 3. 카카오 OAuth 설정

### 3-1. 카카오 개발자 콘솔 (https://developers.kakao.com)

1. **내 애플리케이션 → 애플리케이션 추가하기** (앱 이름: Crew Up)
2. **앱 키 → REST API 키** 복사 (Supabase에 넣을 값)
3. **카카오 로그인 → 활성화 ON**
4. **카카오 로그인 → Redirect URI** 에 아래 추가:
   ```
   https://<YOUR_PROJECT_REF>.supabase.co/auth/v1/callback
   ```
   (`<YOUR_PROJECT_REF>` = Supabase URL의 서브도메인)
5. **카카오 로그인 → 동의항목**: 닉네임(필수 권장), 필요 시 이메일
6. **제품 설정 → 보안 → Client Secret** 생성 후 코드 복사 (Supabase에 넣을 값)

### 3-2. Supabase 대시보드

1. **Authentication → Providers → Kakao** 활성화
2. 입력:
   - `Kakao Client ID` = 카카오 **REST API 키**
   - `Kakao Client Secret` = 카카오 **Client Secret**
3. **Authentication → URL Configuration**:
   - `Site URL`: `http://localhost:3001` (배포 후 실제 도메인으로 변경)
   - `Redirect URLs` 에 추가: `http://localhost:3001/auth/callback`

---

## 4. 동작 확인

1. `npm run dev` → http://localhost:3001
2. **카카오로 시작하기** → 카카오 로그인 → 콜백(`/auth/callback`) → 진입점 복귀
3. 소속 매장이 없으면 **온보딩 화면**으로 이동 → 매장 생성 → 사장님으로 관리자 대시보드 진입
4. 직원·알바는 사장님이 초대(추후 구현) 후 합류

---

## 현재 단계 / 다음 단계

- ✅ **Phase 0-BE (지금)**: Supabase 연결 · 카카오 SSO · 역할/매장 DB 모델 · RLS · 신규 사장님 온보딩
- ⏭ **Phase 1**: 화면의 목업 데이터를 실제 DB 쿼리로 교체 (출퇴근 영속화 + Realtime 근무 현황)
- ⏭ 직원/알바 **초대 플로우**(초대코드/링크), 스케줄·급여·계약서 실데이터 연동

> 참고: 키를 채우고 마이그레이션을 실행하기 전까지는 데모 모드로 동작합니다.
> 관리자/직원 화면의 표시 데이터는 Phase 1에서 실제 쿼리로 교체됩니다.
