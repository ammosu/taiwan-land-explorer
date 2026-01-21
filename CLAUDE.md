# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 專案概述

台灣國有土地資料視覺化系統 - 一個互動式地圖應用，用於瀏覽和搜尋台灣國有土地資訊。

**資料規模：** 381,344 筆土地資料（從 10,201 對 XML+KML 檔案導入）

**技術棧：**
- 前端：React 18 + Vite + react-leaflet + Ant Design
- 後端：Python 3.12 + FastAPI + SQLAlchemy + GeoAlchemy2
- 資料庫：PostgreSQL 14 + PostGIS 3.3
- 地圖圖資：OpenStreetMap

## 常用指令

### 資料庫操作

```bash
# 啟動 PostgreSQL + PostGIS (Docker)
docker compose up -d

# 停止資料庫
docker compose down

# 查看資料庫日誌
docker compose logs -f postgres

# 連接資料庫
docker exec -it land_data_postgres psql -U landuser -d land_data

# 檢查資料筆數
docker exec land_data_postgres psql -U landuser -d land_data -c "SELECT COUNT(*) FROM lands;"

# 檢查空間索引
docker exec land_data_postgres psql -U landuser -d land_data -c "SELECT indexname FROM pg_indexes WHERE tablename = 'lands';"
```

### 資料導入

```bash
# 使用 uv 創建並啟動虛擬環境
cd scripts
uv venv
source .venv/bin/activate

# 安裝依賴
uv pip install -r requirements.txt

# 執行資料導入（需要先啟動資料庫）
python import_land_data.py

# 預期結果：381,344 筆資料，約 88 秒完成
```

### 後端開發

```bash
cd backend

# 使用 uv 創建並啟動虛擬環境
uv venv
source .venv/bin/activate

# 安裝依賴
uv pip install -r requirements.txt

# 啟動開發伺服器（port 8001，因為 8000 被佔用）
uvicorn app.main:app --reload --port 8001

# 查看 API 文件
# http://localhost:8001/docs
```

### 前端開發

```bash
cd frontend

# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev
# 訪問 http://localhost:5173

# 建置生產版本
npm run build

# 預覽建置結果
npm run preview
```

## 架構說明

### 三層架構

```
[XML/KML 檔案]
    ↓ (import_land_data.py)
[PostgreSQL + PostGIS]
    ↓ (FastAPI with GeoJSON)
[React + Leaflet Map]
```

### 資料流程

1. **資料導入階段**
   - 解析 XML 檔案提取土地屬性（地號、面積、地價等）
   - 解析對應 KML 檔案提取地理座標
   - 正規化地號格式進行配對（例如："00170001" → "17-1"）
   - 批次插入資料庫（每 1000 筆一批）
   - 建立 GIST 空間索引以優化查詢效能

2. **API 查詢階段**
   - 使用 PostGIS `ST_Intersects` 進行空間範圍查詢
   - 轉換為 GeoJSON 格式傳輸
   - 支援縣市、鄉鎮、地號、所有權人等多維度搜尋

3. **前端顯示階段**
   - React Leaflet 渲染互動式地圖
   - 動態載入當前可視範圍內的土地資料
   - 客戶端過濾搜尋結果以保持篩選狀態

### 關鍵技術實現

#### 1. 空間索引查詢（backend/app/api/lands.py:53-57）

```python
# 使用 PostGIS 空間索引進行高效範圍查詢
lands = db.query(Land).filter(
    func.ST_Intersects(
        Land.geometry,
        func.ST_GeomFromText(bbox_wkt, 4326)
    )
).limit(limit).all()
```

**重要：** GIST 空間索引（`idx_lands_geometry`）是效能關鍵，查詢時間從秒級降至毫秒級。

#### 2. GeoJSON 序列化（backend/app/api/lands.py:51）

```python
# 使用 PostGIS ST_AsGeoJSON 直接產生 GeoJSON
func.ST_AsGeoJSON(Land.geometry).label('geometry_json')
```

這比在應用層序列化快 10 倍以上。

