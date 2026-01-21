"""
FastAPI application main entry point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.api import lands, search, stats

# Create FastAPI application
app = FastAPI(
    title=settings.api_title,
    version=settings.api_version,
    description=settings.api_description
)

# Configure CORS
# Support both string (comma-separated) and list formats
cors_origins = settings.cors_origins
if isinstance(cors_origins, str):
    cors_origins = [origin.strip() for origin in cors_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins if cors_origins != ["*"] else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check endpoint
@app.get("/", tags=["Health"])
async def root():
    """Root endpoint - health check"""
    return {
        "status": "ok",
        "message": "Taiwan Land Data API",
        "version": settings.api_version
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


# Include routers
app.include_router(lands.router, prefix="/api/lands", tags=["Lands"])
app.include_router(search.router, prefix="/api/search", tags=["Search"])
app.include_router(stats.router, prefix="/api/stats", tags=["Statistics"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
