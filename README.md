# 🐱 Meowdoku Solver - 貓咪數獨智能推導器

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-6-3178c6?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-8-646cff?style=flat-square&logo=vite" alt="Vite" />
  <img src="https://img.shields.io/badge/License-MIT-green.svg?style=flat-square" alt="MIT License" />
</p>

**Meowdoku Solver** 是一款專為「貓咪數獨 / Star Battle（雙星不相鄰）/ Queens 拼圖」設計的現代化益智解謎與智能推導應用程式。

結合了**純邏輯推導引擎**、**步驟白話解說**、**截圖色彩自動辨識**與**流暢的手機/電腦雙端操作手感**，無論是想親自動腦挑戰解題，還是想一窺背後嚴謹的消去法推導步驟，都能輕鬆上手！

---

## 🌟 核心特色

### 🧠 1. 純邏輯 AI 推導引擎（不靠瞎猜）
- **多層次演算法演繹**：內建豐富的數獨/格網推導策略，拒絕黑箱運算，優先以人類可理解的消去法逐步破解。
  - **顯性唯一數 (Naked Single)**：區域唯一空格、行唯一空格、列唯一空格。
  - **周圍相鄰排除 (Eliminate Surroundings)**：貓咪周圍八格（國王步）自動標記排除。
  - **區塊行列交集鎖定 (Line-Region Intersection)**：某區域候選格全部位於同一直線時，鎖定排除該線其他空格。
  - **共享鄰接排除 (Shared Adjacency Elimination)**：兩格共享的鄰近對角空格推導排除。
  - **子集計數法 (Subset Counting)**：多行多區塊聯立計數推導。
  - **極限回溯輔助 (Backtrack Search)**：當純邏輯窮盡時，以最小分支深度進行推導。
- **步驟詳解與視覺化時間軸**：提供播放、暫停、倍速調整、逐格上一步/下一步，並高亮顯示受影響的格子、區域與行列。

### 🎮 2. 極致友善的手動解題模式 (Play Mode)
- **多端流暢操作**：
  - **單擊**：空白與「✕」之間快速切換。
  - **雙擊（手機/電腦皆支援）**：快速放置或收回貓咪，手機單手操作超順暢。
  - **滑動 / 長按拖曳**：快速連續批次劃記 ✕ 或清除 ✕（具備智慧保護機制，不會誤抹已放置的貓咪）。
  - **桌機滑鼠右鍵**：一鍵放置或收回貓咪。
- **即時衝突與錯誤提示**：自動檢測同一行、同一列、同區域重複放置，以及八格緊鄰違規。
- **智慧錦囊 (Smart Hint)**：遇到瓶頸時，點擊燈泡即可獲得一步明確的邏輯推導方向與原因。
- **輔助開關**：支援「放置貓咪後自動劃記周邊 ✕」、「衝突即時紅框警告」。
- **計時器與通關彩帶**：通關時觸發慶祝特效！

### 📷 3. 截圖影像智能辨識 (Image OCR & Grid Detection)
- 支援直接**上傳圖片**、**拖曳檔案**或使用剪貼簿 **Ctrl + V** 貼上遊戲截圖。
- **智慧邊框定位與微調**：提供自由調整四邊裁切框。
- **色彩聚類自動分群**：基於 HSV 空間自動識別色塊分佈，轉換為盤面區域，並賦予易讀的中文顏色名稱（如：珊瑚粉、芥末金黃、薄荷綠等）。

### 🎨 4. 自由地圖編輯器 (Edit Mode)
- 支援任意尺寸自訂（例如 $6 \times 6$ 到 $12 \times 12$ 等）。
- 內建色盤與畫筆，點選顏色即可自由繪製地圖分區。
- 具備區域完整性即時驗證。

### 📋 5. 純文字盤面匯出與分享 (Export & Share)
- 一鍵將題目生成排版對齊的純文字矩陣。
- 包含 1-indexed 座標清單、各顏色區塊包含格子、目前標記進度，方便貼至論壇、社群討論或提供給其他 AI 分析。

