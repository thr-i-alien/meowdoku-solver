# 🐱 Meowdoku Solver - 貓咪數獨智能推導器

<p align="center">
  <a href="https://thr-i-alien.github.io/meowdoku-solver/">
    <img src="https://img.shields.io/badge/Live_Demo-線上遊玩與推導-ff6b6b?style=for-the-badge&logo=githubpages&logoColor=white" alt="Live Demo" />
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-6-3178c6?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-8-646cff?style=flat-square&logo=vite" alt="Vite" />
  <img src="https://img.shields.io/badge/License-MIT-green.svg?style=flat-square" alt="MIT License" />
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square" alt="PRs Welcome" />
</p>

<p align="center">
  <b><a href="#-繁體中文">繁體中文</a></b> | <b><a href="#-english">English</a></b>
</p>

---

## 🇹🇼 繁體中文

**Meowdoku Solver** 是一款專為「Meowdoku / 貓咪數獨」設計的現代化益智解謎與智能推導網頁應用程式。

結合了**純邏輯推導引擎**、**步驟白話解說**、**截圖色彩自動辨識**、**智慧錦囊**與**極致流暢的手機 / 電腦雙端手感**。無論是想親自動腦挑戰解謎，還是想一窺背後嚴謹的消去法推導步驟，都能輕鬆上手！

### 🔗 線上體驗 (Live Demo)

