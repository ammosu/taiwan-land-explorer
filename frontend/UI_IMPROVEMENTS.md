# 前端 UI/UX 改善說明

## 改善概述

基於 **Data-Dense Dashboard** 和 **政府專業風格** 進行全面 UI 重新設計。

---

## 🎨 設計系統

### 配色方案 (Government/Professional Palette)

| 用途 | 顏色 | Hex | 說明 |
|------|------|-----|------|
| **Primary** | Slate 900 | `#0F172A` | 專業深色,用於標題和重要文字 |
| **Secondary** | Slate 700 | `#334155` | 次要文字和標籤 |
| **Accent (CTA)** | Sky 700 | `#0369A1` | 信任藍,用於按鈕和互動元素 |
| **Background** | Slate 50 | `#F8FAFC` | 頁面背景 |
| **Surface** | White | `#FFFFFF` | 卡片和表單背景 |
| **Text** | Slate 950 | `#020617` | 高對比度內文 |
| **Text Muted** | Slate 500 | `#64748B` | 次要資訊 |
| **Border** | Slate 200 | `#E2E8F0` | 分隔線和邊框 |

### 字型系統

- **標題字型**: Poppins (Google Fonts)
  - 用於 H1-H6 標題
  - 現代、專業、幾何感

- **內文字型**: Noto Sans TC (Google Fonts)
  - 用於繁體中文內文
  - 高可讀性,支援完整中文字集

### 間距系統 (Spacing Scale)

```css
--space-xs: 4px
--space-sm: 8px
--space-md: 16px
--space-lg: 24px
--space-xl: 32px
--space-2xl: 48px
```

### 陰影系統 (Shadows)

- **sm**: 卡片內元素
- **md**: 卡片、表單
- **lg**: 浮動元素、彈出框
- **xl**: 模態框、側邊欄

### 圓角 (Border Radius)

- **sm**: 6px - 按鈕、輸入框
- **md**: 8px - 卡片
- **lg**: 12px - 大型容器

---

## 🔧 主要改進項目

### 1. 全域設計 Token (App.css)

**新增內容:**
- CSS 變數系統 (`:root`)
- 一致的配色、間距、陰影定義
- 無障礙支援 (`prefers-reduced-motion`)
- 響應式斷點
- 自定義滾動條樣式
- 列印樣式

**關鍵改進:**
```css
/* 使用 Design Tokens 而非硬編碼顏色 */
background: var(--color-surface);
border: 1px solid var(--color-border);
box-shadow: var(--shadow-md);
```

### 2. Header 導覽列 (App.jsx)

**改進項目:**
- 新增品牌 Logo (SVG 圖示)
- 統計資訊卡片 (`header-stats`) 採用玻璃擬態效果
- 增加視覺層級和強調
- 邊框加入 Accent 色強調