### 🌐 6. 完整雙語系支援 (Bilingual Support)
- 支援**繁體中文 (Traditional Chinese)** 與 **English** 一鍵切換。
- 全站所有介面標題、推導步驟解說、邏輯規則、純文字匯出、衝突提示與操作指南皆完整雙語本地化，並自動保存語系偏好。

---

## 📖 遊戲基本規則

在 $N \times N$ 的棋盤中，目標是在盤面上放置 $N$ 隻貓咪，並遵守以下條件：

1. **顏色區塊限制**：每個彩色區域剛好放 **1** 隻貓咪。
2. **行列唯一限制**：每一橫列與同一直欄剛好放 **1** 隻貓咪。
3. **國王步不相鄰**：任何兩隻貓咪周圍八格（上下、左右、四個對角斜角）**均不可碰觸**。

---

## 🛠️ 技術堆疊

- **核心架構**：[React 19](https://react.dev/) + [TypeScript 6](https://www.typescriptlang.org/)
- **建置工具**：[Vite 8](https://vite.dev/)
- **程式碼檢查**：[Oxlint](https://oxc.rs/)
- **圖示庫**：[Lucide React](https://lucide.dev/) + 手工繪製向量貓咪 SVG (`CatIcon`, `PawIcon`)
- **視覺動效**：[canvas-confetti](https://www.npmjs.com/package/canvas-confetti)
- **樣式架構**：客製化純 CSS 設計系統，具備暖色貓咪主題美學與深淺層次

---

## 📁 專案結構

```text
Meowdoku/
├── src/
│   ├── assets/              # 靜態資源
│   ├── components/          # UI 元件
│   │   ├── icons/           # 貓咪、肉球、叉號等專屬圖示
│   │   ├── Board.tsx        # 數獨核心棋盤元件（支援觸控、拖曳劃記與動畫）
│   │   ├── ColorPalette.tsx # 編輯模式調色盤
│   │   ├── ExportTextModal.tsx # 純文字題庫匯出視窗
│   │   ├── Header.tsx       # 頂部導覽與模式切換
│   │   ├── HelpModal.tsx    # 規則說明與操作指引
│   │   ├── ImageUploadModal.tsx # 截圖辨識、裁切與色彩採樣
│   │   ├── PlayControlPanel.tsx # 玩家操作工具列與計時器
│   │   ├── StepExplanation.tsx  # AI 推導白話步驟說明卡片
│   │   ├── TimelinePlayer.tsx   # 推導時間軸播放器
│   │   └── VictoryModal.tsx     # 通關勝利彈窗
│   ├── logic/               # 演算法與核心邏輯
│   │   ├── exportText.ts    # 題目文字化排版產生器
│   │   ├── imageRecognizer.ts # 圖片顏色分析與盤面辨識
│   │   ├── presets.ts       # 內建預設精選題目與色系配置
│   │   ├── solver.ts        # 純邏輯推導引擎與回溯解題器
│   │   └── validator.ts     # 衝突檢測、智慧提示與通關驗證
│   ├── types/               # TypeScript 型別定義
│   │   └── game.ts          # 棋盤、推導步驟、衝突資訊等型別
│   ├── App.tsx              # 主應用程式控制器
│   ├── main.tsx             # 程式進入點
│   └── index.css            # 全域設計系統與元件樣式
├── index.html
├── package.json
└── tsconfig.json
```

---

## 🚀 快速開始

### 環境需求
- [Node.js](https://nodejs.org/) (建議版本 v18 以上)
- npm、pnpm 或 yarn

### 安裝步驟

1. **複製專案庫**
   ```bash
   git clone https://github.com/kudos131313/meowdoku-solver.git
   cd meowdoku-solver
   ```

2. **安裝相依套件**
   ```bash
   npm install
   ```

3. **啟動本機開發伺服器**
   ```bash
   npm run dev
   ```
   啟動後，使用瀏覽器打開控制台顯示的網址（預設為 `http://localhost:5173/`）。

4. **建置正式生產版本**
   ```bash
   npm run build
   ```

5. **執行程式碼檢查**
   ```bash
   npm run lint
   ```

---

## 📄 授權條款 (License)

本專案採用 [MIT License](LICENSE) 進行授權。歡迎自由學習、修改或衍生應用。
