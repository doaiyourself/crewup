import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { initializeKakaoSDK } from "@react-native-seoul/kakao-login";
import { SessionProvider } from "../lib/session";

export default function RootLayout() {
  useEffect(() => {
    const key = process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY;
    if (key) initializeKakaoSDK(key);
  }, []);

  return (
    <SessionProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }} />
    </SessionProvider>
  );
}
