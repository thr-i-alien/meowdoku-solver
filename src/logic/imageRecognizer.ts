import type { RegionColor, CellStatus } from '../types/game';

export interface CropBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface HSV {
  h: number; // 0 ~ 360
  s: number; // 0 ~ 1
  v: number; // 0 ~ 1
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return `#${[clamp(r), clamp(g), clamp(b)]
    .map((x) => x.toString(16).padStart(2, '0'))
    .join('')}`;
}

function getBorderColor(r: number, g: number, b: number): string {
  return rgbToHex(r * 0.78, g * 0.78, b * 0.78);
}

function rgbToHsv(r: number, g: number, b: number): HSV {
  const rf = r / 255;
  const gf = g / 255;
  const bf = b / 255;
  const max = Math.max(rf, gf, bf);
  const min = Math.min(rf, gf, bf);
  const d = max - min;

  let h = 0;
  if (d > 0) {
    if (max === rf) {
      h = ((gf - bf) / d + (gf < bf ? 6 : 0)) * 60;
    } else if (max === gf) {
      h = ((bf - rf) / d + 2) * 60;
    } else {
      h = ((rf - gf) / d + 4) * 60;
    }
  }

  const s = max === 0 ? 0 : d / max;
  const v = max;
  return { h, s, v };
}

// 根據 RGB 自動賦予繁體中文與英文色彩名稱
function getColorNamesFromRGB(
  r: number,
  g: number,
  b: number,
  index: number
): { name: string; nameEn: string } {
  const hsv = rgbToHsv(r, g, b);
  const { h, s, v } = hsv;

  if (s < 0.12) {
    if (v > 0.8) return { name: `米白 (${index + 1})`, nameEn: `Off-White (${index + 1})` };
    if (v < 0.3) return { name: `深灰 (${index + 1})`, nameEn: `Dark Gray (${index + 1})` };
    return { name: `暖灰 (${index + 1})`, nameEn: `Warm Gray (${index + 1})` };
  }

  if (h >= 345 || h < 14) {
    return { name: `珊瑚粉紅 (${index + 1})`, nameEn: `Coral Pink (${index + 1})` };
  }
  if (h >= 14 && h < 38) {
    return { name: `焦糖橘 (${index + 1})`, nameEn: `Caramel Orange (${index + 1})` };
  }
  if (h >= 38 && h < 65) {
    return { name: `芥末金黃 (${index + 1})`, nameEn: `Mustard Gold (${index + 1})` };
  }
  if (h >= 65 && h < 160) {
    return v < 0.5
      ? { name: `深松綠 (${index + 1})`, nameEn: `Pine Green (${index + 1})` }
      : { name: `草木青綠 (${index + 1})`, nameEn: `Botanical Green (${index + 1})` };
  }
  if (h >= 160 && h < 200) {
    return { name: `湖水青 (${index + 1})`, nameEn: `Lake Cyan (${index + 1})` };
  }
  if (h >= 200 && h < 255) {
    return { name: `晴空藍 (${index + 1})`, nameEn: `Sky Blue (${index + 1})` };
  }
  if (h >= 255 && h < 290) {
    return { name: `丁香紫 (${index + 1})`, nameEn: `Lilac Purple (${index + 1})` };
  }
  if (h >= 290 && h < 345) {
    return { name: `玫瑰粉櫻 (${index + 1})`, nameEn: `Rose Cherry (${index + 1})` };
  }
  return { name: `色彩 (${index + 1})`, nameEn: `Color (${index + 1})` };
}

