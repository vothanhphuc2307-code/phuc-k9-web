# Học Cùng Phúc K9 — Báo cáo audit và nâng cấp source

Ngày thực hiện: 26/10/2026

## 1. Phạm vi và giới hạn

Đã đọc source ZIP được cung cấp, chỉnh sửa trực tiếp trên bản sao làm việc và thực hiện kiểm tra cú pháp cùng các bài test mô phỏng bằng Node.js. Không sửa dữ liệu production, không chạy migration Redis và không deploy lên Vercel.

Chưa có quyền truy cập cấu hình production, Redis Upstash thật, Vercel Blob thật, tài khoản học viên/Admin hoặc môi trường trình duyệt của production. Vì vậy, các bài test dưới đây xác nhận hành vi của mã trong harness mô phỏng, không thay thế kiểm thử integration trên Preview deployment.

## 2. Kiến trúc đã xác minh từ source

- Frontend: HTML/CSS/JavaScript thuần, trang chính `index.html`.
- Backend: Vercel Functions, CommonJS trong thư mục `api/`.
- Dữ liệu ứng dụng: Upstash Redis, được truy cập qua `lib/redis.js`.
- File: Vercel Blob, luồng upload và đọc hiện có trong `api/blob.js`.
- AI Tutor: OpenAI Responses API qua `api/ai.js`.
- Package khai báo Node.js `24.x`; môi trường kiểm tra mã hiện tại là Node.js `22.16.0`.

Không có database migration nào được thực hiện.

## 3. Thay đổi trong bản source này

### Phòng luyện đề phía máy chủ

- Tách ngân hàng đề mẫu khỏi API vào `lib/seed-exams.js`.
- Thêm `lib/exam-utils.js` để kiểm tra cấu trúc đề, chuẩn hóa thang điểm, đánh dấu câu cần Admin rà soát và giới hạn `imageUrl` vào đường dẫn cùng website trong `/assets/` hoặc `/exam-sources/`.
- Nâng cấp `api/exams.js`: nhập JSON thành bản nháp, kiểm tra trước khi xuất bản, ẩn đề thay vì xóa, danh sách Admin, bắt đầu/lưu/khôi phục/nộp bài và lịch sử thi; che đáp án trong payload trước khi nộp; chấm điểm tại máy chủ; chống ghi nhận một lượt thi nhiều lần; chặn lượt thi chưa được rà soát.
- Thêm giao diện ngân hàng đề và phòng thi trong `assets/exam-center.js`/`assets/exam-center.css`, gắn vào trang hiện tại thay vì thay toàn bộ frontend.
- Hỗ trợ lọc/tìm đề, timer, đánh dấu câu, autosave, resume, kết quả/lịch sử, Admin nhập JSON, xem trước, lưu nháp, xuất bản, nhân bản, xuất JSON và ẩn đề.

### Bảo vệ API

- `api/auth.js`: giới hạn tần suất đăng nhập/đăng ký theo IP ở mức cơ bản.
- `api/ai.js`: giới hạn AI Tutor ở 8 lượt/phút và 40 lượt/giờ theo tài khoản hoặc IP, giới hạn output tokens, dùng `store: false`; fail-closed khi Redis không sẵn sàng để tránh endpoint trả phí không được giới hạn.
- `api/dashboard.js`: XP và BXH chỉ ghi nhận từ lượt thi có `attempt_id` được backend xác minh. Kết quả từ bộ tự luyện cũ vẫn có thể lưu vào lịch sử cá nhân nhưng được đánh dấu chưa xác minh, không cấp XP và không đưa vào BXH.
- `lib/auth.js`: xử lý an toàn hơn với cookie có percent-encoding sai định dạng.
- `sw.js`: tăng phiên bản cache để trình duyệt có cơ hội lấy asset mới.
- `env.example` và `README-VERCEL.md`: làm sạch/hướng dẫn biến môi trường; không điền giá trị bí mật.

### Sửa dữ liệu đề mẫu đã xác định được

