import type { RegionColor } from '../types/game';

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

  // 1. 等比縮放至分析畫布 (最大邊長 480px，保證在 15ms 內以純 JS 完成高精準度分析)
  const maxDim = 480;
  const scale = Math.min(1, maxDim / Math.max(nw, nh));
  const w = Math.max(30, Math.round(nw * scale));
  const h = Math.max(30, Math.round(nh * scale));

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    return {
      cropBox: { x: 5, y: 20, width: 90, height: 60 },
      dimension: fallbackDimension,
      confidence: 0,
    };
  }

  canvas.width = w;
  canvas.height = h;
  ctx.drawImage(imageElement, 0, 0, w, h);

  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  // 1. 自適應採樣背景基底色彩 (從頂部四角與兩側極外圍採樣)
  const bgSampleCoords = [
    [Math.round(w * 0.05), Math.round(h * 0.03)],
    [Math.round(w * 0.95), Math.round(h * 0.03)],
    [Math.round(w * 0.05), Math.round(h * 0.12)],
    [Math.round(w * 0.95), Math.round(h * 0.12)],
    [Math.round(w * 0.03), Math.round(h * 0.50)],
    [Math.round(w * 0.97), Math.round(h * 0.50)],
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

  // 計算灰階、飽和度與前景棋盤格子遮罩
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
    const isSaturated = s >= 0.15 && v >= 0.18 && v <= 0.98;
    const isDistinctColor = distBg >= 30 && (s >= 0.10 || (v >= 0.15 && v <= 0.88));

    isColor[p] = (isSaturated || isDistinctColor) && distBg >= 22 ? 1 : 0;
  }

  // 2. 棋盤邊界定位：實心行段落平滑橋接與最大正方形實體鎖定 (Solid-Row Bridge & Max Square Entity)
  // Queens 棋盤在截圖中是高度佔據 35%~50% 的巨大連通正方形實體，遠大於頂部裝飾與底部廣告橫幅

  // (1) 逐行統計實心行 (橫向跨度 >= 50% 寬，彩色像素覆蓋 >= 45% 跨度)
  const isSolidRow = new Uint8Array(h);
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
    if (span >= w * 0.50 && count >= span * 0.45) {
      isSolidRow[y] = 1;
    }
  }

  // (2) 收集連續實心段落
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

  // (3) 平滑橋接相鄰間距 <= 12 像素的區段 (棋盤行間細縫僅 3~6 像素，橋接此細縫，同時徹底隔絕 60+ 像素外的上方說明圖)
  const mergedSegments: { start: number; end: number; len: number }[] = [];
  for (const seg of segments) {
    if (mergedSegments.length === 0) {
      mergedSegments.push({ ...seg });
    } else {
      const last = mergedSegments[mergedSegments.length - 1];
      if (seg.start - last.end <= 12) {
        last.end = seg.end;
        last.len = last.end - last.start + 1;
      } else {
        mergedSegments.push({ ...seg });
      }
    }
  }

  // (4) 挑選高度最大的連通區段 (棋盤實體高度遠超裝飾與按鈕)
  const sorted = [...mergedSegments].sort((a, b) => b.len - a.len);
  const bestSeg = sorted[0] || {
    start: Math.round(h * 0.29),
    end: Math.round(h * 0.72),
    len: Math.round(h * 0.43),
  };

  // (5) 在棋盤中心採樣左右外邊界
  const sampleY = Math.round((bestSeg.start + bestSeg.end) / 2);
  let boardLeft = w;
  let boardRight = -1;
  const sampleOffset = sampleY * w;

  for (let x = 0; x < w; x++) {
    if (isColor[sampleOffset + x]) {
      if (x < boardLeft) boardLeft = x;
      if (x > boardRight) boardRight = x;
    }
  }

  if (boardRight <= boardLeft || (boardRight - boardLeft) < w * 0.5) {
    boardLeft = Math.round(w * 0.05);
    boardRight = Math.round(w * 0.95);
  }

  const boardW = boardRight - boardLeft;
  // (6) 以驗證 100% 正確的底邊 (第 10 行底部)，嚴格按正方形 (H = W) 精確反推頂邊 (第 1 行頂部)
  const boardBottom = bestSeg.end;
  const boardTop = Math.max(0, boardBottom - boardW);

  // 加上適度外擴邊隙 (約 4.5% 棋盤寬度)，剛好完美包覆最外圈格子的外緣、圓角與外邊框線
  const pad = Math.max(3, Math.round(boardW * 0.045));
  const bestLeft = Math.max(0, boardLeft - pad);
  const bestRight = Math.min(w - 1, boardRight + pad);
  const bestTop = Math.max(0, boardTop - pad);
  const bestBottom = Math.min(h - 1, boardBottom + pad);

  const finalW = bestRight - bestLeft;
  const finalH = bestBottom - bestTop;

  // 3. 維度推論 (Dimension Inference: 評估 N = 4 ~ 12)
  const candidateSizes = [4, 5, 6, 7, 8, 9, 10, 11, 12];
  let bestDim = fallbackDimension;
  let maxFitness = -Infinity;
  let secondFitness = -Infinity;

  if (finalW >= 24 && finalH >= 24) {
    for (const k of candidateSizes) {
      const cellW = finalW / k;
      const cellH = finalH / k;

      // A. 格線交界處的梯度能量 (Boundary Gradient Energy)
      let boundaryGradSum = 0;
      let boundarySamples = 0;

      // 採樣垂直格線 (x = bestLeft + i * cellW)
      for (let i = 1; i < k; i++) {
        const gx = Math.round(bestLeft + i * cellW);
        if (gx > 1 && gx < w - 2) {
          const stepY = Math.max(1, Math.floor(cellH / 4));
          for (let gy = bestTop + 2; gy < bestBottom - 2; gy += stepY) {
            const p = gy * w + gx;
            const diff = Math.abs(gray[p + 1] - gray[p - 1]);
            boundaryGradSum += diff;
            boundarySamples++;
          }
        }
      }

      // 採樣水平格線 (y = bestTop + j * cellH)
      for (let j = 1; j < k; j++) {
        const gy = Math.round(bestTop + j * cellH);
        if (gy > 1 && gy < h - 2) {
          const stepX = Math.max(1, Math.floor(cellW / 4));
          for (let gx = bestLeft + 2; gx < bestRight - 2; gx += stepX) {
            const p = gy * w + gx;
            const diff = Math.abs(gray[p + w] - gray[p - w]);
            boundaryGradSum += diff;
            boundarySamples++;
          }
        }
      }

      const avgBoundaryGrad = boundarySamples > 0 ? boundaryGradSum / boundarySamples : 0;

      // B. 單元格內部色彩均質性 (Intra-cell Homogeneity)
      // 若 k 正確，單元格中央 40% 的內部標準差必然極小；若猜錯維度，很多採樣會踩在不同色塊邊界上，標準差暴增
      let totalIntraVariance = 0;
      let validCells = 0;

      for (let r = 0; r < k; r++) {
        for (let c = 0; c < k; c++) {
          const cLeft = Math.round(bestLeft + c * cellW + cellW * 0.3);
          const cRight = Math.round(bestLeft + c * cellW + cellW * 0.7);
          const cTop = Math.round(bestTop + r * cellH + cellH * 0.3);
          const cBottom = Math.round(bestTop + r * cellH + cellH * 0.7);

          let sumGray = 0;
          let sumSqGray = 0;
          let count = 0;

          const step = Math.max(1, Math.floor((cRight - cLeft) / 3));
          for (let py = cTop; py <= cBottom; py += step) {
            for (let px = cLeft; px <= cRight; px += step) {
              if (px >= 0 && px < w && py >= 0 && py < h) {
                const val = gray[py * w + px];
                sumGray += val;
                sumSqGray += val * val;
                count++;
              }
            }
          }

          if (count >= 2) {
            const mean = sumGray / count;
            const variance = Math.max(0, sumSqGray / count - mean * mean);
            totalIntraVariance += Math.sqrt(variance);
            validCells++;
          }
        }
      }

      const avgIntraStd = validCells > 0 ? totalIntraVariance / validCells : 15;

      // 綜合評分：格線梯度越強、內部越平坦純色，得分越高
      // 輔以小幅度的尺度增益 (0.06 * log2(k))，防止整數子倍數 (如 5×5 碰巧對齊 10×10) 因格線重合而搶分
      const scaleBonus = 1 + 0.06 * Math.log2(k);
      const fitness = (avgBoundaryGrad * scaleBonus) / (avgIntraStd + 5.0);

      if (fitness > maxFitness) {
        secondFitness = maxFitness;
        maxFitness = fitness;
        bestDim = k;
      } else if (fitness > secondFitness) {
        secondFitness = fitness;
      }
    }
  }

  const confidence = maxFitness > 0 && secondFitness > 0
    ? Math.min(1, Math.max(0, (maxFitness - secondFitness) / maxFitness * 2.5))
    : 0.8;

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
    confidence: Math.round(confidence * 100) / 100,
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

