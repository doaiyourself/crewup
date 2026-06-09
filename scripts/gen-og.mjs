// OG 공유 카드 이미지(1200x630) 생성 → public/og.png
import sharp from "sharp";

const marks = `
  <g fill="#FFFFFF">
    <circle cx="288" cy="565" r="64"/>
    <circle cx="512" cy="459" r="64"/>
    <circle cx="736" cy="352" r="64"/>
    <rect x="224" y="653" width="128" height="157" rx="64"/>
    <rect x="448" y="544" width="128" height="266" rx="64"/>
    <rect x="672" y="438" width="128" height="372" rx="64"/>
  </g>`;

const svg = `
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#2F6BFF"/>
      <stop offset="1" stop-color="#1E54E6"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <!-- 로고 마크 (1024 좌표계를 좌측에 배치) -->
  <g transform="translate(150,150) scale(0.32)">
    <rect x="0" y="0" width="1024" height="1024" rx="232" fill="rgba(255,255,255,0.16)"/>
    ${marks}
  </g>
  <!-- 텍스트 -->
  <text x="520" y="300" font-family="Apple SD Gothic Neo, NanumGothic, sans-serif" font-size="120" font-weight="800" fill="#FFFFFF">Crew Up</text>
  <text x="524" y="375" font-family="Apple SD Gothic Neo, NanumGothic, sans-serif" font-size="40" font-weight="600" fill="#DCEAFF">알바 출퇴근 · 근로계약 · 급여 관리</text>
  <text x="524" y="440" font-family="Apple SD Gothic Neo, NanumGothic, sans-serif" font-size="32" fill="#BBD3FF">출근부터 급여까지, 우리 가게 크루를 한 팀으로.</text>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile("apps/web/public/og.png");
console.log("✓ og.png 생성");
