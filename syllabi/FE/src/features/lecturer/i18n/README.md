# Vietnamese Translation for Lecturer Module

# Bản dịch tiếng Việt cho Module Giảng viên

## Overview / Tổng quan

This directory contains Vietnamese translations for the Lecturer Module. All user-facing text has been translated to Vietnamese to provide a localized experience for Vietnamese-speaking users.

Thư mục này chứa bản dịch tiếng Việt cho Module Giảng viên. Tất cả văn bản hiển thị cho người dùng đã được dịch sang tiếng Việt để cung cấp trải nghiệm bản địa hóa cho người dùng nói tiếng Việt.

## Files / Tệp tin

- `vi.ts` - Vietnamese translation strings / Chuỗi dịch tiếng Việt
- `README.md` - This file / Tệp này

## Usage / Sử dụng

### In Components / Trong các Component

```typescript
import { useTranslation } from '@/features/lecturer/hooks/useTranslation';

export function MyComponent() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('wizard.title.create')}</h1>
      <p>{t('wizard.steps.courseInformation.description')}</p>
    </div>
  );
}
```

### With Parameters / Với tham số

```typescript
const { t } = useTranslation()

// Simple parameter replacement
t('autoSave.secondsAgo', { count: 30 }) // "30 giây trước"

// Multiple parameters
t('learningOutcomes.clo.minimumRequired', { count: 2 }) // "Cần ít nhất 3 CLO. Bạn hiện có 2 CLO."
```

## Translation Structure / Cấu trúc dịch thuật

The translation file is organized by feature area:

Tệp dịch được tổ chức theo khu vực tính năng:

```
vi
├── common              # Common UI elements / Các phần tử UI chung
├── wizard              # Syllabus wizard / Trình hướng dẫn đề cương
├── courseInformation   # Course info step / Bước thông tin môn học
├── learningOutcomes    # Learning outcomes step / Bước chuẩn đầu ra
├── cloPloMapping       # CLO-PLO mapping step / Bước ánh xạ CLO-PLO
├── courseContent       # Course content step / Bước nội dung môn học
├── assessmentMethods   # Assessment methods step / Bước phương pháp đánh giá
├── references          # References step / Bước tài liệu tham khảo
├── preview             # Preview step / Bước xem trước
├── autoSave            # Auto-save indicator / Chỉ báo tự động lưu
├── statusTracker       # Status tracker / Theo dõi trạng thái
├── validationResults   # Validation results / Kết quả xác thực
├── commentThread       # Comment thread / Chuỗi nhận xét
├── messages            # Messaging system / Hệ thống tin nhắn
├── notifications       # Notifications / Thông báo
└── errors              # Error messages / Thông báo lỗi
```

## Key Translations / Các bản dịch chính

### Academic Terms / Thuật ngữ học thuật

| English                        | Vietnamese                |
| ------------------------------ | ------------------------- |
| Syllabus                       | Đề cương môn học          |
| Course Learning Outcome (CLO)  | Chuẩn đầu ra môn học      |
| Program Learning Outcome (PLO) | Chuẩn đầu ra chương trình |
| Bloom's Taxonomy               | Phân loại Bloom           |
| Assessment                     | Đánh giá                  |
| Credit                         | Tín chỉ                   |
| Semester                       | Học kỳ                    |
| Academic Year                  | Năm học                   |
| Lecturer                       | Giảng viên                |
| Head of Department (HoD)       | Trưởng khoa               |
| Academic Manager               | Quản lý học thuật         |

### Bloom's Taxonomy Levels / Các cấp độ phân loại Bloom

| English    | Vietnamese |
| ---------- | ---------- |
| Remember   | Nhớ        |
| Understand | Hiểu       |
| Apply      | Áp dụng    |
| Analyze    | Phân tích  |
| Evaluate   | Đánh giá   |
| Create     | Sáng tạo   |

### Status Values / Giá trị trạng thái

