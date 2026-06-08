// 키오스크는 세션 없는 공개 페이지 (기기 토큰으로만 동작).
// 관리자 로그인을 기기에 두지 않으므로 가드 없음.
export default function KioskLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
