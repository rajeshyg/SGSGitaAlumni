from pydantic import BaseModel
from typing import Optional

class RawCsvUploadBase(BaseModel):
    File_name: str
    Description: str
    ROW_DATA: dict
    Source: str
    Category: str
    Format: str

class RawCsvUploadCreate(RawCsvUploadBase):
    pass

class RawCsvUpload(RawCsvUploadBase):
    ID: int

    class Config:
        from_attributes = True