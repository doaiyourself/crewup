import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { AppState } from "react-native";
import { supabase } from "./supabase";

// 모바일 세션 컨텍스트 — Supabase auth 세션 추적.
const SessionContext = createContext({
  session: null,
  user: null,
  ready: false,
  signOut: async () => {},
});

export function SessionProvider({ children }) {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });

    // 포그라운드 복귀 시 토큰 자동 갱신 유지
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") supabase.auth.startAutoRefresh();
      else supabase.auth.stopAutoRefresh();
    });

    return () => {
      subscription.unsubscribe();
      sub.remove();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <SessionContext.Provider
      value={{ session, user: session?.user ?? null, ready, signOut }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}
