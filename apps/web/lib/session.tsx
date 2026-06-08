"use client";

// 세션 컨텍스트 (멀티 매장).
// - Supabase env 설정 시: 카카오 OAuth 세션 + 전체 활성 멤버십 로드, 매장 전환 지원.
// - 미설정 시: 데모 localStorage 모드.
//
// 한 사용자가 여러 매장에 서로 다른 역할로 소속될 수 있다 (memberships 다대다).
// currentStoreId 로 "현재 보고 있는 매장"을 전환한다.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { DEMO_ACCOUNTS, type Account, type Role } from "./mock-data";
import { isSupabaseConfigured } from "./supabase/config";
import { createClient } from "./supabase/client";

const STORAGE_KEY = "crewup.session"; // 데모 계정 id
const STORE_KEY = "crewup.currentStore"; // 현재 매장 id

export interface Membership {
  storeId: string;
  storeName: string;
  joinCode: string | null;
  storeStatus: "pending" | "active" | "suspended";
  role: Role;
  position: string;
}

interface SessionValue {
  account: Account | null; // 현재 매장 기준 신원(역할 포함)
  memberships: Membership[]; // 소속된 모든 매장
  currentStoreId: string | null;
  currentMembership: Membership | null;
  ready: boolean;
  isAuthed: boolean; // 로그인 여부 (매장 소속과 무관)
  needsOnboarding: boolean; // 로그인했지만 소속 매장 0개
  mode: "supabase" | "demo";
  login: (account: Account) => void; // 데모용
  logout: () => void | Promise<void>;
  switchStore: (storeId: string) => void;
  refresh: () => Promise<void>;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  return isSupabaseConfigured ? (
    <SupabaseSession>{children}</SupabaseSession>
  ) : (
    <DemoSession>{children}</DemoSession>
  );
}

// ---------------------------------------------------------
// 데모 모드
// ---------------------------------------------------------
function DemoSession({ children }: { children: ReactNode }) {
  const [base, setBase] = useState<Account | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const id = JSON.parse(raw) as string;
        const found = DEMO_ACCOUNTS.find((a) => a.id === id);
        if (found) setBase(found);
      }
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  const login = (acc: Account) => {
    setBase(acc);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(acc.id));
    } catch {
      /* ignore */
    }
  };
  const logout = () => {
    setBase(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  };

  const memberships: Membership[] = base
    ? [
        {
          storeId: "demo-store",
          storeName: "Crew Up 1호점",
          joinCode: "DEMO01",
          storeStatus: "active",
          role: base.role,
          position: base.position,
        },
      ]
    : [];

  return (
    <SessionContext.Provider
      value={{
        account: base,
        memberships,
        currentStoreId: base ? "demo-store" : null,
        currentMembership: memberships[0] ?? null,
        ready,
        isAuthed: !!base,
        needsOnboarding: false,
        mode: "demo",
        login,
        logout,
        switchStore: () => {},
        refresh: async () => {},
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

// ---------------------------------------------------------
// Supabase 모드
// ---------------------------------------------------------
function SupabaseSession({ children }: { children: ReactNode }) {
  const [name, setName] = useState("사용자");
  const [avatarColor, setAvatarColor] = useState("#2F6BFF");
  const [userId, setUserId] = useState<string | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [currentStoreId, setCurrentStoreId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const loadFromUser = useCallback(async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setUserId(null);
        setMemberships([]);
        setCurrentStoreId(null);
        return;
      }
      setUserId(user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("name, avatar_color")
        .eq("id", user.id)
        .single();
      if (profile) {
        setName(profile.name ?? "사용자");
        setAvatarColor(profile.avatar_color ?? "#2F6BFF");
      }

      const { data: rows } = await supabase
        .from("memberships")
        .select("role, position, store_id, stores(name, join_code, status)")
        .eq("user_id", user.id)
        .eq("status", "active");

      const list: Membership[] = (rows ?? []).map((r: any) => ({
        storeId: r.store_id,
        storeName: r.stores?.name ?? "매장",
        joinCode: r.stores?.join_code ?? null,
        storeStatus: (r.stores?.status ?? "pending") as Membership["storeStatus"],
        role: r.role as Role,
        position: r.position ?? "",
      }));
      setMemberships(list);

      // 저장된 현재 매장 복원, 없으면 첫 번째
      let saved: string | null = null;
      try {
        saved = JSON.parse(localStorage.getItem(STORE_KEY) ?? "null");
      } catch {
        /* ignore */
      }
      const valid = list.find((m) => m.storeId === saved);
      setCurrentStoreId(valid ? valid.storeId : list[0]?.storeId ?? null);
    } catch (e) {
      console.error("[session] load failed", e);
    } finally {
      // 무슨 일이 있어도 로딩 상태는 해제 (무한 로딩 방지)
      setReady(true);
    }
  }, []);

  useEffect(() => {
    loadFromUser();
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      // 콜백 안에서 supabase 호출 시 인증 락 교착 방지 → 락 밖으로 defer
      setTimeout(() => {
        loadFromUser();
      }, 0);
    });
    return () => subscription.unsubscribe();
  }, [loadFromUser]);

  const switchStore = (storeId: string) => {
    setCurrentStoreId(storeId);
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(storeId));
    } catch {
      /* ignore */
    }
  };

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    try {
      localStorage.removeItem(STORE_KEY);
    } catch {
      /* ignore */
    }
    setUserId(null);
    setMemberships([]);
    setCurrentStoreId(null);
  };

  const currentMembership =
    memberships.find((m) => m.storeId === currentStoreId) ?? null;

  const account: Account | null =
    userId && currentMembership
      ? {
          id: userId,
          name,
          role: currentMembership.role,
          position: currentMembership.position,
          avatarColor,
        }
      : null;

  return (
    <SessionContext.Provider
      value={{
        account,
        memberships,
        currentStoreId,
        currentMembership,
        ready,
        isAuthed: !!userId,
        needsOnboarding: !!userId && memberships.length === 0,
        mode: "supabase",
        login: () => {},
        logout,
        switchStore,
        refresh: loadFromUser,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
