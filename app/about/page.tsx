import type { Metadata } from "next";
import Link from "next/link";
import { LogoMark, LogoWordmark } from "@/components/logo";

export const metadata: Metadata = {
  title: "Crew Up — 우리 가게 크루를 한 팀으로",
  description:
    "출근부터 급여까지, 흩어진 알바 관리를 한 곳에서. 출퇴근·근로계약·급여·스케줄을 한 팀으로 묶는 매장 관리 서비스, 크루업.",
};

// 라이징 크루 마크 (텍스트 옆 작은 장식용)
function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition hover:shadow-md">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand/10 text-2xl">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-bold text-crew-dark">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{desc}</p>
    </div>
  );
}

function RoleChip({
  label,
  desc,
  height,
}: {
  label: string;
  desc: string;
  height: string;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="flex items-end" style={{ height: 96 }}>
        <div
          className="w-12 rounded-t-full rounded-b-lg bg-brand"
          style={{ height }}
        />
      </div>
      <p className="mt-3 font-bold text-crew-dark">{label}</p>
      <p className="mt-0.5 text-xs text-slate-500">{desc}</p>
    </div>
  );
}

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white text-crew-dark">
      {/* 상단 네비 */}
      <header className="sticky top-0 z-20 border-b border-slate-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <LogoWordmark size={32} />
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition hover:text-brand"
            >
              로그인
            </Link>
            <Link
              href="/login"
              className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
            >
              시작하기
            </Link>
          </div>
        </div>
      </header>

      {/* 히어로 */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-brand/5 to-transparent" />
        <div className="relative mx-auto max-w-6xl px-5 pb-20 pt-16 text-center sm:pt-24">
          <LogoMark size={88} variant="icon" className="mx-auto drop-shadow-lg" />
          <p className="mt-7 inline-block rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
            알바 출퇴근 · 근로계약 · 급여 관리
          </p>
          <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            출근부터 급여까지,
            <br />
            우리 가게 크루를{" "}
            <span className="text-brand">한 팀</span>으로.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-500 sm:text-lg">
            흩어진 알바 관리, 이제 한 곳에서. 출퇴근·계약·급여·스케줄을
            크루업 하나로 묶어 가게의 성장을 함께 만듭니다.
          </p>
          <p className="mt-3 text-sm font-medium tracking-wide text-slate-400">
            Get your crew up.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/login"
              className="w-full rounded-xl bg-brand px-7 py-3.5 text-base font-bold text-white shadow-md transition hover:bg-brand-dark active:scale-[0.98] sm:w-auto"
            >
              카카오로 시작하기
            </Link>
            <a
              href="#features"
              className="w-full rounded-xl border border-slate-200 px-7 py-3.5 text-base font-bold text-slate-700 transition hover:border-brand hover:text-brand sm:w-auto"
            >
              기능 둘러보기
            </a>
          </div>
        </div>
      </section>

      {/* 브랜드 스토리 — 라이징 크루 */}
      <section className="border-y border-slate-100 bg-slate-50/60">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 md:grid-cols-2">
          <div className="flex justify-center">
            <div className="rounded-[2rem] bg-brand p-10 shadow-xl">
              <LogoMark size={180} variant="white" />
            </div>
          </div>
          <div>
            <p className="text-sm font-bold text-brand">브랜드 스토리</p>
            <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">
              라이징 크루 — 함께 올라가는 팀
            </h2>
            <ul className="mt-5 space-y-4 text-sm leading-relaxed text-slate-600">
              <li className="flex gap-3">
                <span className="font-bold text-brand">크루(Crew)</span>
                <span>
                  흩어져 있던 알바·직원이 한 화면, 한 팀으로 정렬됩니다.
                  출퇴근·계약·급여가 한 곳에 모인다는 제품의 본질이에요.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-brand">업(Up)</span>
                <span>
                  왼쪽에서 오른쪽으로 키가 커지는 배열은 매장의 성장과
                  우상향을 형상화합니다. ‘팀을 꾸리다(crew up)’와도 맞물려요.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-brand">조화</span>
                <span>
                  높이가 다른 세 사람은 사장님·점장·직원·알바처럼 역할은 달라도
                  하나의 팀이라는 의미를 담았습니다.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 배경 — 왜 크루업인가 */}
      <section className="mx-auto max-w-3xl px-5 py-16 text-center">
        <h2 className="text-2xl font-extrabold sm:text-3xl">
          크루몬의 빈자리를 채웁니다
        </h2>
        <p className="mt-4 text-base leading-relaxed text-slate-500">
          알바생의 출퇴근·근로계약·급여를 관리하던 ‘크루몬’ 서비스가 종료되며,
          많은 사장님이 대체 도구를 찾고 있습니다. 크루업은 그 핵심 기능을
          동등 이상으로 잇고, 모바일에서 더 빠르고 명확하게 쓸 수 있도록
          새로 만든 매장 관리 파트너입니다.
        </p>
      </section>

      {/* 핵심 기능 */}
      <section id="features" className="bg-slate-50/60 py-16">
        <div className="mx-auto max-w-6xl px-5">
          <div className="text-center">
            <p className="text-sm font-bold text-brand">핵심 기능</p>
            <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">
              가게 운영, 이 한 곳에서
            </h2>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon="⏱"
              title="출퇴근 관리"
              desc="버튼 한 번에 출근·퇴근. 실시간 근무 현황과 지각·결근 정정까지 한눈에."
            />
            <FeatureCard
              icon="📄"
              title="근로계약서"
              desc="표준근로계약서 작성과 전자 서명, PDF 보관·갱신 관리를 간편하게."
            />
            <FeatureCard
              icon="💰"
              title="급여 계산"
              desc="근무 기록 기반 자동 산정. 주휴수당·야간 가산·공제까지 명세서로 발행."
            />
            <FeatureCard
              icon="📅"
              title="스케줄 관리"
              desc="주간 근무표를 손쉽게 편성하고, 충돌·초과근무를 미리 경고합니다."
            />
            <FeatureCard
              icon="📊"
              title="관리자 대시보드"
              desc="인건비·근무시간·출근율 통계로 매장 운영을 데이터로 파악."
            />
            <FeatureCard
              icon="💬"
              title="카카오 간편 로그인"
              desc="복잡한 가입 없이 카카오로 시작. 모바일에서 어디서나 바로 사용."
            />
          </div>
        </div>
      </section>

      {/* 역할 한 팀 */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="text-center">
          <p className="text-sm font-bold text-brand">하나의 팀</p>
          <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">
            역할은 달라도, 한 팀입니다
          </h2>
          <p className="mt-3 text-sm text-slate-500">
            권한은 매장 단위로 부여되어 각자에게 꼭 필요한 화면만 보입니다.
          </p>
        </div>
        <div className="mx-auto mt-10 grid max-w-2xl grid-cols-4 gap-4">
          <RoleChip label="알바" desc="본인 근무·급여" height="40px" />
          <RoleChip label="직원" desc="본인 근무·계약" height="60px" />
          <RoleChip label="점장" desc="승인·스케줄" height="80px" />
          <RoleChip label="사장님" desc="매장 전체 관리" height="96px" />
        </div>
      </section>

      {/* CTA 밴드 */}
      <section className="bg-gradient-to-br from-brand to-brand-dark">
        <div className="mx-auto max-w-4xl px-5 py-16 text-center text-white">
          <LogoMark size={56} variant="white" className="mx-auto" />
          <h2 className="mt-5 text-2xl font-extrabold sm:text-3xl">
            우리 가게 팀워크의 시작
          </h2>
          <p className="mt-3 text-blue-100">
            지금 카카오로 1분 만에 시작해 보세요.
          </p>
          <Link
            href="/login"
            className="mt-7 inline-block rounded-xl bg-white px-8 py-3.5 text-base font-bold text-brand shadow-md transition hover:bg-blue-50 active:scale-[0.98]"
          >
            크루업 시작하기
          </Link>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="border-t border-slate-100 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 text-sm text-slate-400 sm:flex-row">
          <LogoWordmark size={26} textClassName="text-slate-500" />
          <p>출근부터 급여까지, 우리 가게 크루를 한 팀으로.</p>
          <p>© 2026 Crew Up</p>
        </div>
      </footer>
    </main>
  );
}
