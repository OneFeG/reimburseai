"""
Waitlist API Endpoints
======================
Handles waitlist signups for beta access.
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, EmailStr

from app.db.supabase import get_supabase_client

router = APIRouter(prefix="/waitlist", tags=["Waitlist"])


class WaitlistSignup(BaseModel):
    """Request model for waitlist signup."""
    email: EmailStr
    reason: Optional[str] = None


class WaitlistResponse(BaseModel):
    """Response model for waitlist signup."""
    success: bool
    message: str
    id: Optional[str] = None


class WaitlistEntry(BaseModel):
    """Model for a waitlist entry."""
    id: UUID
    email: str
    reason: Optional[str]
    status: str
    created_at: datetime


@router.post("", response_model=WaitlistResponse)
async def join_waitlist(signup: WaitlistSignup, request: Request):
    """
    Add an email to the waitlist.
    
    This endpoint stores the email and optional reason in the database
    and can optionally send a notification email to contact@reimburseai.app
    """
    try:
        supabase = get_supabase_client()
        
        # Get client info
        client_ip = request.client.host if request.client else None
        user_agent = request.headers.get("user-agent", "")
        
        # Check if email already exists
        existing = supabase.table("waitlist").select("id, email").eq("email", signup.email).execute()
        
        if existing.data and len(existing.data) > 0:
            return WaitlistResponse(
                success=True,
                message="You're already on the waitlist! We'll be in touch soon.",
                id=str(existing.data[0]["id"])
            )
        
        # Insert new waitlist entry
        result = supabase.table("waitlist").insert({
            "email": signup.email,
            "reason": signup.reason,
            "source": "website",
            "ip_address": client_ip,
            "user_agent": user_agent[:500] if user_agent else None,  # Limit user agent length
            "status": "pending"
        }).execute()
        
        if result.data and len(result.data) > 0:
            # Log the signup (in production, could send notification email)
            print(f"📧 New waitlist signup: {signup.email}")
            
            return WaitlistResponse(
                success=True,
                message="Successfully joined the waitlist! We'll be in touch soon.",
                id=str(result.data[0]["id"])
            )
        
        raise HTTPException(status_code=500, detail="Failed to save to waitlist")
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Waitlist error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to join waitlist: {str(e)}"
        )


@router.get("/count")
async def get_waitlist_count():
    """
    Get the total number of waitlist signups.
    Useful for displaying social proof on the landing page.
    """
    try:
        supabase = get_supabase_client()
        
        result = supabase.table("waitlist").select("id", count="exact").execute()
        
        return {
            "count": result.count or 0,
            "message": f"{result.count or 0} people on the waitlist"
        }
        
    except Exception as e:
        print(f"❌ Waitlist count error: {e}")
        return {"count": 0, "message": "Join the waitlist"}


@router.get("/check/{email}")
async def check_waitlist(email: str):
    """
    Check if an email is already on the waitlist.
    """
    try:
        supabase = get_supabase_client()
        
        result = supabase.table("waitlist").select("id, created_at, status").eq("email", email.lower()).execute()
        
        if result.data and len(result.data) > 0:
            return {
                "on_waitlist": True,
                "status": result.data[0]["status"],
                "signed_up_at": result.data[0]["created_at"]
            }
        
        return {"on_waitlist": False}
        
    except Exception as e:
        print(f"❌ Waitlist check error: {e}")
        return {"on_waitlist": False, "error": str(e)}
