# Deadline Alerts Backend Integration Specification

## Overview

This document specifies the backend requirements for implementing automated deadline alerts in the Review Schedule Management system. The frontend has been fully implemented with alert configuration UI, and this specification details what the backend needs to implement to complete the feature.

**Related Requirements:** 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8

## Feature Summary

The automated deadline alerts system sends notifications to reviewers at configured thresholds before deadlines and when deadlines are overdue. Academic Managers configure alert settings when creating or editing review schedules, and the backend is responsible for:

1. Storing alert configuration
2. Scheduling alert jobs based on thresholds
3. Sending notifications via configured channels (Email, In-App)
4. Logging all sent alerts for audit purposes
5. Handling overdue alerts

## Frontend Implementation Status

✅ **Completed:**
- Alert configuration UI in review schedule form
- Alert configuration display in detail view
- Data models and TypeScript types
- Zod validation schemas
- API client functions (ready for backend integration)

## Data Model

### DeadlineAlertConfig

The alert configuration is stored as part of the ReviewSchedule entity:

```typescript
interface DeadlineAlertConfig {
  enabled: boolean;              // Master toggle for alerts
  thresholds: number[];          // Days before deadline [7, 3, 1]
  channels: ('EMAIL' | 'IN_APP')[]; // Notification channels
  sendOverdueAlerts: boolean;    // Send alerts after deadline passes
}
```

### Example Configuration

```json
{
  "enabled": true,
  "thresholds": [7, 3, 1],
  "channels": ["EMAIL", "IN_APP"],
  "sendOverdueAlerts": true
}
```

This configuration means:
- Alerts are enabled
- Send notifications 7 days, 3 days, and 1 day before each deadline
- Send via both email and in-app notifications
- Continue sending alerts after deadlines pass

## Backend Requirements

### 1. Database Schema

#### ReviewSchedule Table
Add `alert_config` column to store the configuration:

```sql
ALTER TABLE review_schedules 
ADD COLUMN alert_config JSONB NOT NULL DEFAULT '{
  "enabled": true,
  "thresholds": [7, 3, 1],
  "channels": ["EMAIL", "IN_APP"],
  "sendOverdueAlerts": true
}'::jsonb;
```

#### AlertLog Table
Create a table to track all sent alerts:

```sql
CREATE TABLE alert_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES review_schedules(id),
  reviewer_id UUID NOT NULL REFERENCES users(id),
  alert_type VARCHAR(20) NOT NULL, -- 'THRESHOLD' or 'OVERDUE'
  deadline_type VARCHAR(20) NOT NULL, -- 'L1', 'L2', or 'FINAL'
  days_before_deadline INTEGER, -- NULL for overdue alerts
  channels VARCHAR(20)[] NOT NULL, -- ['EMAIL', 'IN_APP']
  sent_at TIMESTAMP NOT NULL DEFAULT NOW(),
  email_status VARCHAR(20), -- 'SENT', 'FAILED', 'BOUNCED'
  in_app_status VARCHAR(20), -- 'SENT', 'READ', 'DISMISSED'
  error_message TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_alert_logs_schedule ON alert_logs(schedule_id);
CREATE INDEX idx_alert_logs_reviewer ON alert_logs(reviewer_id);
CREATE INDEX idx_alert_logs_sent_at ON alert_logs(sent_at);
```

### 2. Alert Scheduling Logic

#### When to Schedule Alerts

Alerts should be scheduled when:
1. A new review schedule is created with `alertConfig.enabled = true`
2. An existing review schedule is updated with changed deadlines or alert configuration
3. A reviewer is assigned to a department in a review schedule

#### Alert Calculation

For each review schedule with alerts enabled:

