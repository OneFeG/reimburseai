"""
Database Dependencies - Supabase client access.
"""

from app.db.supabase import get_supabase_admin_client, get_supabase_client


def get_client():
    """Get the Supabase client instance (respects RLS)."""
    return get_supabase_client()


def get_admin_client():
    """Get the Supabase admin client (bypasses RLS)."""
    return get_supabase_admin_client()
