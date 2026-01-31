"""Database models for SMD System"""
from app.models.user import User, UserRole
from app.models.department import Department
from app.models.program import Program, DegreeType
from app.models.plo import ProgramLearningOutcome
from app.models.course import Course
from app.models.syllabus import Syllabus, SyllabusStatus
from app.models.syllabus_version import SyllabusVersion
from app.models.approval_history import ApprovalHistory, ApprovalAction

# FE02 - Academic Timelines
from app.models.academic_year import AcademicYear, Semester, SubmissionPeriod

# FE03 - Review Schedules
from app.models.review_schedule import ReviewSchedule, ReviewerAssignment

# FE04 - Evaluation Templates
from app.models.evaluation import (
    EvaluationTemplate, EvaluationCriteria, CriteriaPLOMapping,
    TemplateProgram, CriteriaCategory
)

# FE05 - Update Requests
from app.models.update_request import UpdateRequest, EvaluationResult, UpdateRequestStatus

# FE06 - Notifications
from app.models.notification import (
    Notification, NotificationRecipient, NotificationTemplate,
    AutoReminderConfig, NotificationType, NotificationPriority, NotificationStatus
)

# FE07 - Import
from app.models.import_log import ImportLog, ImportError, ImportStatus, ImportType

# Lecturer Module
from app.models.syllabus_clo import SyllabusCLO, BloomLevel, clo_plo_mapping
from app.models.syllabus_content import SyllabusContent, content_clo_mapping
from app.models.syllabus_assessment import SyllabusAssessment, AssessmentType, assessment_clo_mapping
from app.models.syllabus_reference import SyllabusReference, ReferenceType
from app.models.syllabus_comment import SyllabusComment, CommentType, CommentPriority
from app.models.message import Message, MessageAttachment
from app.models.peer_evaluation import PeerEvaluation, PeerEvaluationScore, PeerRecommendation

__all__ = [
    # Core models
    "User", "UserRole",
    "Department",
    "Program", "DegreeType",
    "ProgramLearningOutcome",
    "Course",
    "Syllabus", "SyllabusStatus",
    "SyllabusVersion",
    "ApprovalHistory", "ApprovalAction",
    # FE02
    "AcademicYear", "Semester", "SubmissionPeriod",
    # FE03
    "ReviewSchedule", "ReviewerAssignment",
    # FE04
    "EvaluationTemplate", "EvaluationCriteria", "CriteriaPLOMapping",
    "TemplateProgram", "CriteriaCategory",
    # FE05
    "UpdateRequest", "EvaluationResult", "UpdateRequestStatus",
    # FE06
    "Notification", "NotificationRecipient", "NotificationTemplate",
    "AutoReminderConfig", "NotificationType", "NotificationPriority", "NotificationStatus",
    # FE07
    "ImportLog", "ImportError", "ImportStatus", "ImportType",
    # Lecturer Module
    "SyllabusCLO", "BloomLevel", "clo_plo_mapping",
    "SyllabusContent", "content_clo_mapping",
    "SyllabusAssessment", "AssessmentType", "assessment_clo_mapping",
    "SyllabusReference", "ReferenceType",
    "SyllabusComment", "CommentType", "CommentPriority",
    "Message", "MessageAttachment",
    "PeerEvaluation", "PeerEvaluationScore", "PeerRecommendation",
]