- Đề Toán Lâm Đồng 2026, câu trắc nghiệm số 2: đáp án `C` trong dữ liệu không khớp lời giải mô tả diện tích; dữ liệu đã được chỉnh thành `B` theo lời giải hiện có.
- Bốn câu đúng/sai trong đề Toán có trường `explanation` và `sourcePage` bị đảo; đã chuẩn hóa.
- Câu 9 tính trung bình: trung bình là `(2×2 + 4×6 + 7×10 + 4×14 + 3×18) / 20 = 10,4`, khớp đáp án B; câu này không bị gắn cờ cần rà soát.
- Đề Sinh Điện Biên vẫn có 4 câu cần Admin rà soát vì đáp án/hình chưa đủ chắc chắn. Các câu này không được cho xuất bản qua API phòng thi cho tới khi người quản trị hoàn tất rà soát.

Các chỉnh sửa dữ liệu không phải lời cam kết rằng toàn bộ đáp án của mọi đề mẫu đã được đối chiếu độc lập với đề gốc chính thức.

## 4. Bảng vấn đề và cách xử lý

| Ưu tiên | Phát hiện / rủi ro | Bằng chứng | Cách xử lý trong source |
|---|---|---|---|
| P0 | Cần bảo vệ kết quả và XP khỏi điểm do trình duyệt tự khai | Luồng dashboard cũ nhận kết quả từ frontend; không thể tin điểm do client tự gửi | Điểm mới phải bắt nguồn từ attempt đã chấm trên server; kết quả legacy được đánh dấu `verified:false` và không cấp XP/BXH |
| P0 | Cần ngăn đáp án lộ trước khi nộp | Backend phòng thi cần phân biệt dữ liệu công khai và dữ liệu chấm | Payload đề trước khi nộp không chứa đáp án; kết quả/lời giải trả sau khi attempt đã nộp và thuộc tài khoản đó |
| P0 | Cần kiểm soát quyền Admin ở backend | Có API sửa/nhập/xuất bản đề và upload file | Các action quản trị kiểm tra session/username ở API, không dựa vào việc ẩn nút frontend |
| P1 | Đề nhập JSON có thể thiếu trường hoặc câu trùng ID | Cần schema để tránh publish đề lỗi | Validate schema, câu ID trùng, loại câu hỏi và scoring; đề chưa đủ đáp án/hình không được publish |
| P1 | Nộp bài lặp hoặc quá giờ có thể tạo kết quả sai | Người dùng có thể bấm nhiều lần hoặc gửi lại sau timeout | Khóa lượt thi, kết quả nộp lặp trả lại kết quả cũ; khi hết giờ chấm dữ liệu máy chủ đã lưu |
| P1 | AI endpoint trả phí có nguy cơ bị spam | `api/ai.js` nhận yêu cầu và gọi OpenAI | Thêm quota Redis theo tài khoản/IP, giới hạn chiều dài câu hỏi và số token đầu ra |
| P1 | Cookie lỗi encoding không nên gây lỗi handler | Cookie có thể chứa dữ liệu percent-encoding không hợp lệ | `lib/auth.js` bắt lỗi parse cookie |
| P1 | Cache cũ có thể tiếp tục phục vụ JS cũ sau deploy | Có `sw.js` trong source | Tăng cache version; asset phòng thi có query version |
| P2 | Frontend nguyên bản lớn và khó bảo trì | `index.html` khoảng 1,45 MB, nhiều script/style inline và ID lặp | Chưa viết lại trang lớn; tính năng mới tách sang `assets/exam-center.js` và `.css` để giảm rủi ro thay đổi lan rộng |

## 5. Kiểm thử đã chạy

### Kiểm tra tĩnh

- `node --check` cho các file JavaScript trong project: PASS.
- JSON parse cho `package.json`, `vercel.json`, `manifest.webmanifest`, `exam-template.json`: PASS.
- `exam-template.json` qua schema validator: PASS.
- Kiểm thử đường dẫn ảnh: chấp nhận đường dẫn cùng site phù hợp; từ chối URL ngoài, đường dẫn traversal và URL protocol-relative: PASS.
- Kiểm tra chuẩn hóa scoring khi chỉ cung cấp một phần scoring: PASS.

### Harness mô phỏng API đề và dashboard

