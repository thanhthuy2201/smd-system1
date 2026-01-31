# Deadline Alerts Testing Guide

## Overview

This guide provides comprehensive testing procedures for the automated deadline alerts feature in the Review Schedule Management system. Use this guide to verify that alerts are working correctly after backend implementation.

**Related Requirements:** 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8

## Prerequisites

Before testing, ensure:

1. ✅ Backend alert system is deployed and configured
2. ✅ Email service (SMTP) is configured and working
3. ✅ In-app notification system is implemented
4. ✅ Cron job for daily alert processing is scheduled
5. ✅ Test user accounts with reviewer roles are available
6. ✅ Test email addresses are accessible for verification

## Test Environment Setup

### Test Data Requirements

Create the following test data:

1. **Test Semester**
   - Name: "HK1 2024-2025 (Test)"
   - Submission End Date: Today - 5 days
   - Start Date: Today
   - End Date: Today + 90 days

2. **Test Departments**
   - Department A
   - Department B

3. **Test Reviewers**
   - Reviewer 1 (HoD role, Department A)
   - Reviewer 2 (AA role, Department B)
   - Reviewer 3 (HoD role, Department A, backup)

4. **Test Academic Manager**
   - Manager 1 (Academic Manager role)

### Email Configuration

Set up test email addresses that you can access:
- reviewer1@test.university.edu.vn
- reviewer2@test.university.edu.vn
- manager1@test.university.edu.vn

## Test Cases

### TC-01: Create Schedule with Alerts Enabled

**Objective:** Verify alert configuration is saved when creating a review schedule

**Steps:**
1. Log in as Academic Manager
2. Navigate to Review Schedules → Create
3. Fill in schedule details:
   - Name: "Test Alert Schedule 1"
   - Semester: Select test semester
   - Review Start Date: Today + 1 day
   - L1 Deadline: Today + 8 days
   - L2 Deadline: Today + 15 days
   - Final Approval Date: Today + 22 days
4. In "Cấu hình nhắc nhở hạn chót" section:
   - Enable "Bật nhắc nhở tự động" toggle
   - Select thresholds: 7, 3, 1 days
   - Select channels: Email, In-App
   - Enable "Gửi thông báo quá hạn"
5. Click "Lưu"

**Expected Results:**
- ✅ Schedule created successfully
- ✅ Success toast: "Tạo lịch phê duyệt thành công"
- ✅ Redirected to detail page
- ✅ Alert configuration displayed correctly in detail view
- ✅ Backend logs show alert jobs scheduled for:
  - L1: 7, 3, 1 days before deadline
  - L2: 7, 3, 1 days before deadline
  - Final: 7, 3, 1 days before deadline

**Validates:** Requirements 7.1, 7.2, 7.3, 7.7

---

### TC-02: Create Schedule with Alerts Disabled

**Objective:** Verify no alerts are scheduled when alerts are disabled

**Steps:**
1. Log in as Academic Manager
2. Navigate to Review Schedules → Create
3. Fill in schedule details (same as TC-01)
4. In "Cấu hình nhắc nhở hạn chót" section:
   - Disable "Bật nhắc nhở tự động" toggle
5. Click "Lưu"

**Expected Results:**
- ✅ Schedule created successfully
- ✅ Alert configuration shows `enabled: false`
- ✅ Backend logs show NO alert jobs scheduled
- ✅ No alerts will be sent for this schedule

**Validates:** Requirements 7.6

---

### TC-03: Threshold Alert - 7 Days Before L1 Deadline

**Objective:** Verify threshold alerts are sent at configured intervals

**Prerequisites:**
- Schedule created with L1 deadline = Today + 7 days
- Alerts enabled with threshold: 7 days
- Reviewer assigned to department with pending reviews

**Steps:**
1. Wait for daily cron job to run (or manually trigger)
2. Check reviewer's email inbox
3. Check reviewer's in-app notifications
4. Check alert logs in database

**Expected Results:**

**Email:**
- ✅ Email received at reviewer's address
- ✅ Subject: "[Nhắc nhở] Hạn phê duyệt L1 sắp đến - Test Alert Schedule 1"
- ✅ Body contains:
  - Reviewer name
  - Schedule name
  - Deadline type (L1)
  - Deadline date
  - Days remaining (7 days)
  - Pending count
  - Dashboard link
