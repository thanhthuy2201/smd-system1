"""Router for Evaluation Template Management (FE04)"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional

from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.models import (
    User, EvaluationTemplate, EvaluationCriteria, CriteriaPLOMapping,
    TemplateProgram, Program
)
from app.schemas.evaluation import (
    EvaluationTemplateCreate, EvaluationTemplateUpdate,
    EvaluationTemplateResponse, EvaluationTemplateListResponse,
    EvaluationCriteriaCreate, EvaluationCriteriaUpdate, EvaluationCriteriaResponse,
    CriteriaPLOMappingCreate, CriteriaPLOMappingResponse,
    TemplateValidationResponse
)

router = APIRouter(prefix="/evaluation-templates", tags=["Evaluation Templates"])


# ==================== Evaluation Template ====================

@router.get("", response_model=list[EvaluationTemplateListResponse])
def list_templates(
    is_active: Optional[bool] = None,
    program_id: Optional[int] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all evaluation templates"""
    query = db.query(
        EvaluationTemplate,
        func.count(EvaluationCriteria.criteria_id.distinct()).label("criteria_count"),
        func.count(TemplateProgram.id.distinct()).label("program_count")
    ).outerjoin(EvaluationCriteria).outerjoin(TemplateProgram).group_by(
        EvaluationTemplate.template_id
    )

    if is_active is not None:
        query = query.filter(EvaluationTemplate.is_active == is_active)

    if program_id:
        query = query.filter(TemplateProgram.program_id == program_id)

    results = query.order_by(EvaluationTemplate.created_at.desc()).offset(skip).limit(limit).all()

    return [
        EvaluationTemplateListResponse(
            template_id=t.template_id,
            name=t.name,
            description=t.description,
            is_default=t.is_default,
            is_active=t.is_active,
            criteria_count=criteria_count,
            program_count=program_count,
            created_at=t.created_at
        )
        for t, criteria_count, program_count in results
    ]


@router.post("", response_model=EvaluationTemplateResponse, status_code=status.HTTP_201_CREATED)
def create_template(
    data: EvaluationTemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Admin", "Academic Affairs"]))
):
    """Create a new evaluation template"""
    # If setting as default, unset other defaults
    if data.is_default:
        db.query(EvaluationTemplate).filter(
            EvaluationTemplate.is_default == True
        ).update({"is_default": False})

    template = EvaluationTemplate(
        name=data.name,
        description=data.description,
        is_default=data.is_default,
        created_by=current_user.user_id
    )
    db.add(template)
    db.flush()

    # Create program associations
    if data.program_ids:
        for program_id in data.program_ids:
            program = db.query(Program).filter(Program.program_id == program_id).first()
            if program:
                tp = TemplateProgram(
                    template_id=template.template_id,
                    program_id=program_id
                )
                db.add(tp)

    # Create criteria if provided
    if data.criteria:
        for criteria_data in data.criteria:
            criteria = EvaluationCriteria(
                template_id=template.template_id,
                name=criteria_data.name,
                description=criteria_data.description,
                category=criteria_data.category,
                weight=criteria_data.weight,
                max_score=criteria_data.max_score,
                passing_score=criteria_data.passing_score,
                is_mandatory=criteria_data.is_mandatory,
                display_order=criteria_data.display_order
            )
            db.add(criteria)
            db.flush()

            # Create PLO mappings
            if criteria_data.plo_mappings:
                for plo_data in criteria_data.plo_mappings:
                    mapping = CriteriaPLOMapping(
                        criteria_id=criteria.criteria_id,
                        program_id=plo_data.program_id,
                        plo_code=plo_data.plo_code,
                        plo_description=plo_data.plo_description
                    )
                    db.add(mapping)

    db.commit()
    db.refresh(template)
    return template