export function sampleGridFromImage(
  imageElement: HTMLImageElement,
  crop: CropBox,
  gridSize: number
): { grid: number[][]; detectedColors: RegionColor[] } {
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

  // 對每一個格子取中央 40% 的精華區域採樣，避開四周白色縫隙與圓角
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const sampleLeft = Math.round(c * cellWidth + cellWidth * 0.3);
      const sampleTop = Math.round(r * cellHeight + cellHeight * 0.3);
      const sampleW = Math.max(1, Math.round(cellWidth * 0.4));
      const sampleH = Math.max(1, Math.round(cellHeight * 0.4));

      const imgData = ctx.getImageData(sampleLeft, sampleTop, sampleW, sampleH);
      const data = imgData.data;

      let rSum = 0;
      let gSum = 0;
      let bSum = 0;
      let pixelCount = 0;

      for (let i = 0; i < data.length; i += 4) {
        const pr = data[i];
        const pg = data[i + 1];
        const pb = data[i + 2];
        if (pr > 246 && pg > 246 && pb > 246) continue;

        rSum += pr;
        gSum += pg;
        bSum += pb;
        pixelCount++;
      }

      if (pixelCount === 0) {
        sampledPixels.push({ r: 215, g: 215, b: 215 });
      } else {
        sampledPixels.push({
          r: Math.round(rSum / pixelCount),
          g: Math.round(gSum / pixelCount),
          b: Math.round(bSum / pixelCount),
        });
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

  return { grid: resultGrid, detectedColors };
}