**視覺效果:**
- 深色背景 (#0F172A) + 藍色底線 (#0369A1)
- Logo + 標題並排顯示
- 統計數字採用半透明卡片設計

### 3. 搜尋列 (SearchBar.jsx)

**改進項目:**
- 新增區塊標題與圖示
- 改善表單輸入框視覺回饋
- 增加 hover 和 focus 狀態
- 自定義下拉選單圖示
- 更好的間距和對齊

**互動改進:**
- 輸入框 hover 時邊框變藍
- Focus 時顯示淺藍光暈
- 按鈕 hover 時微微上浮 (`translateY(-1px)`)

### 4. 搜尋結果列表 (App.jsx)

**改進項目:**
- 採用 `.search-results-card` 樣式類別
- Sticky header 保持可見
- Hover 時項目向右滑動 (`translateX(4px)`)
- 自定義滾動條樣式
- 更清晰的文字層級

**配色:**
- Header: 深色背景 + 白色文字
- Item hover: 淺灰背景
- Meta 資訊: 靜音色文字

### 5. 地圖容器 (MapContainer.jsx)

**改進項目:**
- 多邊形配色改用設計系統顏色
- Hover 效果更明顯 (邊框加粗、顏色變亮)
- Loading 圖示改用旋轉 SVG
- Filter Badge 改用藍色玻璃擬態
- 更專業的視覺回饋

**多邊形樣式:**
```javascript
fillColor: '#0369A1',    // 信任藍
color: '#0F172A',        // 深色邊框
fillOpacity: 0.35,       // 適中透明度
weight: 1.5              // 清晰邊框
```

**Hover 樣式:**
```javascript
fillColor: '#0284C7',    // 更亮的藍色
color: '#0369A1',        // 藍色邊框
fillOpacity: 0.6,        // 增加不透明度
weight: 2.5              // 加粗邊框
```

### 6. 土地詳情側邊欄 (LandDetails.jsx)

**改進項目:**
- Section 標題使用 SVG 圖示取代 Ant Design 圖示
- 圖示顏色統一使用 `var(--color-accent)`
- 價值卡片改用漸變背景
- 更好的視覺層級和資訊密度
- 計算公式顯示

**價值卡片樣式:**
```css
background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%);
border: 1px solid #BFDBFE;
```

### 7. Ant Design 覆寫

**全域改進:**
- 按鈕統一圓角和 hover 效果
- 輸入框 focus 狀態統一
- Drawer header 深色設計
- Descriptions 標籤背景淡化
- Divider 顏色統一

**按鈕效果:**
- Primary 按鈕使用 Accent 藍色
- Hover 時上浮 + 陰影增強
- 過渡動畫 200ms ease-out

---

## ♿ 無障礙改進

### 對比度

- 所有文字符合 **WCAG AA** 標準 (4.5:1 對比度)
- 重要文字使用 Slate 950 (#020617) 確保可讀性

### 動畫

- 支援 `prefers-reduced-motion` 媒體查詢
- 減少動態使用者看不到動畫

### 鍵盤導航

- Focus 狀態使用藍色外框 (2px solid)
- Outline offset 2px 提升可見性

### 語意化

- 正確使用 `<header>`, `<main>`, `<section>`
- SVG 圖示加入適當的 `aria-label` (建議)

---

## 📱 響應式設計

### 斷點

- **Mobile**: < 480px
- **Tablet**: < 768px
- **Desktop**: > 768px

### Mobile 優化

- Header 高度從 72px 縮減為 64px
- 間距自動縮小 (CSS 變數調整)
- Drawer 全螢幕顯示
- 搜尋結果高度減少
- Filter Badge 字體縮小

---

## 🎯 UI/UX 最佳實踐遵循

### ✅ 實施的最佳實踐

| 規則 | 實施狀態 |
|------|---------|
| **使用 SVG 圖示而非 emoji** | ✅ 所有裝飾圖示改用 SVG |
| **一致的圖示尺寸** | ✅ 統一 16x16, 18x18, 20x20 |
| **Hover 狀態不改變佈局** | ✅ 使用 opacity/color 而非 scale |
| **所有可點擊元素有 cursor-pointer** | ✅ 已實施 |
| **平滑過渡動畫** | ✅ 150-300ms ease-out |
| **高對比度文字** | ✅ WCAG AA 達成 |
| **Design Tokens** | ✅ 使用 CSS 變數 |
| **響應式設計** | ✅ 320px-1440px 支援 |

### 🔄 動畫效果

```css
/* Loading Spinner */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Fade In */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
```

---

## 📊 效能考量

### 建置結果

```
dist/index.html                   0.86 kB │ gzip:   0.52 kB
dist/assets/index-*.css          23.69 kB │ gzip:   8.38 kB
dist/assets/index-*.js          882.83 kB │ gzip: 285.93 kB
```

### 優化建議 (未來)

1. **Code Splitting**: 使用動態 import 分割大型組件
2. **Icon Sprites**: 整合 SVG 圖示為單一 sprite
3. **Font Subsetting**: 只載入需要的 Noto Sans TC 字符
4. **Lazy Loading**: 地圖資料延遲載入

---

## 🚀 部署說明

### 建置步驟

```bash
cd frontend
npm install
npm run build
```

### 環境需求

- Node.js 18+
- npm 9+
- Vite 7+

### Google Fonts

已在 `index.html` 中加入:
```html
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500;600;700&family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
```

---

## 📝 維護建議

### 新增顏色時

使用 CSS 變數,不要硬編碼:
```css
/* 好的做法 */
color: var(--color-primary);

/* 避免 */
color: #0F172A;
```

### 新增間距時

使用間距 token:
```css
/* 好的做法 */
padding: var(--space-md);

/* 避免 */
padding: 16px;
```

### 新增陰影時

選擇適當的陰影級別:
```css
box-shadow: var(--shadow-md);  /* 卡片 */
box-shadow: var(--shadow-lg);  /* 浮動元素 */
```

---

## 🎨 設計參考

基於以下 UI/UX Pro Max 搜尋結果:

- **Product Type**: Analytics Dashboard
- **Style**: Data-Dense Dashboard + Swiss Modernism
- **Typography**: Modern Professional (Poppins + Noto Sans TC)
- **Color Palette**: Government/Public Service
- **UX Guidelines**: Accessibility, Animation, Z-Index Management

---

## 📸 視覺對比

### 改善前
- 基礎 Ant Design 預設樣式
- 單調的藍色配色
- 缺乏視覺層級
- Emoji 圖示
- 硬編碼顏色和間距

### 改善後
- 專業的政府風格設計系統
- 一致的品牌配色
- 清晰的視覺層級
- SVG 圖示系統
- Token-based 設計
- 更好的互動回饋

---

## 🔗 相關檔案

- `frontend/index.html` - Google Fonts 載入
- `frontend/src/App.css` - 設計系統和全域樣式
- `frontend/src/App.jsx` - 主應用佈局
- `frontend/src/components/Search/SearchBar.jsx` - 搜尋列
- `frontend/src/components/Map/MapContainer.jsx` - 地圖容器
- `frontend/src/components/Sidebar/LandDetails.jsx` - 詳情側邊欄

---

**最後更新**: 2026-01-22
**設計系統版本**: 1.0.0
