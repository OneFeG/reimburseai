"""
Pydantic Schemas Package
========================
Request/Response models for API validation.
"""

from app.schemas.common import (
    BaseResponse,
    ErrorResponse,
    PaginatedResponse,
    PaginationParams,
)
from app.schemas.company import (
    CompanyCreate,
    CompanyResponse,
    CompanyUpdate,
    VaultLinkRequest,
)
from app.schemas.employee import (
    EmployeeCreate,
    EmployeeResponse,
    EmployeeUpdate,
)
from app.schemas.receipt import (
    AuditResult,
    ReceiptCreate,
    ReceiptResponse,
    ReceiptUpdate,
    ReceiptUploadResponse,
)

__all__ = [
    # Common
    "BaseResponse",
    "ErrorResponse",
    "PaginatedResponse",
    "PaginationParams",
    # Company
    "CompanyCreate",
    "CompanyResponse",
    "CompanyUpdate",
    "VaultLinkRequest",
    # Employee
    "EmployeeCreate",
    "EmployeeResponse",
    "EmployeeUpdate",
    # Receipt
    "ReceiptCreate",
    "ReceiptResponse",
    "ReceiptUpdate",
    "ReceiptUploadResponse",
    "AuditResult",
]
