from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_
from sqlalchemy.exc import SQLAlchemyError, OperationalError
from typing import List, Optional
import csv
import json
import io
import logging
from database import get_db
from models import RawCsvUpload
from schemas import RawCsvUpload as RawCsvUploadSchema, RawCsvUploadCreate

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/data")
def get_data(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Retrieve alumni data with optional search and pagination."""
    try:
        logger.info(f"Fetching data with skip={skip}, limit={limit}, search={search}")

        query = db.query(RawCsvUpload)

        if search:
            # Sanitize search input
            search_term = search.strip()
            if len(search_term) > 100:  # Prevent overly long search terms
                raise HTTPException(status_code=400, detail="Search term too long")

            query = query.filter(
                or_(
                    RawCsvUpload.File_name.contains(search_term),
                    RawCsvUpload.Description.contains(search_term),
                    RawCsvUpload.Source.contains(search_term),
                    RawCsvUpload.Category.contains(search_term)
                )
            )

        total = query.count()
        data = query.offset(skip).limit(limit).all()
        logger.info(f"Retrieved {len(data)} records out of {total} total")

        return {"data": data, "total": total}

    except SQLAlchemyError as e:
        logger.error(f"Database error in get_data: {e}")
        raise HTTPException(status_code=500, detail="Database query failed")

    except HTTPException:
        raise  # Re-raise HTTP exceptions as-is

    except Exception as e:
        logger.error(f"Unexpected error in get_data: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.put("/data/{id}")
def update_data(
    id: int,
    update_data: RawCsvUploadCreate,
    db: Session = Depends(get_db)
):
    try:
        db_item = db.query(RawCsvUpload).filter(RawCsvUpload.ID == id).first()
        if not db_item:
            raise HTTPException(status_code=404, detail="Item not found")

        for key, value in update_data.dict(exclude_unset=True).items():
            setattr(db_item, key, value)

        db.commit()
        db.refresh(db_item)
        logger.info(f"Updated data item {id}")
        return {"data": db_item, "message": "Updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating data item {id}: {e}")
        raise HTTPException(status_code=500, detail="Update failed")

@router.get("/export/csv")
def export_csv(
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Export alumni data as CSV with optional search filtering."""
    try:
        logger.info(f"Exporting CSV data with search={search}")

        query = db.query(RawCsvUpload)

        if search:
            # Sanitize search input
            search_term = search.strip()
            if len(search_term) > 100:
                raise HTTPException(status_code=400, detail="Search term too long")

            query = query.filter(
                or_(
                    RawCsvUpload.File_name.contains(search_term),
                    RawCsvUpload.Description.contains(search_term),
                    RawCsvUpload.Source.contains(search_term),
                    RawCsvUpload.Category.contains(search_term)
                )
            )

        data = query.all()
        logger.info(f"Exporting {len(data)} records to CSV")

        if not data:
            # Return empty CSV with headers
            output = io.StringIO()
            writer = csv.writer(output)
            writer.writerow(['ID', 'File_name', 'Description', 'Source', 'Category', 'Format', 'ROW_DATA'])
            output.seek(0)
            return StreamingResponse(
                io.StringIO(output.getvalue()),
                media_type="text/csv",
                headers={"Content-Disposition": "attachment; filename=alumni_data.csv"}
            )

        # Create CSV in memory
        output = io.StringIO()
        writer = csv.writer(output)

        # Write header
        writer.writerow(['ID', 'File_name', 'Description', 'Source', 'Category', 'Format', 'ROW_DATA'])

        # Write data with error handling for individual rows
        for item in data:
            try:
                row_data = json.dumps(item.ROW_DATA) if item.ROW_DATA else ''
                writer.writerow([
                    item.ID,
                    item.File_name or '',
                    item.Description or '',
                    item.Source or '',
                    item.Category or '',
                    item.Format or '',
                    row_data
                ])
            except Exception as row_error:
                logger.warning(f"Error processing row {item.ID}: {row_error}")
                # Write row with error indicator
                writer.writerow([
                    item.ID,
                    item.File_name or '',
                    item.Description or '',
                    item.Source or '',
                    item.Category or '',
                    item.Format or '',
                    f"ERROR: {str(row_error)}"
                ])

        output.seek(0)

        response = StreamingResponse(
            io.StringIO(output.getvalue()),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=alumni_data.csv"}
        )
        return response

    except SQLAlchemyError as e:
        logger.error(f"Database error in export_csv: {e}")
        raise HTTPException(status_code=500, detail="Database query failed during CSV export")

    except HTTPException:
        raise

    except Exception as e:
        logger.error(f"Unexpected error in export_csv: {e}")
        raise HTTPException(status_code=500, detail="CSV export failed")

@router.get("/export/json")
def export_json(
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Export alumni data as JSON with optional search filtering."""
    try:
        logger.info(f"Exporting JSON data with search={search}")

        query = db.query(RawCsvUpload)

        if search:
            # Sanitize search input
            search_term = search.strip()
            if len(search_term) > 100:
                raise HTTPException(status_code=400, detail="Search term too long")

            query = query.filter(
                or_(
                    RawCsvUpload.File_name.contains(search_term),
                    RawCsvUpload.Description.contains(search_term),
                    RawCsvUpload.Source.contains(search_term),
                    RawCsvUpload.Category.contains(search_term)
                )
            )

        data = query.all()
        logger.info(f"Exporting {len(data)} records to JSON")

        # Convert to dict format with error handling
        json_data = []
        for item in data:
            try:
                json_data.append({
                    'ID': item.ID,
                    'File_name': item.File_name,
                    'Description': item.Description,
                    'Source': item.Source,
                    'Category': item.Category,
                    'Format': item.Format,
                    'ROW_DATA': item.ROW_DATA
                })
            except Exception as item_error:
                logger.warning(f"Error processing item {item.ID}: {item_error}")
                # Include item with error information
                json_data.append({
                    'ID': item.ID,
                    'File_name': item.File_name,
                    'Description': item.Description,
                    'Source': item.Source,
                    'Category': item.Category,
                    'Format': item.Format,
                    'ROW_DATA': None,
                    'error': str(item_error)
                })

        json_output = json.dumps(json_data, indent=2, default=str)

        response = StreamingResponse(
            io.StringIO(json_output),
            media_type="application/json",
            headers={"Content-Disposition": "attachment; filename=alumni_data.json"}
        )
        return response

    except SQLAlchemyError as e:
        logger.error(f"Database error in export_json: {e}")
        raise HTTPException(status_code=500, detail="Database query failed during JSON export")

    except json.JSONEncodeError as e:
        logger.error(f"JSON encoding error in export_json: {e}")
        raise HTTPException(status_code=500, detail="JSON encoding failed")

    except HTTPException:
        raise

    except Exception as e:
        logger.error(f"Unexpected error in export_json: {e}")
        raise HTTPException(status_code=500, detail="JSON export failed")