- ✅ Email is in Vietnamese
- ✅ Link is clickable and leads to correct page

**In-App Notification:**
- ✅ Notification appears in notification center
- ✅ Title: "Nhắc nhở hạn phê duyệt"
- ✅ Message contains schedule name and days remaining
- ✅ Clicking notification navigates to schedule detail page
- ✅ Notification marked as unread initially

**Database:**
- ✅ Alert log entry created with:
  - `alert_type = 'THRESHOLD'`
  - `deadline_type = 'L1'`
  - `days_before_deadline = 7`
  - `channels = ['EMAIL', 'IN_APP']`
  - `email_status = 'SENT'`
  - `in_app_status = 'SENT'`
  - `sent_at` timestamp

**Validates:** Requirements 7.2, 7.3, 7.4, 7.8

---

### TC-04: Multiple Threshold Alerts

**Objective:** Verify alerts are sent at all configured thresholds

**Prerequisites:**
- Schedule with L1 deadline = Today + 7 days
- Alerts enabled with thresholds: 7, 3, 1 days
- Reviewer assigned with pending reviews

**Steps:**
1. Day 1 (7 days before): Verify alert sent (TC-03)
2. Day 5 (3 days before): Wait for cron job, verify alert sent
3. Day 7 (1 day before): Wait for cron job, verify alert sent

**Expected Results:**
- ✅ Alert sent on Day 1 (7 days before)
- ✅ Alert sent on Day 5 (3 days before)
- ✅ Alert sent on Day 7 (1 day before)
- ✅ Each alert has correct `days_before_deadline` value
- ✅ No duplicate alerts sent on same day
- ✅ All alerts logged in database

**Validates:** Requirements 7.2, 7.4, 7.8

---

### TC-05: Overdue Alert

**Objective:** Verify overdue alerts are sent after deadline passes

**Prerequisites:**
- Schedule with L1 deadline = Today - 1 day (past)
- Alerts enabled with `sendOverdueAlerts = true`
- Reviewer assigned with pending reviews (not completed)

**Steps:**
1. Wait for daily cron job to run
2. Check reviewer's email inbox
3. Check reviewer's in-app notifications
4. Check alert logs

**Expected Results:**

**Email:**
- ✅ Email received
- ✅ Subject: "[Khẩn cấp] Đã quá hạn phê duyệt L1 - Test Alert Schedule 1"
- ✅ Body indicates deadline has passed
- ✅ Shows days overdue (1 day)
- ✅ Urgent tone in message

**In-App Notification:**
- ✅ Notification appears
- ✅ Title: "Quá hạn phê duyệt"
- ✅ Message indicates overdue status
- ✅ High priority/urgent styling (if implemented)

**Database:**
- ✅ Alert log entry with:
  - `alert_type = 'OVERDUE'`
  - `deadline_type = 'L1'`
  - `days_before_deadline = NULL`
  - Overdue days calculated from current date

**Validates:** Requirements 7.5, 7.8

---

### TC-06: Daily Overdue Alerts

**Objective:** Verify overdue alerts continue daily until resolved

**Prerequisites:**
- Schedule with L1 deadline = Today - 3 days
- Alerts enabled with `sendOverdueAlerts = true`
- Reviewer has pending reviews

**Steps:**
1. Day 1: Verify overdue alert sent
2. Day 2: Verify another overdue alert sent
3. Day 3: Verify another overdue alert sent
4. Complete all pending reviews
5. Day 4: Verify NO alert sent (no pending reviews)

**Expected Results:**
- ✅ Overdue alert sent daily while reviews pending
- ✅ Each alert shows increasing days overdue (1, 2, 3 days)
- ✅ Alerts stop when all reviews completed
- ✅ All alerts logged separately in database

**Validates:** Requirements 7.5, 7.8

---

### TC-07: No Alerts for Reviewers Without Pending Reviews

**Objective:** Verify alerts are only sent to reviewers with pending work

