/**
 * Vietnamese translations for Lecturer Module
 * Bản dịch tiếng Việt cho Module Giảng viên
 */

export const vi = {
  // Common
  common: {
    cancel: 'Hủy',
    save: 'Lưu',
    saveDraft: 'Lưu nháp',
    submit: 'Nộp',
    edit: 'Chỉnh sửa',
    delete: 'Xóa',
    add: 'Thêm',
    remove: 'Xóa bỏ',
    next: 'Tiếp theo',
    previous: 'Quay lại',
    close: 'Đóng',
    confirm: 'Xác nhận',
    ok: 'OK',
    loading: 'Đang tải...',
    submitting: 'Đang nộp...',
    saving: 'Đang lưu...',
    saved: 'Đã lưu',
    error: 'Lỗi',
    success: 'Thành công',
    required: 'Bắt buộc',
    optional: 'Tùy chọn',
    search: 'Tìm kiếm',
    filter: 'Lọc',
    sort: 'Sắp xếp',
    view: 'Xem',
    download: 'Tải xuống',
    upload: 'Tải lên',
    retry: 'Thử lại',
    stay: 'Ở lại',
    leave: 'Rời đi',
    select: 'Chọn',
    characters: 'ký tự',
    minimum: 'Tối thiểu',
    outOf: 'trên',
  },

  // Syllabus Wizard
  wizard: {
    title: {
      create: 'Tạo đề cương môn học',
      edit: 'Chỉnh sửa đề cương môn học',
    },
    step: 'Bước',
    of: 'của',
    complete: 'Hoàn thành',
    steps: {
      courseInformation: {
        title: 'Thông tin môn học',
        description: 'Thông tin cơ bản về môn học',
      },
      learningOutcomes: {
        title: 'Chuẩn đầu ra môn học',
        description: 'Định nghĩa các CLO',
      },
      cloPloMapping: {
        title: 'Ánh xạ CLO-PLO',
        description: 'Ánh xạ CLO với PLO',
      },
      courseContent: {
        title: 'Nội dung môn học',
        description: 'Chủ đề và giờ học hàng tuần',
      },
      assessmentMethods: {
        title: 'Phương pháp đánh giá',
        description: 'Chấm điểm và đánh giá',
      },
      references: {
        title: 'Tài liệu tham khảo',
        description: 'Sách giáo khoa và nguồn tài liệu',
      },
      preview: {
        title: 'Xem trước',
        description: 'Xem lại và nộp',
      },
    },
    unsavedChanges: {
      title: 'Thay đổi chưa được lưu',
      description:
        'Bạn có thay đổi chưa được lưu. Bạn có chắc chắn muốn rời đi? Các thay đổi của bạn sẽ bị mất.',
    },
    submitSyllabus: 'Nộp đề cương',
  },

  // Course Information Step
  courseInformation: {
    course: {
      label: 'Môn học',
      placeholder: 'Chọn một môn học',
      description: 'Chọn môn học mà bạn đang tạo đề cương',
      noCoursesAssigned: 'Không có môn học được phân công',
      loadError: 'Không thể tải danh sách môn học. Vui lòng thử lại sau.',
    },
    courseCode: {
      label: 'Mã môn học',
      description: 'Tự động điền từ danh mục môn học',
    },
    courseName: {
      label: 'Tên môn học',
      description: 'Tự động điền từ danh mục môn học',
    },
    academicYear: {
      label: 'Năm học',
      placeholder: 'Chọn năm học',
      description: 'Năm học cho đề cương này',
    },
    semester: {
      label: 'Học kỳ',
      placeholder: 'Chọn học kỳ',
      description: 'Học kỳ mà môn học này sẽ được giảng dạy',
      fall: 'Học kỳ 1',
      spring: 'Học kỳ 2',
      summer: 'Học kỳ hè',
    },
    credits: {
      label: 'Số tín chỉ',
      description: 'Tự động điền từ danh mục môn học',
    },
    totalHours: {
      label: 'Tổng số giờ',
      description: 'Được tính bằng số tín chỉ × 15 giờ',
    },
    description: {
      label: 'Mô tả môn học',
      placeholder: 'Nhập mô tả chi tiết về môn học...',
      description:
        'Cung cấp mô tả chi tiết về nội dung và mục tiêu của môn học',
      characters: 'ký tự',
      minimum: 'tối thiểu',
    },
  },

  // Learning Outcomes Step
  learningOutcomes: {
    info: 'Định nghĩa ít nhất 3 Chuẩn đầu ra môn học (CLO). Mỗi CLO nên bắt đầu bằng một động từ hành động và chỉ rõ những gì sinh viên sẽ có thể làm sau khi hoàn thành môn học.',
    bloomTaxonomy: {
      title: 'Các cấp độ phân loại Bloom',
      remember: {
        level: 'Nhớ',
        description: 'Nhớ lại các sự kiện và khái niệm cơ bản',
        verbs: 'Định nghĩa, Liệt kê, Nhớ lại, Xác định, Đặt tên, Phát biểu',
      },
      understand: {
        level: 'Hiểu',
        description: 'Giải thích các ý tưởng hoặc khái niệm',
        verbs: 'Mô tả, Giải thích, Tóm tắt, Diễn giải, Phân loại',
      },
      apply: {
        level: 'Áp dụng',
        description: 'Sử dụng thông tin trong các tình huống mới',
        verbs: 'Áp dụng, Chứng minh, Sử dụng, Thực hiện, Giải quyết, Thực thi',
      },
      analyze: {
        level: 'Phân tích',
        description: 'Rút ra mối liên hệ giữa các ý tưởng',
        verbs: 'Phân tích, So sánh, Đối chiếu, Kiểm tra, Phân biệt',
      },
      evaluate: {
        level: 'Đánh giá',
        description: 'Biện minh cho một lập trường hoặc quyết định',
        verbs: 'Đánh giá, Thẩm định, Biện minh, Phê bình, Bảo vệ, Phán xét',
      },
      create: {
        level: 'Sáng tạo',
        description: 'Tạo ra công việc mới hoặc độc đáo',
        verbs:
          'Sáng tạo, Thiết kế, Phát triển, Xây dựng, Hình thành, Soạn thảo',
      },
      verbs: 'Động từ',
    },
    clo: {
      add: 'Thêm CLO',
      remove: 'Xóa CLO',
      code: {
        label: 'Mã CLO',
        description: 'Mã tuần tự được tạo tự động',
      },
      bloomLevel: {
        label: 'Cấp độ phân loại Bloom',
        placeholder: 'Chọn cấp độ Bloom',
        description: 'Chọn cấp độ nhận thức cho chuẩn đầu ra này',
      },
      description: {
        label: 'Mô tả',
        placeholder: 'Bắt đầu bằng một động từ hành động (ví dụ: {verbs})...',
        description:
          'Mô tả những gì sinh viên sẽ có thể làm (tối thiểu 20 ký tự, phải bắt đầu bằng động từ hành động)',
      },
      suggestedVerbs: 'Động từ hành động được đề xuất cho {level}:',
      noCLOs: 'Chưa có CLO nào được định nghĩa. Nhấp "Thêm CLO" để bắt đầu.',
      minimumRequired: 'Cần ít nhất 3 CLO. Bạn hiện có {count} CLO.',
    },
  },

  // CLO-PLO Mapping Step
  cloPloMapping: {
    title: 'Ánh xạ CLO với PLO',
    description:
      'Ánh xạ mỗi Chuẩn đầu ra môn học (CLO) với ít nhất một Chuẩn đầu ra chương trình (PLO)',
    info: 'Chọn các PLO phù hợp cho mỗi CLO. Mỗi CLO phải được ánh xạ với ít nhất một PLO.',
    loadingPLOs: 'Đang tải PLO...',
    noPLOs: 'Không có PLO nào cho chương trình này',
    loadError: 'Không thể tải PLO. Vui lòng thử lại sau.',
    clo: 'CLO',
    plo: 'PLO',
    selectPLOs: 'Chọn PLO',
    selectedPLOs: '{count} PLO đã chọn',
    noPLOsSelected: 'Chưa chọn PLO nào',
    mappingRequired: 'Mỗi CLO phải được ánh xạ với ít nhất một PLO',
  },

  // Course Content Step
  courseContent: {
    sectionTitle: 'Nội dung môn học',
    sectionDescription: 'Định nghĩa các chủ đề hàng tuần và phân bổ giờ học',
    info: 'Thêm các chủ đề cho mỗi tuần của môn học. Tổng số giờ nên phù hợp với số tín chỉ (tín chỉ × 15).',
    addTopic: 'Thêm chủ đề',
    removeTopic: 'Xóa chủ đề',
    noTopics:
      'Chưa có chủ đề nào được định nghĩa. Nhấp "Thêm chủ đề" để bắt đầu.',
    week: 'Tuần',
    weekNumber: {
      label: 'Số tuần',
      description: 'Số tuần trong học kỳ',
    },
    title: {
      label: 'Tiêu đề',
      placeholder: 'Nhập tiêu đề chủ đề...',
      description: 'Tiêu đề ngắn gọn cho chủ đề',
    },
    topicDescription: {
      label: 'Mô tả',
      placeholder: 'Nhập mô tả chi tiết...',
      description: 'Mô tả chi tiết về nội dung sẽ được giảng dạy',
    },
    lectureHours: {
      label: 'Giờ lý thuyết',
      description: 'Số giờ lý thuyết (0-10)',
    },
    labHours: {
      label: 'Giờ thực hành',
      description: 'Số giờ thực hành (0-10)',
    },
    relatedCLOs: {
      label: 'CLO liên quan',
      placeholder: 'Chọn CLO',
      description: 'Chọn các CLO mà chủ đề này đề cập đến',
    },
    teachingMethods: {
      label: 'Phương pháp giảng dạy',
      placeholder: 'Chọn phương pháp',
      description: 'Chọn phương pháp giảng dạy sẽ được sử dụng',
      lecture: 'Giảng bài',
      discussion: 'Thảo luận',
      groupWork: 'Làm việc nhóm',
      lab: 'Thực hành',
      presentation: 'Thuyết trình',
      caseStudy: 'Nghiên cứu tình huống',
      project: 'Dự án',
    },
    totalHours: {
      label: 'Tổng số giờ',
      current: 'Hiện tại: {hours} giờ',
      expected: 'Dự kiến: {hours} giờ',
      warning: 'Tổng số giờ không khớp với số tín chỉ',
    },
  },

  // Assessment Methods Step
  assessmentMethods: {
    sectionTitle: 'Phương pháp đánh giá',
    sectionDescription: 'Định nghĩa các phương pháp đánh giá và trọng số',
    info: 'Thêm các phương pháp đánh giá cho môn học. Tổng trọng số phải bằng 100%.',
    addAssessment: 'Thêm đánh giá',
    removeAssessment: 'Xóa đánh giá',
    noAssessments:
      'Chưa có phương pháp đánh giá nào được định nghĩa. Nhấp "Thêm đánh giá" để bắt đầu.',
    type: {
      label: 'Loại',
      placeholder: 'Chọn loại đánh giá',
      description: 'Loại phương pháp đánh giá',
      quiz: 'Kiểm tra',
      assignment: 'Bài tập',
      midterm: 'Giữa kỳ',
      final: 'Cuối kỳ',
      project: 'Dự án',
      presentation: 'Thuyết trình',
    },
    name: {
      label: 'Tên',
      placeholder: 'Nhập tên đánh giá...',
      description: 'Tên mô tả cho đánh giá',
    },
    weight: {
      label: 'Trọng số (%)',
      description: 'Phần trăm của điểm tổng (0-100)',
    },
    relatedCLOs: {
      label: 'CLO liên quan',
      placeholder: 'Chọn CLO',
      description: 'Chọn các CLO mà đánh giá này đo lường',
    },
    assessmentDescription: {
      label: 'Mô tả',
      placeholder: 'Nhập mô tả (tùy chọn)...',
      description: 'Mô tả chi tiết về đánh giá',
    },
    totalWeight: {
      label: 'Tổng trọng số',
      current: 'Hiện tại: {weight}%',
      required: 'Yêu cầu: 100%',
      error: 'Tổng trọng số phải bằng 100%',
    },
  },

  // References Step
  references: {
    sectionTitle: 'Tài liệu tham khảo',
    sectionDescription: 'Thêm sách giáo khoa và tài liệu tham khảo',
    info: 'Thêm tài liệu tham khảo cho môn học. Ít nhất một sách giáo khoa bắt buộc phải được chỉ định.',
    addReference: 'Thêm tài liệu',
    removeReference: 'Xóa tài liệu',
    noReferences:
      'Chưa có tài liệu tham khảo nào được thêm. Nhấp "Thêm tài liệu" để bắt đầu.',
    type: {
      label: 'Loại',
      placeholder: 'Chọn loại',
      description: 'Loại tài liệu tham khảo',
      required: 'Bắt buộc',
      recommended: 'Đề xuất',
      online: 'Tài nguyên trực tuyến',
    },
    referenceTitle: {
      label: 'Tiêu đề',
      placeholder: 'Nhập tiêu đề...',
      description: 'Tiêu đề của sách hoặc tài liệu',
    },
    authors: {
      label: 'Tác giả',
      placeholder: 'Nhập tên tác giả...',
      description: 'Tác giả của tài liệu',
    },
    publisher: {
      label: 'Nhà xuất bản',
      placeholder: 'Nhập nhà xuất bản...',
      description: 'Nhà xuất bản (tùy chọn)',
    },
    year: {
      label: 'Năm xuất bản',
      placeholder: 'Nhập năm...',
      description: 'Năm xuất bản (1900 - hiện tại)',
    },
    isbn: {
      label: 'ISBN',
      placeholder: 'Nhập ISBN...',
      description: 'Mã ISBN 10 hoặc 13 chữ số (tùy chọn)',
    },
    url: {
      label: 'URL',
      placeholder: 'Nhập URL...',
      description: 'URL cho tài nguyên trực tuyến (tùy chọn)',
    },
    requiredTextbook: 'Ít nhất một sách giáo khoa bắt buộc phải được chỉ định',
  },

  // Preview Step
  preview: {
    title: 'Xem trước đề cương',
    description: 'Xem lại đề cương hoàn chỉnh trước khi nộp',
    editSection: 'Chỉnh sửa phần này',
    sections: {
      courseInformation: 'Thông tin môn học',
      learningOutcomes: 'Chuẩn đầu ra môn học',
      cloPloMapping: 'Ánh xạ CLO-PLO',
      courseContent: 'Nội dung môn học',
      assessmentMethods: 'Phương pháp đánh giá',
      references: 'Tài liệu tham khảo',
    },
  },

  // Auto-save Indicator
  autoSave: {
    saving: 'Đang lưu...',
    saved: 'Đã lưu',
    lastSaved: 'Lần lưu cuối',
    failedToSave: 'Không thể lưu',
    retry: 'Thử lại',
    justNow: 'vừa xong',
    secondsAgo: '{count} giây trước',
    minutesAgo: '{count} phút trước',
    hoursAgo: '{count} giờ trước',
  },

  // Status Tracker
  statusTracker: {
    title: 'Tiến trình phê duyệt',
    stage: 'Giai đoạn',
    of: 'của',
    complete: 'Hoàn thành',
    inProgress: 'Đang xử lý',
    completedOn: 'Hoàn thành vào',
    stages: {
      submitted: 'Đã nộp',
      hodReview: 'Trưởng khoa xem xét',
      academicManagerReview: 'Quản lý học thuật xem xét',
      approved: 'Đã phê duyệt',
    },
    status: {
      draft: 'Bản nháp',
      pendingReview: 'Chờ xem xét',
      revisionRequired: 'Yêu cầu sửa đổi',
      approved: 'Đã phê duyệt',
      rejected: 'Bị từ chối',
      archived: 'Đã lưu trữ',
    },
  },

  // Validation Results
  validationResults: {
    title: 'Kết quả xác thực',
    description: 'Kiểm tra các tiêu chí bắt buộc trước khi nộp',
    passed: 'Đã đạt',
    failed: 'Không đạt',
    allPassed: 'Tất cả tiêu chí đã đạt',
    issuesFound: 'Phát hiện vấn đề xác thực',
    someFailures: '{count} tiêu chí chưa đạt',
    fixIssues: 'Vui lòng khắc phục các vấn đề trước khi nộp',
    failedChecks: '{failed} trong số {total} kiểm tra xác thực không đạt. Vui lòng khắc phục các vấn đề bên dưới trước khi nộp.',
    allPassedMessage: '✓ Tất cả {count} kiểm tra xác thực đã đạt. Đề cương của bạn đã sẵn sàng để nộp.',
    criteria: {
      courseInformationComplete: 'Thông tin môn học đầy đủ',
      minimumCLOs: 'Tối thiểu 3 CLO',
      closPloMapped: 'Tất cả CLO được ánh xạ với PLO',
      contentCoversWeeks: 'Nội dung bao gồm số tuần dự kiến',
      hoursAligned: 'Tổng số giờ phù hợp với số tín chỉ',
      assessmentWeights: 'Tổng trọng số đánh giá bằng 100%',
      requiredTextbook: 'Ít nhất một sách giáo khoa bắt buộc',
      closAssessed: 'Tất cả CLO được đánh giá',
    },
    goToSection: 'Đi đến phần',
  },

  // Comment Thread
  commentThread: {
    title: 'Nhận xét',
    addComment: 'Thêm nhận xét',
    reply: 'Trả lời',
    edit: 'Chỉnh sửa',
    delete: 'Xóa',
    resolve: 'Giải quyết',
    resolved: 'Đã giải quyết',
    active: 'Đang hoạt động',
    noComments: 'Chưa có nhận xét nào',
    showResolved: 'Hiển thị đã giải quyết',
    hideResolved: 'Ẩn đã giải quyết',
    filterByType: 'Lọc theo loại',
    filterBySection: 'Lọc theo phần',
    allTypes: 'Tất cả loại',
    allSections: 'Tất cả phần',
    type: {
      label: 'Loại',
      placeholder: 'Chọn loại',
      suggestion: 'Đề xuất',
      question: 'Câu hỏi',
      error: 'Lỗi',
      general: 'Chung',
    },
    priority: {
      label: 'Mức độ ưu tiên',
      placeholder: 'Chọn mức độ ưu tiên',
      low: 'Thấp',
      medium: 'Trung bình',
      high: 'Cao',
    },
    section: {
      label: 'Phần tham chiếu',
      placeholder: 'Chọn phần (tùy chọn)',
      description: 'Chỉ định phần nào của đề cương mà nhận xét này đề cập đến',
    },
    text: {
      label: 'Nhận xét',
      placeholder: 'Nhập nhận xét của bạn...',
      description: 'Tối thiểu 10 ký tự, tối đa 1000 ký tự',
    },
    deleteConfirmation: {
      title: 'Xóa nhận xét',
      description:
        'Bạn có chắc chắn muốn xóa nhận xét này? Hành động này không thể hoàn tác.',
    },
    resolveConfirmation: {
      title: 'Giải quyết nhận xét',
      description: 'Đánh dấu nhận xét này là đã giải quyết?',
    },
  },

  // Messages
  messages: {
    inbox: 'Hộp thư đến',
    compose: 'Soạn tin nhắn',
    send: 'Gửi',
    recipient: {
      label: 'Người nhận',
      placeholder: 'Tìm kiếm người nhận...',
      description: 'Tìm kiếm theo tên hoặc email',
      noResults: 'Không tìm thấy người dùng',
    },
    subject: {
      label: 'Tiêu đề',
      placeholder: 'Nhập tiêu đề...',
      description: 'Tối đa 200 ký tự',
    },
    body: {
      label: 'Nội dung',
      placeholder: 'Nhập nội dung tin nhắn...',
      description: 'Tối đa 5000 ký tự',
    },
    attachments: {
      label: 'Tệp đính kèm',
      description: 'Tối đa 5 tệp, mỗi tệp tối đa 10MB',
      addAttachment: 'Thêm tệp đính kèm',
      removeAttachment: 'Xóa tệp đính kèm',
      maxFiles: 'Đã đạt giới hạn tệp tối đa (5)',
      maxSize: 'Kích thước tệp vượt quá 10MB',
    },
    linkedSyllabus: {
      label: 'Đề cương liên kết',
      placeholder: 'Chọn đề cương (tùy chọn)',
      description: 'Liên kết tin nhắn này với một đề cương cụ thể',
    },
    unread: 'Chưa đọc',
    read: 'Đã đọc',
    markAsRead: 'Đánh dấu đã đọc',
    markAsUnread: 'Đánh dấu chưa đọc',
    noMessages: 'Không có tin nhắn',
    conversation: 'Cuộc trò chuyện',
    reply: 'Trả lời',
    quickReply: 'Trả lời nhanh',
    from: 'Từ',
    to: 'Đến',
    sentAt: 'Đã gửi lúc',
    filter: {
      all: 'Tất cả',
      unread: 'Chưa đọc',
      read: 'Đã đọc',
    },
  },

  // Peer Review
  peerReview: {
    queue: {
      title: 'Hàng đợi đánh giá đồng nghiệp',
      description: 'Đề cương được phân công cho bạn để đánh giá',
      noReviews: 'Không có đánh giá nào được phân công',
      noSyllabiAssigned: 'Không có đề cương nào được phân công để đánh giá',
      filterByStatus: 'Lọc theo trạng thái',
      allStatuses: 'Tất cả trạng thái',
      assignedOn: 'Được phân công vào',
      assigned: 'Được phân công',
      dueDate: 'Hạn chót',
      due: 'Hạn chót',
      lecturer: 'Giảng viên',
      priority: {
        normal: 'Bình thường',
        high: 'Cao',
        highPriority: 'Ưu tiên cao',
      },
      status: {
        pending: 'Đang chờ',
        inProgress: 'Đang thực hiện',
        completed: 'Đã hoàn thành',
      },
      actions: {
        viewSyllabus: 'Xem đề cương',
        startReview: 'Bắt đầu đánh giá',
        continueReview: 'Tiếp tục đánh giá',
        viewReview: 'Xem đánh giá',
      },
      counts: {
        pending: '{count} Đang chờ',
        inProgress: '{count} Đang thực hiện',
      },
    },
    evaluation: {
      title: 'Biểu mẫu đánh giá',
      description: 'Đánh giá đề cương dựa trên các tiêu chí sau',
      criterion: 'Tiêu chí',
      score: 'Điểm',
      comment: 'Nhận xét',
      commentRequired: 'Nhận xét bắt buộc cho điểm thấp (≤2)',
      commentPlaceholder: 'Giải thích lý do cho điểm này...',
      overallScore: 'Điểm tổng thể',
      recommendation: {
        label: 'Khuyến nghị',
        placeholder: 'Chọn khuyến nghị',
        approve: 'Phê duyệt',
        needsRevision: 'Cần sửa đổi',
        reject: 'Từ chối',
      },
      summaryComments: {
        label: 'Nhận xét tóm tắt',
        placeholder: 'Cung cấp nhận xét tổng thể về đề cương...',
        description: 'Tối thiểu 50 ký tự',
      },
      saveDraft: 'Lưu bản nháp',
      submitEvaluation: 'Nộp đánh giá',
      rubricGuide: 'Hướng dẫn chấm điểm',
    },
    rubric: {
      title: 'Hướng dẫn chấm điểm',
      description: 'Hướng dẫn chi tiết cho việc chấm điểm từng tiêu chí',
      scoreLevel: 'Mức điểm',
      guidelines: 'Hướng dẫn',
      examples: 'Ví dụ',
      scores: {
        1: 'Không đạt yêu cầu',
        2: 'Dưới mức mong đợi',
        3: 'Đạt mức mong đợi',
        4: 'Vượt mức mong đợi',
        5: 'Xuất sắc',
      },
    },
    viewer: {
      title: 'Xem đề cương',
      readOnly: 'Chế độ chỉ đọc',
      print: 'In',
      export: 'Xuất',
      backToQueue: 'Quay lại hàng đợi',
    },
  },

  // Review Schedules
  reviewSchedules: {
    title: 'Lịch xem xét',
    description: 'Xem lịch xem xét và theo dõi tiến trình',
    calendar: {
      title: 'Lịch xem xét',
      description: 'Xem các kỳ xem xét và hạn chót cho khoa của bạn',
      month: 'Tháng',
      week: 'Tuần',
      today: 'Hôm nay',
      reviewPeriod: 'Kỳ xem xét',
      deadline: 'Hạn chót',
      noSchedules: 'Không có lịch xem xét nào',
      previousMonth: 'Tháng trước',
      nextMonth: 'Tháng sau',
      schedulesFor: 'Lịch cho',
      active: 'Đang hoạt động',
    },
    timeline: {
      title: 'Dòng thời gian nộp bài',
      description:
        'Theo dõi tiến trình của đề cương đã nộp qua quy trình phê duyệt',
      noSubmissions: 'Chưa có đề cương nào được nộp',
      viewDetails: 'Xem chi tiết',
      approvalTimeline: 'Dòng thời gian phê duyệt',
      submitted: 'Đã nộp',
      lastUpdated: 'Cập nhật lần cuối',
      hod: 'Trưởng khoa',
      academicManager: 'Quản lý học thuật',
      progress: 'Tiến trình',
      stages: {
        submitted: 'Đã nộp',
        hodReview: 'Trưởng khoa xem xét',
        academicManagerReview: 'Quản lý học thuật xem xét',
        approved: 'Đã phê duyệt',
      },
    },
    alerts: {
      title: 'Cảnh báo hạn chót',
      description: 'Hạn chót sắp tới trong vòng 7 ngày tới',
      noAlerts: 'Không có hạn chót sắp tới',
      noUpcomingDeadlines: 'Không có hạn chót sắp tới',
      daysRemaining: '{count} ngày còn lại',
      dayRemaining: '1 ngày còn lại',
      dueToday: 'Hết hạn hôm nay',
      dueTomorrow: 'Hết hạn ngày mai',
      overdue: 'Quá hạn {count} ngày',
      overdueBy: 'Quá hạn',
      due: 'Hạn chót',
      type: {
        submission: 'Nộp bài',
        revision: 'Sửa đổi',
        review: 'Xem xét',
      },
      urgency: {
        low: 'Thấp',
        medium: 'Trung bình',
        high: 'Cao',
        critical: 'Nghiêm trọng',
      },
    },
  },

  // Update Requests
  updateRequests: {
    title: 'Yêu cầu cập nhật',
    description: 'Yêu cầu thay đổi đối với đề cương đã phê duyệt',
    create: 'Tạo yêu cầu cập nhật',
    list: {
      title: 'Yêu cầu cập nhật của tôi',
      noRequests: 'Không có yêu cầu cập nhật nào',
      status: {
        draft: 'Bản nháp',
        pending: 'Đang chờ',
        approved: 'Đã phê duyệt',
        rejected: 'Bị từ chối',
      },
    },
    form: {
      title: 'Tạo yêu cầu cập nhật',
      description: 'Yêu cầu thay đổi đối với đề cương đã phê duyệt',
      syllabus: {
        label: 'Đề cương',
        placeholder: 'Chọn đề cương đã phê duyệt',
        description: 'Chọn đề cương bạn muốn cập nhật',
      },
      changeType: {
        label: 'Loại thay đổi',
        placeholder: 'Chọn loại thay đổi',
        description: 'Chọn loại thay đổi bạn muốn thực hiện',
        minorUpdate: 'Cập nhật nhỏ',
        contentRevision: 'Sửa đổi nội dung',
        majorRestructure: 'Tái cấu trúc lớn',
      },
      affectedSections: {
        label: 'Các phần bị ảnh hưởng',
        placeholder: 'Chọn các phần',
        description: 'Chọn các phần sẽ bị thay đổi',
      },
      justification: {
        label: 'Lý do',
        placeholder: 'Giải thích lý do cần cập nhật...',
        description:
          'Cung cấp lý do chi tiết cho việc cập nhật (tối thiểu 50 ký tự)',
      },
      effectiveSemester: {
        label: 'Học kỳ có hiệu lực',
        placeholder: 'Chọn học kỳ',
        description: 'Khi nào thay đổi này sẽ có hiệu lực',
      },
      urgency: {
        label: 'Mức độ khẩn cấp',
        placeholder: 'Chọn mức độ khẩn cấp',
        description: 'Mức độ khẩn cấp của yêu cầu này',
        normal: 'Bình thường',
        high: 'Cao',
      },
      supportingDocuments: {
        label: 'Tài liệu hỗ trợ',
        description: 'Tải lên bất kỳ tài liệu hỗ trợ nào',
        addDocument: 'Thêm tài liệu',
      },
      draftChanges: {
        title: 'Thay đổi đề xuất',
        description: 'Thực hiện các thay đổi đề xuất cho đề cương',
        original: 'Bản gốc',
        proposed: 'Đề xuất',
      },
      saveDraft: 'Lưu bản nháp',
      submitRequest: 'Nộp yêu cầu',
      cancel: 'Hủy yêu cầu',
    },
    statusTracker: {
      title: 'Trạng thái yêu cầu',
      description: 'Theo dõi tiến trình của yêu cầu cập nhật',
      submittedOn: 'Đã nộp vào',
      reviewedBy: 'Được xem xét bởi',
      decision: 'Quyết định',
      feedback: 'Phản hồi',
      noFeedback: 'Chưa có phản hồi',
    },
  },

  // Notifications
  notifications: {
    title: 'Thông báo',
    markAllAsRead: 'Đánh dấu tất cả đã đọc',
    noNotifications: 'Không có thông báo',
    syllabusStatusChanged: 'Trạng thái đề cương đã thay đổi',
    peerReviewAssigned: 'Được phân công đánh giá đồng nghiệp',
    newMessage: 'Tin nhắn mới',
    newComment: 'Nhận xét mới',
    deadlineApproaching: 'Sắp đến hạn',
  },

  // Notification Badge
  notificationBadge: {
    unread: 'chưa đọc',
    new: 'mới',
  },

  // Notification List
  notificationList: {
    unread: 'chưa đọc',
    read: 'đã đọc',
    all: 'Tất cả',
    allTypes: 'Tất cả loại',
    allStatus: 'Tất cả trạng thái',
    filterByType: 'Lọc theo loại thông báo',
    filterByStatus: 'Lọc theo trạng thái đã đọc',
    noUnread: 'Không có thông báo chưa đọc',
    types: {
      statusChange: 'Thay đổi trạng thái',
      peerReview: 'Đánh giá đồng nghiệp',
      message: 'Tin nhắn',
      deadline: 'Hạn chót',
      comment: 'Nhận xét',
    },
  },

  // Notification Preferences
  notificationPreferences: {
    title: 'Tùy chọn thông báo',
    description: 'Cấu hình cách thức và thời điểm nhận thông báo',
    loadError: 'Không thể tải tùy chọn thông báo',
    toast: {
      success: {
        title: 'Đã cập nhật tùy chọn',
        description: 'Tùy chọn thông báo của bạn đã được lưu.',
      },
      error: {
        description: 'Không thể cập nhật tùy chọn thông báo. Vui lòng thử lại.',
      },
    },
    deliveryMethods: {
      title: 'Phương thức gửi',
      email: {
        label: 'Thông báo qua Email',
        description: 'Nhận thông báo qua email',
        ariaLabel: 'Bật/tắt thông báo email',
      },
      inApp: {
        label: 'Thông báo trong ứng dụng',
        description: 'Hiển thị thông báo trong ứng dụng',
        ariaLabel: 'Bật/tắt thông báo trong ứng dụng',
      },
    },
    types: {
      title: 'Loại thông báo',
      statusChange: {
        label: 'Thay đổi trạng thái đề cương',
        description: 'Khi đề cương của bạn được phê duyệt hoặc yêu cầu sửa đổi',
        ariaLabel: 'Bật/tắt thông báo thay đổi trạng thái',
      },
      peerReview: {
        label: 'Phân công đánh giá đồng nghiệp',
        description: 'Khi bạn được phân công đánh giá một đề cương',
        ariaLabel: 'Bật/tắt thông báo đánh giá đồng nghiệp',
      },
      message: {
        label: 'Tin nhắn mới',
        description: 'Khi bạn nhận được tin nhắn mới',
        ariaLabel: 'Bật/tắt thông báo tin nhắn',
      },
      deadline: {
        label: 'Nhắc nhở hạn chót',
        description: 'Khi sắp đến hạn chót',
        ariaLabel: 'Bật/tắt thông báo hạn chót',
      },
      comment: {
        label: 'Nhận xét',
        description: 'Khi có người nhận xét về đề cương của bạn',
        ariaLabel: 'Bật/tắt thông báo nhận xét',
      },
    },
    timing: {
      title: 'Thời gian nhắc nhở hạn chót',
      remindMe: 'Nhắc tôi',
      daysBefore: '{count} ngày trước',
    },
  },

  // Submission
  submission: {
    title: 'Nộp đề cương để xem xét',
    reviewSummary:
      'Vui lòng xem lại tóm tắt bên dưới và xác nhận rằng đề cương của bạn đã sẵn sàng để nộp.',
    syllabusReady: 'Đề cương đã sẵn sàng để nộp',
    summary: 'Tóm tắt đề cương',
    course: 'Môn học',
    academicPeriod: 'Kỳ học',
    credits: 'Số tín chỉ',
    totalHours: 'Tổng số giờ',
    statistics: {
      clos: 'CLO',
      topics: 'Chủ đề',
      assessments: 'Đánh giá',
      references: 'Tài liệu',
    },
    notes: {
      label: 'Ghi chú nộp bài (Tùy chọn)',
      placeholder:
        'Thêm bất kỳ ghi chú hoặc nhận xét bổ sung nào cho người đánh giá...',
      description:
        'Tối đa 1000 ký tự. Những ghi chú này sẽ hiển thị cho người đánh giá.',
    },
    confirmation: {
      label:
        'Tôi xác nhận rằng đề cương này đã hoàn chỉnh và sẵn sàng để xem xét',
      description:
        'Bằng cách đánh dấu vào ô này, bạn xác nhận rằng tất cả thông tin đều chính xác và đề cương đáp ứng các tiêu chuẩn yêu cầu.',
    },
    submitting: 'Đang nộp đề cương...',
    submitForReview: 'Nộp để xem xét',
    success:
      'Đề cương đã được nộp thành công! Người đánh giá đã được thông báo.',
    validationRequired: 'Vui lòng xác thực đề cương trước khi nộp',
    checklistIncomplete:
      'Vui lòng hoàn thành tất cả các tiêu chí xác thực trước khi nộp',
  },

  // Syllabi List
  syllabiList: {
    title: 'Đề cương của tôi',
    description: 'Quản lý đề cương môn học của bạn',
    createNew: 'Tạo đề cương mới',
    noSyllabi: 'Chưa có đề cương nào',
    noSyllabiDescription: 'Bắt đầu bằng cách tạo đề cương đầu tiên của bạn',
    search: {
      placeholder: 'Tìm kiếm theo mã môn học hoặc tên môn học...',
    },
    filters: {
      status: {
        label: 'Trạng thái',
        all: 'Tất cả trạng thái',
      },
      academicYear: {
        label: 'Năm học',
        all: 'Tất cả năm học',
      },
      semester: {
        label: 'Học kỳ',
        all: 'Tất cả học kỳ',
      },
    },
    sort: {
      label: 'Sắp xếp theo',
      createdDate: 'Ngày tạo',
      modifiedDate: 'Ngày sửa đổi',
      courseCode: 'Mã môn học',
      ascending: 'Tăng dần',
      descending: 'Giảm dần',
    },
    columns: {
      courseCode: 'Mã môn học',
      courseName: 'Tên môn học',
      academicPeriod: 'Kỳ học',
      status: 'Trạng thái',
      lastModified: 'Sửa đổi lần cuối',
      actions: 'Hành động',
    },
    actions: {
      view: 'Xem',
      edit: 'Chỉnh sửa',
      submit: 'Nộp',
      withdraw: 'Rút lại',
      delete: 'Xóa',
      duplicate: 'Nhân bản',
      export: 'Xuất',
    },
    resultsCount: '{count} đề cương',
    clearFilters: 'Xóa bộ lọc',
  },

  // Dashboard
  dashboard: {
    title: 'Bảng điều khiển giảng viên',
    welcome: 'Chào mừng trở lại, {name}',
    overview: {
      title: 'Tổng quan',
      totalSyllabi: 'Tổng số đề cương',
      drafts: 'Bản nháp',
      pendingReview: 'Chờ xem xét',
      approved: 'Đã phê duyệt',
    },
    recentActivity: {
      title: 'Hoạt động gần đây',
      noActivity: 'Không có hoạt động gần đây',
    },
    upcomingDeadlines: {
      title: 'Hạn chót sắp tới',
      noDeadlines: 'Không có hạn chót sắp tới',
    },
    quickActions: {
      title: 'Hành động nhanh',
      createSyllabus: 'Tạo đề cương',
      viewReviews: 'Xem đánh giá',
      checkMessages: 'Kiểm tra tin nhắn',
    },
  },

  // Accessibility
  accessibility: {
    skipToMain: 'Bỏ qua đến nội dung chính',
    openMenu: 'Mở menu',
    closeMenu: 'Đóng menu',
    openDialog: 'Mở hộp thoại',
    closeDialog: 'Đóng hộp thoại',
    loading: 'Đang tải',
    required: 'Bắt buộc',
    optional: 'Tùy chọn',
    error: 'Lỗi',
    success: 'Thành công',
    warning: 'Cảnh báo',
    info: 'Thông tin',
  },

  // Errors
  errors: {
    generic: 'Đã xảy ra lỗi. Vui lòng thử lại.',
    networkError: 'Lỗi kết nối mạng. Vui lòng kiểm tra kết nối của bạn.',
    authenticationRequired: 'Yêu cầu xác thực',
    accessDenied: 'Truy cập bị từ chối',
    notFound: 'Không tìm thấy',
    conflict: 'Xung đột',
    validationFailed: 'Xác thực không thành công',
    pleaseLoginToContinue: 'Vui lòng đăng nhập để tiếp tục',
    noPermission: 'Bạn không có quyền thực hiện hành động này',
    resourceNotFound: 'Không tìm thấy tài nguyên được yêu cầu',
    syllabusNotFound: 'Không tìm thấy đề cương',
    cannotEditStatus: 'Không thể chỉnh sửa đề cương có trạng thái "{status}"',
    submissionFailed: 'Nộp đề cương không thành công',
    saveFailed: 'Lưu không thành công',
    loadFailed: 'Tải không thành công',
  },

  // Editor
  editor: {
    title: 'Chỉnh sửa đề cương',
    version: 'Phiên bản',
    lastUpdated: 'Cập nhật lần cuối',
    unsavedChanges: 'Có thay đổi chưa lưu',
    saveChanges: 'Lưu thay đổi',
    loadError: 'Không thể tải đề cương. Vui lòng thử lại.',
    accessDenied: {
      title: 'Không thể chỉnh sửa',
      description:
        'Đề cương này có trạng thái "{status}" và không thể chỉnh sửa.',
      dialogDescription:
        'Đề cương có trạng thái "{status}" không thể chỉnh sửa. Chỉ có thể chỉnh sửa đề cương ở trạng thái "Bản nháp" hoặc "Yêu cầu sửa đổi".',
    },
    revisionRequired: {
      title: 'Yêu cầu sửa đổi',
      description:
        'Đề cương này đã được xem xét và yêu cầu sửa đổi. Vui lòng xem phản hồi bên dưới.',
    },
    tabs: {
      editor: 'Chỉnh sửa',
      feedback: 'Phản hồi',
      history: 'Lịch sử',
    },
    feedback: {
      title: 'Phản hồi từ người đánh giá',
      description: 'Xem và trả lời các nhận xét từ người đánh giá',
      noComments: 'Không có nhận xét nào',
    },
    history: {
      title: 'Lịch sử phiên bản',
      description: 'Xem các thay đổi trước đây của đề cương',
      comingSoon: 'Tính năng này sẽ sớm có',
    },
  },

  // Version History
  versionHistory: {
    title: 'Lịch sử phiên bản',
    version: 'Phiên bản',
    current: 'Hiện tại',
    change: 'thay đổi',
    changes: 'thay đổi',
    noVersions: 'Chưa có lịch sử phiên bản',
    showDetails: 'Hiển thị chi tiết',
    hideDetails: 'Ẩn chi tiết',
    oldValue: 'Giá trị cũ',
    newValue: 'Giá trị mới',
    empty: '(trống)',
    compare: 'So sánh',
    compareMode: 'Chế độ so sánh',
    selected: 'Đã chọn',
    compareVersions: 'So sánh phiên bản',
    comparingVersions: 'So sánh phiên bản {from} với {to}',
    changesBetweenVersions: 'Thay đổi giữa các phiên bản',
    revert: 'Hoàn nguyên',
    revertConfirmation: {
      title: 'Xác nhận hoàn nguyên',
      description:
        'Bạn có chắc chắn muốn hoàn nguyên về phiên bản {version}? Hành động này sẽ tạo một phiên bản mới với nội dung từ phiên bản đã chọn.',
    },
  },
}

export type TranslationKey = typeof vi
