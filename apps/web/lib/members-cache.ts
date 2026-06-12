// 매장 멤버(list_store_members) 세션 메모리 캐시.
// 거의 모든 관리자 화면이 멤버 목록을 받으므로, 화면 전환마다 RPC를 다시 기다리지
// 않도록 캐시한다. 화면은 캐시를 즉시 보여주고(없으면 빈 배열) 백그라운드로 갱신한다.
import type { Role } from "@/lib/mock-data";

export interface StoreMember {
  user_id: string;
  name: string;
  avatar_color: string;
  phone: string | null;
  role: Role;
  position: string | null;
  hourly_wage: number;
  status: string;
  joined_at: string;
}

const cache = new Map<string, StoreMember[]>();

export function getCachedMembers(storeId: string | null | undefined): StoreMember[] {
  return (storeId && cache.get(storeId)) || [];
}

export function hasCachedMembers(storeId: string | null | undefined): boolean {
  return !!storeId && cache.has(storeId);
}

export function setCachedMembers(
  storeId: string | null | undefined,
  members: StoreMember[]
) {
  if (storeId) cache.set(storeId, members);
}
