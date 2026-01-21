# 🚀 部署指南 - Render 免費方案

本指南說明如何將 Taiwan Land Explorer 部署到 Render 免費方案上。

## 📋 前置準備

1. **GitHub 帳號**：專案已推送到 https://github.com/ammosu/taiwan-land-explorer
2. **Render 帳號**：註冊 [Render.com](https://render.com/)
3. **資料庫備份**：準備好資料匯入方案

## 🗄️ 資料庫大小

- 目前資料庫：**257 MB**（381,344 筆土地資料）
- Render 免費方案：**1 GB** 儲存空間
- ✅ 完全符合免費方案限制

## 📦 部署步驟

### 步驟 1：創建 PostgreSQL 資料庫

1. 登入 [Render Dashboard](https://dashboard.render.com/)
2. 點擊 **"New +"** → 選擇 **"PostgreSQL"**
3. 設定如下：
   - **Name**: `taiwan-land-db`
   - **Database**: `land_data`
   - **User**: `landuser`
   - **Region**: Singapore（或選擇離你最近的區域）
   - **PostgreSQL Version**: 14
   - **Plan**: Free
4. 點擊 **"Create Database"**
5. 等待資料庫創建完成（約 1-2 分鐘）

### 步驟 2：啟用 PostGIS 擴展

資料庫創建後，需要手動啟用 PostGIS：

1. 在資料庫頁面找到 **"Connect"** 區塊
2. 複製 **"External Connection String"**（格式：`postgres://user:pass@host/database`）
3. 使用本地 psql 連接：
   ```bash
   psql "postgresql://landuser:密碼@主機/land_data"
   ```
4. 執行以下 SQL：
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   \q
   ```

### 步驟 3：匯入資料庫結構

```bash
# 連接到 Render 資料庫
psql "你的資料庫連接字串" < database/schema.sql
```

### 步驟 4：部署後端 API

1. 回到 Render Dashboard
2. 點擊 **"New +"** → 選擇 **"Web Service"**
3. 選擇 **"Build and deploy from a Git repository"**
4. 連接你的 GitHub 帳號並選擇 `taiwan-land-explorer` repository
5. 設定如下：
   - **Name**: `taiwan-land-api`
   - **Region**: Singapore
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Environment**: Docker
   - **Dockerfile Path**: `./Dockerfile`
   - **Plan**: Free
6. 設定環境變數：
   - `DATABASE_URL`: 從步驟 1 的資料庫複製 **"Internal Connection String"**
   - `CORS_ORIGINS`: `*`（允許所有來源，生產環境應限制）
   - `PORT`: `8001`
7. 點擊 **"Create Web Service"**

### 步驟 5：部署前端

1. 點擊 **"New +"** → 選擇 **"Static Site"**
2. 選擇同一個 GitHub repository
3. 設定如下：
   - **Name**: `taiwan-land-explorer`
   - **Region**: Singapore
   - **Branch**: `main`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
   - **Plan**: Free
4. 設定環境變數：
   - `VITE_API_URL`: 你的後端 API URL（格式：`https://taiwan-land-api.onrender.com`）
5. 點擊 **"Create Static Site"**

## 📊 匯入土地資料

由於原始資料檔案（10,000+ XML/KML）過大無法上傳到 GitHub，有兩種方式匯入資料：

### 選項 A：本地匯出/匯入（推薦）

**步驟 1：本地匯出資料**
```bash
# 從本地 Docker 資料庫匯出
docker exec land_data_postgres pg_dump -U landuser -d land_data \
  --no-owner --no-acl \
  --data-only \
  --table=lands \
  > land_data_dump.sql
```

**步驟 2：匯入到 Render**
```bash
# 連接到 Render 資料庫並匯入
psql "你的 Render 資料庫連接字串" < land_data_dump.sql
```

**預計時間：** 約 5-10 分鐘（視網路速度而定）

### 選項 B：重新執行導入腳本

如果你有原始 XML/KML 檔案：

1. 上傳到雲端儲存（如 S3、Google Drive）
2. 在本地下載並執行導入腳本，但指定 Render 資料庫：
   ```bash
   # 設定環境變數
   export DATABASE_URL="你的 Render 資料庫連接字串"

   # 執行導入
   python scripts/import_land_data.py
   ```

**預計時間：** 約 2-3 分鐘（網路上傳較慢）

## ✅ 驗證部署

### 檢查資料庫
```bash
psql "你的資料庫連接字串" -c "SELECT COUNT(*) FROM lands;"
```
預期輸出：`381344`

### 檢查後端 API
訪問：`https://你的後端.onrender.com/docs`

應該能看到 Swagger API 文檔。

測試端點：
```bash
curl https://你的後端.onrender.com/api/stats/summary
```

### 檢查前端
訪問：`https://你的前端.onrender.com/`

應該能看到地圖界面。

## ⚠️ 免費方案限制

### 資料庫
- ✅ 1 GB 儲存（目前使用 257 MB）
- ⚠️ 90 天後會被刪除（需要定期備份）
- ⚠️ 連線數限制：最多 97 個

### Web Service
- ✅ 免費 750 小時/月
- ⚠️ 閒置 15 分鐘後休眠
- ⚠️ Cold start 約 30-60 秒
- ⚠️ 512 MB RAM

### 靜態站點
- ✅ 100 GB 頻寬/月
- ✅ 無休眠問題
- ✅ CDN 加速

## 🔄 更新部署

Render 會自動監聽 GitHub repository 的變更：

1. **推送到 main 分支**：
   ```bash
   git add .
   git commit -m "Update"
   git push origin main
   ```

2. **自動部署**：Render 會自動檢測變更並重新部署

3. **手動觸發**：在 Render Dashboard 點擊 **"Manual Deploy"**

## 🛠️ 常見問題

### Q1: 部署失敗，顯示 "Out of memory"
**A:** 免費方案只有 512 MB RAM，可能在建置時超出限制。
- 解決：使用更小的 Docker base image（已使用 `python:3.12-slim`）

### Q2: Cold start 太慢
**A:** 免費方案的 cold start 時間約 30-60 秒。
- 解決：升級到付費方案（$7/月起）或使用 UptimeRobot 定期 ping

### Q3: 資料庫 90 天後被刪除怎麼辦？
**A:** 免費資料庫會在 90 天後刪除。
- 解決：
  1. 定期備份（使用 `pg_dump`）
  2. 重新創建資料庫並匯入備份
  3. 升級到付費方案（$7/月，永久保留）

### Q4: CORS 錯誤
**A:** 前端無法訪問後端 API。
- 檢查：後端環境變數 `CORS_ORIGINS` 是否包含前端 URL
- 解決：更新 `CORS_ORIGINS=*` 或指定前端 URL

### Q5: 地圖無資料
**A:** 前端顯示但地圖無 polygon。
- 檢查：資料庫是否成功匯入資料
- 驗證：`psql -c "SELECT COUNT(*) FROM lands;"`
- 檢查：前端 API URL 是否正確設定

## 💰 成本分析

### 免費方案（測試/展示）
- 資料庫：$0
- 後端：$0
- 前端：$0
- **總計：$0/月**

限制：
- 資料庫 90 天後刪除
- 閒置後休眠
- Cold start 延遲

### 付費方案（生產環境）
- PostgreSQL Starter：$7/月（256MB RAM，1GB 儲存，永久）
- Web Service Starter：$7/月（512MB RAM，無休眠）
- Static Site：$0（免費）
- **總計：$14/月**

優點：
- 永久保留資料
- 無休眠
- 更好的效能

## 📞 支援

- Render 文檔：https://render.com/docs
- 專案 Issues：https://github.com/ammosu/taiwan-land-explorer/issues

## 🎉 完成！

部署完成後，你的應用會在以下 URL 可用：
- 前端：`https://taiwan-land-explorer.onrender.com`
- 後端：`https://taiwan-land-api.onrender.com`
- API 文檔：`https://taiwan-land-api.onrender.com/docs`

享受你的 Taiwan Land Explorer！🗺️
