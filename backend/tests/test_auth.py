import pytest
from datetime import timedelta
from ..auth import (
    verify_password,
    get_password_hash,
    create_access_token,
    verify_token
)
from ..config import settings

def test_get_password_hash():
    """Test password hashing"""
    password = "testpassword"
    hashed = get_password_hash(password)
    assert hashed != password
    assert verify_password(password, hashed)

def test_verify_password_correct():
    """Test password verification with correct password"""
    password = "testpassword"
    hashed = get_password_hash(password)
    assert verify_password(password, hashed)

def test_verify_password_incorrect():
    """Test password verification with incorrect password"""
    password = "testpassword"
    wrong_password = "wrongpassword"
    hashed = get_password_hash(password)
    assert not verify_password(wrong_password, hashed)

def test_create_access_token():
    """Test JWT token creation"""
    data = {"sub": "testuser"}
    token = create_access_token(data)
    assert isinstance(token, str)
    assert len(token) > 0

def test_create_access_token_with_expiry():
    """Test JWT token creation with custom expiry"""
    data = {"sub": "testuser"}
    expires_delta = timedelta(minutes=30)
    token = create_access_token(data, expires_delta)
    assert isinstance(token, str)

def test_verify_token_valid():
    """Test token verification with valid token"""
    data = {"sub": "testuser"}
    token = create_access_token(data)
    username = verify_token(token)
    assert username == "testuser"

def test_verify_token_invalid():
    """Test token verification with invalid token"""
    invalid_token = "invalid.jwt.token"
    with pytest.raises(Exception):  # Should raise HTTPException
        verify_token(invalid_token)

def test_verify_token_expired():
    """Test token verification with expired token"""
    data = {"sub": "testuser"}
    # Create token with very short expiry
    expires_delta = timedelta(seconds=-1)  # Already expired
    token = create_access_token(data, expires_delta)
    with pytest.raises(Exception):  # Should raise HTTPException
        verify_token(token)