- 🌐 **立即線上試玩**：[https://thr-i-alien.github.io/meowdoku-solver/](https://thr-i-alien.github.io/meowdoku-solver/)
- 📱 完整適配桌面滑鼠與行動裝置觸控操作，免安裝開啟即玩。

---

### 🌟 核心特色

#### 🧠 1. 純邏輯 AI 推導引擎（不靠瞎猜）
- **多層次演算法演繹**：內建豐富的數獨/格網推導策略，拒絕黑箱運算，優先以人類可理解的消去法逐步破解：
  - **顯性唯一數 (Naked Single)**：區域唯一空格、行唯一空格、列唯一空格。
  - **周圍相鄰排除 (Eliminate Surroundings)**：貓咪周圍八格（國王步）自動標記排除。
  - **區塊行列交集鎖定 (Line-Region Intersection)**：某區域候選格全部位於同一直線時，鎖定排除該線其他空格。
  - **共享鄰接排除 (Shared Adjacency Elimination)**：兩格共享的鄰近對角空格推導排除。
  - **子集計數法 (Subset Counting)**：多行多區塊聯立計數推導。
  - **極限回溯輔助 (Backtrack Search)**：當純邏輯窮盡時，以最小分支深度進行推導。
- **步驟詳解與視覺化時間軸**：
  - 白話解說每一步驟背後的邏輯理由與策略名稱。
  - 提供播放、暫停、倍速調整（1x / 2x / 5x / 10x）、手動滑桿拖曳與單步上一步/下一步。
  - 盤面高亮色彩提示：綠色表示確認放置貓咪、橘色/紅色表示排除空格、紫色/亮色高亮受影響的區域與行列。

#### 🎮 2. 極致友善的手動解題模式 (Play Mode)
- **多端流暢操作手感**：
  - **電腦滑鼠**：左鍵點擊切換空白與「✕」；右鍵一鍵放置/收回貓咪；滑鼠拖曳連續批次劃記 ✕。
  - **手機觸控**：
    - **單擊**：空白與「✕」之間快速切換。
    - **雙擊**：極速放置或收回貓咪，單手操作超順暢。
    - **滑動 / 長按拖曳**：連續批次劃記 ✕ 或清除 ✕（具備智慧保護機制，不會覆蓋或誤抹已放置的貓咪）。
- **手機專屬即時狀態膠囊 (Mobile Status Bar)**：
  - 精巧常駐於棋盤上方，即時展示「已放置貓咪數 / 目標總數」及「即時衝突警示膠囊」，不佔用額外垂直空間。
- **即時衝突與錯誤提示**：
  - 自動檢測同一橫列、同一直欄、同顏色區域重複放置貓咪，以及八格相鄰違規觸碰。
- **智慧錦囊 (Smart Hint)**：
  - 遇到瓶頸時，點擊燈泡即可獲得一步明確的邏輯推導方向與原因，並以高雅懸浮提示卡片引導。
- **輔助開關與貼心機制**：
  - 支援「放置貓咪後自動劃記周邊 ✕」、「衝突即時紅框警告」自由啟閉。
  - 提供步數撤銷 (Undo)、清空盤面與計時器。
  - 通關時觸發全螢幕慶祝彩帶特效 (Confetti)。

#### 📷 3. 截圖影像智能辨識與進度還原 (Image OCR & Progress Resume)
- **多種輸入途徑**：支援剪貼簿直接 **Ctrl + V** 貼上截圖、檔案拖曳上傳或點擊選檔。
- **自由互動式裁切框**：支援滑鼠/觸控拖曳四邊與四角調整裁切區域，並提供 X、Y、寬、高 像素級滑桿微調，精準適配 4~12 各維度棋盤。
- **HSV 色彩空間聚類分析**：
  - 智慧識別色塊分佈，自動建立區塊連通圖。
  - 自動轉換為舒適且易讀的色彩命名（如珊瑚粉、芥末金黃、薄荷綠、薰衣草紫等）。
- **🐾 遊戲解題進度智慧辨識與還原（接關挑戰）**：
  - **自動識別作答進度**：除了辨識底圖色塊，還能智慧識別截圖中已擺放的貓咪 (🐱) 與排除標記 (✕)。
  - **自由選擇匯入模式**：提供「匯入截圖中的貓咪與 ✕ 進度」切換開關，自由決定是要匯入原始空盤重新挑戰，還是直接無縫接續先前的作答進度。
  - **雙分頁即時預覽與微調**：彈窗內建「色塊分區」與「進度標記 (✕ / 🐱)」獨立分頁，可即時查看貓咪數量與 ✕ 統計，並支援直接點擊格子循環切換「空 ➔ ✕ ➔ 🐱 ➔ 空」進行手動修正，確認無誤後一鍵套用至棋盤！

#### 🖌️ 4. 自訂地圖編輯器 (Custom Map Editor)
- **4×4 至 12×12 自由維度**：隨心切換不同網格尺寸，探索由淺入深的數獨難度。
- **靈活繪圖工具箱**：
  - **筆刷塗色 (Brush)**：單格點擊精準指定色彩分區。
  - **油漆桶填色 (Bucket Fill)**：一鍵洪水填充相鄰同色格，大面積塗色超省時。
  - **復原與重做 (Undo / Redo)**：繪製失誤隨時撤銷，創作無負擔。
- **地圖完整度即時分析 (Map Analysis)**：
  - 即時統計當前色彩種類，確保恰好劃分為 $N$ 種顏色區域。
  - 自動檢測非連通區塊（同色格子被阻斷分離時發出警告提示）。
- **題目可解性智能診斷 (Solvability Check)**：
  - 繪製完成後，一鍵快速計算地圖是否可行。
  - 精確反饋「題目唯一解」、「題目多組解」或「題目無解」狀態診斷。
- **快捷工具與一鍵銜接**：
  - 支援「隨機生成合法地圖」、「載入經典預設題目」、「清空盤面」。
  - 創作完成後，可一鍵轉入「手動挑戰模式」動腦破解，或交由「純邏輯推導引擎」逐步展示解答。

#### 📋 5. 純文字盤面匯出與題目分享 (Export & Share)
- 一鍵將題目生成對齊工整的純文字字元矩陣。
- 包含 1-indexed 坐標清單、各色彩區塊所包含的格子、目前標記進度。
- 便於複製至論壇、社群討論或提供給大型語言模型 (LLM) 進行分析解題。

#### 🌐 6. 完整雙語系支援 (Bilingual Support)
- 支援**繁體中文 (Traditional Chinese)** 與 **English** 一鍵無縫切換。
- 全站所有介面標題、推導步驟解說、邏輯規則、純文字匯出、衝突提示與操作指南皆完整雙語本地化。
- 自動保存語系偏好於本機 LocalStorage。

---

### 📖 遊戲基本規則

在 $N \times N$ 的棋盤中，目標是在盤面上放置 $N$ 隻貓咪，並遵守以下三大條件：

1. **顏色區塊唯一**：每個彩色分區剛好放置 **1** 隻貓咪。
2. **行列唯一限制**：每一橫列與同一直欄剛好放置 **1** 隻貓咪。
3. **國王步不相鄰**：任何兩隻貓咪周圍八格（上下、左右、四個對角斜角）**均不可碰觸**。

---

### 🛠️ 技術堆疊

- **核心框架**：[React 19](https://react.dev/) + [TypeScript 6](https://www.typescriptlang.org/)
- **建置工具**：[Vite 8](https://vite.dev/)
- **程式碼檢查**：[Oxlint](https://oxc.rs/)
- **圖示庫**：[Lucide React](https://lucide.dev/) + 手工繪製向量貓咪 SVG (`CatIcon`, `PawIcon`, `CrossIcon`, `GithubIcon`)
- **視覺動效**：[canvas-confetti](https://www.npmjs.com/package/canvas-confetti)
- **樣式設計**：客製化純 CSS 設計系統，具備溫暖貓咪美學色彩、玻璃擬態與深淺層次
- **自動化部署**：[GitHub Actions](https://github.com/features/actions) 自動持續整合與發布至 GitHub Pages

---

### 🚀 快速開始

#### 環境需求
- [Node.js](https://nodejs.org/) (建議版本 v18 以上)
- npm、pnpm 或 yarn

#### 安裝步驟

1. **複製專案庫**
   ```bash
   git clone https://github.com/thr-i-alien/meowdoku-solver.git
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

## 🇬🇧 English

**Meowdoku Solver** is a modern puzzle solver and interactive web application designed for "Meowdoku / Cat Sudoku" grids.

It pairs a **pure-logic deduction engine** with **plain-language step explanations**, **screenshot color clustering & OCR**, **smart contextual hints**, and **fluid mouse & touch controls**. Whether you want to solve puzzles manually with responsive gestures or inspect the rigorous elimination steps discovered by the deduction engine, Meowdoku Solver has you covered!

### 🔗 Live Demo

- 🌐 **Play Online**: [https://thr-i-alien.github.io/meowdoku-solver/](https://thr-i-alien.github.io/meowdoku-solver/)
- 📱 Fully responsive for both desktop and mobile devices. Zero installation required.

---

### 🌟 Key Features

#### 🧠 1. Pure-Logic Deduction Engine (No Guesswork)
- **Multi-tiered Logical Strategies**: Built upon rigorous deductive rules rather than blind guessing, prioritizing human-readable steps:
  - **Naked Single**: Solves solitary candidates across color regions, rows, or columns.
  - **Eliminate Surroundings**: Automatically rules out the 8 surrounding neighbor cells around any placed cat (King's move).
  - **Line-Region Intersection**: Eliminates candidates along a row or column when a region's possibilities are confined to that line.
  - **Shared Adjacency Elimination**: Eliminates mutual diagonal candidates shared between cells.
  - **Subset Counting**: Multi-region, multi-line linear constraints and subset evaluation.
  - **Backtracking Fallback**: Minimal-depth search branch employed only when pure logical deductions are exhausted.
- **Detailed Step Explanations & Timeline Visualizer**:
  - Clear, natural-language explanation of the reasoning and strategy name behind each step.
  - Interactive playback: Play, Pause, speed multipliers (1x / 2x / 5x / 10x), manual scrubbing slider, and step-by-step navigation.
  - Visual color highlights: Green for placed cats, orange/red for eliminated cells, and purple accents for affected regions and lines.

#### 🎮 2. Smooth Interactive Play Mode
- **Dual-Device Ergonomics**:
  - **Desktop Mouse**: Left-click to toggle empty/cross (`✕`); right-click to place/remove a cat; click-and-drag for rapid batch marking.
  - **Mobile Touch**:
    - **Single Tap**: Quickly toggles between empty and cross (`✕`).
    - **Double Tap**: Instantly places or retrieves a cat for effortless one-handed play.
    - **Swipe / Drag**: Batch-marks or unmarks crosses (`✕`) continuously (with smart protection to avoid overwriting placed cats).
- **Mobile Status Capsule**:
  - Elegantly floats above the grid, displaying real-time cat counts and instant conflict alerts without taking up precious screen real estate.
- **Real-Time Conflict Detection**:
  - Highlights row duplicates, column duplicates, same-region clashes, and 8-neighbor touching violations.
- **Smart Hints**:
  - Stuck on a tricky board? Tap the lightbulb icon to receive a guided next logical step with full reasoning in an unobtrusive floating card.
- **Quality-of-Life Tools**:
  - Configurable auto-marking for surroundings upon placing a cat and instant conflict alerts.
  - Undo history, board reset, and built-in timer.
  - Celebratory full-screen confetti animation upon puzzle completion.

#### 📷 3. Intelligent Screenshot Recognition & Progress Resume (OCR)
- **Flexible Image Inputs**: Paste directly from clipboard via **Ctrl + V**, drag and drop image files, or click to upload.
- **Interactive Cropping Box**: Drag edges and corners freely, or fine-tune boundaries using pixel-accurate sliders (X, Y, Width, Height) to fit grids from 4x4 up to 12x12.
- **HSV Color-Space Clustering**:
  - Intelligently identifies color partitions and establishes connected grid graphs.
  - Automatically maps detected hues to comfortable, accessible names (Coral, Mustard Gold, Mint, Lavender, etc.).
- **🐾 Game Progress Restoration (Seamless Resume)**:
  - **Automatic Mark Detection**: Beyond recognizing color regions, the computer vision engine accurately detects already placed cats (🐱) and elimination marks (✕).
  - **Selective Progress Import**: Includes an "Import cats & ✕ progress from screenshot" checkbox. Choose between loading a blank board or picking up your puzzle right where you left off!
  - **Dual-Tab Preview & Fast Tuning**: Switch between "Color Regions" and "Progress Marks (✕ / 🐱)" in the recognition modal. View real-time cat/cross stats and click any cell to cycle (`Empty ➔ ✕ ➔ 🐱 ➔ Empty`) for instant adjustments before applying to the board.

#### 🖌️ 4. Custom Map Editor & Generator
- **Flexible Dimensions (4×4 to 12×12)**: Seamlessly resize grids to design boards from beginner challenges to grandmaster difficulty.
- **Versatile Painting Tools**:
  - **Brush**: Color individual cells with pinpoint accuracy.
  - **Bucket Fill**: Flood-fill connected adjacent regions rapidly.
  - **Undo / Redo**: Freely experiment with paint layouts without friction.
- **Real-Time Map Integrity Analysis**:
  - Live color counter ensuring the grid is partitioned into exactly $N$ distinct regions.
  - Region connectivity detection that warns against fragmented/disconnected color pockets.
- **Smart Solvability Diagnosis**:
  - One-click feasibility check testing the puzzle in milliseconds.
  - Clear diagnosis badges: "Unique Solution", "Multi Solutions", or "Unsolvable".
- **Quick Utilities & Play Transitions**:
  - Includes "Generate Random Map", "Load Classic Preset", and "Clear Board".
  - Directly transition a painted map into "Interactive Play Mode" or dispatch it to the "Pure-Logic Deduction Engine".

#### 📋 5. Plain-Text Board Export & Sharing
- Export any puzzle into an aligned ASCII matrix with a single click.
- Includes 1-indexed coordinate lists, color block memberships, and current marking progress.
- Ready to paste into community forums, Discord discussions, or Large Language Models (LLMs) for collaborative analysis.

#### 🌐 6. Complete Bilingual Localization
- Seamless real-time switching between **繁體中文 (Traditional Chinese)** and **English**.
- Fully localized interface labels, step breakdowns, game rules, text exports, conflict messages, and user guides.
- Automatic persistence to `localStorage`.

---

### 📖 Game Rules

On an $N \times N$ grid, your goal is to place exactly $N$ cats satisfying three core constraints:

1. **Unique per Color Region**: Exactly **1** cat in each distinct colored region.
2. **Unique per Row & Column**: Exactly **1** cat in every horizontal row and vertical column.
3. **King's Move Non-Touching**: No two cats may touch each other—even diagonally (all 8 surrounding cells must remain free).

---

### 🛠️ Tech Stack

- **Core Framework**: [React 19](https://react.dev/) + [TypeScript 6](https://www.typescriptlang.org/)
- **Build Tool**: [Vite 8](https://vite.dev/)
- **Linter**: [Oxlint](https://oxc.rs/)
- **Iconography**: [Lucide React](https://lucide.dev/) + Custom SVG Vectors (`CatIcon`, `PawIcon`, `CrossIcon`, `GithubIcon`)
- **Animation**: [canvas-confetti](https://www.npmjs.com/package/canvas-confetti)
- **Styling**: Custom Vanilla CSS design system with warm feline aesthetics, glassmorphism, and layered depth
- **CI/CD**: Automated deployment via [GitHub Actions](https://github.com/features/actions) to GitHub Pages

---

### 🚀 Getting Started

#### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- npm, pnpm, or yarn

#### Setup & Run

1. **Clone the repository**
   ```bash
   git clone https://github.com/thr-i-alien/meowdoku-solver.git
   cd meowdoku-solver
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the local dev server**
   ```bash
   npm run dev
   ```
   Open the displayed URL in your browser (defaults to `http://localhost:5173/`).

4. **Build for production**
   ```bash
   npm run build
   ```

5. **Run linter**
   ```bash
   npm run lint
   ```

---

## 📄 授權條款 / License

本專案採用 [MIT License](LICENSE) 進行授權。歡迎自由學習、修改或衍生應用。  
This project is licensed under the [MIT License](LICENSE).