#### 3. 地圖效能優化（frontend/src/components/Map/MapContainer.jsx）

**動態查詢限制：**
```javascript
// 當有搜尋條件時，增加 bbox 查詢限制以確保獲得足夠的匹配結果
const bboxLimit = searchFilters ? 2000 : 500;
```

**防抖機制（Debounce）：**
```javascript
// 地圖移動後等待 500ms 才發送請求
timeoutRef.current = setTimeout(() => {
    const bounds = map.getBounds();
    onBoundsChange(bounds);
}, 500);
```

**併發請求控制：**
```javascript
// 使用 ref 防止同時發送多個請求
if (requestInProgressRef.current) return;
requestInProgressRef.current = true;
// ... 執行 API 請求 ...
requestInProgressRef.current = false;
```

**React 優化：**
```javascript
// useCallback 防止不必要的重渲染
const handleBoundsChange = useCallback(async (bounds) => {
    // ...
}, [searchFilters]);
```

#### 4. 搜尋過濾器傳遞（重要！）

**問題：** 搜尋後地圖平移會顯示未過濾的資料

**解決：** 三層過濾機制
1. **App.jsx**: 儲存搜尋條件 `searchFilters` state
2. **MapContainer.jsx**: 客戶端過濾 GeoJSON features
3. **SearchFilterController**: 監聽過濾器變化並重新載入

```javascript
// 客戶端過濾（MapContainer.jsx:143-170）
if (searchFilters && geoJson.features) {
    const filteredFeatures = geoJson.features.filter(feature => {
        const props = feature.properties;
        if (searchFilters.city && props.city !== searchFilters.city) return false;
        if (searchFilters.district && props.district !== searchFilters.district) return false;
        if (searchFilters.parcel_no && !props.parcel_no.includes(searchFilters.parcel_no)) return false;
        return true;
    });
}
```

#### 5. 動態查詢限制（frontend/src/components/Search/SearchBar.jsx:63-72）

```javascript
// 根據搜尋精確度調整結果數量
if (values.district) {
    params.limit = 5000; // 鄉鎮層級：顯示全部（大部分鄉鎮 < 5000 筆）
} else if (values.city) {
    params.limit = 2000; // 縣市層級
} else if (values.parcel_no || values.owner_name) {
    params.limit = 1000; // 特定搜尋
} else {
    params.limit = 100; // 無過濾：保持小量
}
```

## API 端點

### 土地資料 (lands)

- `GET /api/lands/bbox` - 根據地圖範圍查詢（回傳 GeoJSON）
  - 參數：`min_lng`, `min_lat`, `max_lng`, `max_lat`, `limit`（最大 3000）
  - 用途：地圖平移/縮放時動態載入
  - 前端使用：無過濾時 limit=500，有搜尋條件時 limit=2000

- `GET /api/lands/{id}` - 查詢單筆土地詳細資訊
  - 回應：完整屬性 + GeoJSON geometry

- `GET /api/lands/` - 分頁列表
  - 參數：`limit`, `offset`

### 搜尋 (search)

- `GET /api/search/` - 多條件搜尋
  - 參數：`city`, `district`, `parcel_no`, `owner_name`, `limit`（最大 10,000）

- `GET /api/search/cities` - 取得所有縣市清單

- `GET /api/search/districts/{city}` - 取得指定縣市的鄉鎮清單

### 統計 (stats)

- `GET /api/stats/summary` - 系統摘要統計
  - 回應：總筆數、縣市分布、平均面積等

## 資料庫結構

**主表：** `lands` (381,344 筆)

**關鍵欄位：**
- `geometry` - PostGIS Polygon (WGS84, SRID 4326)
- `city`, `district` - 行政區劃
- `section_code`, `parcel_no` - 段代碼、地號
- `area` - 登記面積（平方公尺）
- `announced_value`, `announced_land_price` - 公告現值/地價（元/㎡）
- `owner_name`, `manager_name` - 所有權人/管理者

