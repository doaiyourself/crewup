// 동적 Expo 설정 — 카카오 네이티브 앱 키를 env로 주입(키를 git에 커밋하지 않음).
const kakaoAppKey = process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY || "";

export default () => ({
  expo: {
    name: "Crew Up",
    slug: "crewup",
    scheme: "crewup",
    version: "0.1.0",
    orientation: "portrait",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: { backgroundColor: "#2F6BFF" },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.crewup.app",
    },
    android: {
      package: "com.crewup.app",
      adaptiveIcon: { backgroundColor: "#2F6BFF" },
    },
    plugins: [
      "expo-router",
      // 카카오 로그인 네이티브 설정 (URL scheme/매니페스트 자동 구성)
      ["@react-native-seoul/kakao-login", { kakaoAppKey }],
    ],
    experiments: { typedRoutes: false },
  },
});
