#!/bin/bash
# 台灣國有土地資料視覺化系統 - 啟動腳本

echo "========================================"
echo "台灣國有土地資料視覺化系統"
echo "========================================"
echo ""

# 檢查 Docker 是否運行
if ! docker ps >/dev/null 2>&1; then
    echo "❌ Docker 未運行，請先啟動 Docker"
    exit 1
fi

echo "✓ Docker 正常運行"
echo ""

# 啟動資料庫
echo "🔹 啟動 PostgreSQL + PostGIS..."
docker compose up -d

sleep 3

# 檢查資料庫是否就緒
echo "🔹 檢查資料庫狀態..."
if docker exec land_data_postgres pg_isready -U landuser -d land_data >/dev/null 2>&1; then
    echo "✓ 資料庫已就緒"
else
    echo "❌ 資料庫尚未就緒，請稍候再試"
    exit 1
fi

echo ""

# 啟動後端 API
echo "🔹 啟動後端 API (port 8001)..."
source .venv/bin/activate
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8001 &
BACKEND_PID=$!
cd ..

sleep 3

# 檢查後端是否啟動
if curl -s http://localhost:8001/health >/dev/null 2>&1; then
    echo "✓ 後端 API 已啟動"
else
    echo "⚠️  後端 API 啟動中..."
fi

echo ""

# 啟動前端
echo "🔹 啟動前端開發伺服器 (port 5173)..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

sleep 3

echo ""
echo "========================================"
echo "✓ 系統啟動完成！"
echo "========================================"
echo ""
echo "📊 資料庫: http://localhost:5432"
echo "🔧 後端 API: http://localhost:8001"
echo "🔧 API 文檔: http://localhost:8001/docs"
echo "🌐 前端: http://localhost:5173"
echo ""
echo "按 Ctrl+C 停止所有服務"
echo ""

# 等待使用者中斷
wait