```typescript
// Pseudo-code for alert scheduling
function scheduleAlertsForReviewSchedule(schedule: ReviewSchedule) {
  if (!schedule.alertConfig.enabled) {
    return; // Skip if alerts disabled
  }

  const deadlines = [
    { type: 'L1', date: schedule.l1Deadline },
    { type: 'L2', date: schedule.l2Deadline },
    { type: 'FINAL', date: schedule.finalApprovalDate }
  ];

  for (const deadline of deadlines) {
    for (const threshold of schedule.alertConfig.thresholds) {
      const alertDate = new Date(deadline.date);
      alertDate.setDate(alertDate.getDate() - threshold);
      
      // Schedule alert job for this date
      scheduleJob({
        scheduleId: schedule.id,
        deadlineType: deadline.type,
        alertDate: alertDate,
        daysBeforeDeadline: threshold,
        channels: schedule.alertConfig.channels
      });
    }
    
    // Schedule overdue check if enabled
    if (schedule.alertConfig.sendOverdueAlerts) {
      scheduleOverdueCheck({
        scheduleId: schedule.id,
        deadlineType: deadline.type,
        deadlineDate: deadline.date,
        channels: schedule.alertConfig.channels
      });
    }
  }
}
```

#### Recommended Implementation: Cron Job

Use a cron job that runs daily (e.g., at 8:00 AM) to check for alerts that need to be sent:

```typescript
// Daily cron job at 8:00 AM
async function processDailyAlerts() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Find all active schedules with alerts enabled
  const schedules = await db.reviewSchedules.findMany({
    where: {
      isActive: true,
      'alertConfig.enabled': true
    },
    include: {
      assignments: {
        include: {
          primaryReviewer: true,
          backupReviewer: true
        }
      }
    }
  });
  
  for (const schedule of schedules) {
    await processScheduleAlerts(schedule, today);
  }
}

async function processScheduleAlerts(schedule: ReviewSchedule, today: Date) {
  const deadlines = [
    { type: 'L1', date: schedule.l1Deadline },
    { type: 'L2', date: schedule.l2Deadline },
    { type: 'FINAL', date: schedule.finalApprovalDate }
  ];
  
  for (const deadline of deadlines) {
    const daysUntilDeadline = Math.floor(
      (deadline.date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    // Check if today matches any threshold
    if (schedule.alertConfig.thresholds.includes(daysUntilDeadline)) {
      await sendThresholdAlerts(schedule, deadline.type, daysUntilDeadline);
    }
    
    // Check for overdue
    if (daysUntilDeadline < 0 && schedule.alertConfig.sendOverdueAlerts) {
      await sendOverdueAlerts(schedule, deadline.type, Math.abs(daysUntilDeadline));
    }
  }
}
```

### 3. Notification Sending

#### Email Notifications

**Template Variables:**
- `reviewerName`: Name of the reviewer
- `scheduleName`: Name of the review schedule
- `semesterName`: Semester name
- `deadlineType`: L1, L2, or FINAL
- `deadlineDate`: Formatted deadline date
- `daysRemaining`: Days until deadline (or days overdue)
- `pendingCount`: Number of pending reviews
- `dashboardUrl`: Link to the review dashboard

**Email Templates:**

**Threshold Alert Email (Vietnamese):**
```
Subject: [Nhắc nhở] Hạn phê duyệt {deadlineType} sắp đến - {scheduleName}

Xin chào {reviewerName},

Đây là thông báo nhắc nhở về hạn phê duyệt đề cương sắp đến:

Chu kỳ: {scheduleName}
Học kỳ: {semesterName}
Loại hạn: {deadlineType}
Hạn chót: {deadlineDate}
Thời gian còn lại: {daysRemaining} ngày

Bạn hiện có {pendingCount} đề cương đang chờ phê duyệt.

Vui lòng truy cập hệ thống để hoàn thành phê duyệt trước hạn chót:
{dashboardUrl}

Trân trọng,
Hệ thống Quản lý Đề cương
```

**Overdue Alert Email (Vietnamese):**
```
Subject: [Khẩn cấp] Đã quá hạn phê duyệt {deadlineType} - {scheduleName}

Xin chào {reviewerName},

Thông báo khẩn: Hạn phê duyệt đề cương đã quá hạn!

Chu kỳ: {scheduleName}
Học kỳ: {semesterName}
Loại hạn: {deadlineType}
Hạn chót: {deadlineDate}
Đã quá hạn: {daysOverdue} ngày

Bạn vẫn còn {pendingCount} đề cương chưa hoàn thành phê duyệt.

Vui lòng ưu tiên xử lý ngay:
{dashboardUrl}

Trân trọng,
Hệ thống Quản lý Đề cương
```

