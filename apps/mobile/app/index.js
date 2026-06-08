import { View, ActivityIndicator } from "react-native";
import { Redirect } from "expo-router";
import { useSession } from "../lib/session";
import { BRAND } from "@crewup/core";

// 진입 게이트: 세션에 따라 로그인/홈으로 분기
export default function Index() {
  const { session, ready } = useSession();

  if (!ready) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: BRAND.primary,
        }}
      >
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  return <Redirect href={session ? "/(app)/home" : "/login"} />;
}