**Prerequisites:**
- Schedule with L1 deadline = Today + 7 days
- Reviewer 1: Has 5 pending reviews
- Reviewer 2: Has 0 pending reviews (all completed)

**Steps:**
1. Wait for daily cron job to run
2. Check both reviewers' email inboxes
3. Check alert logs

**Expected Results:**
- ✅ Reviewer 1 receives alert (has pending reviews)
- ✅ Reviewer 2 does NOT receive alert (no pending reviews)
- ✅ Alert log only contains entry for Reviewer 1
- ✅ System efficiently filters recipients

**Validates:** Requirements 7.4

---

### TC-08: Email-Only Alerts

**Objective:** Verify alerts respect channel configuration

**Prerequisites:**
- Schedule with alerts enabled
- Channels: Email only (In-App unchecked)
- L1 deadline = Today + 7 days

**Steps:**
1. Wait for cron job to run
2. Check reviewer's email
3. Check reviewer's in-app notifications
4. Check alert logs

**Expected Results:**
- ✅ Email received
- ✅ NO in-app notification created
- ✅ Alert log shows `channels = ['EMAIL']`
- ✅ `email_status = 'SENT'`
- ✅ `in_app_status = NULL`

**Validates:** Requirements 7.3

---

### TC-09: In-App-Only Alerts

**Objective:** Verify in-app only alerts work correctly

**Prerequisites:**
- Schedule with alerts enabled
- Channels: In-App only (Email unchecked)
- L1 deadline = Today + 7 days

**Steps:**
1. Wait for cron job to run
2. Check reviewer's email (should be empty)
3. Check reviewer's in-app notifications
4. Check alert logs

**Expected Results:**
- ✅ NO email received
- ✅ In-app notification created
- ✅ Alert log shows `channels = ['IN_APP']`
- ✅ `email_status = NULL`
- ✅ `in_app_status = 'SENT'`

**Validates:** Requirements 7.3

---

### TC-10: Manual Reminder Sending

**Objective:** Verify manual reminder functionality works

**Prerequisites:**
- Active schedule with assigned reviewers
- Reviewers have pending reviews

**Steps:**
1. Log in as Academic Manager
2. Navigate to schedule detail page
3. Click "Send Reminder" button
4. Confirm in dialog
5. Check reviewers' emails and notifications
6. Check alert logs

**Expected Results:**
- ✅ Confirmation dialog appears
- ✅ Shows list of reviewers who will receive reminder
- ✅ After confirmation, success toast: "Đã gửi nhắc nhở đến người phê duyệt"
- ✅ All assigned reviewers with pending reviews receive notifications
- ✅ Notifications sent via configured channels
- ✅ Alert logs created for each sent reminder
- ✅ Logs show manual trigger (not automatic)

**Validates:** Requirements 7.4, 7.8

---

### TC-11: Manual Reminder to Specific Reviewers

**Objective:** Verify selective manual reminders

**Prerequisites:**
- Schedule with 3 assigned reviewers
- All have pending reviews

**Steps:**
1. Navigate to schedule detail page
2. Click "Send Reminder" button
3. In dialog, select only Reviewer 1 and Reviewer 2
4. Confirm
5. Check notifications

**Expected Results:**
- ✅ Only Reviewer 1 and Reviewer 2 receive notifications
- ✅ Reviewer 3 does NOT receive notification
- ✅ Alert logs only for selected reviewers
- ✅ Success toast displayed

**Validates:** Requirements 7.4

---

### TC-12: Update Alert Configuration

**Objective:** Verify alert configuration can be updated

**Prerequisites:**
- Existing schedule with alerts enabled
- Thresholds: [7, 3, 1]

**Steps:**
1. Navigate to schedule edit page
2. Change thresholds to: [5, 2]
3. Change channels to: Email only
4. Save changes
5. Check backend logs

**Expected Results:**
- ✅ Schedule updated successfully
- ✅ Success toast: "Cập nhật lịch phê duyệt thành công"
- ✅ New alert configuration saved
- ✅ Backend reschedules alert jobs with new thresholds
- ✅ Old alert jobs cancelled
- ✅ Future alerts use new configuration

**Validates:** Requirements 7.1, 7.2, 7.3

---