@router.get("/default", response_model=EvaluationTemplateResponse)
def get_default_template(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get the default evaluation template"""
    template = db.query(EvaluationTemplate).filter(
        EvaluationTemplate.is_default == True,
        EvaluationTemplate.is_active == True
    ).first()

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No default template found"
        )
    return template


@router.get("/{template_id}", response_model=EvaluationTemplateResponse)
def get_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get evaluation template by ID with criteria"""
    template = db.query(EvaluationTemplate).filter(
        EvaluationTemplate.template_id == template_id
    ).first()
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )

    # Add program names
    for tp in template.programs:
        program = db.query(Program).filter(Program.program_id == tp.program_id).first()
        if program:
            tp.program_name = program.name
            tp.program_code = program.code

    # Add PLO mapping details
    for criteria in template.criteria:
        for mapping in criteria.plo_mappings:
            program = db.query(Program).filter(Program.program_id == mapping.program_id).first()
            if program:
                mapping.program_name = program.name

    return template


@router.put("/{template_id}", response_model=EvaluationTemplateResponse)
def update_template(
    template_id: int,
    data: EvaluationTemplateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Admin", "Academic Affairs"]))
):
    """Update an evaluation template"""
    template = db.query(EvaluationTemplate).filter(
        EvaluationTemplate.template_id == template_id
    ).first()
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )

    # If setting as default, unset other defaults
    if data.is_default:
        db.query(EvaluationTemplate).filter(
            EvaluationTemplate.template_id != template_id,
            EvaluationTemplate.is_default == True
        ).update({"is_default": False})

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(template, field, value)

    db.commit()
    db.refresh(template)
    return template


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Admin"]))
):
    """Delete an evaluation template"""
    template = db.query(EvaluationTemplate).filter(
        EvaluationTemplate.template_id == template_id
    ).first()
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )

    if template.is_default:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete the default template"
        )

    db.delete(template)
    db.commit()


@router.post("/{template_id}/clone", response_model=EvaluationTemplateResponse, status_code=status.HTTP_201_CREATED)
def clone_template(
    template_id: int,
    new_name: str = Query(..., min_length=1, max_length=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Admin", "Academic Affairs"]))
):
    """Clone an existing template"""
    original = db.query(EvaluationTemplate).filter(
        EvaluationTemplate.template_id == template_id
    ).first()
    if not original:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )

    # Create new template
    new_template = EvaluationTemplate(
        name=new_name,
        description=original.description,
        is_default=False,
        created_by=current_user.user_id
    )
    db.add(new_template)
    db.flush()

    # Clone criteria
    for criteria in original.criteria:
        new_criteria = EvaluationCriteria(
            template_id=new_template.template_id,
            name=criteria.name,
            description=criteria.description,
            category=criteria.category,
            weight=criteria.weight,
            max_score=criteria.max_score,
            passing_score=criteria.passing_score,
            is_mandatory=criteria.is_mandatory,
            display_order=criteria.display_order
        )
        db.add(new_criteria)
        db.flush()

        # Clone PLO mappings
        for mapping in criteria.plo_mappings:
            new_mapping = CriteriaPLOMapping(
                criteria_id=new_criteria.criteria_id,
                program_id=mapping.program_id,
                plo_code=mapping.plo_code,
                plo_description=mapping.plo_description
            )
            db.add(new_mapping)

    # Clone program associations
    for tp in original.programs:
        new_tp = TemplateProgram(
            template_id=new_template.template_id,
            program_id=tp.program_id
        )
        db.add(new_tp)

    db.commit()
    db.refresh(new_template)
    return new_template


