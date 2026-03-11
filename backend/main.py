"""
Main FastAPI application entry point.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from backend.core.config import settings
from backend.routers import upload, frames, calibrate, analyze, report, reference

# Initialize FastAPI app
app = FastAPI(
    title="Video Viscosity Analysis API",
    description="Research-grade API for analyzing liquid viscosity from video",
    version="1.0.0",
    docs_url=None,
    redoc_url=None
)

# Configure CORS for mobile app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your mobile app's origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files directory
static_dir = Path(__file__).parent / "static"
static_dir.mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

# Include routers
app.include_router(upload.router, prefix="/api/v1")
app.include_router(frames.router, prefix="/api/v1")
app.include_router(calibrate.router, prefix="/api/v1")
app.include_router(analyze.router, prefix="/api/v1")
app.include_router(report.router, prefix="/api/v1")
app.include_router(reference.router, prefix="/api/v1")


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Video Viscosity Analysis API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)