#### In-App Notifications

Store in-app notifications in a `notifications` table:

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  type VARCHAR(50) NOT NULL, -- 'DEADLINE_REMINDER', 'DEADLINE_OVERDUE'
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  link VARCHAR(500),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  read_at TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read);
```

**Notification Content:**

Threshold Alert:
```json
{
  "type": "DEADLINE_REMINDER",
  "title": "Nhắc nhở hạn phê duyệt",
  "message": "Hạn {deadlineType} cho {scheduleName} sẽ đến trong {daysRemaining} ngày. Bạn có {pendingCount} đề cương cần phê duyệt.",
  "link": "/review-schedules/detail/{scheduleId}"
}
```

Overdue Alert:
```json
{
  "type": "DEADLINE_OVERDUE",
  "title": "Quá hạn phê duyệt",
  "message": "Hạn {deadlineType} cho {scheduleName} đã quá {daysOverdue} ngày. Bạn vẫn còn {pendingCount} đề cương chưa hoàn thành.",
  "link": "/review-schedules/detail/{scheduleId}"
}
```

### 4. Alert Recipients

Alerts should be sent to:

1. **Primary Reviewers**: All primary reviewers assigned to departments in the schedule who have pending reviews
2. **Backup Reviewers**: If primary reviewer has not completed reviews and deadline is within 3 days
3. **Academic Manager**: For overdue alerts, also notify the Academic Manager who created the schedule

**Query to get recipients:**

```sql
-- Get reviewers with pending reviews for a schedule
SELECT DISTINCT
  u.id,
  u.name,
  u.email,
  ra.primary_reviewer_id,
  COUNT(s.id) as pending_count
FROM reviewer_assignments ra
JOIN users u ON u.id = ra.primary_reviewer_id
LEFT JOIN syllabi s ON s.department_id = ra.department_id 
  AND s.schedule_id = ra.schedule_id
  AND s.status IN ('PENDING_L1', 'PENDING_L2')
WHERE ra.schedule_id = :scheduleId
  AND s.id IS NOT NULL
GROUP BY u.id, u.name, u.email, ra.primary_reviewer_id
HAVING COUNT(s.id) > 0;
```

### 5. Alert Deduplication

To prevent sending duplicate alerts:

1. Check `alert_logs` table before sending
2. Don't send if an alert of the same type was sent within the last 24 hours
3. For overdue alerts, send daily until resolved

```typescript
async function shouldSendAlert(
  scheduleId: string,
  reviewerId: string,
  alertType: string,
  deadlineType: string,
  daysBeforeDeadline: number | null
): Promise<boolean> {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  const existingAlert = await db.alertLogs.findFirst({
    where: {
      schedule_id: scheduleId,
      reviewer_id: reviewerId,
      alert_type: alertType,
      deadline_type: deadlineType,
      days_before_deadline: daysBeforeDeadline,
      sent_at: { gte: yesterday }
    }
  });
  
  return !existingAlert;
}
```

### 6. API Endpoints

The frontend expects these endpoints to be implemented:

#### POST /api/review-schedules
Create a new review schedule with alert configuration.

**Request Body:**
```json
{
  "name": "Phê duyệt HK1 2024-2025",
  "semesterId": "semester-1-2024",
  "reviewStartDate": "2024-09-01T00:00:00Z",
  "l1Deadline": "2024-09-15T00:00:00Z",
  "l2Deadline": "2024-09-22T00:00:00Z",
  "finalApprovalDate": "2024-09-30T00:00:00Z",
  "alertConfig": {
    "enabled": true,
    "thresholds": [7, 3, 1],
    "channels": ["EMAIL", "IN_APP"],
    "sendOverdueAlerts": true
  }
}
```

**Response:** 201 Created with full schedule details

**Backend Actions:**
1. Validate and save the review schedule
2. If `alertConfig.enabled = true`, schedule alert jobs
3. Return the created schedule

#### PATCH /api/review-schedules/:id
Update an existing review schedule.

**Request Body:** Same as POST, but all fields optional

**Backend Actions:**
1. Validate and update the review schedule
2. If deadlines or alert config changed, reschedule alert jobs
3. If deadlines extended, send notification to affected reviewers (Requirement 6.6)
4. Return the updated schedule

#### GET /api/review-schedules/:id
Get review schedule details including alert configuration.

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "name": "Phê duyệt HK1 2024-2025",
    "alertConfig": {
      "enabled": true,
      "thresholds": [7, 3, 1],
      "channels": ["EMAIL", "IN_APP"],
      "sendOverdueAlerts": true
    },
    // ... other fields
  },
  "assignments": [...],
  "progress": {...},
  "auditTrail": [...]
}
```