@router.get("/{template_id}/validate", response_model=TemplateValidationResponse)
def validate_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Validate template criteria weights and configuration"""
    template = db.query(EvaluationTemplate).filter(
        EvaluationTemplate.template_id == template_id
    ).first()
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )

    errors = []
    warnings = []
    total_weight = sum(c.weight for c in template.criteria)

    # Check total weight
    if abs(total_weight - 100.0) > 0.01:
        errors.append(f"Total weight is {total_weight}%, should be 100%")

    # Check for mandatory criteria
    mandatory_criteria = [c for c in template.criteria if c.is_mandatory]
    if not mandatory_criteria:
        warnings.append("No mandatory criteria defined")

    # Check passing scores
    for criteria in template.criteria:
        if criteria.passing_score and criteria.passing_score > criteria.max_score:
            errors.append(f"Criteria '{criteria.name}': passing score exceeds max score")

    # Check for criteria without weights
    zero_weight = [c for c in template.criteria if c.weight == 0]
    if zero_weight:
        warnings.append(f"{len(zero_weight)} criteria have zero weight")

    return TemplateValidationResponse(
        is_valid=len(errors) == 0,
        total_weight=total_weight,
        errors=errors,
        warnings=warnings
    )


# ==================== Evaluation Criteria ====================

@router.post("/{template_id}/criteria", response_model=EvaluationCriteriaResponse, status_code=status.HTTP_201_CREATED)
def create_criteria(
    template_id: int,
    data: EvaluationCriteriaCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Admin", "Academic Affairs"]))
):
    """Add criteria to a template"""
    template = db.query(EvaluationTemplate).filter(
        EvaluationTemplate.template_id == template_id
    ).first()
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )

    criteria = EvaluationCriteria(
        template_id=template_id,
        name=data.name,
        description=data.description,
        category=data.category,
        weight=data.weight,
        max_score=data.max_score,
        passing_score=data.passing_score,
        is_mandatory=data.is_mandatory,
        display_order=data.display_order
    )
    db.add(criteria)
    db.flush()

    # Create PLO mappings
    if data.plo_mappings:
        for plo_data in data.plo_mappings:
            mapping = CriteriaPLOMapping(
                criteria_id=criteria.criteria_id,
                program_id=plo_data.program_id,
                plo_code=plo_data.plo_code,
                plo_description=plo_data.plo_description
            )
            db.add(mapping)

    db.commit()
    db.refresh(criteria)
    return criteria


@router.put("/criteria/{criteria_id}", response_model=EvaluationCriteriaResponse)
def update_criteria(
    criteria_id: int,
    data: EvaluationCriteriaUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Admin", "Academic Affairs"]))
):
    """Update evaluation criteria"""
    criteria = db.query(EvaluationCriteria).filter(
        EvaluationCriteria.criteria_id == criteria_id
    ).first()
    if not criteria:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Criteria not found"
        )

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(criteria, field, value)

    db.commit()
    db.refresh(criteria)
    return criteria


@router.delete("/criteria/{criteria_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_criteria(
    criteria_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Admin", "Academic Affairs"]))
):
    """Delete evaluation criteria"""
    criteria = db.query(EvaluationCriteria).filter(
        EvaluationCriteria.criteria_id == criteria_id
    ).first()
    if not criteria:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Criteria not found"
        )

    db.delete(criteria)
    db.commit()


# ==================== PLO Mappings ====================

@router.post("/criteria/{criteria_id}/plo-mappings", response_model=CriteriaPLOMappingResponse, status_code=status.HTTP_201_CREATED)
def add_plo_mapping(
    criteria_id: int,
    data: CriteriaPLOMappingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Admin", "Academic Affairs"]))
):
    """Add PLO mapping to criteria"""
    criteria = db.query(EvaluationCriteria).filter(
        EvaluationCriteria.criteria_id == criteria_id
    ).first()
    if not criteria:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Criteria not found"
        )

    mapping = CriteriaPLOMapping(
        criteria_id=criteria_id,
        program_id=data.program_id,
        plo_code=data.plo_code,
        plo_description=data.plo_description
    )
    db.add(mapping)
    db.commit()
    db.refresh(mapping)

    # Add program name
    program = db.query(Program).filter(Program.program_id == data.program_id).first()
    if program:
        mapping.program_name = program.name

    return mapping


@router.delete("/plo-mappings/{mapping_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_plo_mapping(
    mapping_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Admin", "Academic Affairs"]))
):
    """Remove PLO mapping from criteria"""
    mapping = db.query(CriteriaPLOMapping).filter(
        CriteriaPLOMapping.mapping_id == mapping_id
    ).first()
    if not mapping:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mapping not found"
        )

    db.delete(mapping)
    db.commit()
