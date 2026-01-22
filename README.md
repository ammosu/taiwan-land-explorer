# 🗺️ Taiwan Land Explorer

> 台灣國有土地資料視覺化系統

互動式地圖應用，用於瀏覽和搜尋台灣國有土地資訊。

[![Python 3.12+](https://img.shields.io/badge/python-3.12+-blue.svg)](https://www.python.org/downloads/)
[![React 18](https://img.shields.io/badge/react-18-blue.svg)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green.svg)](https://fastapi.tiangolo.com/)
[![PostGIS](https://img.shields.io/badge/PostGIS-3.3-orange.svg)](https://postgis.net/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 🚀 線上展示

- **應用程式**: https://taiwan-land-explorer.onrender.com/
- **API 文檔**: https://taiwan-land-api.onrender.com/docs

> 💡 查看 [DEPLOY.md](DEPLOY.md) 了解如何部署到 Render 免費方案
>
> ⚠️ 注意: 使用 Render 免費方案，閒置 15 分鐘後會休眠，首次訪問需等待約 50 秒喚醒

## 📊 專案資訊

- **資料筆數**: 381,344 筆國有土地
- **涵蓋範圍**: 全台 22 縣市、334 鄉鎮市區
- **地理資料**: 100% 完整多邊形邊界
- **總面積**: 約 762,680,401 m² (約 230,909 公頃)

## 🛠 技術棧

### 後端
- **FastAPI** - 現代、高效能的 Python Web 框架
- **SQLAlchemy + GeoAlchemy2** - ORM 與地理空間擴展
- **PostgreSQL + PostGIS** - 地理空間資料庫
- **Pydantic** - 資料驗證

### 前端
- **React** - 使用者介面框架
- **Vite** - 快速的前端建置工具
- **React Leaflet** - React 地圖組件
- **Ant Design** - UI 組件庫
- **Axios** - HTTP 客戶端

### 基礎設施
- **Docker + Docker Compose** - 容器化資料庫
- **uv** - 快速 Python 套件管理器

## 🚀 快速開始

### 先決條件

- Python 3.11+
- Node.js 18+
- Docker & Docker Compose
- uv (推薦)

### 安裝步驟

1. **克隆專案**
   ```bash
   cd /home/cw/git_project/open_land_data
   ```

2. **建立 Python 虛擬環境**
   ```bash
   uv venv
   source .venv/bin/activate
   ```

3. **安裝依賴**
   ```bash
   # 後端依賴
   cd backend
   uv pip install -r requirements.txt
   cd ..

   # 前端依賴
   cd frontend
   npm install
   cd ..
   ```

4. **啟動資料庫**
   ```bash
   docker compose up -d
   ```

5. **啟動後端 API**
   ```bash
   source .venv/bin/activate
   cd backend
   uvicorn app.main:app --host 0.0.0.0 --port 8001
   ```

6. **啟動前端**
   ```bash
   cd frontend
   npm run dev
   ```

### 使用啟動腳本（推薦）

```bash
./start.sh
```

## 📱 訪問應用

- **前端應用**: http://localhost:5173
- **API 文檔**: http://localhost:8001/docs
- **API 端點**: http://localhost:8001/api/

## 🗺 主要功能

### 地圖功能
- ✅ 互動式地圖瀏覽（OpenStreetMap）
- ✅ 動態載入可視範圍內的土地
- ✅ 土地多邊形渲染
- ✅ Hover 與 Click 互動
- ✅ 彈出視窗顯示基本資訊

### 搜尋功能
- ✅ 按縣市搜尋
- ✅ 按鄉鎮市區搜尋
- ✅ 按地號搜尋（部分符合）
- ✅ 按所有權人搜尋（部分符合）
- ✅ 下拉選單自動完成

### 詳細資訊
- ✅ 土地位置資訊
- ✅ 登記面積（含坪數轉換）
- ✅ 使用分區與用途
- ✅ 公告現值、公告地價
- ✅ 所有權人資訊
- ✅ 管理者資訊
- ✅ 自動計算總價值

## 🔌 API 端點

### 土地資料 (`/api/lands`)
- `GET /api/lands/bbox` - 按地圖範圍查詢（回傳 GeoJSON）
- `GET /api/lands/{id}` - 取得單筆土地詳細資訊
- `GET /api/lands/` - 分頁列表

### 搜尋 (`/api/search`)
- `GET /api/search/` - 多條件搜尋
- `GET /api/search/cities` - 取得縣市列表
- `GET /api/search/districts` - 取得鄉鎮列表
- `GET /api/search/sections` - 取得段列表

### 統計 (`/api/stats`)
- `GET /api/stats/summary` - 總體統計摘要
- `GET /api/stats/by-city` - 按縣市統計
- `GET /api/stats/by-district` - 按鄉鎮統計

## 📁 專案結構

```
open_land_data/
├── ALL/                      # 原始資料 (XML + KML)
├── database/
│   └── schema.sql            # 資料庫結構
├── scripts/
│   ├── import_land_data.py   # 資料導入腳本
│   └── requirements.txt
├── backend/
│   └── app/
│       ├── main.py           # FastAPI 應用
│       ├── models.py         # 資料庫模型
│       ├── schemas.py        # Pydantic schemas
│       ├── database.py       # 資料庫連線
│       ├── config.py         # 配置
│       └── api/              # API 端點
│           ├── lands.py
│           ├── search.py
│           └── stats.py
├── frontend/
│   └── src/
│       ├── components/       # React 元件
│       │   ├── Map/
│       │   ├── Search/
│       │   └── Sidebar/
│       ├── services/         # API 服務
│       └── App.jsx           # 主應用
├── docker-compose.yml        # 資料庫容器
├── start.sh                  # 啟動腳本
├── .env                      # 環境變數
├── CLAUDE.md                 # 開發筆記
└── README.md                 # 本文件
```

## 🔍 效能優化

### 資料庫
- ✅ PostGIS GIST 空間索引
- ✅ 複合索引（縣市+鄉鎮、段+地號）
- ✅ 連線池管理（10-30 connections）

### API
- ✅ 查詢結果動態限制（無過濾 500 筆，有搜尋條件 2000 筆）
- ✅ 使用 GeoJSON 格式高效傳輸
- ✅ 僅傳輸必要欄位

### 前端
- ✅ 按需載入地圖範圍資料
- ✅ 地圖移動 500ms debounce
- ✅ 併發請求控制
- ✅ React Query 快取管理

## 📝 資料來源

本專案使用的國有土地資料來自：

**內政部國土測繪中心 - 國有土地清冊**
- 🔗 資料來源: https://easymap.moi.gov.tw/R01OpenData/Index
- 📅 資料類型: 政府開放資料
- 🏛️ 提供機關: 內政部國土測繪中心
- 📊 資料筆數: 381,344 筆國有土地

**資料格式說明:**
- **XML 檔案**: 土地屬性資料（縣市、鄉鎮、段、地號、面積、地價、所有權人等）
- **KML 檔案**: 土地地理邊界（Polygon 多邊形座標，WGS84 座標系統）
- **資料配對**: 透過地號正規化配對 XML 與 KML 檔案

**資料處理:**
- 共處理 10,201 對 XML+KML 檔案
- 成功匯入 381,344 筆完整土地資料（100% 含地理邊界）
- 建立 PostGIS 空間索引以優化查詢效能

## 🐛 問題排除

### 資料庫連線失敗
```bash
# 檢查 Docker 容器狀態
docker ps

# 查看資料庫日誌
docker compose logs postgres

# 重新啟動資料庫
docker compose restart
```

### Port 衝突
```bash
# 檢查 Port 佔用
lsof -i :8001  # 後端
lsof -i :5173  # 前端
lsof -i :5432  # 資料庫
```

### 資料導入問題
```bash
# 查看導入日誌
tail -f /tmp/claude/.../import.log

# 檢查資料庫資料
docker exec land_data_postgres psql -U landuser -d land_data -c "SELECT COUNT(*) FROM lands;"
```

## 🚀 部署

本專案可以部署到 Render 免費方案上！

### 快速部署

詳細步驟請參閱 [DEPLOY.md](DEPLOY.md)

### 資源需求

- **資料庫大小**: 257 MB（符合 Render 免費方案 1GB 限制）
- **RAM 需求**: 512 MB（後端）
- **成本**: 完全免費（測試/展示用途）

### 部署選項

1. **Render 免費方案**（推薦測試用）
   - ✅ 完全免費
   - ⚠️ 閒置 15 分鐘後休眠
   - ⚠️ 資料庫 90 天後刪除

2. **Render 付費方案**（生產環境）
   - 💰 $14/月起
   - ✅ 永久保留資料
   - ✅ 無休眠限制

## 📄 授權與聲明

### 專案授權
本專案程式碼採用 MIT License 授權。

### 資料使用聲明
- 資料來源：內政部國土測繪中心 - 國有土地清冊
- 資料性質：政府開放資料
- 使用目的：教育、研究與公益用途
- 資料網址：https://easymap.moi.gov.tw/R01OpenData/Index

**免責聲明：**
本專案僅供教育與研究用途，所有資料來自政府公開資料，不保證資料的即時性、正確性與完整性。如需正式資料，請參考內政部國土測繪中心官方網站。

## 🙏 致謝

- **內政部國土測繪中心** - 提供國有土地公開資料
- **OpenStreetMap** - 提供免費地圖圖磚服務
- **開源社群** - FastAPI、React、Leaflet 等優秀的開源專案

## 👥 貢獻

歡迎提交 Issue 和 Pull Request！

## 📞 聯絡資訊

如有問題，請透過 GitHub Issues 聯繫。
