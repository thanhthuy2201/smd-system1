"""Pydantic schemas for request/response validation"""
from app.schemas.user import (
    UserCreate, UserUpdate, UserResponse, UserList, Token, TokenData, LoginRequest
)
from app.schemas.department import (
    DepartmentCreate, DepartmentUpdate, DepartmentResponse, DepartmentList
)
from app.schemas.program import (
    ProgramCreate, ProgramUpdate, ProgramResponse, ProgramList
)
from app.schemas.course import (
    CourseCreate, CourseUpdate, CourseResponse, CourseList
)
from app.schemas.syllabus import (
    SyllabusCreate, SyllabusUpdate, SyllabusResponse, SyllabusList, SyllabusSearch
)
from app.schemas.syllabus_version import (
    SyllabusVersionCreate, SyllabusVersionResponse, SyllabusVersionList, VersionCompare
)
from app.schemas.approval import (
    ApprovalCreate, ApprovalResponse, ApprovalHistoryList, ApproveRequest, RejectRequest
)

# FE02 - Academic Timelines
from app.schemas.academic_year import (
    AcademicYearCreate, AcademicYearUpdate, AcademicYearResponse, AcademicYearListResponse,
    SemesterCreate, SemesterUpdate, SemesterResponse,
    SubmissionPeriodCreate, SubmissionPeriodUpdate, SubmissionPeriodResponse
)

# FE03 - Review Schedules
from app.schemas.review_schedule import (
    ReviewScheduleCreate, ReviewScheduleUpdate, ReviewScheduleResponse, ReviewScheduleListResponse,
    ReviewerAssignmentCreate, ReviewerAssignmentResponse,
    ReviewProgressResponse, AvailableReviewerResponse
)

# FE04 - Evaluation Templates
from app.schemas.evaluation import (
    EvaluationTemplateCreate, EvaluationTemplateUpdate,
    EvaluationTemplateResponse, EvaluationTemplateListResponse,
    EvaluationCriteriaCreate, EvaluationCriteriaUpdate, EvaluationCriteriaResponse,
    CriteriaPLOMappingCreate, CriteriaPLOMappingResponse,
    TemplateValidationResponse
)

# FE05 - Update Requests
from app.schemas.update_request import (
    UpdateRequestCreate, UpdateRequestUpdate, UpdateRequestResponse, UpdateRequestListResponse,
    EvaluationSubmission, EvaluationResultResponse,
    DecisionRequest, DecisionResponse,
    VersionDiffResponse, SectionDiff
)

# FE06 - Notifications
from app.schemas.notification import (
    NotificationCreate, NotificationBroadcast, NotificationResponse, NotificationListResponse,
    NotificationRecipientResponse,
    NotificationTemplateCreate, NotificationTemplateUpdate, NotificationTemplateResponse,
    AutoReminderConfigCreate, AutoReminderConfigUpdate, AutoReminderConfigResponse,
    UserNotificationSummary, MarkAsReadRequest
)

# FE07 - Import Data
from app.schemas.import_data import (
    ImportRequest, ImportLogResponse, ImportLogListResponse,
    ImportValidationResult, ImportProgressResponse, ImportSummaryResponse,
    ImportTemplateResponse, ImportErrorBase, ImportErrorResponse,
    BulkDeleteRequest, BulkDeleteResponse
)

__all__ = [
    # User
    "UserCreate", "UserUpdate", "UserResponse", "UserList", "Token", "TokenData", "LoginRequest",
    # Department
    "DepartmentCreate", "DepartmentUpdate", "DepartmentResponse", "DepartmentList",
    # Program
    "ProgramCreate", "ProgramUpdate", "ProgramResponse", "ProgramList",
    # Course
    "CourseCreate", "CourseUpdate", "CourseResponse", "CourseList",
    # Syllabus
    "SyllabusCreate", "SyllabusUpdate", "SyllabusResponse", "SyllabusList", "SyllabusSearch",
    # Syllabus Version
    "SyllabusVersionCreate", "SyllabusVersionResponse", "SyllabusVersionList", "VersionCompare",
    # Approval
    "ApprovalCreate", "ApprovalResponse", "ApprovalHistoryList", "ApproveRequest", "RejectRequest",
    # FE02 - Academic Year
    "AcademicYearCreate", "AcademicYearUpdate", "AcademicYearResponse", "AcademicYearListResponse",
    "SemesterCreate", "SemesterUpdate", "SemesterResponse",
    "SubmissionPeriodCreate", "SubmissionPeriodUpdate", "SubmissionPeriodResponse",
    # FE03 - Review Schedule
    "ReviewScheduleCreate", "ReviewScheduleUpdate", "ReviewScheduleResponse", "ReviewScheduleListResponse",
    "ReviewerAssignmentCreate", "ReviewerAssignmentResponse",
    "ReviewProgressResponse", "AvailableReviewerResponse",
    # FE04 - Evaluation Template
    "EvaluationTemplateCreate", "EvaluationTemplateUpdate",
    "EvaluationTemplateResponse", "EvaluationTemplateListResponse",
    "EvaluationCriteriaCreate", "EvaluationCriteriaUpdate", "EvaluationCriteriaResponse",
    "CriteriaPLOMappingCreate", "CriteriaPLOMappingResponse",
    "TemplateValidationResponse",
    # FE05 - Update Request
    "UpdateRequestCreate", "UpdateRequestUpdate", "UpdateRequestResponse", "UpdateRequestListResponse",
    "EvaluationSubmission", "EvaluationResultResponse",
    "DecisionRequest", "DecisionResponse",
    "VersionDiffResponse", "SectionDiff",
    # FE06 - Notification
    "NotificationCreate", "NotificationBroadcast", "NotificationResponse", "NotificationListResponse",
    "NotificationRecipientResponse",
    "NotificationTemplateCreate", "NotificationTemplateUpdate", "NotificationTemplateResponse",
    "AutoReminderConfigCreate", "AutoReminderConfigUpdate", "AutoReminderConfigResponse",
    "UserNotificationSummary", "MarkAsReadRequest",
    # FE07 - Import
    "ImportRequest", "ImportLogResponse", "ImportLogListResponse",
    "ImportValidationResult", "ImportProgressResponse", "ImportSummaryResponse",
    "ImportTemplateResponse", "ImportErrorBase", "ImportErrorResponse",
    "BulkDeleteRequest", "BulkDeleteResponse",
]
