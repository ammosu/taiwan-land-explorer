"""
Land data API endpoints
"""
import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import Land
from app.schemas import (
    LandResponse,
    LandDetailResponse,
    GeoJSONFeatureCollection,
    GeoJSONFeature
)

router = APIRouter()


@router.get("/bbox", response_model=GeoJSONFeatureCollection)
async def get_lands_by_bbox(
    min_lng: float = Query(..., description="Minimum longitude"),
    min_lat: float = Query(..., description="Minimum latitude"),
    max_lng: float = Query(..., description="Maximum longitude"),
    max_lat: float = Query(..., description="Maximum latitude"),
    limit: int = Query(default=100, ge=1, le=3000, description="Maximum number of results"),
    db: Session = Depends(get_db)
):
    """
    Get lands within a bounding box (for map viewport)

    This endpoint is optimized for map rendering - returns GeoJSON format
    with spatial indexing for fast queries.
    """
    # Create bounding box envelope
    bbox_wkt = f"POLYGON(({min_lng} {min_lat}, {max_lng} {min_lat}, {max_lng} {max_lat}, {min_lng} {max_lat}, {min_lng} {min_lat}))"

    # Query lands that intersect with bounding box
    lands = db.query(
        Land.id,
        Land.city,
        Land.district,
        Land.section_name,
        Land.parcel_no,
        Land.area,
        Land.announced_value,
        Land.announced_land_price,
        Land.owner_name,
        func.ST_AsGeoJSON(Land.geometry).label('geometry_json')
    ).filter(
        func.ST_Intersects(
            Land.geometry,
            func.ST_GeomFromText(bbox_wkt, 4326)
        )
    ).limit(limit).all()

    # Convert to GeoJSON FeatureCollection
    features = []
    for land in lands:
        geometry = json.loads(land.geometry_json) if land.geometry_json else None

        feature = GeoJSONFeature(
            type="Feature",
            geometry=geometry,
            properties={
                "id": land.id,
                "city": land.city,
                "district": land.district,
                "section_name": land.section_name,
                "parcel_no": land.parcel_no,
                "area": float(land.area) if land.area else None,
                "announced_value": land.announced_value,
                "announced_land_price": land.announced_land_price,
                "owner_name": land.owner_name,
            }
        )
        features.append(feature)

    return GeoJSONFeatureCollection(
        type="FeatureCollection",
        features=features
    )


@router.get("/{land_id}", response_model=LandDetailResponse)
async def get_land_by_id(
    land_id: int,
    db: Session = Depends(get_db)
):
    """
    Get detailed information for a specific land parcel
    """
    land = db.query(
        Land,
        func.ST_AsGeoJSON(Land.geometry).label('geometry_json')
    ).filter(Land.id == land_id).first()

    if not land:
        raise HTTPException(status_code=404, detail="Land not found")

    land_obj, geometry_json = land

    # Convert geometry to GeoJSON dict
    geometry = json.loads(geometry_json) if geometry_json else None

    # Create response
    response_dict = {
        "id": land_obj.id,
        "section_code": land_obj.section_code,
        "section_name": land_obj.section_name,
        "parcel_no": land_obj.parcel_no,
        "city": land_obj.city,
        "district": land_obj.district,
        "area": land_obj.area,
        "land_use_zone": land_obj.land_use_zone,
        "land_use_type": land_obj.land_use_type,
        "announced_value": land_obj.announced_value,
        "announced_land_price": land_obj.announced_land_price,
        "owner_name": land_obj.owner_name,
        "owner_id": land_obj.owner_id,
        "owner_type": land_obj.owner_type,
        "right_range_type": land_obj.right_range_type,
        "right_denominator": land_obj.right_denominator,
        "right_numerator": land_obj.right_numerator,
        "declared_land_price": land_obj.declared_land_price,
        "manager_name": land_obj.manager_name,
        "created_at": land_obj.created_at,
        "geometry": geometry
    }

    return LandDetailResponse(**response_dict)


@router.get("/", response_model=List[LandResponse])
async def list_lands(
    limit: int = Query(default=20, ge=1, le=100, description="Number of results"),
    offset: int = Query(default=0, ge=0, description="Offset for pagination"),
    db: Session = Depends(get_db)
):
    """
    List lands with pagination
    """
    lands = db.query(Land).offset(offset).limit(limit).all()
    return lands
