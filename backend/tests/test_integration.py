import pytest
from fastapi.testclient import TestClient
from ..main import app
from ..database import get_db
from .conftest import TestingSessionLocal, override_get_db

# Override the database dependency
app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

def test_full_data_flow(db_session):
    """Test the full data flow from API to database"""
    # First, ensure database is empty
    response = client.get("/api/data")
    assert response.status_code == 200
    assert response.json() == []

    # Create a record manually in the database
    from ..models import RawCsvUpload
    test_record = RawCsvUpload(
        File_name="integration_test.csv",
        Description="Integration test file",
        ROW_DATA={"test": "integration"},
        Source="integration_source",
        Category="integration_category",
        Format="csv"
    )
    db_session.add(test_record)
    db_session.commit()

    # Query the data via API
    response = client.get("/api/data")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["File_name"] == "integration_test.csv"
    assert data[0]["Description"] == "Integration test file"
    assert data[0]["ROW_DATA"] == {"test": "integration"}

    # Test search functionality
    response = client.get("/api/data?search=integration")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1

    # Test pagination
    response = client.get("/api/data?skip=0&limit=10")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1

def test_api_error_handling():
    """Test API error handling"""
    # Test invalid parameters
    response = client.get("/api/data?limit=1500")  # Exceeds max limit
    assert response.status_code == 422  # Validation error

    # Test non-existent endpoint
    response = client.get("/api/nonexistent")
    assert response.status_code == 404