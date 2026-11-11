# Quy chuẩn làm việc cho Claude Code

> **Phạm vi:** Dự án Node.js. Đây là quy ước cho repository; không giả định rằng skill, agent, framework hay package nào đã được cài đặt.
> **Ngôn ngữ:** Trao đổi và tài liệu bằng tiếng Việt, trừ khi người dùng hoặc dự án yêu cầu khác. Giữ nguyên tên API, identifier và thuật ngữ kỹ thuật khi cần.

## 1. Thứ tự ưu tiên

Khi các hướng dẫn xung đột, áp dụng theo thứ tự:

1. Yêu cầu trực tiếp của người dùng trong phiên hiện tại.
2. Quy tắc bảo mật và an toàn của nền tảng.
3. Hướng dẫn gần nhất trong repository (CLAUDE.md, AGENTS.md và hướng dẫn theo thư mục).
4. Quy ước hiện có của codebase.
5. Các mặc định trong file này.

Không âm thầm bỏ qua xung đột có ảnh hưởng đến hành vi, bảo mật hoặc dữ liệu. Nêu rõ xung đột và hỏi người dùng nếu chưa thể chọn phương án an toàn.

## 2. Nguyên tắc bắt buộc

- Đọc hướng dẫn trong repository và kiểm tra trạng thái thay đổi trước khi sửa.
- Xác định đúng phạm vi yêu cầu; không sửa, định dạng lại hoặc xóa phần không liên quan.
- Tìm cách triển khai sẵn có trước khi tạo abstraction, dependency, skill hoặc agent mới.
- Ưu tiên thay đổi nhỏ, có kiểu dữ liệu rõ ràng, xử lý lỗi minh bạch và giữ tương thích ngược.
- Không bịa kết quả kiểm thử, trạng thái lệnh, API, dependency hoặc cấu trúc dự án.
- Không ghi secret, token, dữ liệu cá nhân hay nội dung nhạy cảm vào mã nguồn, log, prompt hoặc tài liệu.
- Không thực hiện thao tác phá hủy dữ liệu, thay đổi hạ tầng, phát hành hay commit nếu chưa được yêu cầu rõ ràng.
- Khi yêu cầu chưa đủ rõ và có nhiều lựa chọn ảnh hưởng đáng kể, hỏi người dùng trước khi chọn.
- Không tạo tài liệu kế hoạch hoặc file phụ nếu người dùng không yêu cầu và công việc không cần chúng.

## 3. Quy trình xử lý yêu cầu

Thực hiện lần lượt; bỏ qua bước chỉ khi không liên quan và nêu lý do trong phần tổng kết nếu việc bỏ qua có ý nghĩa.

### A. Khảo sát

1. Tóm tắt mục tiêu và tiêu chí hoàn thành.
2. Đọc hướng dẫn, manifest, cấu hình và các file liên quan trước khi chỉnh sửa.
3. Kiểm tra thay đổi hiện có; không ghi đè công việc chưa được yêu cầu.
4. Tìm kiếm cách xử lý hoặc helper tương tự để tái sử dụng.

### B. Lập cách làm

1. Chọn thay đổi nhỏ nhất đáp ứng đầy đủ tiêu chí.
2. Liệt kê các bề mặt liên quan: runtime, API, dữ liệu, cấu hình, tài liệu và kiểm thử.
3. Nếu có quyết định sản phẩm/kiến trúc đáng kể chưa được xác định, hỏi trước khi triển khai.
4. Chỉ giao việc cho agent khi phần việc độc lập, có ranh giới rõ và thực sự cần thêm ngữ cảnh hoặc thời gian.

### C. Triển khai

1. Giữ nguyên pattern, naming, formatting và mức tương thích của dự án.
2. Xử lý input không hợp lệ và lỗi theo quy ước hiện có; không che lỗi bằng fallback thành công giả.
3. Cập nhật kiểm thử và tài liệu liên quan trực tiếp đến thay đổi.
4. Không thêm dependency hoặc thay đổi public API nếu không cần thiết cho yêu cầu.

### D. Xác minh

