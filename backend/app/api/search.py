"""
Search API endpoints
"""
from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

from app.database import get_db
from app.models import Land
from app.schemas import LandResponse

router = APIRouter()


@router.get("/", response_model=List[LandResponse])
async def search_lands(
    city: str = Query(None, description="City name (exact match)"),
    district: str = Query(None, description="District name (exact match)"),
    section_code: str = Query(None, description="Section code (exact match)"),
    section_name: str = Query(None, description="Section name (partial match)"),
    parcel_no: str = Query(None, description="Parcel number (partial match)"),
    owner_name: str = Query(None, description="Owner name (partial match)"),
    min_area: float = Query(None, description="Minimum area (square meters)"),
    max_area: float = Query(None, description="Maximum area (square meters)"),
    limit: int = Query(default=100, ge=1, le=10000, description="Maximum number of results"),
    offset: int = Query(default=0, ge=0, description="Result offset for pagination"),
    db: Session = Depends(get_db)
):
    """
    Search lands by various criteria

    All criteria are combined with AND logic.
    Partial matches are supported for section_name, parcel_no, and owner_name.
    """
    query = db.query(Land)

    # Build filters
    filters = []

    if city:
        filters.append(Land.city == city)

    if district:
        filters.append(Land.district == district)

    if section_code:
        filters.append(Land.section_code == section_code)

    if section_name:
        filters.append(Land.section_name.ilike(f"%{section_name}%"))

    if parcel_no:
        filters.append(Land.parcel_no.ilike(f"%{parcel_no}%"))

    if owner_name:
        filters.append(Land.owner_name.ilike(f"%{owner_name}%"))

    if min_area is not None:
        filters.append(Land.area >= min_area)

    if max_area is not None:
        filters.append(Land.area <= max_area)

    # Apply filters
    if filters:
        query = query.filter(and_(*filters))

    # Execute query with pagination
    lands = query.offset(offset).limit(limit).all()

    return lands


@router.get("/cities", response_model=List[str])
async def get_cities(db: Session = Depends(get_db)):
    """
    Get list of all cities in the database
    """
    cities = db.query(Land.city).distinct().order_by(Land.city).all()
    return [city[0] for city in cities if city[0]]


@router.get("/districts", response_model=List[str])
async def get_districts(
    city: str = Query(None, description="Filter districts by city"),
    db: Session = Depends(get_db)
):
    """
    Get list of districts, optionally filtered by city
    """
    query = db.query(Land.district).distinct()

    if city:
        query = query.filter(Land.city == city)

    districts = query.order_by(Land.district).all()
    return [district[0] for district in districts if district[0]]


@router.get("/sections", response_model=List[dict])
async def get_sections(
    city: str = Query(None, description="Filter by city"),
    district: str = Query(None, description="Filter by district"),
    db: Session = Depends(get_db)
):
    """
    Get list of sections with their codes and names
    """
    query = db.query(
        Land.section_code,
        Land.section_name
    ).distinct()

    if city:
        query = query.filter(Land.city == city)

    if district:
        query = query.filter(Land.district == district)

    sections = query.order_by(Land.section_code).all()

    return [
        {"section_code": s[0], "section_name": s[1]}
        for s in sections
        if s[0]
    ]
