"""
SQLAlchemy database models
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Numeric, DateTime
from geoalchemy2 import Geometry

from app.database import Base


class Land(Base):
    """Land parcel model"""

    __tablename__ = "lands"

    id = Column(Integer, primary_key=True, index=True)
    section_code = Column(String(10), index=True)  # 段代碼
    section_name = Column(String(100))  # 段小段名稱
    parcel_no = Column(String(20))  # 地號
    city = Column(String(50), index=True)  # 縣市
    district = Column(String(50), index=True)  # 鄉鎮市區
    area = Column(Numeric(15, 2))  # 登記面積（平方公尺）
    land_use_zone = Column(String(100))  # 使用分區
    land_use_type = Column(String(100))  # 使用地類別
    announced_value = Column(Integer)  # 公告現值（元/㎡）
    announced_land_price = Column(Integer)  # 公告地價（元/㎡）
    owner_name = Column(String(200), index=True)  # 所有權人名稱
    owner_id = Column(String(50))  # 統一編號
    owner_type = Column(String(50))  # 所有權人類別
    right_range_type = Column(String(50))  # 權利範圍類別
    right_denominator = Column(Integer)  # 權利範圍持分分母
    right_numerator = Column(Integer)  # 權利範圍持分分子
    declared_land_price = Column(Integer)  # 申報地價
    manager_name = Column(String(200))  # 管理者名稱
    geometry = Column(Geometry(geometry_type='POLYGON', srid=4326))  # 地理邊界
    created_at = Column(DateTime, default=datetime.now)  # 建立時間

    def __repr__(self):
        return f"<Land(id={self.id}, city={self.city}, district={self.district}, parcel_no={self.parcel_no})>"
