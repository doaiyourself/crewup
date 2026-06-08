import { View, ActivityIndicator } from "react-native";
import { Redirect, Stack } from "expo-router";
import { useSession } from "../../lib/session";
import { BRAND } from "@crewup/core";

// 보호 라우트: 세션 없으면 로그인으로
export default function AppLayout() {
  const { session, ready } = useSession();

  if (!ready) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f1f5f9",
        }}
      >
        <ActivityIndicator color={BRAND.primary} />
      </View>
    );
  }
  if (!session) return <Redirect href="/login" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
