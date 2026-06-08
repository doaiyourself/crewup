import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Redirect, useRouter } from "expo-router";
import { login as kakaoLogin } from "@react-native-seoul/kakao-login";
import { BRAND } from "@crewup/core";
import { supabase } from "../lib/supabase";
import { useSession } from "../lib/session";

export default function Login() {
  const { session, ready } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (ready && session) return <Redirect href="/(app)/home" />;

  const onKakao = async () => {
    setLoading(true);
    try {
      // 1) 카카오 네이티브 로그인 → idToken (OIDC 활성화 필요)
      const token = await kakaoLogin();
      if (!token?.idToken) {
        throw new Error("카카오 idToken 없음 — OpenID Connect 활성화를 확인하세요");
      }
      // 2) Supabase 세션 교환
      const { error } = await supabase.auth.signInWithIdToken({
        provider: "kakao",
        token: token.idToken,
      });
      if (error) throw error;
      router.replace("/(app)/home");
    } catch (e) {
      Alert.alert("로그인 실패", String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>iii</Text>
        </View>
        <Text style={styles.title}>{BRAND.name}</Text>
        <Text style={styles.tagline}>알바 출퇴근 · 근로계약 · 급여 관리</Text>
      </View>

      <View style={styles.bottom}>
        <Pressable
          onPress={onKakao}
          disabled={loading}
          style={({ pressed }) => [
            styles.kakao,
            (pressed || loading) && { opacity: 0.85 },
          ]}
        >
          {loading ? (
            <ActivityIndicator color="#191600" />
          ) : (
            <Text style={styles.kakaoText}>💬  카카오로 시작하기</Text>
          )}
        </Pressable>
        <Text style={styles.terms}>
          로그인 시 이용약관 및 개인정보처리방침에 동의합니다.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BRAND.primary },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  logo: {
    width: 84,
    height: 84,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: { color: "#fff", fontSize: 34, fontWeight: "800", letterSpacing: 2 },
  title: { color: "#fff", fontSize: 30, fontWeight: "800", marginTop: 18 },
  tagline: { color: "rgba(255,255,255,0.85)", fontSize: 14, marginTop: 6 },
  bottom: { paddingHorizontal: 24, paddingBottom: 28 },
  kakao: {
    backgroundColor: "#FEE500",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  kakaoText: { color: "#191600", fontSize: 16, fontWeight: "700" },
  terms: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    textAlign: "center",
    marginTop: 14,
  },
});
