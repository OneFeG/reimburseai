"""
API Router
==========
Main router that combines all endpoint routers.
"""

from fastapi import APIRouter

from app.api import (
    advance,
    audit,
    billing,
    kyb,
    ledger,
    reimburse,
    treasury,
    whitelist,
    test_endpoints,
)
from app.api.endpoints import (
    companies,
    employees,
    health,
    policies,
    receipts,
    upload,
    vaults,
)

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(
    health.router,
    tags=["Health"],
)

api_router.include_router(
    upload.router,
    prefix="/upload",
    tags=["Upload"],
)

api_router.include_router(
    companies.router,
    prefix="/companies",
    tags=["Companies"],
)

api_router.include_router(
    employees.router,
    prefix="/employees",
    tags=["Employees"],
)

api_router.include_router(
    receipts.router,
    prefix="/receipts",
    tags=["Receipts"],
)

api_router.include_router(
    policies.router,
    prefix="/policies",
    tags=["Policies"],
)

api_router.include_router(
    vaults.router,
    prefix="/vaults",
    tags=["Vaults"],
)

# x402 Auditor Agent endpoint
api_router.include_router(
    audit.router,
    tags=["Audit"],
)

# Treasury Agent endpoint
api_router.include_router(
    treasury.router,
    tags=["Treasury"],
)

# Ledger endpoints
api_router.include_router(
    ledger.router,
    tags=["Ledger"],
)

# Advance endpoints
api_router.include_router(
    advance.router,
    tags=["Advance"],
)

# KYB endpoints
api_router.include_router(
    kyb.router,
    tags=["KYB"],
)

# Wallet whitelist endpoints
api_router.include_router(
    whitelist.router,
    tags=["Whitelist"],
)

# Billing/Metering endpoints
api_router.include_router(
    billing.router,
    tags=["Billing"],
)

# Full reimbursement flow endpoint
api_router.include_router(
    reimburse.router,
    tags=["Reimbursement"],
)

# Test endpoints (development only - bypasses x402)
api_router.include_router(
    test_endpoints.router,
    tags=["Test"],
)
