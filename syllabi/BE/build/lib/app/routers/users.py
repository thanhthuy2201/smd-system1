"""Users Router - User Management APIs (Admin)"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import asc, desc, or_
from typing import Optional, Literal
import logging

from app.core.database import get_db
from app.core.security import get_current_user, get_password_hash
from app.core.firebase import create_firebase_user, delete_firebase_user, get_firebase_user_by_email
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserUpdate, UserResponse, UserList
from app.schemas.common import SortOrder, build_paginated_response

logger = logging.getLogger(__name__)

router = APIRouter()


def require_admin(current_user: User = Depends(get_current_user)):
    """Dependency to require admin role"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


@router.get(
    "",
    response_model=UserList,
    summary="List All Users",
    description="""
Get a paginated list of all users. **Admin only.**

**Filters:**
- `role`: Filter by user role (Admin, Lecturer, HoD, Academic Affairs, Principal, Student)
- `department_id`: Filter by department ID
- `is_active`: Filter by active status (true/false)
- `search`: Search by email, username, first_name, or last_name

**Sorting:**
- `sortBy`: Field to sort by (user_id, email, username, first_name, last_name, role, created_date)
- `sortOrder`: Sort order (asc, desc)
    """
)
async def list_users(
    # Pagination
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    pageSize: int = Query(10, ge=1, le=100, description="Items per page"),
    # Search
    search: Optional[str] = Query(None, description="Search by email, username, or name"),
    # Filters
    role: Optional[UserRole] = Query(None, description="Filter by role"),
    department_id: Optional[int] = Query(None, description="Filter by department"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    # Sorting
    sortBy: Optional[str] = Query("created_date", description="Field to sort by"),
    sortOrder: SortOrder = Query(SortOrder.DESC, description="Sort order"),
    # Dependencies
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Retrieve all users with filters, search, sorting, and pagination."""
    query = db.query(User)

    # Apply search
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (User.email.ilike(search_term)) |
            (User.username.ilike(search_term)) |
            (User.first_name.ilike(search_term)) |
            (User.last_name.ilike(search_term))
        )

    # Apply filters
    if role:
        query = query.filter(User.role == role)
    if department_id:
        query = query.filter(User.department_id == department_id)
    if is_active is not None:
        query = query.filter(User.is_active == is_active)

    # Apply sorting
    sort_columns = {
        "user_id": User.user_id,
        "email": User.email,
        "username": User.username,
        "first_name": User.first_name,
        "last_name": User.last_name,
        "role": User.role,
        "created_date": User.created_date,
    }
    sort_column = sort_columns.get(sortBy, User.created_date)
    if sortOrder == SortOrder.ASC:
        query = query.order_by(asc(sort_column))
    else:
        query = query.order_by(desc(sort_column))

    # Get total and paginate
    total = query.count()
    skip = (page - 1) * pageSize
    users = query.offset(skip).limit(pageSize).all()

    return build_paginated_response(users, total, page, pageSize)


@router.get(
    "/contacts",
    summary="Get Contacts for Messaging",
    description="""
Get available contacts for internal messaging.

This endpoint returns users that can be messaged by the current user.
Useful for populating recipient autocomplete in messaging features.

**Filters:**
- `search`: Search by name or email
- `role`: Filter by specific role
- `department_id`: Filter by department
    """
)
async def get_contacts(
    search: Optional[str] = Query(None, description="Search by name or email"),
    role: Optional[UserRole] = Query(None, description="Filter by role"),
    department_id: Optional[int] = Query(None, description="Filter by department"),
    limit: int = Query(20, ge=1, le=50, description="Max number of results"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get available contacts for messaging.
    Returns users that the current user can message.
    """
    query = db.query(User).filter(
        User.user_id != current_user.user_id,
        User.is_active == True
    )

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                User.first_name.ilike(search_term),
                User.last_name.ilike(search_term),
                User.email.ilike(search_term)
            )
        )

    if role:
        query = query.filter(User.role == role)

    if department_id:
        query = query.filter(User.department_id == department_id)

    users = query.order_by(User.last_name, User.first_name).limit(limit).all()

    return [
        {
            "user_id": u.user_id,
            "name": u.full_name,
            "email": u.email,
            "role": u.role.value,
            "department_id": u.department_id
        }
        for u in users
    ]


@router.get(
    "/{user_id}",
    response_model=UserResponse,
    summary="Get User by ID",
    description="Get a specific user by their ID. **Admin only.**"
)
async def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Get a user by ID.
    """
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post(
    "",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create New User",
    description="""
Create a new user account. **Admin only.**

This endpoint creates the user in:
1. Your PostgreSQL database (with role, department, etc.)
2. Firebase Authentication (for login)

The user can immediately log in using Firebase with the provided email/password.
    """
)
async def create_user(
    user_data: UserCreate,
    create_in_firebase: bool = Query(True, description="Also create user in Firebase Authentication"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Create a new user.

    - **username**: Unique username (3-50 characters)
    - **email**: Unique email address
    - **password**: Password (minimum 8 characters)
    - **first_name**: User's first name
    - **last_name**: User's last name
    - **role**: User role in the system
    - **create_in_firebase**: If true, also create user in Firebase (default: true)
    """
    # Check if username exists
    if db.query(User).filter(User.username == user_data.username).first():
        raise HTTPException(status_code=400, detail="Username already registered")

    # Check if email exists
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    firebase_uid = None

    # Create user in Firebase first (if requested)
    if create_in_firebase:
        # Check if user already exists in Firebase
        existing_firebase = get_firebase_user_by_email(user_data.email)
        if existing_firebase:
            firebase_uid = existing_firebase["uid"]
            logger.info(f"User already exists in Firebase: {firebase_uid}")
        else:
            display_name = f"{user_data.first_name} {user_data.last_name}"
            firebase_result = create_firebase_user(
                email=user_data.email,
                password=user_data.password,
                display_name=display_name
            )

            if firebase_result:
                firebase_uid = firebase_result["uid"]
                logger.info(f"Created Firebase user: {firebase_uid}")
            else:
                logger.warning("Failed to create Firebase user, continuing with DB only")

    # Create user in database
    user = User(
        username=user_data.username,
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        role=user_data.role,
        department_id=user_data.department_id,
        faculty_position=user_data.faculty_position,
        phone=user_data.phone,
        firebase_uid=firebase_uid,
        is_active=True
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


@router.put(
    "/{user_id}",
    response_model=UserResponse,
    summary="Update User",
    description="Update an existing user. **Admin only.**"
)
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Update a user by ID.
    """
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Update fields
    update_data = user_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)

    return user


@router.delete(
    "/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete/Deactivate User",
    description="Deactivate a user account. **Admin only.**"
)
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Deactivate a user (soft delete).
    """
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.user_id == current_user.user_id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")

    user.is_active = False
    db.commit()

    return None


@router.put(
    "/{user_id}/role",
    response_model=UserResponse,
    summary="Assign User Role",
    description="Change a user's role. **Admin only.**"
)
async def assign_role(
    user_id: int,
    role: UserRole,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Assign a new role to a user.
    """
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.role = role
    db.commit()
    db.refresh(user)

    return user
