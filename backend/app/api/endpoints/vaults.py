"""
Vault Endpoints
===============
Blockchain vault management - integration point for Dev 1 (Web3 Lead).
"""

from fastapi import APIRouter, Header, HTTPException

from app.core.exceptions import AppException
from app.schemas.company import (
    CompanyResponse,
    VaultLinkRequest,
    VaultLinkResponse,
)
from app.services.company import CompanyService

router = APIRouter()


@router.post(
    "/link",
    response_model=VaultLinkResponse,
    summary="Link vault to company",
    description="""
    Link a deployed vault contract address to a company.
    
    **This is the handshake endpoint for Dev 1 (Web3 Lead).**
    
    After Dev 1 deploys a Treasury Vault using Thirdweb SDK,
    they call this endpoint to save the vault address in the database.
    
    This links the on-chain vault to the company's database record,
    enabling the system to track which vault belongs to which company.
    """,
)
async def link_vault(
    data: VaultLinkRequest,
    x_api_key: str = Header(..., alias="X-API-Key", description="Internal API key"),
):
    """
    Link a deployed vault address to a company.
    
    Called by the Web3 service after vault deployment.
    
    Example flow:
    1. Company signs up → company record created
    2. Dev 1's service deploys vault on Avalanche
    3. Dev 1's service calls this endpoint with vault address
    4. Company is now ready for reimbursements
    """
    # TODO: Validate API key in production
    # For now, we accept any key for development
    
    try:
        service = CompanyService()
        company = await service.link_vault(data)
        
        return VaultLinkResponse(
            success=True,
            message="Vault linked successfully",
            company_id=company.id,
            vault_address=company.vault_address or "",
            chain_id=company.vault_chain_id or 43113,
        )
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())


@router.get(
    "/company/{company_id}",
    summary="Get company vault info",
    description="Get vault address and status for a company.",
)
async def get_vault_info(company_id: str):
    """Get vault information for a company."""
    try:
        service = CompanyService()
        company = await service.get_by_id(company_id)
        
        return {
            "success": True,
            "company_id": company.id,
            "vault_address": company.vault_address,
            "vault_chain_id": company.vault_chain_id,
            "vault_deployed_at": company.vault_deployed_at,
            "is_vault_deployed": company.vault_address is not None,
        }
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())


@router.get(
    "/by-address/{vault_address}",
    response_model=CompanyResponse,
    summary="Get company by vault address",
    description="Look up which company owns a vault address.",
)
async def get_company_by_vault(vault_address: str):
    """
    Get company by vault address.
    Useful for reverse lookups from blockchain events.
    """
    try:
        from app.db.supabase import get_supabase_admin_client
        
        client = get_supabase_admin_client()
        result = (
            client.table("companies")
            .select("*")
            .eq("vault_address", vault_address)
            .execute()
        )
        
        if not result.data:
            raise HTTPException(
                status_code=404,
                detail={
                    "error": {
                        "code": "VAULT_NOT_FOUND",
                        "message": f"No company found with vault: {vault_address}",
                    }
                },
            )
        
        return CompanyResponse(**result.data[0])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