Các ca đã qua: ẩn đề chưa rà soát; hiện số câu cần rà soát trong Admin; áp dụng sửa đáp án seed; import JSON thành nháp; publish đề hợp lệ; bắt đầu lượt thi; lưu và khôi phục câu trả lời mà không lộ key; chấm điểm server-side; nộp lặp trả cùng kết quả; ghi lịch sử một lần; dashboard lấy điểm từ attempt đã xác minh; XP idempotent; điểm client cũ không cấp XP/BXH; từ chối câu hỏi ID trùng; ẩn đề nhưng giữ dữ liệu.

### Harness mô phỏng xác thực

- 30 lần đăng nhập sai đầu tiên nhận xử lý lỗi thông tin đăng nhập theo harness.
- Lần thứ 31 bị giới hạn tốc độ.

Các bài test dùng mock Redis/Blob/auth; chưa kiểm tra với dịch vụ thật.

## 6. Những việc chưa hoàn thành / phải làm trước production

1. Chưa deploy bản này lên Vercel; chưa có xác minh end-to-end với Redis, Vercel Blob, OAuth, tài khoản thật hoặc trình duyệt production.
2. Chưa chạy Lighthouse hoặc đo thời gian tải/INP/LCP trước-sau. Không có số liệu hiệu năng được tuyên bố.
3. Chưa tái cấu trúc toàn bộ `index.html`; phần UI mới được gắn vào trang hiện có nhằm tránh thay toàn bộ website trong một bước.
4. Modal Admin hiện hỗ trợ ảnh thông qua `imageUrl` cùng website (`/assets/` hoặc `/exam-sources/`), nhưng chưa có nút upload riêng từng ảnh câu hỏi lên Blob trong modal.
5. Bốn câu của đề Sinh cần Admin xem đề nguồn/ảnh và điền đáp án chính xác trước khi publish.
6. Các điểm/XPs đã được lưu dưới phiên bản cũ không thể tự xác minh lại lịch sử chỉ từ source. Bản này không xóa hoặc tự sửa hàng loạt dữ liệu cũ; cần chính sách riêng nếu muốn đối soát lịch sử.
7. Rate limit đăng nhập theo IP là lớp giảm spam cơ bản, không thay thế hệ thống phát hiện tấn công phân tán hoặc dịch vụ chống bot.
8. `package.json` khai báo Node.js 24.x; hãy dùng Node 24 trong cấu hình build/Preview để khớp môi trường khai báo. Chưa chạy install/build với phiên bản đó trong lần audit này.
9. Cần kiểm tra model ID OpenAI và quyền/billing của API key trong cấu hình tài khoản. Source mặc định `gpt-5.6-luna`; API chính thức liệt kê model ID này, nhưng điều đó không bảo đảm tài khoản của dự án đã có quyền gọi.

## 7. Checklist triển khai an toàn

1. Sao lưu source GitHub và export/backup dữ liệu Redis theo cơ chế hiện có trước khi thay đổi production.
2. Đặt bản source này ở branch riêng, không ghi đè production ngay.
3. Kiểm tra biến môi trường qua Vercel Project Settings; không chia sẻ token hoặc chèn secret vào frontend.
4. Dùng Node.js 24.x, kiểm tra build/install và tạo Preview Deployment.
5. Đăng nhập tài khoản thường và Admin riêng; thử nhập JSON sai, nhập đề hợp lệ nhưng còn nháp, rà đáp án, publish, thi, tải lại, hết giờ, nộp lặp và xem lịch sử.
6. Xác nhận đề/đáp án chưa nộp không thể lấy từ response công khai; thử API Admin trực tiếp khi không có quyền.
7. Kiểm tra upload/tải tài liệu bằng Blob thật, hạn mức AI, giới hạn đăng nhập và Service Worker sau khi deploy Preview.
8. Chỉ promote Production sau khi checklist pass; không xóa key Redis để xử lý lỗi.

## 8. Trạng thái kết luận

Đây là bản nâng cấp source có kiểm thử logic mô phỏng, không phải xác nhận triển khai production. Các thay đổi tập trung vào ngân hàng đề/phòng thi, xác thực đầu vào, chấm điểm server-side, XP/BXH đã xác minh và hạn chế lạm dụng API; giao diện lớn cũ được giữ lại và mở rộng bằng asset tách riêng.
