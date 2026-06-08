import type { Metadata } from "next";
import Link from "next/link";
import { LogoWordmark } from "@/components/logo";

export const metadata: Metadata = {
  title: "개인정보처리방침 — Crew Up",
};

// ⚠️ 표준 템플릿입니다. [대괄호] 항목을 사업자 정보로 채우고,
// 실제 운영 전 법무 검토를 받으세요. (법적 자문 아님)
export default function Privacy() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-10 text-slate-700">
      <Link href="/about" className="inline-block">
        <LogoWordmark size={28} />
      </Link>
      <h1 className="mt-6 text-2xl font-extrabold text-crew-dark">
        개인정보처리방침
      </h1>
      <p className="mt-1 text-sm text-slate-400">시행일: 2026-06-08</p>

      <div className="mt-6 space-y-6 text-sm leading-relaxed">
        <p>
          Crew Up(이하 “서비스”)은 「개인정보 보호법」 등 관련 법령을 준수하며,
          이용자의 개인정보를 다음과 같이 처리합니다.
        </p>

        <Section title="1. 수집하는 개인정보 항목">
          <ul className="list-disc space-y-1 pl-5">
            <li>카카오 로그인: 닉네임, 프로필 이미지, (선택) 이메일, 카카오 회원번호</li>
            <li>매장/사업자 정보: 상호, 사업자등록번호, 대표자명, 개업일자, 주소</li>
            <li>근무 정보: 출퇴근 기록, 근무 스케줄, 시급, 급여 산정 내역</li>
            <li>근로계약 정보: 계약 조건, 전자서명</li>
            <li>(선택) 위치정보: 출퇴근 본인확인을 위한 단말기 GPS 위치</li>
            <li>연락처(휴대전화번호 등 이용자가 입력한 정보)</li>
          </ul>
        </Section>

        <Section title="2. 개인정보의 이용 목적">
          <ul className="list-disc space-y-1 pl-5">
            <li>회원 식별 및 로그인(인증)</li>
            <li>출퇴근·스케줄·급여·근로계약 관리 서비스 제공</li>
            <li>사업자 진위확인(국세청 사업자등록정보 조회)</li>
            <li>서비스 운영·개선 및 고객 문의 대응</li>
          </ul>
        </Section>

        <Section title="3. 위치정보의 처리">
          <p>
            위치정보는 매장이 ‘GPS 출퇴근’을 설정한 경우에 한해, 출근/퇴근 시점에
            본인의 매장 반경 내 여부를 확인하는 목적으로만 사용됩니다. 이용자의
            동의(브라우저 위치 권한) 없이는 수집되지 않으며, 검증 외 목적의
            지속적 위치 추적은 하지 않습니다.
          </p>
        </Section>

        <Section title="4. 보유 및 이용기간">
          <p>
            원칙적으로 회원 탈퇴 시 지체 없이 파기합니다. 다만 관계 법령에 따라
            보존이 필요한 경우 해당 기간 동안 보관합니다. (예: 「근로기준법」상
            근로계약·임금대장 등 3년)
          </p>
        </Section>

        <Section title="5. 제3자 제공 및 처리위탁">
          <ul className="list-disc space-y-1 pl-5">
            <li>카카오(주): 소셜 로그인 인증</li>
            <li>
              Supabase(데이터베이스·호스팅): 서비스 데이터 저장 및 처리. 데이터가
              해외 리전에 저장될 수 있습니다.
            </li>
            <li>국세청: 사업자등록 진위확인(사업자번호·대표자명·개업일자 대조)</li>
          </ul>
        </Section>

        <Section title="6. 이용자의 권리">
          <p>
            이용자는 언제든지 자신의 개인정보 열람·정정·삭제·처리정지를 요청할 수
            있으며, 회원 탈퇴를 통해 동의를 철회할 수 있습니다.
          </p>
        </Section>

        <Section title="7. 개인정보 보호책임자">
          <p>
            성명/직책: [담당자명]
            <br />
            연락처: [이메일 주소]
            <br />
            상호/사업자: [상호] / [사업자등록번호]
          </p>
        </Section>

        <p className="text-xs text-slate-400">
          본 방침은 표준 양식을 기반으로 하며, 실제 서비스 운영 정보로 보완 후
          공개해야 합니다.
        </p>
      </div>

      <div className="mt-8 border-t border-slate-100 pt-4 text-sm">
        <Link href="/terms" className="text-brand">
          이용약관 보기 →
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
