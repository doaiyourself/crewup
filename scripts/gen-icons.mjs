// 로고 SVG → PWA 아이콘 PNG 생성 (1회성).
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const OUT = "apps/web/public";
mkdirSync(OUT, { recursive: true });

const marks = (color) => `
  <g fill="${color}">
    <circle cx="288" cy="565" r="64"/>
    <circle cx="512" cy="459" r="64"/>
    <circle cx="736" cy="352" r="64"/>
    <rect x="224" y="653" width="128" height="157" rx="64"/>
    <rect x="448" y="544" width="128" height="266" rx="64"/>
    <rect x="672" y="438" width="128" height="372" rx="64"/>
  </g>`;

// 둥근 사각 아이콘 (일반/애플)
const rounded = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <rect width="1024" height="1024" rx="232" fill="#2F6BFF"/>
  ${marks("#FFFFFF")}
</svg>`;

// 마스커블 (전체 채움 사각 + 중앙 안전영역)
const maskable = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <rect width="1024" height="1024" fill="#2F6BFF"/>
  <g transform="translate(512 512) scale(0.78) translate(-512 -512)">${marks("#FFFFFF")}</g>
</svg>`;

async function png(svg, file) {
  await sharp(Buffer.from(svg)).png().toFile(`${OUT}/${file}`);
  console.log("✓", file);
}

await png(rounded(192), "icon-192.png");
await png(rounded(512), "icon-512.png");
await png(rounded(180), "apple-touch-icon.png");
await png(maskable(512), "icon-maskable-512.png");
console.log("아이콘 생성 완료");
