# Deadline Alerts Feature

## Overview

The Deadline Alerts feature automatically sends notifications to reviewers at configured intervals before deadlines and when deadlines are overdue. This ensures reviewers are reminded of their pending work and helps Academic Managers track review progress.

**Status:** ✅ Frontend Complete | ⏳ Backend Pending

**Related Requirements:** 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8

## Features

### 1. Alert Configuration (Frontend ✅)

Academic Managers can configure alerts when creating or editing review schedules:

- **Enable/Disable Toggle**: Master switch for alerts
- **Threshold Selection**: Choose when to send reminders (7, 5, 3, 1 days before deadline)
- **Channel Selection**: Email, In-App notifications, or both
- **Overdue Alerts**: Continue sending alerts after deadlines pass

### 2. Automatic Alert Scheduling (Backend ⏳)

The backend automatically schedules alerts based on configuration:

- Alerts sent at configured thresholds before each deadline (L1, L2, Final)
- Daily overdue alerts for pending reviews past deadline
- Smart recipient filtering (only reviewers with pending work)
- Deduplication to prevent spam

### 3. Manual Reminders (Frontend ✅ | Backend ⏳)

Academic Managers can manually send reminders:

- Send to all assigned reviewers
- Send to specific reviewers
- Immediate delivery via configured channels

### 4. Alert Audit Trail (Frontend ✅ | Backend ⏳)

Complete logging of all sent alerts:

- Timestamp and recipient
- Alert type and deadline
- Delivery status (sent, failed, read)
- Error messages for troubleshooting

## User Interface

### Alert Configuration in Form

Located in the review schedule create/edit form:

```
┌─────────────────────────────────────────┐
│ Cấu hình nhắc nhở hạn chót              │
├─────────────────────────────────────────┤
│ ☑ Bật nhắc nhở tự động                  │
│                                         │
│ Ngưỡng nhắc nhở:                        │
│ ☐ 1 ngày trước hạn chót                 │
│ ☑ 3 ngày trước hạn chót                 │
│ ☐ 5 ngày trước hạn chót                 │
│ ☑ 7 ngày trước hạn chót                 │
│                                         │
│ Kênh thông báo:                         │
│ ☑ Email                                 │
│ ☑ Thông báo trong ứng dụng              │
│                                         │
│ ☑ Gửi thông báo quá hạn                 │
└─────────────────────────────────────────┘
```

### Alert Configuration Display

In the schedule detail view:

```
┌─────────────────────────────────────────┐
│ Cấu hình nhắc nhở                       │
├─────────────────────────────────────────┤
│ Trạng thái: Đang bật ✓                  │
│ Ngưỡng: 7, 3, 1 ngày trước hạn          │
│ Kênh: Email, In-App                     │
│ Thông báo quá hạn: Có                   │
└─────────────────────────────────────────┘
```

## Implementation Status

### Frontend (Complete ✅)

- [x] Alert configuration UI in form component
- [x] Alert configuration display in detail view
- [x] Data models and TypeScript types
- [x] Zod validation schemas
- [x] API client functions
- [x] Manual reminder button and dialog
- [x] Integration with create/edit flows

**Files:**

- `src/features/review-schedules/data/schema.ts` - Types and validation
- `src/features/review-schedules/data/api.ts` - API client
- `src/features/review-schedules/components/review-schedule-form.tsx` - Configuration UI
- `src/features/review-schedules/detail.tsx` - Display and manual reminders

### Backend (Pending ⏳)

- [ ] Database schema for alert configuration and logs
- [ ] Alert scheduling logic
- [ ] Cron job for daily alert processing
- [ ] Email notification service
- [ ] In-app notification system
- [ ] Alert deduplication
- [ ] API endpoints for alert management
- [ ] Error handling and retry logic

**Required:**

- See `docs/backend-integration/deadline-alerts-specification.md` for complete backend requirements

## How It Works

### Alert Flow

```
1. Academic Manager creates/updates schedule
   ↓
2. Frontend sends alert configuration to backend
   ↓
3. Backend saves configuration and schedules alert jobs
   ↓
4. Daily cron job checks for alerts to send
   ↓
5. For each schedule with alerts enabled:
   - Calculate days until each deadline
   - Check if today matches any threshold
   - Get reviewers with pending reviews
   - Send notifications via configured channels
   - Log all sent alerts
   ↓
6. Reviewers receive notifications
   ↓
7. Reviewers complete reviews
   ↓
8. Alerts stop when no pending reviews remain
```

### Alert Types

**Threshold Alerts:**

- Sent X days before deadline (based on configuration)
- Example: 7 days before L1 deadline
- Reminder tone: "Hạn chót sắp đến"

**Overdue Alerts:**

- Sent daily after deadline passes
- Only if reviews still pending
- Urgent tone: "Đã quá hạn"

### Notification Channels

**Email:**

- Professional email template
- Vietnamese language
- Includes schedule details, deadline info, pending count
- Direct link to review dashboard
- Sent via SMTP service

**In-App:**

- Notification center badge
- Click to navigate to schedule
- Mark as read/unread
- Persistent until dismissed

## Configuration Examples

### Example 1: Standard Configuration