#### POST /api/review-schedules/:id/reminders
Manually send reminder notifications (Requirement 7.4).

**Request Body:**
```json
{
  "reviewerIds": ["uuid1", "uuid2"] // Optional, if not provided, send to all
}
```

**Response:** 200 OK

**Backend Actions:**
1. Validate schedule exists and is active
2. Get reviewers (specific IDs or all assigned reviewers)
3. Send notifications via configured channels
4. Log all sent alerts
5. Return success

#### GET /api/review-schedules/:id/alert-logs
Get alert history for a schedule (for audit trail).

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "scheduleId": "uuid",
      "reviewerId": "uuid",
      "reviewerName": "Nguyễn Văn A",
      "alertType": "THRESHOLD",
      "deadlineType": "L1",
      "daysBeforeDeadline": 7,
      "channels": ["EMAIL", "IN_APP"],
      "sentAt": "2024-09-08T08:00:00Z",
      "emailStatus": "SENT",
      "inAppStatus": "READ"
    }
  ]
}
```

### 7. Error Handling

Handle these error scenarios:

1. **Email Delivery Failure**
   - Log error in `alert_logs.error_message`
   - Set `email_status = 'FAILED'`
   - Retry up to 3 times with exponential backoff
   - If all retries fail, notify system administrator

2. **Invalid Email Address**
   - Log error
   - Set `email_status = 'BOUNCED'`
   - Notify Academic Manager to update reviewer contact info

3. **Schedule Deleted/Deactivated**
   - Cancel all scheduled alert jobs for that schedule
   - Don't send any more alerts

4. **Reviewer Unassigned**
   - Stop sending alerts to that reviewer
   - Don't cancel alerts for other reviewers

### 8. Configuration

Add these environment variables:

```env
# Alert System Configuration
ALERT_ENABLED=true
ALERT_CRON_SCHEDULE="0 8 * * *"  # Daily at 8:00 AM
ALERT_FROM_EMAIL="noreply@university.edu.vn"
ALERT_FROM_NAME="Hệ thống Quản lý Đề cương"
ALERT_RETRY_ATTEMPTS=3
ALERT_RETRY_DELAY_MS=5000

