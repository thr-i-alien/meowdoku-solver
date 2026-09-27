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

**Meowdoku Solver** 是一款專為「Meowdoku / 貓咪數獨」設計的現代化益智解謎與智能推導應用程式。

結合了**純邏輯推導引擎**、**步驟白話解說**、**截圖色彩自動辨識**、**智慧錦囊**與**極致流暢的手機/電腦雙端手感**。無論是想親自動腦挑戰解謎，還是想一窺背後嚴謹的消去法推導步驟，都能輕鬆上手！

---

## 🔗 線上體驗 (Live Demo)

- 🌐 **立即線上試玩**：[https://thr-i-alien.github.io/meowdoku-solver/](https://thr-i-alien.github.io/meowdoku-solver/)
- 📱 完整適配桌面滑鼠與行動裝置觸控操作，免安裝開啟即玩。

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
- **步驟詳解與視覺化時間軸**：
  - 白話解說每一步驟背後的邏輯理由與策略名稱。
  - 提供播放、暫停、倍速調整（1x / 2x / 5x / 10x）、手動滑桿拖曳與單步上一步/下一步。
  - 盤面高亮色彩提示：綠色表示確認放置貓咪、橘色/紅色表示排除空格、紫色/亮色高亮受影響的區域與行列。

### 🎮 2. 極致友善的手動解題模式 (Play Mode)
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

### 📷 3. 截圖影像智能辨識 (Image OCR & Grid Detection)
- **多種輸入途徑**：支援剪貼簿直接 **Ctrl + V** 貼上截圖、檔案拖曳上傳或點擊選檔。
- **自由互動式裁切框**：支援滑鼠/觸控拖曳四邊與四角調整裁切區域，並提供 X、Y、寬、高 像素級滑桿微調。
- **HSV 色彩空間聚類分析**：
  - 智慧識別色塊分佈，自動建立區塊連通圖。
  - 自動轉換為舒適且易讀的色彩命名（如珊瑚粉、芥末金黃、薄荷綠、薰衣草紫等）。
- **即時辨識預覽**：辨識結果直接預覽於彈窗中，確認無誤後一鍵匯入棋盤。

### 📋 4. 純文字盤面匯出與題目分享 (Export & Share)
- 一鍵將題目生成對齊工整的純文字字元矩陣。
- 包含 1-indexed 坐標清單、各色彩區塊所包含的格子、目前標記進度。
- 便於複製至論壇、社群討論或提供給大型語言模型 (LLM) 進行分析解題。

### 🌐 5. 完整雙語系支援 (Bilingual Support)
- 支援**繁體中文 (Traditional Chinese)** 與 **English** 一鍵無縫切換。
- 全站所有介面標題、推導步驟解說、邏輯規則、純文字匯出、衝突提示與操作指南皆完整雙語本地化。
- 自動保存語系偏好於本機 LocalStorage。

---

## 📖 遊戲基本規則

在 $N \times N$ 的棋盤中，目標是在盤面上放置 $N$ 隻貓咪，並遵守以下三大條件：

1. **顏色區塊唯一**：每個彩色分區剛好放置 **1** 隻貓咪。
2. **行列唯一限制**：每一橫列與同一直欄剛好放置 **1** 隻貓咪。
3. **國王步不相鄰**：任何兩隻貓咪周圍八格（上下、左右、四個對角斜角）**均不可碰觸**。

---

## 🛠️ 技術堆疊

- **核心框架**：[React 19](https://react.dev/) + [TypeScript 6](https://www.typescriptlang.org/)
- **建置工具**：[Vite 8](https://vite.dev/)
- **程式碼檢查**：[Oxlint](https://oxc.rs/)
- **圖示庫**：[Lucide React](https://lucide.dev/) + 手工繪製向量貓咪 SVG (`CatIcon`, `PawIcon`, `CrossIcon`)
- **視覺動效**：[canvas-confetti](https://www.npmjs.com/package/canvas-confetti)
- **樣式設計**：客製化純 CSS 設計系統，具備溫暖貓咪美學色彩與深淺層次
- **自動化部署**：[GitHub Actions](https://github.com/features/actions) 自動持續整合與發布至 GitHub Pages

---

## 📁 專案結構

```text
meowdoku-solver/
├── .github/
│   └── workflows/
│       └── deploy.yml       # GitHub Actions 自動部署至 GitHub Pages
├── src/
│   ├── assets/              # 靜態資源
│   ├── components/          # UI 元件
│   │   ├── icons/           # 貓咪、肉球、叉號等專屬向量圖示
│   │   ├── Board.tsx        # 核心棋盤（雙擊放貓、滑動拖曳劃記與手勢優化）
│   │   ├── ExportTextModal.tsx # 純文字題庫匯出與分享彈窗
│   │   ├── Header.tsx       # 頂部導覽列、模式切換與語系選擇
│   │   ├── HelpModal.tsx    # 規則說明與詳細操作指引
│   │   ├── HintCard.tsx     # 智慧錦囊提示懸浮卡片
│   │   ├── ImageUploadModal.tsx # 截圖辨識、互動式裁切與色彩聚類
│   │   ├── PlayControlPanel.tsx # 玩家控制列（計時器、錦囊、重置、輔助開關）
│   │   ├── StepExplanation.tsx  # AI 推導白話步驟說明卡片
│   │   ├── TimelinePlayer.tsx   # 推導時間軸播放器（倍速、步進與滑桿）
│   │   └── VictoryModal.tsx     # 通關勝利彈窗與彩帶特效
│   ├── i18n/                # 國際化多語系支援
│   │   ├── locales/         # 語系檔（繁體中文 zh-TW、英文 en）
│   │   ├── context.tsx      # I18n Context 與切換 Hook
│   │   ├── types.ts         # 雙語字典型別定義
│   │   └── index.ts         # 語系資源匯出點
│   ├── logic/               # 演算法與核心邏輯
│   │   ├── exportText.ts    # 題目純文字化排版產生器
│   │   ├── imageRecognizer.ts # 圖片顏色分析、色彩空間聚類與盤面辨識
│   │   ├── presets.ts       # 內建預設精選題目與色系配置
│   │   ├── solver.ts        # 純邏輯推導引擎與回溯解題器
│   │   └── validator.ts     # 衝突檢測、智慧提示與通關驗證
│   ├── types/               # TypeScript 型別定義
│   │   └── game.ts          # 棋盤、推導步驟、衝突資訊等型別
│   ├── App.tsx              # 主應用程式控制器
│   ├── main.tsx             # 程式進入點
│   └── index.css            # 全域設計系統、暖色貓咪主題與響應式樣式
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🚀 快速開始

### 環境需求
- [Node.js](https://nodejs.org/) (建議版本 v18 以上)
- npm、pnpm 或 yarn

### 安裝步驟

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

## 📄 授權條款 (License)

本專案採用 [MIT License](LICENSE) 進行授權。歡迎自由學習、修改或衍生應用。
