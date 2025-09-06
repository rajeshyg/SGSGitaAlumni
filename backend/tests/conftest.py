import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from ..database import Base
from ..models import RawCsvUpload

# Use in-memory SQLite for tests
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Override the database dependency for tests
def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture(scope="function")
def db_session():
    # Create all tables
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        # Drop all tables
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def sample_data(db_session):
    # Create sample data for tests
    data1 = RawCsvUpload(
        File_name="test1.csv",
        Description="Test file 1",
        ROW_DATA={"key": "value1"},
        Source="test_source",
        Category="test_category",
        Format="csv"
    )
    data2 = RawCsvUpload(
        File_name="test2.csv",
        Description="Test file 2",
        ROW_DATA={"key": "value2"},
        Source="another_source",
        Category="another_category",
        Format="json"
    )
    db_session.add(data1)
    db_session.add(data2)
    db_session.commit()
    return [data1, data2]