// 結合 RGB 歐氏距離與 HSV 色相環形距離（大幅強化對微量孤立色相如芥末黃的鑑別力）
function perceptualColorDistance(c1: RGB, c2: RGB): number {
  const hsv1 = rgbToHsv(c1.r, c1.g, c1.b);
  const hsv2 = rgbToHsv(c2.r, c2.g, c2.b);

  // 色相角度差 (0 ~ 180)
  let dh = Math.abs(hsv1.h - hsv2.h);
  if (dh > 180) dh = 360 - dh;

  const satWeight = Math.min(hsv1.s, hsv2.s); // 飽和度越高，色相對比越關鍵
  const hueDistSq = (dh / 180) * (dh / 180) * 120000 * satWeight;

  const dr = c1.r - c2.r;
  const dg = c1.g - c2.g;
  const db = c1.b - c2.b;
  const rgbDistSq = dr * dr * 0.3 + dg * dg * 0.59 + db * db * 0.11;

  return rgbDistSq + hueDistSq;
}

// 採用 Max-Min 代表格挑選法 + 局部微調聚類，徹底保護僅有 1 格的孤立微小色塊
function robustColorClustering(
  pixels: RGB[],
  k: number
): { assignments: number[]; centers: RGB[] } {
  const n = pixels.length;
  if (k >= n) {
    return {
      assignments: pixels.map((_, i) => i % k),
      centers: pixels.slice(0, k),
    };
  }

  // 1. Max-Min Diversity 挑選 k 個相異度最大的像素作為中心種子
  const centerIndices: number[] = [];
  // 挑選第 1 個：離平均最遠或第 1 個
  centerIndices.push(0);

  while (centerIndices.length < k) {
    let bestCandidate = 0;
    let maxMinDist = -1;

    for (let i = 0; i < n; i++) {
      let minDistToExisting = Infinity;
      for (const cIdx of centerIndices) {
        const d = perceptualColorDistance(pixels[i], pixels[cIdx]);
        if (d < minDistToExisting) minDistToExisting = d;
      }
      if (minDistToExisting > maxMinDist) {
        maxMinDist = minDistToExisting;
        bestCandidate = i;
      }
    }

    centerIndices.push(bestCandidate);
  }

  const centers: RGB[] = centerIndices.map((idx) => ({ ...pixels[idx] }));

  // 2. 將每個 pixel 分配給距離最近的原型中心
  const assignments = new Array<number>(n).fill(0);
  for (let i = 0; i < n; i++) {
    let minDist = Infinity;
    let bestC = 0;
    for (let c = 0; c < k; c++) {
      const d = perceptualColorDistance(pixels[i], centers[c]);
      if (d < minDist) {
        minDist = d;
        bestC = c;
      }
    }
    assignments[i] = bestC;
  }

  // 3. 重新計算每群的平均 RGB（若某群只有 1 格，其中心維持該格原汁原味的原色）
  for (let c = 0; c < k; c++) {
    let rSum = 0;
    let gSum = 0;
    let bSum = 0;
    let count = 0;
    for (let i = 0; i < n; i++) {
      if (assignments[i] === c) {
        rSum += pixels[i].r;
        gSum += pixels[i].g;
        bSum += pixels[i].b;
        count++;
      }
    }
    if (count > 0) {
      centers[c] = {
        r: Math.round(rSum / count),
        g: Math.round(gSum / count),
        b: Math.round(bSum / count),
      };
    }
  }

  return { assignments, centers };
}

export interface BoardDetectionResult {
  cropBox: CropBox;
  dimension: number;
  confidence: number;
}

/**
 * 電腦視覺辨識管線 (Computer Vision Pipeline)：
 * 1. 影像灰階與梯度預處理
 * 2. 棋盤邊界定位 (Board Localization)：透過色彩飽和度、邊緣能量密度與正方形幾何特徵，精準鎖定棋盤外框
 * 3. 網格維度推論 (Dimension Inference)：針對 4~12 維度計算「格線邊界梯度峰值」與「單元格內部色彩均質性」，評估最佳 N×N 維度
 */
