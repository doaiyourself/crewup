// Crew Up 로고 — "라이징 크루"
// 세 사람(머리=원, 몸통=pill)이 왼→오 키가 커지며 우상향.
// 역할(사장/점장/직원·알바)이 한 팀으로 함께 성장한다는 의미.

type MarkVariant = "icon" | "mark" | "white";

// 마크 도형 (viewBox 0 0 1024 1024)
function Marks({ color }: { color: string }) {
  return (
    <g fill={color}>
      {/* 머리 (원) */}
      <circle cx="274" cy="566" r="58" />
      <circle cx="512" cy="460" r="68" />
      <circle cx="750" cy="360" r="68" />
      {/* 몸통 (pill) — 바닥선 y=810 공유, 오른쪽일수록 길어짐 */}
      <rect x="216" y="662" width="116" height="148" rx="58" />
      <rect x="444" y="556" width="136" height="254" rx="68" />
      <rect x="682" y="456" width="136" height="354" rx="68" />
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
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 1024 1024"
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
