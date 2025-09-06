import pytest
from fastapi.testclient import TestClient
from ..main import app
from ..database import get_db
from .conftest import TestingSessionLocal, override_get_db

# Override the database dependency
app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

def test_get_data_empty(db_session):
    """Test getting data when database is empty"""
    response = client.get("/api/data")
    assert response.status_code == 200
    assert response.json() == []

def test_get_data_with_sample_data(sample_data):
    """Test getting data with sample data"""
    response = client.get("/api/data")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["File_name"] == "test1.csv"
    assert data[1]["File_name"] == "test2.csv"

def test_get_data_pagination(db_session):
    """Test pagination parameters"""
    response = client.get("/api/data?skip=0&limit=10")
    assert response.status_code == 200

    # Test limit validation
    response = client.get("/api/data?limit=1000")
    assert response.status_code == 200

    # Test limit exceeds max
    response = client.get("/api/data?limit=2000")
    assert response.status_code == 422  # Validation error

def test_get_data_search(sample_data):
    """Test search functionality"""
    # Search by file name
    response = client.get("/api/data?search=test1")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["File_name"] == "test1.csv"

    # Search by description
    response = client.get("/api/data?search=Test file 2")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["File_name"] == "test2.csv"

    # Search by source
    response = client.get("/api/data?search=test_source")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["Source"] == "test_source"

    # Search non-existent
    response = client.get("/api/data?search=nonexistent")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 0

def test_get_data_combined_pagination_and_search(sample_data):
    """Test combining pagination and search"""
    response = client.get("/api/data?skip=0&limit=1&search=test")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["File_name"] == "test1.csv"