export function detectBoardAndDimension(
  imageElement: HTMLImageElement,
  fallbackDimension: number = 8
): BoardDetectionResult {
  const nw = imageElement.naturalWidth;
  const nh = imageElement.naturalHeight;
  if (!nw || !nh) {
    return {
      cropBox: { x: 5, y: 20, width: 90, height: 60 },
      dimension: fallbackDimension,
      confidence: 0,
    };
  }

  // 1. 等比縮放至分析畫布 (基準寬度 600px，保留微小格線縫隙高保真度，純 JS 分析耗時 < 15ms)
  const baseW = 600;
  const scale = baseW / nw;
  const w = baseW;
  const h = Math.round(nh * scale);

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    return {
      cropBox: { x: 3.5, y: 5.0, width: 93.0, height: 87.0 },
      dimension: fallbackDimension,
      confidence: 0,
    };
  }

  canvas.width = w;
  canvas.height = h;
  ctx.drawImage(imageElement, 0, 0, w, h);

  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  // 1. 自適應採樣極端邊界背景基底色彩 (從四個極端角與微小外邊緣採樣，安全避開局部裁切截圖中的棋盤內部)
  const bgSampleCoords = [
    [Math.max(1, Math.round(w * 0.01)), Math.max(1, Math.round(h * 0.01))],
    [Math.min(w - 2, Math.round(w * 0.99)), Math.max(1, Math.round(h * 0.01))],
    [Math.max(1, Math.round(w * 0.01)), Math.min(h - 2, Math.round(h * 0.99))],
    [Math.min(w - 2, Math.round(w * 0.99)), Math.min(h - 2, Math.round(h * 0.99))],
    [Math.round(w * 0.50), Math.max(1, Math.round(h * 0.005))],
    [Math.round(w * 0.50), Math.min(h - 2, Math.round(h * 0.995))],
  ];
  let bgR = 0, bgG = 0, bgB = 0;
  for (const [sx, sy] of bgSampleCoords) {
    const idx = (sy * w + sx) * 4;
    bgR += data[idx];
    bgG += data[idx + 1];
    bgB += data[idx + 2];
  }
  bgR /= bgSampleCoords.length;
  bgG /= bgSampleCoords.length;
  bgB /= bgSampleCoords.length;

  // 計算灰階與前景棋盤色塊遮罩
  const gray = new Float32Array(w * h);
  const isColor = new Uint8Array(w * h);

  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    gray[p] = 0.299 * r + 0.587 * g + 0.114 * b;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const s = max === 0 ? 0 : (max - min) / max;
    const v = max / 255;

    // 計算與背景底色之色差
    const distBg = Math.sqrt((r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2);

    // 棋盤格子為色彩飽和或與背景顯著相異的前景色，排除米白/淡灰/純黑背景底板
    const isSaturated = s >= 0.14 && v >= 0.18 && v <= 0.98;
    const isDistinctColor = distBg >= 30 && (s >= 0.08 || (v >= 0.15 && v <= 0.90));
    const isWhiteCard = max > 242 && (max - min) < 20;
    const isDarkText = max < 60;

    isColor[p] = (isSaturated || isDistinctColor) && distBg >= 22 && !isWhiteCard && !isDarkText ? 1 : 0;
  }

  // 2. 逐行統計實心棋盤行 (全圖 0 ~ h-1 掃描，完美支援長截圖與局部裁切圖)
  // 棋盤本質特徵：水平跨度佔全寬 60% 以上，且彩色像素飽和度高
  const isSolidRow = new Uint8Array(h);
  const rowMinX = new Int32Array(h);
  const rowMaxX = new Int32Array(h);

  for (let y = 0; y < h; y++) {
    const rowOffset = y * w;
    let count = 0;
    let minX = w;
    let maxX = -1;

    for (let x = 0; x < w; x++) {
      if (isColor[rowOffset + x]) {
        count++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
      }
    }

    const span = maxX - minX;
    if (span >= w * 0.60 && count >= span * 0.35) {
      isSolidRow[y] = 1;
      rowMinX[y] = minX;
      rowMaxX[y] = maxX;
    }
  }

  // 收集連續實心段落
  const segments: { start: number; end: number; len: number }[] = [];
  let curStart = -1;
  for (let y = 0; y < h; y++) {
    if (isSolidRow[y]) {
      if (curStart === -1) curStart = y;
    } else {
      if (curStart !== -1) {
        segments.push({ start: curStart, end: y - 1, len: y - curStart });
        curStart = -1;
      }
    }
  }
  if (curStart !== -1) {
    segments.push({ start: curStart, end: h - 1, len: h - curStart });
  }

  // 棋盤內部行間細縫為 5~6 像素，以 10 像素平滑橋接，同時完全隔絕 50+ 像素外的上方卡片
  const mergedSegments: { start: number; end: number; len: number }[] = [];
  for (const seg of segments) {
    if (mergedSegments.length === 0) {
      mergedSegments.push({ ...seg });
    } else {
      const last = mergedSegments[mergedSegments.length - 1];
      if (seg.start - last.end <= 10) {
        last.end = seg.end;
        last.len = last.end - last.start + 1;
      } else {
        mergedSegments.push({ ...seg });
      }
    }
  }

  // 尋找正方形吻合度最高的連通區段 (幾何對稱與高寬一致性)
  let bestCandidate: {
    start: number;
    end: number;
    len: number;
    left: number;
    right: number;
    w: number;
  } | null = null;
  let bestScore = -1;

  for (const seg of mergedSegments) {
    const midY = Math.round((seg.start + seg.end) / 2);
    let minLeft = w;
    let maxRight = -1;
    let sampleRows = 0;

    for (let dy = -8; dy <= 8; dy += 2) {
      const cy = Math.max(0, Math.min(h - 1, midY + dy));
      if (isSolidRow[cy]) {
        if (rowMinX[cy] < minLeft) minLeft = rowMinX[cy];
        if (rowMaxX[cy] > maxRight) maxRight = rowMaxX[cy];
        sampleRows++;
      }
    }

    if (sampleRows > 0 && maxRight > minLeft) {
      const segW = maxRight - minLeft;
      const segH = seg.len;
      const aspect = segH / segW;

      // 棋盤本體為高度與寬度接近的正方形 (長寬比 0.70 ~ 1.30)，且寬度佔比至少 50%
      if (aspect >= 0.70 && aspect <= 1.30 && segW >= w * 0.50) {
        const aspectDiff = Math.abs(1.0 - aspect);
        const score = segH * (1.0 - aspectDiff * 0.8);
        if (score > bestScore) {
          bestScore = score;
          bestCandidate = {
            start: seg.start,
            end: seg.end,
            len: seg.len,
            left: minLeft,
            right: maxRight,
            w: segW,
          };
        }
      }
    }
  }

  // 若無完全吻合正方形者，回退至高度最大連通區段
  const bestSeg =
    bestCandidate ||
    (mergedSegments.length > 0
      ? (() => {
          const sorted = [...mergedSegments].sort((a, b) => b.len - a.len);
          const top = sorted[0];
          const mid = Math.round((top.start + top.end) / 2);
          const minLeft = rowMinX[mid] > 0 ? rowMinX[mid] : Math.round(w * 0.035);
          const maxRight = rowMaxX[mid] > 0 ? rowMaxX[mid] : Math.round(w * 0.965);
          return {
            start: top.start,
            end: top.end,
            len: top.len,
            left: minLeft,
            right: maxRight,
            w: maxRight - minLeft,
          };
        })()
      : {
          start: Math.round(h * 0.05),
          end: Math.round(h * 0.92),
          len: Math.round(h * 0.87),
          left: Math.round(w * 0.035),
          right: Math.round(w * 0.965),
          w: Math.round(w * 0.93),
        });

  // 嚴格貼合色塊邊界，杜絕外部白底侵入
  const bestLeft = bestSeg.left;
  const bestRight = bestSeg.right;
  const bestTop = bestSeg.start;
  const bestBottom = bestSeg.end;

  const finalW = bestRight - bestLeft;
  const finalH = bestBottom - bestTop;

  // 3. 維度推論：貫穿式垂直格線統計分析 (先過濾踩到水平格線之整行全白剖面，再進行中心聚類與距離防抖)
  const validTestRows: number[] = [];
  for (let fy = 0.08; fy <= 0.92; fy += 0.06) {
    const scanY = Math.round(bestTop + finalH * fy);
    if (scanY >= 0 && scanY < h) {
      let whiteCount = 0;
      for (let lx = 0; lx < finalW; lx++) {
        const p = scanY * w + (bestLeft + lx);
        const r = data[p * 4], g = data[p * 4 + 1], b = data[p * 4 + 2];
        if (r > 235 && g > 235 && b > 235) whiteCount++;
      }
      // 若整行白像素超過 20%，為橫向水平格線縫隙，直接捨棄，只保留純色色塊內部之剖面
      if (whiteCount <= finalW * 0.20) {
        validTestRows.push(scanY);
      }
    }
  }

  const verticalLineHits = new Uint8Array(finalW);
  for (const scanY of validTestRows) {
    for (let lx = 0; lx < finalW; lx++) {
      const p = scanY * w + (bestLeft + lx);
      const r = data[p * 4], g = data[p * 4 + 1], b = data[p * 4 + 2];
      if (r > 235 && g > 235 && b > 235) {
        verticalLineHits[lx]++;
      }
    }
  }

  // 真正貫穿全盤的格線在絕大多數有效剖面上都是純白（門檻設為 60%）
  const minHitThresh = Math.max(3, Math.round(validTestRows.length * 0.60));

  // 收集所有連續命中 >= minHitThresh 的白色格線區間
  interface WhiteRun {
    start: number;
    end: number;
    center: number;
    maxHit: number;
  }
  const runs: WhiteRun[] = [];
  let curRunStart = -1;
  let curMaxHit = 0;

  for (let lx = 0; lx < finalW; lx++) {
    if (verticalLineHits[lx] >= minHitThresh) {
      if (curRunStart === -1) {
        curRunStart = lx;
        curMaxHit = verticalLineHits[lx];
      } else {
        if (verticalLineHits[lx] > curMaxHit) curMaxHit = verticalLineHits[lx];
      }
    } else {
      if (curRunStart !== -1) {
        runs.push({
          start: curRunStart,
          end: lx - 1,
          center: (curRunStart + lx - 1) / 2,
          maxHit: curMaxHit,
        });
        curRunStart = -1;
      }
    }
  }
  if (curRunStart !== -1) {
    runs.push({
      start: curRunStart,
      end: finalW - 1,
      center: (curRunStart + finalW - 1) / 2,
      maxHit: curMaxHit,
    });
  }

  // 棋盤內部相鄰格線在 600px 基準下的理論距離：
  // 12 維度每格約 45px，4 維度每格約 140px。相鄰兩條真實格線間距絕對 >= 25px
  const minLineDistance = Math.max(16, finalW / 14);

  // 聚類合併相鄰過近的格線（徹底解決反鋸齒或虛線抖動造成的重復計數）
  const distinctLineCenters: number[] = [];
  for (const run of runs) {
    if (distinctLineCenters.length === 0) {
      distinctLineCenters.push(run.center);
    } else {
      const lastCenter = distinctLineCenters[distinctLineCenters.length - 1];
      if (run.center - lastCenter < minLineDistance) {
        // 距離過近，視為同一條格線，取加權平均中心
        distinctLineCenters[distinctLineCenters.length - 1] = (lastCenter + run.center) / 2;
      } else {
        distinctLineCenters.push(run.center);
      }
    }
  }

  // 排除太貼近棋盤外框邊緣的干擾線（< minLineDistance * 0.6）
  const validInteriorLines = distinctLineCenters.filter(
    (pos) => pos >= minLineDistance * 0.6 && pos <= finalW - minLineDistance * 0.6
  );

  let bestDim = fallbackDimension;
  if (validInteriorLines.length >= 3 && validInteriorLines.length <= 11) {
    bestDim = validInteriorLines.length + 1;
  } else {
    // 備用梯度能量評分 (水平 + 垂直雙向加總)
    const candidateSizes = [4, 5, 6, 7, 8, 9, 10, 11, 12];
    let maxFitness = -Infinity;
    for (const k of candidateSizes) {
      const cellW = finalW / k;
      const cellH = finalH / k;
      let boundaryGradSum = 0;
      let boundarySamples = 0;

      // 垂直分割線梯度
      for (let i = 1; i < k; i++) {
        const gx = Math.round(bestLeft + i * cellW);
        if (gx > 1 && gx < w - 2) {
          const stepY = Math.max(1, Math.floor(cellH / 4));
          for (let gy = bestTop + 2; gy < bestBottom - 2; gy += stepY) {
            const p = gy * w + gx;
            boundaryGradSum += Math.abs(gray[p + 1] - gray[p - 1]);
            boundarySamples++;
          }
        }
      }

      // 水平分割線梯度
      for (let j = 1; j < k; j++) {
        const gy = Math.round(bestTop + j * cellH);
        if (gy > 1 && gy < h - 2) {
          const stepX = Math.max(1, Math.floor(cellW / 4));
          for (let gx = bestLeft + 2; gx < bestRight - 2; gx += stepX) {
            const p = gy * w + gx;
            boundaryGradSum += Math.abs(gray[p + w] - gray[p - w]);
            boundarySamples++;
          }
        }
      }

      const fitness = boundarySamples > 0 ? boundaryGradSum / boundarySamples : 0;
      if (fitness > maxFitness) {
        maxFitness = fitness;
        bestDim = k;
      }
    }
  }

  // 轉換回百分比座標
  const cropBox: CropBox = {
    x: Math.round(((bestLeft / w) * 100) * 10) / 10,
    y: Math.round(((bestTop / h) * 100) * 10) / 10,
    width: Math.round((((bestRight - bestLeft) / w) * 100) * 10) / 10,
    height: Math.round((((bestBottom - bestTop) / h) * 100) * 10) / 10,
  };

  return {
    cropBox,
    dimension: bestDim,
    confidence: 0.95,
  };
}

