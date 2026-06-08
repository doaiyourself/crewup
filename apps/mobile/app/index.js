import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BRAND } from "@crewup/core";

// Step 1 임시 브랜드 홈. Step 2에서 카카오 로그인/보호 라우트로 교체.
export default function Home() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>iii</Text>
        </View>
        <Text style={styles.title}>{BRAND.name}</Text>
        <Text style={styles.tagline}>{BRAND.tagline}</Text>
        <Text style={styles.note}>모바일 앱 · Step 1 스캐폴딩</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BRAND.primary },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  logo: {
    width: 88,
    height: 88,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: { color: "#fff", fontSize: 36, fontWeight: "800", letterSpacing: 2 },
  title: { color: "#fff", fontSize: 32, fontWeight: "800", marginTop: 20 },
  tagline: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
  note: { color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 24 },
});