```typescript
{
  enabled: true,
  thresholds: [7, 3, 1],
  channels: ['EMAIL', 'IN_APP'],
  sendOverdueAlerts: true
}
```

**Result:**

- Alerts sent 7, 3, and 1 days before each deadline
- Both email and in-app notifications
- Daily overdue alerts after deadline

### Example 2: Email-Only, Early Warnings

```typescript
{
  enabled: true,
  thresholds: [7, 5],
  channels: ['EMAIL'],
  sendOverdueAlerts: false
}
```

**Result:**

- Alerts sent 7 and 5 days before deadline
- Email only (no in-app)
- No overdue alerts

### Example 3: Disabled

```typescript
{
  enabled: false,
  thresholds: [7, 3, 1],
  channels: ['EMAIL', 'IN_APP'],
  sendOverdueAlerts: true
}
```

**Result:**

- No alerts sent (disabled)
- Configuration preserved for future use

## API Integration

### Create Schedule with Alerts

```typescript
POST /api/review-schedules

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

### Update Alert Configuration

```typescript
PATCH /api/review-schedules/:id

{
  "alertConfig": {
    "enabled": true,
    "thresholds": [5, 2],
    "channels": ["EMAIL"],
    "sendOverdueAlerts": false
  }
}
```

### Send Manual Reminder

```typescript
POST /api/review-schedules/:id/reminders

{
  "reviewerIds": ["uuid1", "uuid2"] // Optional
}
```

## Testing

### Frontend Testing (Complete ✅)

The frontend implementation has been tested for:

- Alert configuration UI rendering
- Form validation
- Data submission
- Display in detail view
- Manual reminder button

### Backend Testing (Pending ⏳)

Once backend is implemented, test:

- Alert scheduling
- Notification delivery (email and in-app)
- Threshold alerts at correct times
- Overdue alerts
- Deduplication
- Error handling
- Performance with many schedules

**See:** `docs/testing/deadline-alerts-testing-guide.md` for complete test cases

## Documentation

### For Backend Developers

📄 **[Backend Integration Specification](../../../docs/backend-integration/deadline-alerts-specification.md)**

Complete specification including:

- Database schema
- Alert scheduling logic
- Notification templates
- API endpoints
- Error handling
- Performance considerations
- Security requirements

### For QA/Testers

📄 **[Testing Guide](../../../docs/testing/deadline-alerts-testing-guide.md)**

Comprehensive test cases including:

- 20+ test scenarios
- Expected results
- Test data setup
- Troubleshooting guide
- Success criteria

## Validation

### Frontend Validation (Zod Schema)

```typescript
const alertConfigSchema = z.object({
  enabled: z.boolean(),
  thresholds: z
    .array(z.number().int().min(1).max(30))
    .min(1, 'Phải có ít nhất một ngưỡng nhắc nhở'),
  channels: z
    .array(z.enum(['EMAIL', 'IN_APP']))
    .min(1, 'Phải chọn ít nhất một kênh thông báo'),
  sendOverdueAlerts: z.boolean(),
})
```

**Rules:**

- At least one threshold required
- Thresholds must be 1-30 days
- At least one channel required
- All fields required when enabled

### Backend Validation

Backend should validate:

- Schedule exists and is active
- Reviewer assignments exist
- Email addresses are valid
- Dates are in correct sequence
- Alert configuration is valid JSON

## Error Handling

### Frontend Errors

- Form validation errors displayed inline
- API errors shown as toast notifications
- Network errors with retry option

### Backend Errors (To Implement)

- Email delivery failures logged
- Invalid email addresses flagged
- SMTP errors with retry logic
- Rate limiting respected
- System errors logged for admin review

## Performance Considerations

### Frontend

- Alert configuration is part of form state
- No additional API calls for configuration
- Efficient rendering with React Hook Form

### Backend (To Implement)

- Batch processing for multiple alerts
- Database indexing on alert_logs
- Caching of reviewer assignments
- Rate limiting for email service
- Async processing with job queue

## Security

### Frontend

- Input validation with Zod
- XSS prevention (React escaping)
- CSRF protection (API client)

### Backend (To Implement)

- Email security (TLS/SSL)
- Email address validation
- Rate limiting on manual reminders
- Authentication required for all endpoints
- Audit logging

## Future Enhancements

Potential improvements:

1. **Custom Thresholds**: Allow custom day values (not just 1, 3, 5, 7)
2. **SMS Notifications**: Add SMS as a channel option
3. **Escalation**: Auto-escalate to manager if overdue > X days
4. **Digest Mode**: Option for daily digest instead of individual alerts
5. **Quiet Hours**: Don't send alerts during specified hours
6. **Reviewer Preferences**: Let reviewers customize their alert preferences
7. **Alert Templates**: Customizable email templates per institution
8. **Analytics**: Dashboard showing alert effectiveness

## Support

For questions or issues:

- **Frontend**: Check this README and component code
- **Backend**: See backend integration specification
- **Testing**: See testing guide
- **General**: Contact development team

## Change Log

| Date       | Version | Changes                           | Author        |
| ---------- | ------- | --------------------------------- | ------------- |
| 2024-01-XX | 1.0     | Initial implementation (frontend) | Frontend Team |
| TBD        | 2.0     | Backend implementation            | Backend Team  |
