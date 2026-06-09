// Crew Up 로고 — "라이징 크루"
// 세 사람(머리=원, 몸통=pill)이 왼→오 키가 커지며 우상향.
// 역할(사장/점장/직원·알바)이 한 팀으로 함께 성장한다는 의미.

type MarkVariant = "icon" | "mark" | "white";

// 마크 도형 (viewBox 0 0 1024 1024)
function Marks({ color }: { color: string }) {
  return (
    <g fill={color}>
      {/* 머리 (원) — 마스터 로고 좌표(픽셀 추출), r=64, 왼→오 상승 */}
      <circle cx="288" cy="565" r="64" />
      <circle cx="512" cy="459" r="64" />
      <circle cx="736" cy="352" r="64" />
      {/* 몸통 (pill) — 너비 128, 바닥선 y=810 공유 */}
      <rect x="224" y="653" width="128" height="157" rx="64" />
      <rect x="448" y="544" width="128" height="266" rx="64" />
      <rect x="672" y="438" width="128" height="372" rx="64" />
    </g>
  );
}

export function LogoMark({
  size = 40,
  variant = "icon",
  className = "",
}: {
  size?: number;
  variant?: MarkVariant;
  className?: string;
}) {
  // icon: 파란 사각형 포함 → 전체 1024 viewBox (마스터와 동일 비율)
  // mark/white: 사각형 없이 마크만 → 마크 bbox에 꽉 맞춘 정사각 viewBox로 크롭
  //   (마크 bbox x:224~800, y:288~810, 중심 512/549, 한 변 576 + 여백)
  const viewBox = variant === "icon" ? "0 0 1024 1024" : "176 213 672 672";
  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Crew Up 로고"
      className={className}
    >
      {variant === "icon" && (
        <rect width="1024" height="1024" rx="232" fill="#2F6BFF" />
      )}
      <Marks
        color={
          variant === "icon" || variant === "white" ? "#FFFFFF" : "#2F6BFF"
        }
      />
    </svg>
  );
}

// 로고 + 워드마크 (가로 배치)
export function LogoWordmark({
  size = 36,
  variant = "icon",
  textClassName = "text-crew-dark",
}: {
  size?: number;
  variant?: MarkVariant;
  textClassName?: string;
}) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark size={size} variant={variant} />
      <span
        className={`text-xl font-extrabold tracking-tight ${textClassName}`}
      >
        Crew Up
      </span>
    </span>
  );
}