1. Chọn lệnh kiểm tra nhỏ nhất nhưng trực tiếp xác minh hành vi được yêu cầu.
2. Chạy test, lint, type-check hoặc build phù hợp với thay đổi và script sẵn có trong manifest.
3. Nếu kiểm tra thất bại, đọc lỗi và sửa nguyên nhân do thay đổi gây ra; không tuyên bố thành công khi chưa xác minh.
4. Nếu không thể chạy kiểm tra, nêu chính xác lệnh chưa chạy và lý do.

### E. Tổng kết

Trả lời ngắn gọn bằng các mục:

- **Đã làm:** hành vi hoặc file được thay đổi.
- **Xác minh:** lệnh đã chạy và kết quả; hoặc lý do không chạy.
- **Lưu ý:** rủi ro, giới hạn hoặc quyết định còn cần người dùng xác nhận (nếu có).

## 4. Quy ước Node.js

- Kiểm tra `package.json`, lockfile, phiên bản Node và cấu hình hiện hữu trước khi dùng lệnh hoặc API mới.
- Dùng package manager tương ứng với lockfile; không tạo lockfile thứ hai.
- Ưu tiên API chuẩn của Node.js và dependency đã có trước khi bổ sung package.
- Theo module system hiện hữu (`import`/ESM hoặc `require`/CommonJS); không chuyển đổi module system ngoài phạm vi yêu cầu.
- Giữ tương thích với phiên bản Node được khai báo; không dựa vào API mới hơn mà chưa xác minh.
- Xác thực dữ liệu tại biên hệ thống; không tin dữ liệu từ request, file, môi trường hoặc process bên ngoài.
- Giữ lỗi có ngữ cảnh và truyền lỗi theo pattern hiện có; không nuốt exception hoặc trả response thành công giả.
- Không log secret, credential, token, session identifier hoặc payload nhạy cảm.
- Với thay đổi hành vi, thêm hoặc cập nhật test theo framework hiện có. Không cài test framework mới chỉ để kiểm tra một thay đổi nhỏ.
- Không chạy migration, ghi dữ liệu production, gọi dịch vụ thật hoặc thực hiện deploy trong quá trình kiểm thử nếu chưa có cho phép rõ ràng.

## 5. Kỹ năng (skills) và cách chọn

Chỉ sử dụng skill thực sự khả dụng trong môi trường. Không tuyên bố đã gọi một skill nếu skill đó không tồn tại hoặc chưa được kích hoạt. Nếu cần tạo skill lâu dài, đặt tại `.claude/skills/<ten-skill>/SKILL.md` theo format của Claude Code; không nhồi hướng dẫn dự án vào một skill giả định.

| Skill / năng lực | Dùng khi | Đầu ra bắt buộc |
|---|---|---|
| Khảo sát codebase | Cần tìm entry point, luồng xử lý hoặc quy ước | File/symbol liên quan và bằng chứng đọc được |
| Triển khai Node.js | Có yêu cầu sửa hoặc thêm hành vi | Thay đổi đúng phạm vi, xử lý lỗi và kiểm thử liên quan |
| Debugging | Có lỗi tái hiện được hoặc thông báo lỗi | Nguyên nhân gốc, bước tái hiện và xác minh sau sửa |
| Kiểm thử | Hành vi có thể kiểm tra tự động | Test sát yêu cầu và kết quả chạy lệnh |
| Refactor | Người dùng yêu cầu hoặc refactor cần thiết để sửa đúng | Không đổi hành vi ngoài phạm vi; test xác nhận |
| Rà soát bảo mật | Người dùng yêu cầu security review hoặc tìm lỗ hổng khai thác | Findings có mức độ, vị trí, tác động và confidence; không tự triển khai exploit |
| Tài liệu | Hành vi, cấu hình hoặc API thay đổi | Cập nhật đúng tài liệu hiện có, không tạo tài liệu thừa |

### Định dạng skill khi tạo mới

Mỗi skill phải có tên và mô tả phạm vi rõ ràng; nội dung cần nêu:

1. **Mục tiêu**
2. **Khi nào dùng / không dùng**
3. **Input cần có**
4. **Quy trình thực hiện**
5. **Giới hạn và điều cấm**
6. **Định dạng đầu ra**
7. **Cách xác minh**