# Email Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@university.edu.vn
SMTP_PASSWORD=your-password
SMTP_SECURE=true
```

### 9. Testing Requirements

#### Unit Tests

1. Alert scheduling logic
   - Correctly calculates alert dates from thresholds
   - Handles different threshold combinations
   - Respects enabled/disabled flag

2. Alert deduplication
   - Doesn't send duplicate alerts within 24 hours
   - Allows daily overdue alerts

3. Recipient calculation
   - Includes all reviewers with pending reviews
   - Excludes reviewers with no pending reviews
   - Includes backup reviewers when appropriate

#### Integration Tests

1. End-to-end alert flow
   - Create schedule with alerts enabled
   - Verify alert jobs scheduled
   - Simulate cron job execution
   - Verify notifications sent
   - Verify logs created

2. Alert configuration changes
   - Update thresholds
   - Verify jobs rescheduled
   - Disable alerts
   - Verify jobs cancelled

3. Manual reminder sending
   - Send to all reviewers
   - Send to specific reviewers
   - Verify notifications delivered

#### Manual Testing Checklist

- [ ] Create review schedule with alerts enabled
- [ ] Verify alert configuration saved correctly
- [ ] Assign reviewers to departments
- [ ] Simulate date changes to trigger threshold alerts
- [ ] Verify email notifications received
- [ ] Verify in-app notifications appear
- [ ] Test overdue alerts
- [ ] Test manual reminder sending
- [ ] Verify alert logs created
- [ ] Test alert deduplication
- [ ] Update alert configuration
- [ ] Verify jobs rescheduled
- [ ] Disable alerts
- [ ] Verify no more alerts sent
- [ ] Test error handling (invalid email, delivery failure)

### 10. Performance Considerations

1. **Batch Processing**: Process alerts in batches to avoid overwhelming email service
2. **Rate Limiting**: Respect email service rate limits (e.g., 100 emails per minute)
3. **Async Processing**: Send notifications asynchronously using a job queue (e.g., Bull, BullMQ)
4. **Database Indexing**: Ensure proper indexes on `alert_logs` for efficient querying
5. **Caching**: Cache reviewer assignments to reduce database queries

### 11. Monitoring and Observability

Implement logging and metrics for:

1. **Alert Metrics**
   - Total alerts sent per day
   - Alerts by type (threshold vs overdue)
   - Alerts by channel (email vs in-app)
   - Failed alerts count
   - Average delivery time

2. **Error Tracking**
   - Email delivery failures
   - Invalid email addresses
   - System errors during alert processing

3. **Audit Trail**
   - All alerts logged in `alert_logs` table
   - Include timestamps, recipients, channels, and status
   - Queryable for reporting and debugging

### 12. Security Considerations

1. **Email Security**
   - Use TLS/SSL for SMTP connections
   - Validate email addresses before sending
   - Implement SPF, DKIM, and DMARC records

2. **Data Privacy**
   - Don't include sensitive information in email subject lines
   - Use secure links with authentication required
   - Respect user notification preferences

3. **Rate Limiting**
   - Prevent abuse of manual reminder endpoint
   - Limit to 1 manual reminder per schedule per hour

## Implementation Timeline

**Estimated Effort:** 3-5 days

**Phase 1: Database and Core Logic (1-2 days)**
- Set up database schema
- Implement alert scheduling logic
- Implement alert calculation and deduplication

**Phase 2: Notification Delivery (1-2 days)**
- Set up email service integration
- Implement email templates
- Implement in-app notification system
- Implement notification sending logic

**Phase 3: API Endpoints (1 day)**
- Implement/update API endpoints
- Add alert configuration to create/update endpoints
- Implement manual reminder endpoint
- Implement alert logs endpoint

**Phase 4: Testing and Monitoring (1 day)**
- Write unit and integration tests
- Set up monitoring and logging
- Manual testing
- Documentation

## Support and Questions

For questions or clarifications about this specification, please contact:

- **Frontend Team Lead**: [Contact Info]
- **Product Manager**: [Contact Info]
- **Technical Architect**: [Contact Info]

## Appendix: Frontend Code References

The following frontend files are ready for backend integration:

1. **Data Schema**: `src/features/review-schedules/data/schema.ts`
   - Contains TypeScript types and Zod validation schemas
   - `DeadlineAlertConfig` interface
   - `alertConfigSchema` validation

2. **API Client**: `src/features/review-schedules/data/api.ts`
   - Contains API client functions ready to call backend endpoints
   - `create()`, `update()`, `sendReminders()` functions

3. **Form Component**: `src/features/review-schedules/components/review-schedule-form.tsx`
   - Alert configuration UI
   - Validates alert config before submission

4. **Detail View**: `src/features/review-schedules/detail.tsx`
   - Displays alert configuration
   - Manual reminder button

## Change Log

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2024-01-XX | 1.0 | Initial specification | Frontend Team |

