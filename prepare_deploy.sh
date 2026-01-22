#!/bin/bash

echo "🚀 Taiwan Land Explorer - Render 部署準備工具"
echo "================================================"
echo ""

# 檢查 Docker 是否運行
echo "✓ 檢查 Docker 容器狀態..."
if docker ps --filter "name=land_data_postgres" --format "{{.Status}}" | grep -q "Up"; then
    echo "  ✓ 資料庫容器運行中"
else
    echo "  ✗ 資料庫容器未運行，請先啟動："
    echo "    docker compose up -d"
    exit 1
fi

# 檢查資料筆數
echo ""
echo "✓ 檢查資料庫資料..."
LAND_COUNT=$(docker exec land_data_postgres psql -U landuser -d land_data -t -c "SELECT COUNT(*) FROM lands;" 2>/dev/null | tr -d ' ')
if [ "$LAND_COUNT" == "381344" ]; then
    echo "  ✓ 資料完整：$LAND_COUNT 筆"
else
    echo "  ⚠ 資料筆數異常：$LAND_COUNT 筆（預期：381344）"
fi

# 匯出資料
echo ""
echo "✓ 匯出資料庫..."
docker exec land_data_postgres pg_dump -U landuser -d land_data \
  --no-owner --no-acl \
  --data-only \
  --table=lands \
  > land_data_dump.sql

if [ $? -eq 0 ]; then
    echo "  ✓ 資料匯出完成：land_data_dump.sql"
    
    # 壓縮檔案
    echo ""
    echo "✓ 壓縮資料..."
    gzip -c land_data_dump.sql > land_data_dump.sql.gz
    
    ORIGINAL_SIZE=$(ls -lh land_data_dump.sql | awk '{print $5}')
    COMPRESSED_SIZE=$(ls -lh land_data_dump.sql.gz | awk '{print $5}')
    
    echo "  ✓ 原始大小：$ORIGINAL_SIZE"
    echo "  ✓ 壓縮後：$COMPRESSED_SIZE"
else
    echo "  ✗ 資料匯出失敗"
    exit 1
fi

# 完成
echo ""
echo "================================================"
echo "✓ 部署準備完成！"
echo ""
echo "📋 下一步："
echo "1. 確認資料檔案："
echo "   - land_data_dump.sql (未壓縮)"
echo "   - land_data_dump.sql.gz (壓縮版)"
echo ""
echo "2. 推送程式碼到 GitHub："
echo "   git add ."
echo "   git commit -m 'Prepare for Render deployment'"
echo "   git push origin main"
echo ""
echo "3. 按照 DEPLOY.md 的步驟在 Render 創建服務"
echo ""
echo "4. 匯入資料到 Render 資料庫："
echo "   psql \"你的Render資料庫連接字串\" < land_data_dump.sql"
echo ""
echo "📄 詳細說明請見：DEPLOY.md"
