"""
Vault Endpoints
===============
Blockchain vault management - Factory Contract deployment and linking.
Handles automated vault deployment per Phase 1 requirements.
"""

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field

from app.core.exceptions import AppException
from app.schemas.company import (
    CompanyResponse,
    VaultLinkRequest,
    VaultLinkResponse,
)
from app.services.company import CompanyService
from app.services.vault import vault_service, VaultDeploymentError

router = APIRouter()


class VaultDeployRequest(BaseModel):
    """Request to deploy a new vault for a company."""
    company_id: str = Field(..., description="Company UUID")
    admin_address: str = Field(..., description="Wallet address for vault admin")


class VaultDeployResponse(BaseModel):
    """Response from vault deployment."""
    success: bool
    company_id: str
    vault_address: str | None = None
    admin_address: str | None = None
    chain_id: int | None = None
    message: str | None = None


@router.post(
    "/deploy",
    response_model=VaultDeployResponse,
    summary="Deploy vault for company",
    description="""
    Deploy a new Treasury Vault for a company using the Factory Contract pattern.
    
    **Phase 1: Automated Vault Deployment**
    
    This endpoint:
    1. Deploys a Smart Contract Wallet via Thirdweb
    2. Sets the company admin as the wallet owner
    3. Grants operator role to the application
    4. Updates company record with vault address
    
    RBAC:
    - Admin (client): Full control, can withdraw funds
    - Operator (app): Can only execute approved payments
    """,
)
async def deploy_vault(
    data: VaultDeployRequest,
    x_api_key: str = Header(..., alias="X-API-Key", description="Internal API key"),
):
    """
    Deploy a new self-custodial Treasury Vault.
    
    Called during company onboarding after KYB approval.
    """
    # Get company info
    try:
        company_service = CompanyService()
        company = await company_service.get_by_id(data.company_id)
    except AppException:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # Check if vault already exists
    if company.vault_address:
        return VaultDeployResponse(
            success=True,
            company_id=data.company_id,
            vault_address=company.vault_address,
            admin_address=data.admin_address,
            chain_id=company.vault_chain_id or 43113,
            message="Vault already deployed",
        )
    
    try:
        result = await vault_service.deploy_vault(
            company_id=data.company_id,
            admin_address=data.admin_address,
            company_name=company.name,
        )
        
        return VaultDeployResponse(
            success=True,
            company_id=result["company_id"],
            vault_address=result["vault_address"],
            admin_address=result["admin_address"],
            chain_id=result["chain_id"],
            message="Vault deployed successfully",
        )
        
    except VaultDeploymentError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/balance/{company_id}",
    summary="Get vault balance",
    description="Get the USDC and native token balance of a company vault.",
)
async def get_vault_balance(company_id: str):
    """Get vault balances for a company."""
    vault_info = await vault_service.get_vault_info(company_id)
    
    if not vault_info:
        raise HTTPException(
            status_code=404,
            detail="No vault found for this company",
        )
    
    # Get USDC balance
    usdc_address = "0x5425890298aed601595a70AB815c96711a31Bc65"  # Fuji USDC
    
    try:
        usdc_balance = await vault_service.get_vault_balance(
            vault_info["vault_address"],
            token_address=usdc_address,
        )
        native_balance = await vault_service.get_vault_balance(
            vault_info["vault_address"],
        )
        
        return {
            "company_id": company_id,
            "vault_address": vault_info["vault_address"],
            "usdc_balance": usdc_balance.get("balance", {}),
            "native_balance": native_balance.get("balance", {}),
        }
        
    except VaultDeploymentError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/permissions/{company_id}",
    summary="Check vault permissions",
    description="Verify operator permissions on a company vault.",
)
async def check_vault_permissions(company_id: str):
    """Check if application has operator role on vault."""
    vault_info = await vault_service.get_vault_info(company_id)
    
    if not vault_info:
        raise HTTPException(
            status_code=404,
            detail="No vault found for this company",
        )
    
    from app.config import settings
    
    permissions = await vault_service.check_operator_permissions(
        vault_info["vault_address"],
        settings.thirdweb_company_wallet_address,
    )
    
    return {
        "company_id": company_id,
        "vault_address": vault_info["vault_address"],
        **permissions,
    }


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
