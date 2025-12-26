"""
Storage Service
===============
File upload handling with Supabase Storage.
"""

import uuid
from datetime import UTC, datetime
from pathlib import Path

from app.config import settings
from app.core.exceptions import BadRequestException, StorageException
from app.db.supabase import get_supabase_admin_client

# Allowed file types
ALLOWED_MIME_TYPES = {
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
    "image/webp": [".webp"],
    "application/pdf": [".pdf"],
}


class StorageService:
    """Service for handling file uploads to Supabase Storage."""

    def __init__(self):
        """Initialize storage client."""
        self.client = get_supabase_admin_client()
        self.bucket = settings.storage_bucket

    def validate_file(
        self,
        filename: str,
        content_type: str,
        file_size: int,
    ) -> None:
        """
        Validate file before upload.

        Args:
            filename: Original filename
            content_type: MIME type
            file_size: Size in bytes

        Raises:
            BadRequestException: If validation fails
        """
        # Check file size
        if file_size > settings.max_file_size_bytes:
            raise BadRequestException(
                message=f"File too large. Maximum size is {settings.max_file_size_mb}MB",
                error_code="FILE_TOO_LARGE",
            )

        if file_size == 0:
            raise BadRequestException(
                message="File is empty",
                error_code="FILE_EMPTY",
            )

        # Check MIME type
        if content_type not in ALLOWED_MIME_TYPES:
            raise BadRequestException(
                message=f"File type not allowed: {content_type}",
                error_code="INVALID_FILE_TYPE",
                details={"allowed_types": list(ALLOWED_MIME_TYPES.keys())},
            )

        # Check extension matches MIME type
        ext = Path(filename).suffix.lower()
        allowed_extensions = ALLOWED_MIME_TYPES[content_type]
        if ext not in allowed_extensions:
            raise BadRequestException(
                message="File extension doesn't match content type",
                error_code="EXTENSION_MISMATCH",
            )

    def generate_file_path(
        self,
        company_id: str,
        employee_id: str,
        filename: str,
    ) -> str:
        """
        Generate unique file path for storage.

        Structure: {company_id}/{employee_id}/{date}/{uuid}_{filename}

        Args:
            company_id: Company UUID
            employee_id: Employee UUID
            filename: Original filename

        Returns:
            Unique file path
        """
        date_prefix = datetime.now(UTC).strftime("%Y/%m/%d")
        unique_id = str(uuid.uuid4())[:8]

        # Sanitize filename
        safe_filename = "".join(c for c in filename if c.isalnum() or c in ".-_").strip()
        if not safe_filename:
            safe_filename = "receipt"

        # Limit filename length
        if len(safe_filename) > 50:
            ext = Path(safe_filename).suffix
            safe_filename = safe_filename[: 50 - len(ext)] + ext

        return f"{company_id}/{employee_id}/{date_prefix}/{unique_id}_{safe_filename}"

    async def upload_file(
        self,
        company_id: str,
        employee_id: str,
        filename: str,
        content: bytes,
        content_type: str,
    ) -> dict:
        """
        Upload a file to Supabase Storage.

        Args:
            company_id: Company UUID
            employee_id: Employee UUID
            filename: Original filename
            content: File content as bytes
            content_type: MIME type

        Returns:
            Upload result with file_path and file_size
        """
        # Validate
        self.validate_file(filename, content_type, len(content))

        # Generate path
        file_path = self.generate_file_path(company_id, employee_id, filename)

        try:
            # Upload to Supabase Storage
            self.client.storage.from_(self.bucket).upload(
                path=file_path,
                file=content,
                file_options={"content-type": content_type},
            )

            return {
                "file_path": file_path,
                "file_name": filename,
                "file_size": len(content),
                "mime_type": content_type,
                "bucket": self.bucket,
            }

        except Exception as e:
            raise StorageException(
                message=f"Failed to upload file: {str(e)}",
                error_code="UPLOAD_FAILED",
            )

    async def get_signed_url(
        self,
        file_path: str,
        expires_in: int = 3600,
    ) -> str:
        """
        Get a signed URL for accessing a file.

        Args:
            file_path: Path in storage bucket
            expires_in: URL expiration in seconds (default 1 hour)

        Returns:
            Signed URL
        """
        try:
            result = self.client.storage.from_(self.bucket).create_signed_url(
                path=file_path,
                expires_in=expires_in,
            )
            return result["signedURL"]

        except Exception as e:
            raise StorageException(
                message=f"Failed to create signed URL: {str(e)}",
                error_code="SIGNED_URL_FAILED",
            )

    async def delete_file(self, file_path: str) -> bool:
        """
        Delete a file from storage.

        Args:
            file_path: Path in storage bucket

        Returns:
            True if deleted successfully
        """
        try:
            self.client.storage.from_(self.bucket).remove([file_path])
            return True

        except Exception as e:
            raise StorageException(
                message=f"Failed to delete file: {str(e)}",
                error_code="DELETE_FAILED",
            )

    async def download_file(self, file_path: str) -> bytes:
        """
        Download a file from storage.

        Args:
            file_path: Path in storage bucket

        Returns:
            File content as bytes
        """
        try:
            response = self.client.storage.from_(self.bucket).download(file_path)
            return response

        except Exception as e:
            raise StorageException(
                message=f"Failed to download file: {str(e)}",
                error_code="DOWNLOAD_FAILED",
            )

    async def upload_receipt(
        self,
        file_content: bytes,
        filename: str,
        content_type: str,
        company_id: str,
        employee_id: str,
    ) -> str:
        """
        Upload a receipt file and return the file path.

        Convenience method that combines validation, path generation,
        and upload in a single call.

        Args:
            file_content: File content as bytes
            filename: Original filename
            content_type: MIME type
            company_id: Company UUID
            employee_id: Employee UUID

        Returns:
            The file path in storage
        """
        result = await self.upload_file(
            company_id=company_id,
            employee_id=employee_id,
            filename=filename,
            content=file_content,
            content_type=content_type,
        )
        return result["file_path"]


# Module-level helper functions for convenience
storage_service = StorageService()


async def download_file(file_path: str) -> bytes:
    """Download a file from storage."""
    return await storage_service.download_file(file_path)


async def upload_receipt(
    file_content: bytes,
    filename: str,
    content_type: str,
    company_id: str,
    employee_id: str,
) -> str:
    """Upload a receipt and return the file path."""
    return await storage_service.upload_receipt(
        file_content=file_content,
        filename=filename,
        content_type=content_type,
        company_id=company_id,
        employee_id=employee_id,
    )
