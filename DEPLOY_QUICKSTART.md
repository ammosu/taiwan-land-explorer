# 🚀 Render 快速部署指南

## 準備工作（本地已完成）

✅ 資料庫匯出：`land_data_dump.sql` (248MB) 和 `land_data_dump.sql.gz` (59MB)
✅ Docker 配置：`backend/Dockerfile` 和 `.dockerignore`
✅ Render Blueprint：`render.yaml`
✅ 環境變數範例：`frontend/.env.example`

## 三步驟部署

### 1️⃣ 推送程式碼到 GitHub

```bash
git add .
git commit -m "Ready for Render deployment"
git push origin main
```

### 2️⃣ 在 Render Dashboard 創建服務

登入 [Render Dashboard](https://dashboard.render.com/)

#### A. 創建 PostgreSQL 資料庫

1. 點擊 **"New +"** → **"PostgreSQL"**
2. 設定：
   - Name: `taiwan-land-db`
   - Database: `land_data`
   - User: `landuser`
   - Region: **Singapore**
   - Plan: **Free**
3. 創建後，啟用 PostGIS：
   ```bash
   # 複製資料庫的 "External Connection String"
   psql "postgres://landuser:密碼@主機/land_data" \
     -c "CREATE EXTENSION IF NOT EXISTS postgis;"
   ```

#### B. 匯入資料庫結構和資料

```bash
# 1. 匯入結構
psql "你的資料庫連接字串" < database/schema.sql

# 2. 匯入資料（選擇其一）
# 選項 A：使用未壓縮檔案（較快）
psql "你的資料庫連接字串" < land_data_dump.sql

# 選項 B：使用壓縮檔案（較慢但省流量）
gunzip -c land_data_dump.sql.gz | psql "你的資料庫連接字串"

# 3. 驗證資料
psql "你的資料庫連接字串" -c "SELECT COUNT(*) FROM lands;"
# 預期輸出：381344
```

#### C. 部署後端 API

1. 點擊 **"New +"** → **"Web Service"**
2. 連接 GitHub repository: `taiwan-land-explorer`
3. 設定：
   - Name: `taiwan-land-api`
   - Region: **Singapore**
   - Branch: `main`
   - Root Directory: `backend`
   - Environment: **Docker**
   - Plan: **Free**
4. 環境變數：
   - `DATABASE_URL`: 資料庫的 **"Internal Connection String"**
   - `CORS_ORIGINS`: `*`
   - `PORT`: `8001`
5. 點擊 **"Create Web Service"**

#### D. 部署前端

1. 點擊 **"New +"** → **"Static Site"**
2. 選擇同一個 repository
3. 設定：
   - Name: `taiwan-land-explorer`
   - Region: **Singapore**
   - Branch: `main`
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`
   - Plan: **Free**
4. 環境變數：
   - `VITE_API_URL`: 你的後端 URL（如：`https://taiwan-land-api.onrender.com`）
5. 點擊 **"Create Static Site"**

### 3️⃣ 驗證部署

```bash
# 檢查後端 API
curl https://你的後端.onrender.com/api/stats/summary

# 訪問前端
open https://你的前端.onrender.com
```

## ⚡ 使用自動化腳本

```bash
# 本地執行（自動匯出資料）
./prepare_deploy.sh
```

## ⚠️ 免費方案提醒

- **資料庫**：90 天後刪除，記得備份
- **後端**：閒置 15 分鐘休眠，首次訪問需 30-60 秒
- **前端**：無休眠問題

## 🔗 相關連結

- 完整文檔：[DEPLOY.md](DEPLOY.md)
- 專案說明：[README.md](README.md)
- Render 文檔：https://render.com/docs

## 💰 成本

- 免費方案：$0/月（適合測試/展示）
- 付費方案：$14/月（無限制，永久保留）

---

**部署完成後的 URL：**
- 前端：`https://taiwan-land-explorer.onrender.com`
- 後端：`https://taiwan-land-api.onrender.com`
- API 文檔：`https://taiwan-land-api.onrender.com/docs`
