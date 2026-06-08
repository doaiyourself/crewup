# Crew Up 모바일 — Step 2 셋업 (카카오 로그인 + 세션)

모바일은 **네이티브 카카오 SDK → `signInWithIdToken`(OIDC)** 방식이라
**Expo Go로는 안 되고 EAS 개발 빌드(dev client)** 가 필요합니다.

## 1. 카카오 developers 설정 (모바일용 추가)

기존 Crew Up 앱(ID 1479628)에 모바일 설정을 더합니다.

1. **제품 설정 → 카카오 로그인 → 일반 → OpenID Connect → 상태 ON** ⭐
   (모바일 id_token 발급에 필수. 웹 OAuth엔 불필요했지만 모바일엔 켜야 함)
2. **제품 설정 → 카카오 로그인 → 동의항목** → `openid` 가 scope에 포함되는지 확인
   (OIDC ON이면 자동 포함)
3. **앱 설정 → 플랫폼**
   - **Android** 등록: 패키지명 `com.crewup.app`, 키 해시 등록
     (개발용 디버그 키 해시: `keytool -exportcert -alias androiddebugkey -keystore ~/.android/debug.keystore -storepass android -keypass android | openssl sha1 -binary | openssl base64`)
   - **iOS** 등록: 번들 ID `com.crewup.app`
4. **앱 설정 → 앱 키 → 네이티브 앱 키** 복사 → 아래 `.env`

## 2. Supabase

- **Authentication → Providers → Kakao** 는 이미 ON (웹에서 설정함).
- id_token의 `aud`(앱 client id)가 Supabase에 등록된 Kakao Client ID(REST API 키)와
  같은 앱이므로 그대로 동작합니다. 별도 변경 없음.

## 3. 환경변수 — `apps/mobile/.env`

`.env.example` 복사 후 채우기:
```
EXPO_PUBLIC_SUPABASE_URL=https://lmjyoeckfwjimflsdoky.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<웹과 동일한 anon 키>
EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY=<카카오 네이티브 앱 키>
```

## 4. 설치 + 개발 빌드 실행

```bash
# 루트에서 워크스페이스 설치
npm install

# 모바일 네이티브 의존성 정렬
cd apps/mobile && npx expo install --fix

# (A) 로컬 네이티브 빌드 (Xcode/Android Studio 필요)
npx expo run:ios      # 또는 run:android

# (B) 또는 EAS 클라우드 빌드 (권장, 계정 필요)
npm i -g eas-cli && eas login
eas build --profile development --platform ios   # 또는 android
# 빌드된 dev client를 기기에 설치 후:
npx expo start --dev-client
```

> ⚠️ **Expo Go 불가**: `@react-native-seoul/kakao-login`은 네이티브 모듈이라
> 커스텀 dev client(EAS dev build)에서만 동작합니다.

## 5. 동작

`로그인 화면 → 카카오로 시작하기 → (카카오톡/계정 로그인) → idToken →
supabase.signInWithIdToken → 세션 → 홈`

홈에서 프로필 이름이 보이고 로그아웃이 되면 Step 2 성공입니다.

## 다음 (Step 3)

- 멀티 매장/역할 로드 (웹의 memberships 로직 이식)
- 출퇴근 화면(큰 버튼) → 대시보드 → 급여 순 이식 (`@crewup/core` service 재사용)