### TC-13: Disable Alerts for Existing Schedule

**Objective:** Verify alerts can be disabled

**Prerequisites:**
- Schedule with alerts enabled
- Alert jobs scheduled

**Steps:**
1. Navigate to schedule edit page
2. Disable "Bật nhắc nhở tự động" toggle
3. Save changes
4. Check backend logs
5. Wait for scheduled alert time

**Expected Results:**
- ✅ Schedule updated successfully
- ✅ `alertConfig.enabled = false` saved
- ✅ Backend cancels all scheduled alert jobs
- ✅ No alerts sent even when thresholds reached
- ✅ Alert logs show no new entries

**Validates:** Requirements 7.6

---

### TC-14: Alert Deduplication

**Objective:** Verify duplicate alerts are not sent

**Prerequisites:**
- Schedule with L1 deadline = Today + 7 days
- Threshold: 7 days
- Alert already sent today

**Steps:**
1. Manually trigger cron job again (same day)
2. Check reviewer's email and notifications
3. Check alert logs

**Expected Results:**
- ✅ NO duplicate email sent
- ✅ NO duplicate in-app notification
- ✅ Alert log shows only one entry for today
- ✅ System detects existing alert within 24 hours
- ✅ Prevents spam to reviewers

**Validates:** Requirements 7.4

---

### TC-15: Email Delivery Failure Handling

**Objective:** Verify system handles email failures gracefully

**Prerequisites:**
- Schedule with alerts enabled
- Reviewer with invalid email address

**Steps:**
1. Set reviewer email to invalid address (e.g., "invalid@nonexistent.com")
2. Wait for alert to be triggered
3. Check alert logs
4. Check system error logs

**Expected Results:**
- ✅ System attempts to send email
- ✅ Email delivery fails
- ✅ Alert log entry created with:
  - `email_status = 'FAILED'` or `'BOUNCED'`
  - `error_message` populated with error details
- ✅ In-app notification still sent (if configured)
- ✅ System logs error for administrator review
- ✅ Retry mechanism attempted (if implemented)
- ✅ Academic Manager notified of delivery failure (optional)

**Validates:** Requirements 7.8

---

### TC-16: Alerts for Multiple Deadlines

**Objective:** Verify alerts work for all deadline types (L1, L2, Final)

**Prerequisites:**
- Schedule with:
  - L1 deadline = Today + 7 days
  - L2 deadline = Today + 14 days
  - Final deadline = Today + 21 days
- Thresholds: [7, 3, 1]

**Steps:**
1. Day 1 (7 days before L1): Verify L1 alert sent
2. Day 8 (7 days before L2): Verify L2 alert sent
3. Day 15 (7 days before Final): Verify Final alert sent
4. Continue for 3-day and 1-day thresholds

**Expected Results:**
- ✅ Alerts sent for L1 deadline at 7, 3, 1 days before
- ✅ Alerts sent for L2 deadline at 7, 3, 1 days before
- ✅ Alerts sent for Final deadline at 7, 3, 1 days before
- ✅ Each alert correctly identifies deadline type
- ✅ Total of 9 alerts sent (3 thresholds × 3 deadlines)
- ✅ All alerts logged with correct `deadline_type`

**Validates:** Requirements 7.2, 7.4, 7.8

---

### TC-17: Deadline Extension Notification

**Objective:** Verify reviewers are notified when deadlines are extended

**Prerequisites:**
- Active schedule with L1 deadline = Today + 5 days
- Reviewers assigned

**Steps:**
1. Navigate to schedule edit page
2. Extend L1 deadline to Today + 12 days
3. Save changes
4. Check reviewers' notifications

**Expected Results:**
- ✅ Schedule updated successfully
- ✅ Reviewers receive notification about deadline extension
- ✅ Notification includes:
  - Old deadline date
  - New deadline date
  - Additional time granted
- ✅ Alert jobs rescheduled for new deadline
- ✅ Audit trail records deadline change

**Validates:** Requirements 6.6, 7.8

---

### TC-18: Alerts Stop After Schedule Completion

**Objective:** Verify no alerts sent for completed schedules

**Prerequisites:**
- Schedule with all reviews completed
- Status = COMPLETED
- Alerts enabled

