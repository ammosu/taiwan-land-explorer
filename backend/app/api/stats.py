"""
Statistics API endpoints
"""
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import Land
from app.schemas import StatsSummary, CityStats

router = APIRouter()


@router.get("/summary", response_model=StatsSummary)
async def get_summary_stats(db: Session = Depends(get_db)):
    """
    Get overall statistics summary
    """
    # Get counts
    total_lands = db.query(func.count(Land.id)).scalar()
    total_area = db.query(func.sum(Land.area)).scalar() or 0
    cities_count = db.query(func.count(func.distinct(Land.city))).scalar()
    districts_count = db.query(func.count(func.distinct(Land.district))).scalar()

    # Get average announced value (exclude nulls and zeros)
    avg_announced_value = db.query(
        func.avg(Land.announced_value)
    ).filter(
        Land.announced_value.isnot(None),
        Land.announced_value > 0
    ).scalar()

    return StatsSummary(
        total_lands=total_lands,
        total_area=float(total_area),
        cities_count=cities_count,
        districts_count=districts_count,
        avg_announced_value=float(avg_announced_value) if avg_announced_value else None
    )


@router.get("/by-city", response_model=List[CityStats])
async def get_stats_by_city(db: Session = Depends(get_db)):
    """
    Get statistics grouped by city
    """
    results = db.query(
        Land.city,
        func.count(Land.id).label('land_count'),
        func.sum(Land.area).label('total_area'),
        func.avg(Land.area).label('avg_area'),
        func.avg(Land.announced_value).label('avg_announced_value')
    ).filter(
        Land.city.isnot(None)
    ).group_by(
        Land.city
    ).order_by(
        func.count(Land.id).desc()
    ).all()

    return [
        CityStats(
            city=r.city,
            land_count=r.land_count,
            total_area=float(r.total_area) if r.total_area else 0.0,
            avg_area=float(r.avg_area) if r.avg_area else 0.0,
            avg_announced_value=float(r.avg_announced_value) if r.avg_announced_value else None
        )
        for r in results
    ]


@router.get("/by-district", response_model=List[dict])
async def get_stats_by_district(
    city: str = None,
    db: Session = Depends(get_db)
):
    """
    Get statistics grouped by district, optionally filtered by city
    """
    query = db.query(
        Land.city,
        Land.district,
        func.count(Land.id).label('land_count'),
        func.sum(Land.area).label('total_area'),
        func.avg(Land.area).label('avg_area')
    ).filter(
        Land.district.isnot(None)
    )

    if city:
        query = query.filter(Land.city == city)

    results = query.group_by(
        Land.city,
        Land.district
    ).order_by(
        Land.city,
        func.count(Land.id).desc()
    ).all()

    return [
        {
            "city": r.city,
            "district": r.district,
            "land_count": r.land_count,
            "total_area": float(r.total_area) if r.total_area else 0.0,
            "avg_area": float(r.avg_area) if r.avg_area else 0.0
        }
        for r in results
    ]
