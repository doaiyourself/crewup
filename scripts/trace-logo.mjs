// logo-master.png 의 흰색 마크(머리 원 + 몸통 pill)를 픽셀 분석해 좌표 추출.
import sharp from "sharp";

const src = "apps/web/public/logo-master.png";
const { data, info } = await sharp(src)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const { width: W, height: H, channels: C } = info;

const isWhite = (x, y) => {
  const i = (y * W + x) * C;
  const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
  return a > 128 && r > 200 && g > 200 && b > 200;
};

// 열별 흰픽셀 수 → figure 경계(빈 열) 찾기
const colCount = new Array(W).fill(0);
for (let x = 0; x < W; x++)
  for (let y = 0; y < H; y++) if (isWhite(x, y)) colCount[x]++;

// 흰 열 구간 묶기 → 3개 figure
const ranges = [];
let start = -1;
for (let x = 0; x < W; x++) {
  if (colCount[x] > 0 && start < 0) start = x;
  else if (colCount[x] === 0 && start >= 0) { ranges.push([start, x - 1]); start = -1; }
}
if (start >= 0) ranges.push([start, W - 1]);

const scale = 1024 / W;
const r2 = (n) => Math.round(n * scale);

console.log(`이미지 ${W}x${H}, figure 열구간 ${ranges.length}개`);

const shapes = [];
for (const [x0, x1] of ranges) {
  // 이 열구간의 흰픽셀 y 분포 → 행별 카운트로 head/body 분리(빈 행 기준)
  const rowHas = [];
  for (let y = 0; y < H; y++) {
    let any = false;
    for (let x = x0; x <= x1; x++) if (isWhite(x, y)) { any = true; break; }
    rowHas[y] = any;
  }
  const segs = [];
  let s = -1;
  for (let y = 0; y < H; y++) {
    if (rowHas[y] && s < 0) s = y;
    else if (!rowHas[y] && s >= 0) { segs.push([s, y - 1]); s = -1; }
  }
  if (s >= 0) segs.push([s, H - 1]);

  // 각 세그먼트의 정확한 bbox
  for (const [y0, y1] of segs) {
    let minX = W, maxX = 0, minY = H, maxY = 0;
    for (let y = y0; y <= y1; y++)
      for (let x = x0; x <= x1; x++)
        if (isWhite(x, y)) {
          if (x < minX) minX = x; if (x > maxX) maxX = x;
          if (y < minY) minY = y; if (y > maxY) maxY = y;
        }
    const w = maxX - minX + 1, h = maxY - minY + 1;
    shapes.push({ x0: minX, y0: minY, w, h, ratio: (h / w).toFixed(2) });
  }
}

console.log("\n--- 추출된 도형 (1024 기준) ---");
for (const sh of shapes) {
  const cx = r2(sh.x0 + sh.w / 2), cy = r2(sh.y0 + sh.h / 2);
  if (sh.ratio < 1.25) {
    // 원(머리)
    console.log(`circle cx="${cx}" cy="${cy}" r="${r2(sh.w / 2)}"   (ratio ${sh.ratio})`);
  } else {
    // pill(몸통)
    console.log(`rect x="${r2(sh.x0)}" y="${r2(sh.y0)}" width="${r2(sh.w)}" height="${r2(sh.h)}" rx="${r2(sh.w / 2)}"`);
  }
}