**Steps:**
1. Complete all pending reviews
2. Wait for scheduled alert time
3. Check for notifications
4. Check alert logs

**Expected Results:**
- ✅ NO alerts sent (no pending reviews)
- ✅ Alert logs show no new entries
- ✅ System efficiently skips completed schedules
- ✅ Reviewers not bothered with unnecessary notifications

**Validates:** Requirements 7.4

---

### TC-19: Alert Audit Trail

**Objective:** Verify all alerts are logged for audit purposes

**Prerequisites:**
- Schedule with alerts enabled
- Multiple alerts sent over time

**Steps:**
1. Navigate to schedule detail page
2. View audit trail section
3. Filter by alert-related actions
4. Check database alert_logs table

**Expected Results:**
- ✅ All sent alerts appear in audit trail
- ✅ Each entry shows:
  - Timestamp
  - Recipient
  - Alert type (threshold/overdue)
  - Deadline type
  - Channels used
  - Delivery status
- ✅ Entries are sortable and filterable
- ✅ Database logs match UI display
- ✅ Logs retained for compliance period

**Validates:** Requirements 7.8

---

### TC-20: Performance with Large Number of Schedules

**Objective:** Verify system performs well with many schedules

**Prerequisites:**
- 100+ active schedules with alerts enabled
- Multiple reviewers per schedule

**Steps:**
1. Create 100+ test schedules
2. Trigger daily cron job
3. Monitor system performance
4. Check all alerts sent successfully

**Expected Results:**
- ✅ Cron job completes within reasonable time (< 5 minutes)
- ✅ All alerts sent successfully
- ✅ No timeouts or errors
- ✅ Database queries optimized
- ✅ Email service rate limits respected
- ✅ System remains responsive during processing

**Validates:** Requirements 7.4, 7.8

---

## Regression Testing

After any changes to the alert system, run these critical tests:

1. ✅ TC-01: Create schedule with alerts
2. ✅ TC-03: Threshold alert delivery
3. ✅ TC-05: Overdue alert delivery
4. ✅ TC-10: Manual reminder sending
5. ✅ TC-12: Update alert configuration
6. ✅ TC-14: Alert deduplication

## Test Data Cleanup

After testing, clean up test data:

```sql
-- Delete test alert logs
DELETE FROM alert_logs WHERE schedule_id IN (
  SELECT id FROM review_schedules WHERE name LIKE 'Test Alert Schedule%'
);

-- Delete test schedules
DELETE FROM review_schedules WHERE name LIKE 'Test Alert Schedule%';

-- Delete test notifications
DELETE FROM notifications WHERE title LIKE '%Test Alert Schedule%';
```

## Troubleshooting

### Alerts Not Being Sent

**Check:**
1. Is `ALERT_ENABLED=true` in environment variables?
2. Is cron job running? Check cron logs
3. Is `alertConfig.enabled = true` for the schedule?
4. Are there reviewers with pending reviews?
5. Check alert_logs for error messages
6. Verify email service configuration (SMTP)

### Duplicate Alerts

**Check:**
1. Is deduplication logic working?
2. Check alert_logs for multiple entries
3. Is cron job running multiple times?
4. Are there multiple backend instances?

### Email Not Received

**Check:**
1. Spam/junk folder
2. Email address is correct
3. SMTP configuration is correct
4. Check alert_logs for email_status
5. Email service rate limits
6. Firewall blocking SMTP port

### In-App Notifications Not Appearing

**Check:**
1. Is in-app notification system implemented?
2. Check notifications table in database
3. Is frontend polling for notifications?
4. WebSocket connection (if used)
5. User permissions

## Success Criteria

The alert system is considered fully functional when:

- ✅ All 20 test cases pass
- ✅ Alerts sent at correct times
- ✅ Email and in-app notifications delivered
- ✅ Alert configuration respected
- ✅ Deduplication prevents spam
- ✅ Error handling works correctly
- ✅ Audit trail complete
- ✅ Performance acceptable
- ✅ No critical bugs

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| QA Lead | | | |
| Backend Developer | | | |
| Frontend Developer | | | |
| Product Manager | | | |

