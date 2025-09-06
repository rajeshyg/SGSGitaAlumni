import pytest
from ..models import RawCsvUpload

def test_raw_csv_upload_creation(db_session):
    """Test creating a RawCsvUpload instance"""
    data = RawCsvUpload(
        File_name="test.csv",
        Description="Test description",
        ROW_DATA={"test": "data"},
        Source="test_source",
        Category="test_category",
        Format="csv"
    )
    db_session.add(data)
    db_session.commit()

    # Query the data back
    retrieved = db_session.query(RawCsvUpload).filter_by(File_name="test.csv").first()
    assert retrieved is not None
    assert retrieved.File_name == "test.csv"
    assert retrieved.Description == "Test description"
    assert retrieved.ROW_DATA == {"test": "data"}
    assert retrieved.Source == "test_source"
    assert retrieved.Category == "test_category"
    assert retrieved.Format == "csv"
    assert retrieved.ID is not None

def test_raw_csv_upload_table_name():
    """Test that the table name is correct"""
    assert RawCsvUpload.__tablename__ == "raw_csv_uploads"

def test_raw_csv_upload_columns():
    """Test that all columns are defined correctly"""
    # Check if columns exist
    assert hasattr(RawCsvUpload, 'ID')
    assert hasattr(RawCsvUpload, 'File_name')
    assert hasattr(RawCsvUpload, 'Description')
    assert hasattr(RawCsvUpload, 'ROW_DATA')
    assert hasattr(RawCsvUpload, 'Source')
    assert hasattr(RawCsvUpload, 'Category')
    assert hasattr(RawCsvUpload, 'Format')