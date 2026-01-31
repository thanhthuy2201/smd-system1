"""Syllabus Versions Router - Version Control APIs"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
import json

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User, UserRole
from app.models.syllabus import Syllabus, SyllabusStatus
from app.models.syllabus_version import SyllabusVersion
from app.schemas.syllabus_version import (
    SyllabusVersionCreate, SyllabusVersionResponse, SyllabusVersionList, VersionCompare
)

router = APIRouter()


def require_instructor(current_user: User = Depends(get_current_user)):
    """Dependency to require instructor or higher role (not student)"""
    if current_user.role == UserRole.STUDENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Instructor access required"
        )
    return current_user


@router.get(
    "/{syllabus_id}/versions",
    response_model=SyllabusVersionList,
    summary="List Syllabus Versions",
    description="Get all versions of a specific syllabus."
)
async def list_versions(
    syllabus_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all versions of a syllabus.
    """
    syllabus = db.query(Syllabus).filter(Syllabus.syllabus_id == syllabus_id).first()
    if not syllabus:
        raise HTTPException(status_code=404, detail="Syllabus not found")

    query = db.query(SyllabusVersion).filter(SyllabusVersion.syllabus_id == syllabus_id)
    total = query.count()
    versions = query.order_by(SyllabusVersion.version_number.desc()).offset(skip).limit(limit).all()

    return {"total": total, "items": versions}


@router.get(
    "/{syllabus_id}/versions/{version_id}",
    response_model=SyllabusVersionResponse,
    summary="Get Specific Version",
    description="Get a specific version of a syllabus."
)
async def get_version(
    syllabus_id: int,
    version_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific syllabus version.
    """
    version = db.query(SyllabusVersion).filter(
        SyllabusVersion.syllabus_id == syllabus_id,
        SyllabusVersion.version_id == version_id
    ).first()

    if not version:
        raise HTTPException(status_code=404, detail="Version not found")

    return version


@router.post(
    "/{syllabus_id}/versions",
    response_model=SyllabusVersionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create New Version",
    description="Create a new version of a syllabus. **Instructor only.**"
)
async def create_version(
    syllabus_id: int,
    version_data: SyllabusVersionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_instructor)
):
    """
    Create a new version of a syllabus.

    A new version is typically created when updating an approved syllabus.
    """
    syllabus = db.query(Syllabus).filter(Syllabus.syllabus_id == syllabus_id).first()
    if not syllabus:
        raise HTTPException(status_code=404, detail="Syllabus not found")

    # Check ownership
    if syllabus.created_by != current_user.user_id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized to create version")

    # Get next version number
    max_version = db.query(SyllabusVersion).filter(
        SyllabusVersion.syllabus_id == syllabus_id
    ).order_by(SyllabusVersion.version_number.desc()).first()

    next_version = (max_version.version_number + 1) if max_version else 1

    # Set all existing versions as not current
    db.query(SyllabusVersion).filter(
        SyllabusVersion.syllabus_id == syllabus_id
    ).update({"is_current": False})

    # Create new version
    version = SyllabusVersion(
        syllabus_id=syllabus_id,
        version_number=next_version,
        changes_summary=version_data.changes_summary,
        content_json=version_data.content_json,
        created_by=current_user.user_id,
        effective_date=version_data.effective_date,
        expiry_date=version_data.expiry_date,
        is_current=True
    )

    db.add(version)

    # Update syllabus version_id
    syllabus.version_id = version.version_id
    syllabus.status = SyllabusStatus.DRAFT  # Reset to draft for new version

    db.commit()
    db.refresh(version)

    return version


@router.get(
    "/{syllabus_id}/versions/compare",
    response_model=VersionCompare,
    summary="Compare Two Versions",
    description="Compare two versions of a syllabus to see differences."
)
async def compare_versions(
    syllabus_id: int,
    version1_id: int = Query(..., description="First version ID"),
    version2_id: int = Query(..., description="Second version ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Compare two versions of a syllabus.

    Returns the differences between the two versions.
    """
    version1 = db.query(SyllabusVersion).filter(
        SyllabusVersion.syllabus_id == syllabus_id,
        SyllabusVersion.version_id == version1_id
    ).first()

    version2 = db.query(SyllabusVersion).filter(
        SyllabusVersion.syllabus_id == syllabus_id,
        SyllabusVersion.version_id == version2_id
    ).first()

    if not version1 or not version2:
        raise HTTPException(status_code=404, detail="One or both versions not found")

    # Compare content
    content1 = version1.content_json or {}
    content2 = version2.content_json or {}

    keys1 = set(content1.keys())
    keys2 = set(content2.keys())

    added = list(keys2 - keys1)
    removed = list(keys1 - keys2)
    common = keys1 & keys2

    modified = []
    differences = {}

    for key in common:
        if content1[key] != content2[key]:
            modified.append(key)
            differences[key] = {
                "version1": content1[key],
                "version2": content2[key]
            }

    for key in added:
        differences[key] = {"version1": None, "version2": content2[key]}

    for key in removed:
        differences[key] = {"version1": content1[key], "version2": None}

    return {
        "version1_id": version1_id,
        "version2_id": version2_id,
        "version1_number": version1.version_number,
        "version2_number": version2.version_number,
        "differences": differences,
        "added_fields": added,
        "removed_fields": removed,
        "modified_fields": modified
    }


@router.put(
    "/{syllabus_id}/versions/{version_id}/activate",
    response_model=SyllabusVersionResponse,
    summary="Set as Current Version",
    description="Set a specific version as the current active version. **Instructor only.**"
)
async def activate_version(
    syllabus_id: int,
    version_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_instructor)
):
    """
    Set a version as the current active version.
    """
    syllabus = db.query(Syllabus).filter(Syllabus.syllabus_id == syllabus_id).first()
    if not syllabus:
        raise HTTPException(status_code=404, detail="Syllabus not found")

    version = db.query(SyllabusVersion).filter(
        SyllabusVersion.syllabus_id == syllabus_id,
        SyllabusVersion.version_id == version_id
    ).first()

    if not version:
        raise HTTPException(status_code=404, detail="Version not found")

    # Set all versions as not current
    db.query(SyllabusVersion).filter(
        SyllabusVersion.syllabus_id == syllabus_id
    ).update({"is_current": False})

    # Set selected version as current
    version.is_current = True
    syllabus.version_id = version_id

    db.commit()
    db.refresh(version)

    return version
