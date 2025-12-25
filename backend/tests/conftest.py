"""
Test Configuration
==================
Pytest fixtures and configuration.
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    """Create a test client for the FastAPI app."""
    return TestClient(app)


@pytest.fixture
def sample_company():
    """Sample company data for testing."""
    return {
        "name": "Test Company",
        "slug": "test-company",
        "email": "admin@test-company.com",
    }


@pytest.fixture
def sample_employee():
    """Sample employee data for testing."""
    return {
        "email": "employee@test-company.com",
        "name": "Test Employee",
        "department": "Engineering",
    }


@pytest.fixture
def auth_headers():
    """Sample authentication headers."""
    return {
        "X-Company-ID": "test-company-id",
        "X-Employee-ID": "test-employee-id",
    }
