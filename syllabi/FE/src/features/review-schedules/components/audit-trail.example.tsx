/**
 * Example usage of the AuditTrail component
 *
 * This file demonstrates how to use the AuditTrail component
 * with sample data for testing and development purposes.
 */
import { type AuditTrailEntry } from '../data/schema'
import { AuditTrail } from './audit-trail'

// Sample audit trail data
const sampleAuditTrail: AuditTrailEntry[] = [
  {
    id: '1',
    scheduleId: 'schedule-1',
    action: 'Tạo lịch phê duyệt',
    performedBy: 'user-1',
    performedByName: 'Nguyễn Văn A',
    performedAt: new Date('2024-01-15T09:00:00'),
  },
  {
    id: '2',
    scheduleId: 'schedule-1',
    action: 'Cập nhật thông tin',
    field: 'l1Deadline',
    oldValue: '2024-02-15',
    newValue: '2024-02-20',
    performedBy: 'user-1',
    performedByName: 'Nguyễn Văn A',
    performedAt: new Date('2024-01-16T14:30:00'),
    reason: 'Gia hạn do yêu cầu của các khoa',
  },
  {
    id: '3',
    scheduleId: 'schedule-1',
    action: 'Phân công người phê duyệt',
    field: 'primaryReviewer',
    oldValue: 'Không có',
    newValue: 'Trần Thị B - Khoa CNTT',
    performedBy: 'user-2',
    performedByName: 'Lê Văn C',
    performedAt: new Date('2024-01-17T10:15:00'),
  },
  {
    id: '4',
    scheduleId: 'schedule-1',
    action: 'Gửi nhắc nhở',
    performedBy: 'system',
    performedByName: 'Hệ thống',
    performedAt: new Date('2024-01-18T08:00:00'),
  },
  {
    id: '5',
    scheduleId: 'schedule-1',
    action: 'Cập nhật thông tin',
    field: 'l2Deadline',
    oldValue: '2024-03-01',
    newValue: '2024-03-05',
    performedBy: 'user-1',
    performedByName: 'Nguyễn Văn A',
    performedAt: new Date('2024-01-19T16:45:00'),
    reason: 'Điều chỉnh theo lịch học kỳ mới',
  },
]

/**
 * Example 1: Basic usage with default settings
 */
export function AuditTrailBasicExample() {
  return (
    <div className='container mx-auto py-8'>
      <h2 className='mb-4 text-2xl font-bold'>Basic Audit Trail</h2>
      <AuditTrail entries={sampleAuditTrail} />
    </div>
  )
}

/**
 * Example 2: With custom page size
 */
export function AuditTrailCustomPageSizeExample() {
  return (
    <div className='container mx-auto py-8'>
      <h2 className='mb-4 text-2xl font-bold'>
        Audit Trail with Custom Page Size
      </h2>
      <AuditTrail entries={sampleAuditTrail} pageSize={3} />
    </div>
  )
}

/**
 * Example 3: Without filter controls
 */
export function AuditTrailNoFilterExample() {
  return (
    <div className='container mx-auto py-8'>
      <h2 className='mb-4 text-2xl font-bold'>Audit Trail without Filter</h2>
      <AuditTrail entries={sampleAuditTrail} showFilter={false} />
    </div>
  )
}

/**
 * Example 4: Empty state
 */
export function AuditTrailEmptyExample() {
  return (
    <div className='container mx-auto py-8'>
      <h2 className='mb-4 text-2xl font-bold'>Empty Audit Trail</h2>
      <AuditTrail entries={[]} />
    </div>
  )
}