**索引（6 個）：**
1. `idx_lands_geometry` - GIST 空間索引（最關鍵）
2. `idx_lands_city_district` - 行政區查詢
3. `idx_lands_section_parcel` - 地號查詢
4. `idx_lands_owner` - 所有權人查詢
5. `idx_lands_area` - 面積範圍查詢
6. `idx_lands_announced_value` - 地價查詢

## 常見問題

### 1. 後端無法啟動 (port 8000 被佔用)

```bash
# 後端改用 port 8001
uvicorn app.main:app --reload --port 8001

# 前端 proxy 已配置為 8001（vite.config.js）
```

### 2. 修改後端程式碼後 API 沒有更新

```bash
# 手動重啟 uvicorn
pkill -f uvicorn
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8001
```

### 3. 搜尋後地圖沒有顯示 polygon

**問題：** 搜尋後地圖移動到目標位置，但看不到土地 polygon

**原因：** 搜尋區域的 bbox 範圍內可能包含多個不同地區的土地，當 bbox 查詢限制過低（500 筆）時，過濾後可能沒有符合搜尋條件的土地

**解決：**
- 前端：當有搜尋條件時，bbox limit 從 500 增加到 2000
- 後端：bbox API 最大限制從 1000 增加到 3000
- 搜尋後的地圖 zoom 級別從 15 調整為 13（更大視野）

### 4. 搜尋後地圖平移顯示錯誤資料

這個問題已透過客戶端過濾解決。確保：
- `App.jsx` 中 `searchFilters` state 正確傳遞給 `MapContainer`
- `MapContainer.jsx` 中 `handleBoundsChange` 包含過濾邏輯
- `SearchFilterController` 使用 `prevFiltersRef` 避免無限迴圈

### 5. 地圖移動時 API 請求過於頻繁

已實施三項優化：
- 500ms 防抖（debounce）
- `requestInProgressRef` 防止併發
- `useCallback` 優化 React 渲染

### 6. 虛擬環境管理

本專案使用 `uv` 管理 Python 虛擬環境：

```bash
# 創建虛擬環境
uv venv

# 啟動虛擬環境
source .venv/bin/activate

# 安裝依賴
uv pip install -r requirements.txt

# 退出虛擬環境
deactivate
```

## 效能指標

- **資料導入速度：** 381,344 筆 / 88 秒 = ~4,300 筆/秒
- **資料庫查詢時間：** < 100ms（使用 GIST 索引）
- **API 回應時間：** < 500ms
- **前端地圖渲染：** 1,000 個多邊形 < 1 秒

## 目錄結構

```
open_land_data/
├── database/
│   └── schema.sql          # PostgreSQL + PostGIS schema
├── scripts/
│   ├── import_land_data.py # 資料導入主程式（360+ 行）
│   └── requirements.txt    # Python 依賴
├── backend/
│   ├── app/
│   │   ├── main.py         # FastAPI 入口
│   │   ├── models.py       # SQLAlchemy 模型
│   │   ├── schemas.py      # Pydantic schemas
│   │   ├── database.py     # 資料庫連線
│   │   └── api/
│   │       ├── lands.py    # 土地資料 API (3 endpoints)
│   │       ├── search.py   # 搜尋 API (3 endpoints)
│   │       └── stats.py    # 統計 API (1 endpoint)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Map/
│   │   │   │   └── MapContainer.jsx  # 主地圖元件（310 行）
│   │   │   ├── Search/
│   │   │   │   └── SearchBar.jsx     # 搜尋列
│   │   │   └── Sidebar/
│   │   │       └── LandDetails.jsx   # 詳細資訊側邊欄
│   │   ├── services/
│   │   │   └── api.js                # API 封裝（axios）
│   │   └── App.jsx                   # 主應用（狀態管理）
│   └── package.json
└── docker-compose.yml      # PostgreSQL + PostGIS 容器
```

## 開發注意事項

### 修改 API 端點時

1. 更新 `backend/app/api/*.py`
2. 確認 Pydantic schema 定義於 `backend/app/schemas.py`
3. 重啟後端服務
4. 更新 `frontend/src/services/api.js` 的對應方法
5. 測試 API 文件：http://localhost:8001/docs