| English           | Vietnamese      |
| ----------------- | --------------- |
| Draft             | Bản nháp        |
| Pending Review    | Chờ xem xét     |
| Revision Required | Yêu cầu sửa đổi |
| Approved          | Đã phê duyệt    |
| Rejected          | Bị từ chối      |
| Archived          | Đã lưu trữ      |

### Semester Names / Tên học kỳ

| English | Vietnamese |
| ------- | ---------- |
| Fall    | Học kỳ 1   |
| Spring  | Học kỳ 2   |
| Summer  | Học kỳ hè  |

## Adding New Translations / Thêm bản dịch mới

To add new translations:

Để thêm bản dịch mới:

1. Add the English key and Vietnamese value to `vi.ts`
   Thêm khóa tiếng Anh và giá trị tiếng Việt vào `vi.ts`

2. Use the translation in your component with `t('your.key.path')`
   Sử dụng bản dịch trong component của bạn với `t('your.key.path')`

3. For parameters, use `{paramName}` in the translation string
   Đối với tham số, sử dụng `{paramName}` trong chuỗi dịch

Example / Ví dụ:

```typescript
// In vi.ts
export const vi = {
  myFeature: {
    greeting: 'Xin chào, {name}!',
    itemCount: 'Bạn có {count} mục',
  },
}

// In component
const { t } = useTranslation()
t('myFeature.greeting', { name: 'Nguyễn Văn A' }) // "Xin chào, Nguyễn Văn A!"
t('myFeature.itemCount', { count: 5 }) // "Bạn có 5 mục"
```

## Translation Guidelines / Hướng dẫn dịch thuật

1. **Consistency / Tính nhất quán**: Use consistent terminology throughout
   Sử dụng thuật ngữ nhất quán trong toàn bộ

2. **Context / Ngữ cảnh**: Consider the context when translating
   Xem xét ngữ cảnh khi dịch

3. **Formality / Tính trang trọng**: Use appropriate level of formality for academic context
   Sử dụng mức độ trang trọng phù hợp cho ngữ cảnh học thuật

4. **Length / Độ dài**: Keep translations concise while maintaining meaning
   Giữ bản dịch ngắn gọn trong khi duy trì ý nghĩa

5. **Technical Terms / Thuật ngữ kỹ thuật**: Use established Vietnamese academic terminology
   Sử dụng thuật ngữ học thuật tiếng Việt đã được thiết lập

## Testing Translations / Kiểm tra bản dịch

To test translations:

Để kiểm tra bản dịch:

1. Run the development server: `pnpm dev`
   Chạy máy chủ phát triển: `pnpm dev`

2. Navigate to the Lecturer Module pages
   Điều hướng đến các trang Module Giảng viên

3. Verify all text appears in Vietnamese
   Xác minh tất cả văn bản xuất hiện bằng tiếng Việt

4. Check parameter replacements work correctly
   Kiểm tra thay thế tham số hoạt động chính xác

5. Test with different data to ensure pluralization and formatting
   Kiểm tra với dữ liệu khác nhau để đảm bảo số nhiều và định dạng

## Maintenance / Bảo trì

When adding new features:

Khi thêm tính năng mới:

1. Add English text to components first
   Thêm văn bản tiếng Anh vào components trước

2. Extract text to translation keys
   Trích xuất văn bản thành khóa dịch

3. Add Vietnamese translations to `vi.ts`
   Thêm bản dịch tiếng Việt vào `vi.ts`

4. Update this README if adding new sections
   Cập nhật README này nếu thêm phần mới

## Support / Hỗ trợ

For translation issues or suggestions:

Đối với vấn đề hoặc đề xuất dịch thuật:

- Check the translation key path is correct
  Kiểm tra đường dẫn khóa dịch là chính xác

- Verify the parameter names match
  Xác minh tên tham số khớp

- Ensure the translation file is imported correctly
  Đảm bảo tệp dịch được nhập chính xác

- Review console warnings for missing keys
  Xem lại cảnh báo console cho các khóa bị thiếu
