"""
Database Dependencies - Supabase client access.
"""

from app.db.supabase import get_client


def get_supabase_client():
    """Get the Supabase client instance."""
    return get_client()
