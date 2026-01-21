-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create lands table
CREATE TABLE IF NOT EXISTS lands (
    id SERIAL PRIMARY KEY,
    section_code VARCHAR(10),           -- 段代碼
    section_name VARCHAR(100),          -- 段小段名稱
    parcel_no VARCHAR(20),              -- 地號
    city VARCHAR(50),                   -- 縣市
    district VARCHAR(50),               -- 鄉鎮市區
    area DECIMAL(15, 2),                -- 登記面積（平方公尺）
    land_use_zone VARCHAR(100),         -- 使用分區
    land_use_type VARCHAR(100),         -- 使用地類別
    announced_value INTEGER,            -- 公告現值（元/㎡）
    announced_land_price INTEGER,       -- 公告地價（元/㎡）
    owner_name VARCHAR(200),            -- 所有權人名稱
    owner_id VARCHAR(50),               -- 統一編號
    owner_type VARCHAR(50),             -- 所有權人類別
    right_range_type VARCHAR(50),       -- 權利範圍類別
    right_denominator INTEGER,          -- 權利範圍持分分母
    right_numerator INTEGER,            -- 權利範圍持分分子
    declared_land_price INTEGER,        -- 申報地價
    manager_name VARCHAR(200),          -- 管理者名稱
    geometry GEOMETRY(Polygon, 4326),   -- 地理邊界（PostGIS）
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create spatial index (CRITICAL for performance!)
CREATE INDEX IF NOT EXISTS idx_lands_geometry ON lands USING GIST(geometry);

-- Create frequently used query indexes
CREATE INDEX IF NOT EXISTS idx_lands_city_district ON lands(city, district);
CREATE INDEX IF NOT EXISTS idx_lands_section_parcel ON lands(section_code, parcel_no);
CREATE INDEX IF NOT EXISTS idx_lands_owner ON lands(owner_name);
CREATE INDEX IF NOT EXISTS idx_lands_section_code ON lands(section_code);

-- Create index for area-based queries
CREATE INDEX IF NOT EXISTS idx_lands_area ON lands(area);

-- Create index for value-based queries
CREATE INDEX IF NOT EXISTS idx_lands_announced_value ON lands(announced_value);

-- Add comments for documentation
COMMENT ON TABLE lands IS '台灣國有土地資料表';
COMMENT ON COLUMN lands.section_code IS '段代碼';
COMMENT ON COLUMN lands.section_name IS '段小段名稱';
COMMENT ON COLUMN lands.parcel_no IS '地號';
COMMENT ON COLUMN lands.city IS '縣市';
COMMENT ON COLUMN lands.district IS '鄉鎮市區';
COMMENT ON COLUMN lands.area IS '登記面積（平方公尺）';
COMMENT ON COLUMN lands.geometry IS '地理邊界（WGS84座標系統）';
