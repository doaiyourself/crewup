import type { Metadata } from "next";
import Link from "next/link";
import { LogoWordmark } from "@/components/logo";

export const metadata: Metadata = {
  title: "이용약관 — Crew Up",
};

// ⚠️ 표준 템플릿입니다. 운영 전 법무 검토 권장. (법적 자문 아님)
export default function Terms() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-10 text-slate-700">
      <Link href="/about" className="inline-block">
        <LogoWordmark size={28} />
      </Link>
      <h1 className="mt-6 text-2xl font-extrabold text-crew-dark">이용약관</h1>
      <p className="mt-1 text-sm text-slate-400">시행일: 2026-06-08</p>

      <div className="mt-6 space-y-6 text-sm leading-relaxed">
        <Section title="제1조 (목적)">
          <p>
            본 약관은 Crew Up(이하 “서비스”)의 이용 조건 및 절차, 이용자와
            운영자의 권리·의무 등을 규정함을 목적으로 합니다.
          </p>
        </Section>

        <Section title="제2조 (정의)">
          <ul className="list-disc space-y-1 pl-5">
            <li>“이용자”란 본 약관에 따라 서비스를 이용하는 사장님·점장·직원·알바를 말합니다.</li>
            <li>“매장”이란 서비스에 등록된 사업장 단위를 말합니다.</li>
          </ul>
        </Section>

        <Section title="제3조 (서비스의 내용)">
          <p>
            서비스는 알바·직원의 출퇴근 관리, 근무 스케줄, 근로계약, 급여 산정 등
            매장 운영 관리 기능을 제공합니다. 급여·수당 계산값은 참고용 추정치이며,
            확정 급여는 운영자(사장님)의 정산을 따릅니다.
          </p>
        </Section>

        <Section title="제4조 (이용자의 의무)">
          <ul className="list-disc space-y-1 pl-5">
            <li>타인의 정보(사업자정보 포함)를 도용하지 않습니다.</li>
            <li>출퇴근 기록을 부정하게 조작하지 않습니다.</li>
            <li>관계 법령과 본 약관을 준수합니다.</li>
          </ul>
        </Section>

        <Section title="제5조 (면책)">
          <p>
            서비스가 제공하는 노동법·세무 관련 계산값은 참고 자료이며, 법정
            기준의 최종 적용 및 책임은 사업주에게 있습니다. 천재지변, 제3자 서비스
            (카카오·호스팅 등) 장애로 인한 손해에 대해 운영자는 책임을 지지
            않습니다.
          </p>
        </Section>

        <Section title="제6조 (준거법)">
          <p>본 약관은 대한민국 법령에 따라 해석·적용됩니다.</p>
        </Section>

        <p className="text-xs text-slate-400">
          본 약관은 표준 양식을 기반으로 하며, 운영 정보로 보완 후 공개해야 합니다.
        </p>
      </div>

      <div className="mt-8 border-t border-slate-100 pt-4 text-sm">
        <Link href="/privacy" className="text-brand">
          개인정보처리방침 보기 →
        </Link>
      </div>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-1.5 font-bold text-crew-dark">{title}</h2>
      {children}
    </section>
  );
}
