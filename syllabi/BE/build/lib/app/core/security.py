"""Security utilities - Firebase token verification and password hashing"""
from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status, Cookie, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import JWTError, jwt
import bcrypt
import logging

from app.core.database import get_db
from app.core.config import settings
from app.core.firebase import verify_firebase_token

logger = logging.getLogger(__name__)

# bcrypt has a 72-byte limit for passwords
MAX_PASSWORD_LENGTH = 72

# JWT settings
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours


def _truncate_password(password: str) -> bytes:
    """Truncate password to 72 bytes for bcrypt compatibility."""
    password_bytes = password.encode('utf-8')
    if len(password_bytes) > MAX_PASSWORD_LENGTH:
        password_bytes = password_bytes[:MAX_PASSWORD_LENGTH]
    return password_bytes


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a hashed password."""
    password_bytes = _truncate_password(plain_password)
    hashed_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_bytes, hashed_bytes)


def get_password_hash(password: str) -> str:
    """Hash a password."""
    password_bytes = _truncate_password(password)
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token.

    Note: This is primarily for internal use or fallback authentication.
    Primary authentication is via Firebase tokens.
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    """Decode and verify a JWT access token."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

# HTTP Bearer for Authorization header
http_bearer = HTTPBearer(auto_error=False)


async def get_current_user(
    authorization: Optional[str] = Header(None, alias="Authorization"),
    x_firebase_token: Optional[str] = Header(None, alias="X-Firebase-Token"),
    firebase_token: Optional[str] = Cookie(None, alias="firebase_token"),
    firebase_auth_token: Optional[str] = Cookie(None, alias="firebase_auth_token"),
    bearer_credentials: Optional[HTTPAuthorizationCredentials] = Depends(http_bearer),
    db: Session = Depends(get_db)
):
    """
    Get current authenticated user from Firebase token.

    Token can be provided via:
    1. Authorization header: "Bearer <token>"
    2. X-Firebase-Token header: "<token>"
    3. Cookie: firebase_token=<token> or firebase_auth_token=<token>

    The token is verified with Firebase Admin SDK.
    User must exist in the database (matched by firebase_uid or email).
    """
    from app.models.user import User

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Get token from various sources (priority order)
    token = None

    # 1. Bearer token from Authorization header
    if bearer_credentials:
        token = bearer_credentials.credentials
    elif authorization and authorization.startswith("Bearer "):
        token = authorization[7:]

    # 2. X-Firebase-Token header
    if not token and x_firebase_token:
        token = x_firebase_token

    # 3. Cookie (support both cookie names)
    if not token and firebase_auth_token:
        # Remove quotes if present (cookie might be JSON-encoded)
        token = firebase_auth_token.strip('"')
    if not token and firebase_token:
        token = firebase_token

    if not token:
        raise credentials_exception

    # Verify Firebase token
    firebase_data = verify_firebase_token(token)
    if not firebase_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired Firebase token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    firebase_uid = firebase_data.get("uid")
    firebase_email = firebase_data.get("email")

    if not firebase_uid:
        raise credentials_exception

    # Find user by Firebase UID first
    user = db.query(User).filter(User.firebase_uid == firebase_uid).first()

    # If not found by UID, try email and link the account
    if not user and firebase_email:
        user = db.query(User).filter(User.email == firebase_email).first()

        if user:
            # Link Firebase UID to existing user
            user.firebase_uid = firebase_uid
            db.commit()
            logger.info(f"Linked Firebase UID {firebase_uid} to user {user.user_id}")

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not registered in system. Please contact administrator.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )

    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()

    return user


def require_roles(allowed_roles: list[str]):
    """
    Dependency factory that checks if the current user has one of the allowed roles.

    Usage:
        @router.get("/admin-only")
        def admin_endpoint(current_user: User = Depends(require_roles(["Admin"]))):
            ...
    """
    async def role_checker(
        authorization: Optional[str] = Header(None, alias="Authorization"),
        x_firebase_token: Optional[str] = Header(None, alias="X-Firebase-Token"),
        firebase_token: Optional[str] = Cookie(None, alias="firebase_token"),
        firebase_auth_token: Optional[str] = Cookie(None, alias="firebase_auth_token"),
        bearer_credentials: Optional[HTTPAuthorizationCredentials] = Depends(http_bearer),
        db: Session = Depends(get_db)
    ):
        from app.models.user import User, UserRole

        # Get current user
        user = await get_current_user(
            authorization, x_firebase_token, firebase_token, firebase_auth_token, bearer_credentials, db
        )

        # Map role strings to enum values
        role_map = {
            "Admin": UserRole.ADMIN,
            "Lecturer": UserRole.LECTURER,
            "HoD": UserRole.HOD,
            "Academic Affairs": UserRole.ACADEMIC_AFFAIRS,
            "Principal": UserRole.PRINCIPAL,
            "Student": UserRole.STUDENT,
        }

        # Check if user's role is in allowed roles
        user_role_value = user.role.value if hasattr(user.role, 'value') else str(user.role)

        allowed = False
        for role_name in allowed_roles:
            if role_name in role_map:
                if user.role == role_map[role_name]:
                    allowed = True
                    break
            elif user_role_value == role_name:
                allowed = True
                break

        if not allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {', '.join(allowed_roles)}"
            )

        return user

    return role_checker


async def get_current_user_optional(
    authorization: Optional[str] = Header(None, alias="Authorization"),
    x_firebase_token: Optional[str] = Header(None, alias="X-Firebase-Token"),
    firebase_token: Optional[str] = Cookie(None, alias="firebase_token"),
    firebase_auth_token: Optional[str] = Cookie(None, alias="firebase_auth_token"),
    bearer_credentials: Optional[HTTPAuthorizationCredentials] = Depends(http_bearer),
    db: Session = Depends(get_db)
) -> Optional["User"]:
    """
    Get current user if authenticated, otherwise return None.
    Useful for endpoints that work with or without authentication.
    """
    try:
        return await get_current_user(
            authorization, x_firebase_token, firebase_token, firebase_auth_token, bearer_credentials, db
        )
    except HTTPException:
        return None
