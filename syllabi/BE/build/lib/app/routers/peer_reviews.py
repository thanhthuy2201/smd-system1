"""Router for Peer Review/Evaluation (FE06)"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import (
    User, Syllabus, SyllabusStatus, Course,
    PeerEvaluation, PeerEvaluationScore, PeerRecommendation,
    EvaluationTemplate, EvaluationCriteria
)
from app.schemas.lecturer import (
    PeerEvaluationCreate, PeerEvaluationUpdate,
    PeerEvaluationResponse, PeerEvaluationScoreResponse
)

router = APIRouter(prefix="/peer-reviews", tags=["Peer Reviews"])


@router.get("")
def get_assigned_reviews(
    status_filter: Optional[str] = Query(None, alias="status", description="draft or submitted"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get syllabi assigned for peer review"""
    # Get syllabi pending review (for now, get all pending syllabi not created by current user)
    query = db.query(Syllabus).filter(
        Syllabus.status == SyllabusStatus.PENDING_REVIEW,
        Syllabus.created_by != current_user.user_id
    )

    # Filter by department if lecturer
    if current_user.department_id:
        query = query.join(Course).filter(
            Course.department_id == current_user.department_id
        )

    syllabi = query.all()

    result = []
    for s in syllabi:
        course = db.query(Course).filter(Course.course_id == s.course_id).first()
        creator = db.query(User).filter(User.user_id == s.created_by).first()

        # Check if user has already started evaluation
        existing_eval = db.query(PeerEvaluation).filter(
            PeerEvaluation.syllabus_id == s.syllabus_id,
            PeerEvaluation.evaluator_id == current_user.user_id
        ).first()

        if status_filter == "draft" and (not existing_eval or not existing_eval.is_draft):
            continue
        if status_filter == "submitted" and (not existing_eval or existing_eval.is_draft):
            continue

        result.append({
            "syllabus_id": s.syllabus_id,
            "course_code": course.code if course else None,
            "course_name": course.name if course else None,
            "creator_name": creator.full_name if creator else None,
            "academic_year": s.academic_year,
            "semester": s.semester,
            "submitted_at": s.submitted_at.isoformat() if s.submitted_at else None,
            "evaluation_status": "draft" if existing_eval and existing_eval.is_draft else ("submitted" if existing_eval else "not_started"),
            "evaluation_id": existing_eval.evaluation_id if existing_eval else None
        })

    return result


