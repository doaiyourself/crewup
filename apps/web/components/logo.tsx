// Crew Up 로고 — "라이징 크루"
// 세 사람(머리=원, 몸통=pill)이 왼→오 키가 커지며 우상향.
// 역할(사장/점장/직원·알바)이 한 팀으로 함께 성장한다는 의미.

type MarkVariant = "icon" | "mark" | "white";

// 마크 도형 (viewBox 0 0 1024 1024)
function Marks({ color }: { color: string }) {
  return (
    <g fill={color}>
      {/* 머리 (원) — 세 명 동일 크기, 왼→오 상승 */}
      <circle cx="285" cy="555" r="70" />
      <circle cx="512" cy="440" r="70" />
      <circle cx="739" cy="325" r="70" />
      {/* 몸통 (pill) — 동일 너비, 바닥선 y=815 공유, 오른쪽일수록 길어짐 */}
      <rect x="215" y="660" width="140" height="155" rx="70" />
      <rect x="442" y="545" width="140" height="270" rx="70" />
      <rect x="669" y="430" width="140" height="385" rx="70" />
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
