"""
Supabase Client
===============
Initialize and manage Supabase connections.
Uses service role key for backend operations (bypasses RLS).
"""

from functools import lru_cache

from supabase import Client, create_client

from app.config import settings


@lru_cache
def get_supabase_client() -> Client:
    """
    Get Supabase client with anon key.
    This client respects Row Level Security (RLS) policies.
    Use this for user-facing operations.
    """
    if not settings.supabase_url or not settings.supabase_anon_key:
        raise ValueError(
            "Supabase URL and ANON KEY must be set in environment variables. "
            "Get these from your Supabase dashboard."
        )

    return create_client(
        settings.supabase_url,
        settings.supabase_anon_key,
    )


@lru_cache
def get_supabase_admin_client() -> Client:
    """
    Get Supabase client with service role key.
    This client BYPASSES Row Level Security (RLS) policies.
    Use this for admin operations and backend-to-backend calls.

    WARNING: Never expose this client to the frontend.
    """
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise ValueError(
            "Supabase URL and SERVICE_ROLE_KEY must be set in environment variables. "
            "Get these from your Supabase dashboard."
        )

    return create_client(
        settings.supabase_url,
        settings.supabase_service_role_key,
    )


def get_storage_client():
    """Get Supabase storage client for file operations."""
    client = get_supabase_admin_client()
    return client.storage


def init_storage_bucket() -> bool:
    """
    Initialize the receipts storage bucket if it doesn't exist.
    Should be called on application startup.

    Returns:
        True if bucket exists or was created successfully
    """
    try:
        storage = get_storage_client()
        bucket_name = settings.storage_bucket

        # List existing buckets
        buckets = storage.list_buckets()
        bucket_names = [b.name for b in buckets]

        if bucket_name not in bucket_names:
            # Create the bucket with private access
            storage.create_bucket(
                bucket_name,
                options={
                    "public": False,
                    "file_size_limit": settings.max_file_size_bytes,
                    "allowed_mime_types": [
                        "image/jpeg",
                        "image/png",
                        "image/webp",
                        "application/pdf",
                    ],
                },
            )
            print(f"✅ Created storage bucket: {bucket_name}")
        else:
            print(f"✅ Storage bucket exists: {bucket_name}")

        return True
    except Exception as e:
        print(f"❌ Failed to initialize storage bucket: {e}")
        return False