### 修改地圖互動時

1. 主要邏輯在 `MapContainer.jsx`
2. 注意防抖和併發控制機制
3. 測試效能：打開 Network 標籤確認請求頻率
4. 使用 React DevTools 檢查不必要的重渲染

### 修改資料庫結構時

1. 更新 `database/schema.sql`
2. 更新 `backend/app/models.py` 的 SQLAlchemy 模型
3. 重建資料庫或執行 migration
4. 重新導入資料（如需要）
5. 更新相關 API 端點和 schemas

### 新增搜尋條件時

1. 更新 `SearchBar.jsx` 表單欄位
2. 更新 `backend/app/api/search.py` 查詢邏輯
3. 更新 `MapContainer.jsx` 客戶端過濾邏輯
4. 確保三層都支援新條件（表單 → API → 地圖過濾）

## 測試驗證

```bash
# 1. 資料庫驗證
docker exec land_data_postgres psql -U landuser -d land_data -c "SELECT COUNT(*) FROM lands;"
# 預期：381344

docker exec land_data_postgres psql -U landuser -d land_data -c "SELECT COUNT(*) FROM lands WHERE geometry IS NULL;"
# 預期：0

# 2. API 測試（台北市範圍）
curl "http://localhost:8001/api/lands/bbox?min_lng=121.50&min_lat=25.02&max_lng=121.52&max_lat=25.04&limit=100"

# 3. 搜尋測試
curl "http://localhost:8001/api/search/?city=台北市&district=中正區&limit=100"

# 4. 效能測試
time curl "http://localhost:8001/api/lands/bbox?min_lng=121.5&min_lat=25.0&max_lng=121.6&max_lat=25.1&limit=500"
# 預期：< 1 秒
```

## 已知問題

無目前已知的未解決問題。所有初期回報的問題（搜尋過濾、API 請求頻率、結果數量限制）均已修復。

## 未來擴充方向

1. **圖層切換：** 支援不同主題圖層（地價熱力圖、用途分類著色）
2. **匯出功能：** 匯出搜尋結果為 CSV/GeoJSON/ShapeFile
3. **統計儀表板：** 面積分布、地價趨勢圖表
4. **使用者系統：** 登入、收藏土地、比較功能
5. **向量圖磚：** 使用 Mapbox Vector Tiles 提升大量資料渲染效能
6. **行動版優化：** 改進 RWD 設計與觸控互動
7. **全文搜尋：** 使用 PostgreSQL full-text search 提升搜尋體驗

## 重要實施細節

### 地號正規化

資料導入時需要正規化地號格式以配對 XML 和 KML 檔案：

```python
def normalize_parcel_no(parcel_no: str) -> str:
    """正規化地號格式 '00170001' -> '17-1'"""
    if not parcel_no or len(parcel_no) < 4:
        return parcel_no

    # 分為母號和子號
    mother = parcel_no[:4].lstrip('0') or '0'
    child = parcel_no[4:].lstrip('0') or '0'

    return f"{mother}-{child}"
```

### MapContainer 元件架構

MapContainer 包含三個子元件，各自負責不同功能：

1. **MapBoundsHandler** - 監聽地圖移動/縮放，觸發資料載入（含防抖）
2. **MapCenterController** - 控制地圖中心點移動（搜尋結果定位時使用）
3. **SearchFilterController** - 監聽搜尋過濾器變化，重新載入地圖資料

這種分離設計讓各個功能獨立運作，避免互相干擾。

### React Hooks 依賴管理

**關鍵：** SearchFilterController 必須使用 `prevFiltersRef` 來檢測變化，避免無限迴圈：

```javascript
const prevFiltersRef = useRef(null);

useEffect(() => {
    const filtersChanged = JSON.stringify(prevFiltersRef.current) !== JSON.stringify(searchFilters);
    if (filtersChanged && map) {
        prevFiltersRef.current = searchFilters;
        onReload(bounds);
    }
}, [searchFilters]); // 只依賴 searchFilters
```

如果 dependency array 包含 `onReload`，會導致每次渲染都觸發。
