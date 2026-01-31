import { useState, useEffect } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import {
  Plus,
  Save,
  Upload,
  GripVertical,
  Trash2,
  ArrowLeft,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { syllabusData } from '../data/syllabus-data'

interface LearningOutcome {
  id: string
  description: string
}

interface Topic {
  id: string
  title: string
  description: string
}

interface Assessment {
  id: string
  name: string
  weight: number
}

export function SyllabusEditor() {
  const navigate = useNavigate()
  const { id } = useParams({ from: '/_authenticated/syllabus/edit/$id' })

  // Find the syllabus by ID
  const syllabus = syllabusData.find((s) => s.id === id)

  const [courseCode, setCourseCode] = useState('')
  const [textbook, setTextbook] = useState('')
  const [learningOutcomes, setLearningOutcomes] = useState<LearningOutcome[]>(
    []
  )
  const [topics, setTopics] = useState<Topic[]>([])
  const [assessments, setAssessments] = useState<Assessment[]>([])

  // Load syllabus data when component mounts
  useEffect(() => {
    if (syllabus) {
      setCourseCode(syllabus.courseCode)
      // TODO: Load other fields from syllabus data when available
    }
  }, [syllabus])

  if (!syllabus) {
    return (
      <div className='py-12 text-center'>
        <h2 className='text-2xl font-bold'>Không tìm thấy đề cương</h2>
        <p className='mt-2 text-muted-foreground'>
          Đề cương với ID "{id}" không tồn tại.
        </p>
        <Button onClick={() => navigate({ to: '/syllabus' })} className='mt-4'>
          <ArrowLeft className='mr-2 h-4 w-4' />
          Quay lại danh sách
        </Button>
      </div>
    )
  }

  const addLearningOutcome = () => {
    setLearningOutcomes([
      ...learningOutcomes,
      { id: Date.now().toString(), description: '' },
    ])
  }

  const removeLearningOutcome = (id: string) => {
    setLearningOutcomes(learningOutcomes.filter((lo) => lo.id !== id))
  }

  const updateLearningOutcome = (id: string, description: string) => {
    setLearningOutcomes(
      learningOutcomes.map((lo) => (lo.id === id ? { ...lo, description } : lo))
    )
  }

  const addTopic = () => {
    setTopics([
      ...topics,
      { id: Date.now().toString(), title: '', description: '' },
    ])
  }

  const removeTopic = (id: string) => {
    setTopics(topics.filter((t) => t.id !== id))
  }

  const updateTopic = (
    id: string,
    field: 'title' | 'description',
    value: string
  ) => {
    setTopics(topics.map((t) => (t.id === id ? { ...t, [field]: value } : t)))
  }

  const addAssessment = () => {
    setAssessments([
      ...assessments,
      { id: Date.now().toString(), name: '', weight: 0 },
    ])
  }

  const removeAssessment = (id: string) => {
    setAssessments(assessments.filter((a) => a.id !== id))
  }

  const updateAssessment = (
    id: string,
    field: 'name' | 'weight',
    value: string | number
  ) => {
    setAssessments(
      assessments.map((a) => (a.id === id ? { ...a, [field]: value } : a))
    )
  }

  const handleSaveDraft = () => {
    toast.success('Đã lưu bản nháp')
    // TODO: Implement save draft API call
  }

  const handlePublish = () => {
    toast.success('Đã xuất bản đề cương')
    // TODO: Implement publish API call
    navigate({ to: '/syllabus' })
  }

  const handleCancel = () => {
    navigate({ to: '/syllabus' })
  }

  return (
    <div className='space-y-6'>
      {/* Toolbar */}
      <div className='flex items-center justify-between border-b pb-4'>
        <div>
          <h2 className='text-2xl font-bold'>Trình soạn thảo đề cương</h2>
          <p className='text-sm text-muted-foreground'>
            Chỉnh sửa thông tin đề cương khóa học
          </p>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline' onClick={handleCancel}>
            Hủy
          </Button>
          <Button variant='outline' onClick={handleSaveDraft}>
            <Save className='mr-2 h-4 w-4' />
            Lưu bản nháp
          </Button>
          <Button onClick={handlePublish}>
            <Upload className='mr-2 h-4 w-4' />
            Cập nhật/Xuất bản
          </Button>
        </div>
      </div>

      {/* General Information */}
      <Card>
        <CardHeader>
          <CardTitle>Thông tin chung</CardTitle>
          <CardDescription>Nhập thông tin cơ bản về khóa học</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid gap-4 md:grid-cols-2'>
            <div className='space-y-2'>
              <Label htmlFor='courseCode'>Mã khóa học</Label>
              <Input
                id='courseCode'
                placeholder='VD: CS101'
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='textbook'>Giáo trình</Label>
              <Input
                id='textbook'
                placeholder='Tên giáo trình'
                value={textbook}
                onChange={(e) => setTextbook(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Learning Outcomes */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle>Chuẩn đầu ra</CardTitle>
              <CardDescription>
                Thêm các kết quả học tập mong đợi
              </CardDescription>
            </div>
            <Button onClick={addLearningOutcome} size='sm'>
              <Plus className='mr-2 h-4 w-4' />
              Thêm chuẩn đầu ra
            </Button>
          </div>
        </CardHeader>
        <CardContent className='space-y-3'>
          {learningOutcomes.length === 0 ? (
            <p className='py-4 text-center text-sm text-muted-foreground'>
              Chưa có chuẩn đầu ra nào. Nhấn nút "Thêm chuẩn đầu ra" để bắt đầu.
            </p>
          ) : (
            learningOutcomes.map((outcome, index) => (
              <div key={outcome.id} className='flex gap-2'>
                <div className='flex-1'>
                  <Textarea
                    placeholder={`Chuẩn đầu ra ${index + 1}`}
                    value={outcome.description}
                    onChange={(e) =>
                      updateLearningOutcome(outcome.id, e.target.value)
                    }
                    rows={2}
                  />
                </div>
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={() => removeLearningOutcome(outcome.id)}
                >
                  <Trash2 className='h-4 w-4' />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Topics */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle>Quản lý chủ đề</CardTitle>
              <CardDescription>
                Thêm và sắp xếp các chương/bài học
              </CardDescription>
            </div>
            <Button onClick={addTopic} size='sm'>
              <Plus className='mr-2 h-4 w-4' />
              Thêm chủ đề
            </Button>
          </div>
        </CardHeader>
        <CardContent className='space-y-3'>
          {topics.length === 0 ? (
            <p className='py-4 text-center text-sm text-muted-foreground'>
              Chưa có chủ đề nào. Nhấn nút "Thêm chủ đề" để bắt đầu.
            </p>
          ) : (
            topics.map((topic, index) => (
              <div key={topic.id} className='flex items-start gap-2'>
                <Button
                  variant='ghost'
                  size='icon'
                  className='mt-2 cursor-move'
                >
                  <GripVertical className='h-4 w-4' />
                </Button>
                <div className='flex-1 space-y-2'>
                  <Input
                    placeholder={`Chủ đề ${index + 1}`}
                    value={topic.title}
                    onChange={(e) =>
                      updateTopic(topic.id, 'title', e.target.value)
                    }
                  />
                  <Textarea
                    placeholder='Mô tả chi tiết'
                    value={topic.description}
                    onChange={(e) =>
                      updateTopic(topic.id, 'description', e.target.value)
                    }
                    rows={2}
                  />
                </div>
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={() => removeTopic(topic.id)}
                  className='mt-2'
                >
                  <Trash2 className='h-4 w-4' />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Assessments */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle>Thành phần đánh giá</CardTitle>
              <CardDescription>
                Thiết lập bài kiểm tra và trọng số điểm
              </CardDescription>
            </div>
            <Button onClick={addAssessment} size='sm'>
              <Plus className='mr-2 h-4 w-4' />
              Thêm đánh giá
            </Button>
          </div>
        </CardHeader>
        <CardContent className='space-y-3'>
          {assessments.length === 0 ? (
            <p className='py-4 text-center text-sm text-muted-foreground'>
              Chưa có thành phần đánh giá nào. Nhấn nút "Thêm đánh giá" để bắt
              đầu.
            </p>
          ) : (
            assessments.map((assessment, index) => (
              <div key={assessment.id} className='flex items-start gap-2'>
                <div className='grid flex-1 gap-2 md:grid-cols-2'>
                  <Input
                    placeholder={`Tên bài kiểm tra ${index + 1}`}
                    value={assessment.name}
                    onChange={(e) =>
                      updateAssessment(assessment.id, 'name', e.target.value)
                    }
                  />
                  <div className='flex items-center gap-2'>
                    <Input
                      type='number'
                      placeholder='Trọng số (%)'
                      value={assessment.weight || ''}
                      onChange={(e) =>
                        updateAssessment(
                          assessment.id,
                          'weight',
                          Number(e.target.value)
                        )
                      }
                      min={0}
                      max={100}
                    />
                    <span className='text-sm text-muted-foreground'>%</span>
                  </div>
                </div>
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={() => removeAssessment(assessment.id)}
                >
                  <Trash2 className='h-4 w-4' />
                </Button>
              </div>
            ))
          )}
          {assessments.length > 0 && (
            <div className='border-t pt-2'>
              <p className='text-sm font-medium'>
                Tổng trọng số:{' '}
                <span
                  className={
                    assessments.reduce((sum, a) => sum + a.weight, 0) === 100
                      ? 'text-green-600'
                      : 'text-destructive'
                  }
                >
                  {assessments.reduce((sum, a) => sum + a.weight, 0)}%
                </span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Version History */}
      <Card>
        <CardHeader>
          <CardTitle>Lịch sử phiên bản</CardTitle>
          <CardDescription>
            Xem lại các mốc thời gian của tài liệu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder='Chọn phiên bản' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='v1.0'>Phiên bản 1.0 - 15/01/2024</SelectItem>
              <SelectItem value='v1.1'>Phiên bản 1.1 - 20/01/2024</SelectItem>
              <SelectItem value='v2.0'>Phiên bản 2.0 - 25/01/2024</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
    </div>
  )
}