// 智慧偵測並貼合棋盤最外圈有色格子的邊界
export function autoDetectBoardBounds(
  imageElement: HTMLImageElement,
  currentCrop: CropBox
): CropBox {
  const result = detectBoardAndDimension(imageElement);
  return result.confidence > 0.1 ? result.cropBox : currentCrop;
}

export interface SampleGridResult {
  grid: number[][];
  detectedColors: RegionColor[];
  cellStatuses: CellStatus[][];
}

export function sampleGridFromImage(
  imageElement: HTMLImageElement,
  crop: CropBox,
  gridSize: number
): SampleGridResult {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas 2D context 初始化失敗');

  const naturalW = imageElement.naturalWidth;
  const naturalH = imageElement.naturalHeight;

  const cropX = Math.round((crop.x / 100) * naturalW);
  const cropY = Math.round((crop.y / 100) * naturalH);
  const cropW = Math.round((crop.width / 100) * naturalW);
  const cropH = Math.round((crop.height / 100) * naturalH);

  canvas.width = cropW;
  canvas.height = cropH;

  ctx.drawImage(imageElement, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

  const cellWidth = cropW / gridSize;
  const cellHeight = cropH / gridSize;

  const sampledPixels: RGB[] = [];
  const cellStatuses: CellStatus[][] = Array.from({ length: gridSize }, () =>
    Array.from({ length: gridSize }, () => 'EMPTY' as CellStatus)
  );

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const cellLeft = Math.round(c * cellWidth);
      const cellTop = Math.round(r * cellHeight);
      const cellW = Math.max(2, Math.round(cellWidth));
      const cellH = Math.max(2, Math.round(cellHeight));

      const imgData = ctx.getImageData(cellLeft, cellTop, cellW, cellH);
      const data = imgData.data;

      // 1. 角落採樣（Corner Sampling - 抵禦中央 ✕ 與貓咪遮蔽，還原真實底色）
      const cornerColors: RGB[] = [];
      const sampleCorners = [
        [0.15, 0.15],
        [0.85, 0.15],
        [0.15, 0.85],
        [0.85, 0.85],
      ];

      for (const [fx, fy] of sampleCorners) {
        const lx = Math.round(cellW * fx);
        const ly = Math.round(cellH * fy);
        const idx = (ly * cellW + lx) * 4;
        const pr = data[idx];
        const pg = data[idx + 1];
        const pb = data[idx + 2];

        // 排除純白雜訊與貓咪深黑
        if (!(pr > 225 && pg > 225 && pb > 225) && !(pr < 60 && pg < 60 && pb < 60)) {
          cornerColors.push({ r: pr, g: pg, b: pb });
        }
      }

      let baseColor: RGB;
      if (cornerColors.length > 0) {
        const rSum = cornerColors.reduce((acc, p) => acc + p.r, 0);
        const gSum = cornerColors.reduce((acc, p) => acc + p.g, 0);
        const bSum = cornerColors.reduce((acc, p) => acc + p.b, 0);
        baseColor = {
          r: Math.round(rSum / cornerColors.length),
          g: Math.round(gSum / cornerColors.length),
          b: Math.round(bSum / cornerColors.length),
        };
      } else {
        // 角落都被遮蔽時，回退全格非純白純黑採樣
        let rSum = 0, gSum = 0, bSum = 0, cnt = 0;
        for (let i = 0; i < data.length; i += 4) {
          const pr = data[i], pg = data[i + 1], pb = data[i + 2];
          if (!(pr > 230 && pg > 230 && pb > 230) && !(pr < 60 && pg < 60 && pb < 60)) {
            rSum += pr; gSum += pg; bSum += pb; cnt++;
          }
        }
        baseColor = cnt > 0
          ? { r: Math.round(rSum / cnt), g: Math.round(gSum / cnt), b: Math.round(bSum / cnt) }
          : { r: 215, g: 215, b: 215 };
      }
      sampledPixels.push(baseColor);

      // 2. 單元格進度狀態識別（EMPTY vs CROSS vs CAT）
      // 採樣中央 50% 核心區域 (nx in [0.25, 0.75], ny in [0.25, 0.75])
      let centerCount = 0;
      let darkCount = 0;
      let whiteCount = 0;
      let diffCount = 0;
      let centerCoreWhiteCount = 0;

      // 對角四象限白色統計（真正的 ✕ 必然由對角雙斜線構成，在四個角落象限均有白色延伸，而直白線絕不可能同時具有四對角白色）
      let qTopLeftWhite = 0;
      let qTopRightWhite = 0;
      let qBottomLeftWhite = 0;
      let qBottomRightWhite = 0;

      for (let ly = 0; ly < cellH; ly++) {
        const ny = ly / cellH;
        if (ny < 0.25 || ny > 0.75) continue;

        for (let lx = 0; lx < cellW; lx++) {
          const nx = lx / cellW;
          if (nx < 0.25 || nx > 0.75) continue;

          const idx = (ly * cellW + lx) * 4;
          const pr = data[idx];
          const pg = data[idx + 1];
          const pb = data[idx + 2];
          centerCount++;

          // 貓咪深黑毛/黑耳
          if (pr < 60 && pg < 60 && pb < 60) {
            darkCount++;
          }

          // 白 ✕：純白或近純白 (RGB > 238 且飽和度極低，且不是底色)
          const max = Math.max(pr, pg, pb);
          const min = Math.min(pr, pg, pb);
          const sat = max === 0 ? 0 : (max - min) / max;
          const isWhitePixel = max > 238 && sat < 0.08 && min > 220;

          if (isWhitePixel) {
            whiteCount++;
            // 正中心核心 (nx in [0.42, 0.58], ny in [0.42, 0.58])
            // 真正的 ✕ 必然穿過十字交叉的幾何正中心！
            if (nx >= 0.42 && nx <= 0.58 && ny >= 0.42 && ny <= 0.58) {
              centerCoreWhiteCount++;
            }

            // 四象限對角白色手臂統計
            if (nx >= 0.28 && nx <= 0.42 && ny >= 0.28 && ny <= 0.42) qTopLeftWhite++;
            if (nx >= 0.58 && nx <= 0.72 && ny >= 0.28 && ny <= 0.42) qTopRightWhite++;
            if (nx >= 0.28 && nx <= 0.42 && ny >= 0.58 && ny <= 0.72) qBottomLeftWhite++;
            if (nx >= 0.58 && nx <= 0.72 && ny >= 0.58 && ny <= 0.72) qBottomRightWhite++;
          }

          // 與底色之歐氏差異
          const distBg = Math.sqrt((pr - baseColor.r) ** 2 + (pg - baseColor.g) ** 2 + (pb - baseColor.b) ** 2);
          if (distBg > 40) {
            diffCount++;
          }
        }
      }

      if (centerCount > 0) {
        const darkRatio = darkCount / centerCount;
        const whiteRatio = whiteCount / centerCount;
        const diffRatio = diffCount / centerCount;

        // 計算具有白色手臂的對角象限數量 (真正的 ✕ 在 4 個象限中至少 3 個都必須有白色延伸)
        let diagonalQuadrantsWithWhite = 0;
        if (qTopLeftWhite >= 2) diagonalQuadrantsWithWhite++;
        if (qTopRightWhite >= 2) diagonalQuadrantsWithWhite++;
        if (qBottomLeftWhite >= 2) diagonalQuadrantsWithWhite++;
        if (qBottomRightWhite >= 2) diagonalQuadrantsWithWhite++;

        // 貓咪：具備深黑黑耳/額頭，且與底色相異比例顯著
        if (darkRatio >= 0.04 && diffRatio >= 0.25) {
          cellStatuses[r][c] = 'CAT';
        }
        // 白 ✕：排除貓咪後，具備純白交叉特徵，中心有密集交叉點，且四個對角至少 3 個象限具備對角白色像素
        else if (
          whiteRatio >= 0.12 &&
          diffRatio >= 0.15 &&
          centerCoreWhiteCount >= 5 &&
          diagonalQuadrantsWithWhite >= 3
        ) {
          cellStatuses[r][c] = 'CROSS';
        } else {
          cellStatuses[r][c] = 'EMPTY';
        }
      }
    }
  }

  // 使用色相強化與微小孤立區域保護演算法
  const { assignments, centers } = robustColorClustering(sampledPixels, gridSize);

  const resultGrid: number[][] = [];
  for (let r = 0; r < gridSize; r++) {
    const row: number[] = [];
    for (let c = 0; c < gridSize; c++) {
      row.push(assignments[r * gridSize + c]);
    }
    resultGrid.push(row);
  }

  const detectedColors: RegionColor[] = centers.map((center, idx) => {
    const hex = rgbToHex(center.r, center.g, center.b);
    const border = getBorderColor(center.r, center.g, center.b);
    const { name, nameEn } = getColorNamesFromRGB(center.r, center.g, center.b, idx);
    return {
      id: idx,
      name,
      nameEn,
      hex,
      bgHex: hex,
      borderHex: border,
    };
  });

  return { grid: resultGrid, detectedColors, cellStatuses };
}
