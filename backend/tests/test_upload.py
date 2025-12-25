"""
Upload Endpoint Tests
=====================
"""

import io


def test_upload_requires_headers(client):
    """Test that upload endpoint requires company and employee headers."""
    response = client.post("/api/upload")
    assert response.status_code == 422  # Missing headers


def test_upload_requires_file(client, auth_headers):
    """Test that upload endpoint requires a file."""
    response = client.post("/api/upload", headers=auth_headers)
    assert response.status_code == 422  # Missing file