Không tạo skill trùng phạm vi với skill đã có. Kiểm tra quy ước và cấu trúc Claude Code hiện hành của dự án trước khi thêm metadata.

## 6. Sub-agent: vai trò và quy tắc giao việc

Chỉ dùng sub-agent nếu runtime cung cấp agent phù hợp. Mặc định tự xử lý công việc ngắn, tra cứu đơn giản, hoặc một luồng điều tra liên tục. Không giao nhiều agent cùng sửa một file hoặc cùng thực hiện một mục tiêu.

| Vai trò | Phạm vi phù hợp | Không giao |
|---|---|---|
| **Explorer** | Khảo sát độc lập nhiều khu vực hoặc tìm prior art; chỉ đọc | Sửa file, kết luận khi chưa có bằng chứng |
| **Implementer** | Một thay đổi độc lập, có file và tiêu chí đầu ra xác định | Việc phụ thuộc vào quyết định sản phẩm chưa được chốt |
| **Test runner** | Chạy test/build/lint có phạm vi xác định và báo lỗi | Sửa code, trừ khi được giao rõ |
| **Reviewer** | Đọc diff để phát hiện lỗi logic, regression hoặc thiếu test | Thực hiện lại toàn bộ công việc hay tự sửa |
| **Security reviewer** | Rà soát bảo mật theo yêu cầu rõ ràng | Viết exploit hoặc chủ động tấn công hệ thống |

### Mẫu giao việc bắt buộc

Mỗi lần giao agent phải cung cấp:

```text
Mục tiêu:
Phạm vi file/thư mục:
Chỉ dẫn đọc/sửa:
Tiêu chí hoàn thành:
Kiểm tra cần chạy:
Giới hạn và điểm dừng:
Đầu ra cần trả về:
```

Yêu cầu agent báo file đã đọc/sửa, bằng chứng, lệnh đã chạy và kết quả. Người điều phối chịu trách nhiệm tích hợp, kiểm tra xung đột và xác minh cuối; không mặc định tin rằng agent đã hoàn tất chỉ từ lời khẳng định.

## 7. Cấu trúc repository khuyến nghị

Đây là quy ước định hướng, không phải yêu cầu tạo toàn bộ cây thư mục. Giữ cấu trúc thực tế hiện có của dự án; chỉ thêm thư mục khi có nội dung cần đặt vào đó.

```text
.
├── CLAUDE.md
├── package.json
├── src/
├── test/                 # hoặc tests/, theo quy ước sẵn có
└── .claude/
    ├── agents/           # agent chuyên biệt; chỉ tạo khi có nhu cầu ổn định
    └── skills/           # mỗi skill ở .claude/skills/<ten-skill>/SKILL.md
```

### Quy tắc cấu trúc

- Không tạo `src/`, `test/`, `.claude/agents/` hoặc `.claude/skills/` nếu chưa có lý do thực tế.
- Tôn trọng cấu trúc và tên thư mục hiện có; không di chuyển file chỉ để khớp ví dụ.
- Tách mã nguồn, kiểm thử và cấu hình theo pattern hiện tại; đặt test gần mã hoặc trong thư mục test theo quy ước của repository.
- Tệp hướng dẫn cấp thư mục chỉ tạo khi có quy tắc riêng thực sự cần thiết; tránh lặp lại hoặc mâu thuẫn với `CLAUDE.md`.
- Mọi thay đổi trong `.claude/` phải có mục đích, phạm vi và cách kích hoạt rõ ràng.

## 8. Tiêu chí hoàn thành

Chỉ coi yêu cầu hoàn tất khi:

- Hành vi đáp ứng đúng yêu cầu, không chỉ chỉnh sửa hình thức.
- Các thay đổi không liên quan được giữ nguyên.
- Test/kiểm tra phù hợp đã chạy hoặc giới hạn được nói rõ.
- Tài liệu trực tiếp liên quan đã cập nhật nếu hành vi hoặc cách dùng thay đổi.
- Phần tổng kết nêu chính xác những gì đã làm và chưa làm.
