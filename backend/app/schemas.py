"""
Pydantic schemas for request/response validation
"""
from typing import Optional, Any
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field, ConfigDict


class LandBase(BaseModel):
    """Base land schema"""

    section_code: Optional[str] = None
    section_name: Optional[str] = None
    parcel_no: Optional[str] = None
    city: Optional[str] = None
    district: Optional[str] = None
    area: Optional[Decimal] = None
    land_use_zone: Optional[str] = None
    land_use_type: Optional[str] = None
    announced_value: Optional[int] = None
    announced_land_price: Optional[int] = None
    owner_name: Optional[str] = None
    owner_id: Optional[str] = None
    owner_type: Optional[str] = None
    right_range_type: Optional[str] = None
    right_denominator: Optional[int] = None
    right_numerator: Optional[int] = None
    declared_land_price: Optional[int] = None
    manager_name: Optional[str] = None


class LandResponse(LandBase):
    """Land response schema"""

    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LandDetailResponse(LandResponse):
    """Land detail response with geometry"""

    geometry: Optional[dict] = None  # GeoJSON geometry


class GeoJSONFeature(BaseModel):
    """GeoJSON Feature"""

    type: str = "Feature"
    geometry: dict
    properties: dict


class GeoJSONFeatureCollection(BaseModel):
    """GeoJSON FeatureCollection"""

    type: str = "FeatureCollection"
    features: list[GeoJSONFeature]


class BBoxQuery(BaseModel):
    """Bounding box query parameters"""

    min_lng: float = Field(..., description="Minimum longitude")
    min_lat: float = Field(..., description="Minimum latitude")
    max_lng: float = Field(..., description="Maximum longitude")
    max_lat: float = Field(..., description="Maximum latitude")
    limit: int = Field(default=100, ge=1, le=1000, description="Maximum number of results")


class SearchQuery(BaseModel):
    """Search query parameters"""

    city: Optional[str] = Field(None, description="City name")
    district: Optional[str] = Field(None, description="District name")
    section_code: Optional[str] = Field(None, description="Section code")
    section_name: Optional[str] = Field(None, description="Section name")
    parcel_no: Optional[str] = Field(None, description="Parcel number")
    owner_name: Optional[str] = Field(None, description="Owner name")
    min_area: Optional[float] = Field(None, description="Minimum area")
    max_area: Optional[float] = Field(None, description="Maximum area")
    limit: int = Field(default=100, ge=1, le=1000, description="Maximum number of results")
    offset: int = Field(default=0, ge=0, description="Result offset for pagination")


class StatsSummary(BaseModel):
    """Statistics summary"""

    total_lands: int
    total_area: float
    cities_count: int
    districts_count: int
    avg_announced_value: Optional[float] = None


class CityStats(BaseModel):
    """City-level statistics"""

    city: str
    land_count: int
    total_area: float
    avg_area: float
    avg_announced_value: Optional[float] = None
