import pytest
from ..schemas import RawCsvUploadBase, RawCsvUploadCreate, RawCsvUpload

def test_raw_csv_upload_base_creation():
    """Test creating RawCsvUploadBase schema"""
    data = RawCsvUploadBase(
        File_name="test.csv",
        Description="Test description",
        ROW_DATA={"key": "value"},
        Source="test_source",
        Category="test_category",
        Format="csv"
    )
    assert data.File_name == "test.csv"
    assert data.Description == "Test description"
    assert data.ROW_DATA == {"key": "value"}
    assert data.Source == "test_source"
    assert data.Category == "test_category"
    assert data.Format == "csv"

def test_raw_csv_upload_create():
    """Test RawCsvUploadCreate inherits from base"""
    data = RawCsvUploadCreate(
        File_name="test.csv",
        Description="Test description",
        ROW_DATA={"key": "value"},
        Source="test_source",
        Category="test_category",
        Format="csv"
    )
    assert isinstance(data, RawCsvUploadBase)

def test_raw_csv_upload_with_id():
    """Test RawCsvUpload with ID field"""
    data = RawCsvUpload(
        ID=1,
        File_name="test.csv",
        Description="Test description",
        ROW_DATA={"key": "value"},
        Source="test_source",
        Category="test_category",
        Format="csv"
    )
    assert data.ID == 1
    assert data.File_name == "test.csv"

def test_pydantic_validation_required_fields():
    """Test that required fields are validated"""
    with pytest.raises(ValueError):
        # Missing required fields
        RawCsvUploadBase()

def test_pydantic_validation_data_types():
    """Test data type validation"""
    # Valid data
    data = RawCsvUploadBase(
        File_name="test.csv",
        Description="Test",
        ROW_DATA={"key": "value"},
        Source="source",
        Category="category",
        Format="csv"
    )
    assert data.File_name == "test.csv"

    # Invalid data type for File_name (should be str)
    with pytest.raises(ValueError):
        RawCsvUploadBase(
            File_name=123,  # Invalid type
            Description="Test",
            ROW_DATA={"key": "value"},
            Source="source",
            Category="category",
            Format="csv"
        )