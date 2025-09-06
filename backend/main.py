from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from routers import data, auth
from database import test_database_connection, get_connection_info
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="SGSGita Alumni API",
    description="Alumni Data Management System API",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api", tags=["auth"])
app.include_router(data.router, prefix="/api", tags=["data"])

@app.get("/")
def read_root():
    return {"Hello": "World", "service": "SGSGita Alumni API"}

@app.get("/health")
def health_check():
    """Health check endpoint to monitor service status."""
    try:
        # Test database connection
        db_status = test_database_connection()

        if db_status:
            return {
                "status": "healthy",
                "database": "connected",
                "timestamp": "2024-01-01T00:00:00Z"  # Would use datetime in production
            }
        else:
            raise HTTPException(status_code=503, detail="Database connection failed")

    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=503, detail="Service unhealthy")

@app.get("/health/database")
def database_health_check():
    """Detailed database health check with connection pool information."""
    try:
        db_status = test_database_connection()
        connection_info = get_connection_info()

        return {
            "database_connected": db_status,
            "connection_pool": connection_info,
            "status": "healthy" if db_status else "unhealthy"
        }

    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return {
            "database_connected": False,
            "error": str(e),
            "status": "unhealthy"
        }