from sqlalchemy import Column, Integer, String, Text, JSON
from database import Base

class RawCsvUpload(Base):
    __tablename__ = "raw_csv_uploads"
    ID = Column(Integer, primary_key=True, index=True)
    File_name = Column(String(255))
    Description = Column(Text)
    ROW_DATA = Column(JSON)
    Source = Column(String(255))
    Category = Column(String(255))
    Format = Column(String(50))