@router.get("/{syllabus_id}/view")
def get_syllabus_for_review(
    syllabus_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get syllabus in review format (read-only view)"""
    syllabus = db.query(Syllabus).filter(
        Syllabus.syllabus_id == syllabus_id,
        Syllabus.status == SyllabusStatus.PENDING_REVIEW
    ).first()

    if not syllabus:
        raise HTTPException(status_code=404, detail="Syllabus not found or not available for review")

    # Import here to avoid circular dependency
    from app.routers.lecturer import get_syllabus_preview
    return get_syllabus_preview(syllabus_id, db, current_user)


@router.get("/templates/{template_id}")
def get_evaluation_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get evaluation template with criteria"""
    template = db.query(EvaluationTemplate).filter(
        EvaluationTemplate.template_id == template_id,
        EvaluationTemplate.is_active == True
    ).first()

    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    criteria = db.query(EvaluationCriteria).filter(
        EvaluationCriteria.template_id == template_id
    ).order_by(EvaluationCriteria.display_order).all()

    return {
        "template_id": template.template_id,
        "name": template.name,
        "description": template.description,
        "criteria": [
            {
                "criteria_id": c.criteria_id,
                "name": c.name,
                "description": c.description,
                "category": c.category.value,
                "weight": c.weight,
                "max_score": c.max_score,
                "is_mandatory": c.is_mandatory
            }
            for c in criteria
        ]
    }


@router.post("/{syllabus_id}", response_model=PeerEvaluationResponse, status_code=status.HTTP_201_CREATED)
def create_peer_evaluation(
    syllabus_id: int,
    data: PeerEvaluationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Submit peer evaluation"""
    syllabus = db.query(Syllabus).filter(
        Syllabus.syllabus_id == syllabus_id,
        Syllabus.status == SyllabusStatus.PENDING_REVIEW
    ).first()

    if not syllabus:
        raise HTTPException(status_code=404, detail="Syllabus not found or not available for review")

    if syllabus.created_by == current_user.user_id:
        raise HTTPException(status_code=400, detail="Cannot evaluate your own syllabus")

    # Check for existing evaluation
    existing = db.query(PeerEvaluation).filter(
        PeerEvaluation.syllabus_id == syllabus_id,
        PeerEvaluation.evaluator_id == current_user.user_id
    ).first()

    if existing and not existing.is_draft:
        raise HTTPException(status_code=400, detail="Evaluation already submitted")

    if existing:
        # Update existing draft
        evaluation = existing
        # Clear old scores
        db.query(PeerEvaluationScore).filter(
            PeerEvaluationScore.evaluation_id == evaluation.evaluation_id
        ).delete()
    else:
        evaluation = PeerEvaluation(
            syllabus_id=syllabus_id,
            evaluator_id=current_user.user_id,
            template_id=data.template_id
        )
        db.add(evaluation)
        db.flush()

    # Add scores
    total_score = 0
    total_weight = 0
    for score_data in data.scores:
        criteria = db.query(EvaluationCriteria).filter(
            EvaluationCriteria.criteria_id == score_data.criteria_id
        ).first()

        if criteria:
            score = PeerEvaluationScore(
                evaluation_id=evaluation.evaluation_id,
                criteria_id=score_data.criteria_id,
                score=score_data.score,
                comment=score_data.comment
            )
            db.add(score)
            total_score += score_data.score * criteria.weight
            total_weight += criteria.weight

    # Calculate overall score
    if total_weight > 0:
        evaluation.overall_score = total_score / total_weight

    evaluation.summary_comments = data.summary_comments
    evaluation.recommendation = data.recommendation
    evaluation.is_draft = data.recommendation is None  # If no recommendation, keep as draft

    if not evaluation.is_draft:
        evaluation.submitted_at = datetime.utcnow()

    db.commit()
    db.refresh(evaluation)

    # Build response
    scores = db.query(PeerEvaluationScore).filter(
        PeerEvaluationScore.evaluation_id == evaluation.evaluation_id
    ).all()

    score_responses = []
    for s in scores:
        criteria = db.query(EvaluationCriteria).filter(
            EvaluationCriteria.criteria_id == s.criteria_id
        ).first()
        score_responses.append(PeerEvaluationScoreResponse(
            score_id=s.score_id,
            criteria_id=s.criteria_id,
            criteria_name=criteria.name if criteria else None,
            score=s.score,
            comment=s.comment
        ))

    return PeerEvaluationResponse(
        evaluation_id=evaluation.evaluation_id,
        syllabus_id=evaluation.syllabus_id,
        evaluator_id=evaluation.evaluator_id,
        evaluator_name=current_user.full_name,
        template_id=evaluation.template_id,
        overall_score=evaluation.overall_score,
        recommendation=evaluation.recommendation,
        summary_comments=evaluation.summary_comments,
        is_draft=evaluation.is_draft,
        submitted_at=evaluation.submitted_at,
        created_at=evaluation.created_at,
        scores=score_responses
    )


@router.put("/{evaluation_id}", response_model=PeerEvaluationResponse)
def update_peer_evaluation(
    evaluation_id: int,
    data: PeerEvaluationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update draft evaluation"""
    evaluation = db.query(PeerEvaluation).filter(
        PeerEvaluation.evaluation_id == evaluation_id,
        PeerEvaluation.evaluator_id == current_user.user_id
    ).first()

    if not evaluation:
        raise HTTPException(status_code=404, detail="Evaluation not found")

    if not evaluation.is_draft:
        raise HTTPException(status_code=400, detail="Cannot update submitted evaluation")

    # Update scores if provided
    if data.scores:
        db.query(PeerEvaluationScore).filter(
            PeerEvaluationScore.evaluation_id == evaluation_id
        ).delete()

        total_score = 0
        total_weight = 0
        for score_data in data.scores:
            criteria = db.query(EvaluationCriteria).filter(
                EvaluationCriteria.criteria_id == score_data.criteria_id
            ).first()

            if criteria:
                score = PeerEvaluationScore(
                    evaluation_id=evaluation_id,
                    criteria_id=score_data.criteria_id,
                    score=score_data.score,
                    comment=score_data.comment
                )
                db.add(score)
                total_score += score_data.score * criteria.weight
                total_weight += criteria.weight

        if total_weight > 0:
            evaluation.overall_score = total_score / total_weight

    if data.summary_comments is not None:
        evaluation.summary_comments = data.summary_comments

    if data.recommendation is not None:
        evaluation.recommendation = data.recommendation
        evaluation.is_draft = False
        evaluation.submitted_at = datetime.utcnow()

    db.commit()
    db.refresh(evaluation)

    # Build response
    scores = db.query(PeerEvaluationScore).filter(
        PeerEvaluationScore.evaluation_id == evaluation.evaluation_id
    ).all()

    score_responses = []
    for s in scores:
        criteria = db.query(EvaluationCriteria).filter(
            EvaluationCriteria.criteria_id == s.criteria_id
        ).first()
        score_responses.append(PeerEvaluationScoreResponse(
            score_id=s.score_id,
            criteria_id=s.criteria_id,
            criteria_name=criteria.name if criteria else None,
            score=s.score,
            comment=s.comment
        ))

    return PeerEvaluationResponse(
        evaluation_id=evaluation.evaluation_id,
        syllabus_id=evaluation.syllabus_id,
        evaluator_id=evaluation.evaluator_id,
        evaluator_name=current_user.full_name,
        template_id=evaluation.template_id,
        overall_score=evaluation.overall_score,
        recommendation=evaluation.recommendation,
        summary_comments=evaluation.summary_comments,
        is_draft=evaluation.is_draft,
        submitted_at=evaluation.submitted_at,
        created_at=evaluation.created_at,
        scores=score_responses
    )


@router.get("/{syllabus_id}/evaluations")
def get_syllabus_evaluations(
    syllabus_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all evaluations for a syllabus (for syllabus owner)"""
    syllabus = db.query(Syllabus).filter(
        Syllabus.syllabus_id == syllabus_id,
        Syllabus.created_by == current_user.user_id
    ).first()

    if not syllabus:
        raise HTTPException(status_code=404, detail="Syllabus not found or not authorized")

    evaluations = db.query(PeerEvaluation).filter(
        PeerEvaluation.syllabus_id == syllabus_id,
        PeerEvaluation.is_draft == False
    ).all()

    result = []
    for e in evaluations:
        evaluator = db.query(User).filter(User.user_id == e.evaluator_id).first()
        result.append({
            "evaluation_id": e.evaluation_id,
            "evaluator_name": evaluator.full_name if evaluator else None,
            "overall_score": e.overall_score,
            "recommendation": e.recommendation.value if e.recommendation else None,
            "summary_comments": e.summary_comments,
            "submitted_at": e.submitted_at.isoformat() if e.submitted_at else None
        })

    return result
