from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool
from sqlalchemy.exc import OperationalError, DisconnectionError
from config import settings
import time
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

SQLALCHEMY_DATABASE_URL = f"mysql+mysqlconnector://{settings.database_user}:{settings.database_password}@{settings.database_host}/{settings.database_name}"

# Enhanced engine configuration with connection pooling and timeouts
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    poolclass=QueuePool,
    pool_size=10,  # Maximum number of connections in the pool
    max_overflow=20,  # Maximum number of connections that can be created beyond pool_size
    pool_timeout=30,  # Timeout for getting a connection from the pool
    pool_recycle=3600,  # Recycle connections after 1 hour
    pool_pre_ping=True,  # Enable connection health checks
    connect_args={
        'connect_timeout': 10,  # Connection timeout
        'autocommit': False,
    },
    echo=False  # Set to True for SQL query logging in development
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """Database session generator with retry logic and error handling."""
    max_retries = 3
    retry_delay = 1  # seconds

    for attempt in range(max_retries):
        db = None
        try:
            db = SessionLocal()
            # Test the connection
            db.execute(text("SELECT 1"))
            yield db
            break  # Success, exit retry loop

        except (OperationalError, DisconnectionError) as e:
            logger.warning(f"Database connection attempt {attempt + 1} failed: {e}")
            if db:
                db.close()

            if attempt < max_retries - 1:
                logger.info(f"Retrying database connection in {retry_delay} seconds...")
                time.sleep(retry_delay)
                retry_delay *= 2  # Exponential backoff
            else:
                logger.error(f"Failed to connect to database after {max_retries} attempts")
                raise e

        except Exception as e:
            logger.error(f"Unexpected database error: {e}")
            if db:
                db.close()
            raise e

        finally:
            if db:
                try:
                    db.close()
                except Exception as close_error:
                    logger.warning(f"Error closing database session: {close_error}")

def test_database_connection():
    """Test database connectivity and return connection status."""
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        logger.info("Database connection test successful")
        return True
    except Exception as e:
        logger.error(f"Database connection test failed: {e}")
        return False

def get_connection_info():
    """Get database connection pool information."""
    return {
        "pool_size": engine.pool.size(),
        "checkedin": engine.pool.checkedin(),
        "checkedout": engine.pool.checkedout(),
        "overflow": engine.pool.overflow(),
    }