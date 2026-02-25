"""
Upload Endpoint
===============
POST /api/upload - Main endpoint for receipt file uploads.
This is the primary endpoint that Dev 2 (Frontend Lead) will call.
"""

from fastapi import APIRouter, File, Form, Header, HTTPException, UploadFile

from app.core.exceptions import AppException
from app.schemas.receipt import ReceiptCreate, ReceiptStatus, ReceiptUploadResponse
from app.services.receipt import ReceiptService
from app.services.storage import StorageService

router = APIRouter()


@router.post(
    "",
    response_model=ReceiptUploadResponse,
    summary="Upload a receipt",
    description="""
    Upload a receipt image for processing.

    This endpoint:
    1. Validates the file (type, size)
    2. Uploads to Supabase Storage
    3. Creates a receipt record in the database
    4. Returns a receipt ID for tracking

    The receipt will be in 'uploaded' status and ready for AI audit.

    **Required Headers:**
    - `X-Company-ID`: The company UUID
    - `X-Employee-ID`: The employee UUID

    **Supported file types:** JPEG, PNG, WebP, PDF
    **Max file size:** 10MB
    """,
)
async def upload_receipt(
    file: UploadFile = File(..., description="Receipt image or PDF"),
    description: str | None = Form(None, description="Optional expense description"),
    category: str | None = Form(None, description="Expense category"),
    x_company_id: str = Header(..., alias="X-Company-ID"),
    x_employee_id: str = Header(..., alias="X-Employee-ID"),
):
    """
    Upload a receipt for processing.

    This is the main entry point for the expense submission flow:
    1. Employee uploads receipt image
    2. File is stored in Supabase Storage
    3. Receipt record is created in database
    4. AI audit can then be triggered separately
    """
    try:
        # Read file content
        content = await file.read()

        # Initialize services
        storage_service = StorageService()
        receipt_service = ReceiptService()

        # Upload file to storage
        upload_result = await storage_service.upload_file(
            company_id=x_company_id,
            employee_id=x_employee_id,
            filename=file.filename or "receipt",
            content=content,
            content_type=file.content_type or "application/octet-stream",
        )

        # Create receipt record
        receipt_data = ReceiptCreate(
            company_id=x_company_id,
            employee_id=x_employee_id,
            file_path=upload_result["file_path"],
            file_name=upload_result["file_name"],
            file_size=upload_result["file_size"],
            mime_type=upload_result["mime_type"],
            description=description,
            category=category,
        )

        receipt = await receipt_service.create(receipt_data)

        return ReceiptUploadResponse(
            success=True,
            message="Receipt uploaded successfully",
            receipt_id=receipt.id,
            file_path=receipt.file_path,
            status=ReceiptStatus.UPLOADED,
        )

    except AppException as e:
        raise HTTPException(
            status_code=e.status_code,
            detail=e.to_dict(),
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "error": {
                    "code": "UPLOAD_FAILED",
                    "message": str(e),
                }
            },
        )


@router.post(
    "/batch",
    summary="Upload multiple receipts",
    description="Upload multiple receipt files in a single request.",
)
async def upload_batch(
    files: list[UploadFile] = File(..., description="Multiple receipt files"),
    x_company_id: str = Header(..., alias="X-Company-ID"),
    x_employee_id: str = Header(..., alias="X-Employee-ID"),
):
    """
    Upload multiple receipts at once.
    Returns status for each file.
    """
    results = []
    storage_service = StorageService()
    receipt_service = ReceiptService()

    for file in files:
        try:
            content = await file.read()

            upload_result = await storage_service.upload_file(
                company_id=x_company_id,
                employee_id=x_employee_id,
                filename=file.filename or "receipt",
                content=content,
                content_type=file.content_type or "application/octet-stream",
            )

            receipt_data = ReceiptCreate(
                company_id=x_company_id,
                employee_id=x_employee_id,
                file_path=upload_result["file_path"],
                file_name=upload_result["file_name"],
                file_size=upload_result["file_size"],
                mime_type=upload_result["mime_type"],
            )

            receipt = await receipt_service.create(receipt_data)

            results.append(
                {
                    "filename": file.filename,
                    "success": True,
                    "receipt_id": receipt.id,
                }
            )

        except Exception as e:
            results.append(
                {
                    "filename": file.filename,
                    "success": False,
                    "error": str(e),
                }
            )

    return {
        "success": True,
        "uploaded": len([r for r in results if r["success"]]),
        "failed": len([r for r in results if not r["success"]]),
        "results": results,
    }
