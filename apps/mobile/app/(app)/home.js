import { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BRAND } from "@crewup/core";
import { supabase } from "../../lib/supabase";
import { useSession } from "../../lib/session";

// Step 2 임시 홈: 로그인 확인 + 프로필 표시 + 로그아웃.
// Step 3에서 출퇴근/대시보드 화면으로 확장.
export default function Home() {
  const { user, signOut } = useSession();
  const [name, setName] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("name")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => setName(data?.name ?? "사용자"));
  }, [user]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.hi}>안녕하세요,</Text>
        <Text style={styles.name}>{name || "..."}님</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>🎉 모바일 로그인 성공</Text>
        <Text style={styles.cardDesc}>
          카카오 SSO + Supabase 세션이 연결됐어요. Step 3에서 출퇴근·급여 화면을
          이식합니다.
        </Text>
      </View>

      <View style={{ flex: 1 }} />

      <Pressable onPress={signOut} style={styles.logout}>
        <Text style={styles.logoutText}>로그아웃</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f1f5f9", padding: 20 },
  header: { paddingTop: 8, paddingBottom: 16 },
  hi: { color: "#64748b", fontSize: 14 },
  name: { color: BRAND.dark, fontSize: 26, fontWeight: "800", marginTop: 2 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  cardTitle: { fontSize: 16, fontWeight: "800", color: BRAND.dark },
  cardDesc: { marginTop: 6, fontSize: 13, lineHeight: 20, color: "#64748b" },
  logout: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  logoutText: { color: "#475569", fontSize: 15, fontWeight: "600" },
});
