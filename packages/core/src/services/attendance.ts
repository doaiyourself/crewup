// 출퇴근 서비스 — 플랫폼 공유.
// Supabase 클라이언트를 주입받아 순수 로직만 담는다.
// 웹(@supabase/ssr 쿠키)·모바일(supabase-js+AsyncStorage)이 클라이언트만 따로 만들고
// 이 로직은 그대로 공유한다.

// 최소한의 클라이언트 형태만 정의 (supabase-js / ssr 둘 다 호환)
export interface SupabaseLike {
  from: (table: string) => any;
  auth: { getUser: () => Promise<{ data: { user: { id: string } | null } }> };
}

export interface TodayAttendance {
  status: "off" | "working" | "done";
  clockInAt: string | null;
  clockOutAt: string | null;
}

function today(): string {
  // YYYY-MM-DD (로컬)
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function createAttendanceService(supabase: SupabaseLike) {
  async function getToday(storeId: string): Promise<TodayAttendance> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { status: "off", clockInAt: null, clockOutAt: null };

    const { data } = await supabase
      .from("attendance")
      .select("clock_in_at, clock_out_at")
      .eq("store_id", storeId)
      .eq("user_id", user.id)
      .eq("work_date", today())
      .maybeSingle();

    if (!data) return { status: "off", clockInAt: null, clockOutAt: null };
    const status: TodayAttendance["status"] = data.clock_out_at
      ? "done"
      : data.clock_in_at
      ? "working"
      : "off";
    return {
      status,
      clockInAt: data.clock_in_at ?? null,
      clockOutAt: data.clock_out_at ?? null,
    };
  }

  async function clockIn(storeId: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("NOT_AUTHENTICATED");
    return supabase
      .from("attendance")
      .upsert(
        {
          store_id: storeId,
          user_id: user.id,
          work_date: today(),
          clock_in_at: new Date().toISOString(),
        },
        { onConflict: "store_id,user_id,work_date" }
      )
      .select()
      .single();
  }

  async function clockOut(storeId: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("NOT_AUTHENTICATED");
    return supabase
      .from("attendance")
      .update({ clock_out_at: new Date().toISOString() })
      .eq("store_id", storeId)
      .eq("user_id", user.id)
      .eq("work_date", today())
      .select()
      .single();
  }

  return { getToday, clockIn, clockOut };
}
