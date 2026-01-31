"""Authentication Router - Firebase Token Verification"""
from fastapi import APIRouter, Depends, HTTPException, status, Header, Cookie, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional
import logging

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.firebase import verify_firebase_token, get_firebase_config
from app.models.user import User, UserRole
from app.schemas.user import UserResponse

logger = logging.getLogger(__name__)

# HTTP Bearer for Authorization header
http_bearer = HTTPBearer(auto_error=False)

router = APIRouter()


class FirebaseConfigResponse(BaseModel):
    """Firebase configuration for frontend"""
    apiKey: str | None = None
    authDomain: str | None = None
    projectId: str | None = None
    storageBucket: str | None = None
    messagingSenderId: str | None = None
    appId: str | None = None


@router.get(
    "/firebase-config",
    response_model=FirebaseConfigResponse,
    summary="Get Firebase Configuration",
    description="""
Get Firebase configuration for frontend initialization.

**Note:** This returns the same configuration values as the frontend
VITE_FIREBASE_* environment variables, allowing the frontend to
dynamically fetch Firebase config from the backend if needed.
    """
)
async def get_firebase_configuration():
    """
    Get Firebase configuration for frontend.
    """
    config = get_firebase_config()
    return FirebaseConfigResponse(**config)


class VerifyResponse(BaseModel):
    """Response schema for token verification"""
    valid: bool
    firebase_uid: Optional[str] = None
    email: Optional[str] = None
    user_registered: bool = False
    is_new_user: bool = False
    user: Optional[dict] = None


@router.post(
    "/verify",
    response_model=VerifyResponse,
    summary="Verify Firebase Token",
    description="""
Verify a Firebase ID token and check/create user in the system.

**Token can be provided via:**
- Authorization header: `Bearer <firebase_token>`
- X-Firebase-Token header: `<firebase_token>`
- Cookie: `firebase_token=<token>` or `firebase_auth_token=<token>`

**Parameters:**
- `auto_register`: If true and user doesn't exist, auto-create with role=Student (default: true)

**Use cases:**
- Frontend calls this after Firebase login/register
- Validates token and returns user info with role
- Auto-creates new users with Student role (if auto_register=true)
    """,
    responses={
        200: {"description": "Token verification result"},
        401: {"description": "Invalid or missing token"}
    }
)
async def verify_token(
    auto_register: bool = Query(True, description="Auto-create user if not exists (default: true)"),
    authorization: Optional[str] = Header(None, alias="Authorization"),
    x_firebase_token: Optional[str] = Header(None, alias="X-Firebase-Token"),
    firebase_token: Optional[str] = Cookie(None, alias="firebase_token"),
    firebase_auth_token: Optional[str] = Cookie(None, alias="firebase_auth_token"),
    bearer_credentials: Optional[HTTPAuthorizationCredentials] = Depends(http_bearer),
    db: Session = Depends(get_db)
):
    """
    Verify Firebase ID token and return user status.
    If auto_register=true and user doesn't exist, create with default role (Student).
    """
    # Get token from various sources (same as get_current_user)
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
        token = firebase_auth_token.strip('"')
    if not token and firebase_token:
        token = firebase_token

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Firebase token is required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Verify Firebase token
    firebase_data = verify_firebase_token(token)
    if not firebase_data:
        return VerifyResponse(valid=False)

    firebase_uid = firebase_data.get("uid")
    firebase_email = firebase_data.get("email")
    firebase_name = firebase_data.get("name", "")

    if not firebase_uid:
        return VerifyResponse(valid=False)

    is_new_user = False

    # Find user by Firebase UID or email
    user = db.query(User).filter(
        (User.firebase_uid == firebase_uid) | (User.email == firebase_email)
    ).first()

    if user:
        # Link Firebase UID if not already linked
        if not user.firebase_uid:
            user.firebase_uid = firebase_uid
            logger.info(f"Linked Firebase UID {firebase_uid} to existing user {user.user_id}")

        # Update last login
        user.last_login = datetime.utcnow()
        db.commit()

    elif auto_register and firebase_email:
        # Auto-create new user with default role (Student)
        # Parse name from Firebase (if available)
        first_name = ""
        last_name = ""
        if firebase_name:
            name_parts = firebase_name.split(" ", 1)
            first_name = name_parts[0]
            last_name = name_parts[1] if len(name_parts) > 1 else ""

        # Generate username from email
        username = firebase_email.split("@")[0]

        # Ensure username is unique
        base_username = username
        counter = 1
        while db.query(User).filter(User.username == username).first():
            username = f"{base_username}{counter}"
            counter += 1

        user = User(
            username=username,
            email=firebase_email,
            firebase_uid=firebase_uid,
            first_name=first_name,
            last_name=last_name,
            role=UserRole.STUDENT,  # Default role
            is_active=True,
            last_login=datetime.utcnow()
        )

        db.add(user)
        db.commit()
        db.refresh(user)

        is_new_user = True
        logger.info(f"Auto-created new user: {user.user_id} ({firebase_email}) with role Student")

    # Build user data response
    user_data = None
    if user:
        # Check if user is active
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive"
            )

        # Get department name
        department_name = None
        if user.department_id and user.department:
            department_name = user.department.dept_name

        user_data = {
            "id": user.user_id,
            "email": user.email,
            "role": user.role.value if hasattr(user.role, 'value') else str(user.role),
            "firstName": user.first_name,
            "lastName": user.last_name,
            "fullName": user.full_name,
            "department": department_name,
            "departmentId": user.department_id,
            "facultyPosition": user.faculty_position,
            "isActive": user.is_active
        }

    return VerifyResponse(
        valid=True,
        firebase_uid=firebase_uid,
        email=firebase_email,
        user_registered=user is not None,
        is_new_user=is_new_user,
        user=user_data
    )


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get Current User",
    description="""
Get the profile of the currently authenticated user.

**Authentication required:** Send Firebase token via:
- Authorization header: `Bearer <firebase_token>`
- X-Firebase-Token header: `<firebase_token>`
- Cookie: `firebase_token=<firebase_token>` or `firebase_auth_token=<firebase_token>`
    """
)
async def get_me(current_user: User = Depends(get_current_user)):
    """
    Get current authenticated user's profile.
    """
    return current_user


@router.post(
    "/logout",
    summary="User Logout",
    description="""
Logout notification endpoint.

Since Firebase tokens are verified on each request, actual logout
is handled client-side by:
1. Calling Firebase signOut()
2. Clearing stored tokens/cookies

This endpoint is for logging purposes only.
    """
)
async def logout(current_user: User = Depends(get_current_user)):
    """
    Logout notification - client should clear Firebase session.
    """
    return {
        "message": "Logout successful. Please clear Firebase session on client.",
        "user_id": current_user.user_id
    }
