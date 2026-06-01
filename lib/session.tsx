"use client";

// 카카오 SSO(Supabase Auth) 연동 전 임시 세션 컨텍스트.
// 현재는 localStorage에 데모 계정을 저장. 추후 Supabase 세션으로 교체. (PRD §5.3)

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { DEMO_ACCOUNTS, type Account } from "./mock-data";

const STORAGE_KEY = "crewup.session";

interface SessionValue {
  account: Account | null;
  ready: boolean; // localStorage 로딩 완료 여부
  login: (account: Account) => void;
  logout: () => void;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const id = JSON.parse(raw) as string;
        const found = DEMO_ACCOUNTS.find((a) => a.id === id);
        if (found) setAccount(found);
      }
    } catch {
      // ignore
    }
    setReady(true);
  }, []);

  const login = (acc: Account) => {
    setAccount(acc);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(acc.id));
    } catch {
      // ignore
    }
  };

  const logout = () => {
    setAccount(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  return (
    <SessionContext.Provider value={{ account, ready, login, logout }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
