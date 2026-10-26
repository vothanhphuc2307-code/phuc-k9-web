# HỌC CÙNG PHÚC K9 — hướng dẫn deploy Vercel

## Kiến trúc trong source này

- `index.html`: frontend HTML/CSS/JavaScript.
- `api/*.js`: Vercel Functions (CommonJS).
- `lib/auth.js`: hash mật khẩu, cookie/session, CSRF và tiện ích tài khoản.
- `lib/redis.js`: client Upstash Redis.
- `lib/exam-utils.js`: kiểm tra schema, quy tắc rà soát đề và chuẩn hóa cách tính điểm.
- `lib/seed-exams.js`: dữ liệu đề mẫu được tách riêng khỏi API.
- `api/blob.js`: luồng upload và truy cập Vercel Blob.
- `api/exams.js`: ngân hàng đề server-side, lượt thi, lưu câu trả lời, chấm và lịch sử.
- `api/ai.js`: AI Tutor qua OpenAI Responses API; yêu cầu Redis để áp dụng hạn mức gọi.

## Cài đặt

1. Sao lưu project Vercel đang chạy và dữ liệu Redis trước khi deploy bản mới.
2. Tải source lên repository GitHub của project, giữ `index.html` tại thư mục gốc.
3. Cài dependency và deploy bằng Vercel. `package.json` yêu cầu Node.js 24.x.
4. Trong Vercel, kết nối Upstash Redis và Vercel Blob. Sau đó cấu hình các biến môi trường cần thiết ở dưới.
5. Chỉ sau khi kiểm tra Preview deployment, mới promote sang Production.

## Biến môi trường

- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`: bắt buộc cho tài khoản, phiên và dữ liệu học.
- `BLOB_READ_WRITE_TOKEN`: cần cho upload/tải private Blob.
- `ADMIN_USERNAME`: danh sách username Admin, nhiều tài khoản phân cách bằng dấu phẩy. Mọi username phải khớp tài khoản đã đăng ký.
- `APP_ORIGIN`: origin dùng trong luồng OAuth; mặc định production URL nếu không đặt.
- `OPENAI_API_KEY`: chỉ cần nếu dùng AI Tutor.
- `OPENAI_MODEL`: tùy chọn, mặc định `gpt-5.6-luna` trong source hiện tại.
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`: chỉ cần nếu bật Google OAuth.
- Các alias `KV_REST_API_URL` và `KV_REST_API_TOKEN` vẫn được `lib/redis.js` chấp nhận cho project cũ.

`env.example` chỉ minh họa tên biến và để trống giá trị; không điền secret vào file rồi commit lên GitHub.

## Các thay đổi bảo vệ trong bản audit

- API đề nhận được cả body đã parse bởi Vercel Functions lẫn body dạng stream.
- Đề nhập JSON được kiểm tra schema; đề còn câu thiếu/đánh dấu rà soát không được phát hành hoặc bắt đầu lượt thi qua API đề.
- Tính điểm dùng default theo từng trường scoring, không làm mất điểm Đúng/Sai khi chỉ khai báo một phần scoring.
- Lượt thi có thời hạn lưu, resume và nộp bài idempotent; sau hạn, máy chủ chấm dữ liệu đã lưu thay vì chấp nhận câu trả lời mới gửi muộn.
- AI Tutor có hạn mức lượt gọi trong Redis (8 lượt/phút và 40 lượt/giờ theo tài khoản hoặc IP) và giới hạn token đầu ra. Đăng nhập/đăng ký cũng có giới hạn theo IP để giảm spam và brute-force.
- Dữ liệu Toán mẫu được sửa đáp án câu 2 theo chính lời giải; bốn câu đúng/sai bị đảo trường lời giải/trang nguồn đã được chuẩn hóa. Câu 9 tính trung bình bằng 10,4, khớp đáp án B. Bốn câu Sinh phụ thuộc hình/đáp án chưa đủ vẫn cần Admin rà soát; không coi đây là xác nhận toàn bộ đáp án đã được đối chiếu với đề gốc chính thức.
- Phòng thi mới hiển thị bảng dữ liệu (`table`) và ảnh câu hỏi qua `imageUrl` cùng website trong `/assets/` hoặc `/exam-sources/`; bản này chưa có nút tải ảnh riêng từng câu vào Blob từ modal Admin.
- Kết quả từ bộ luyện tập cũ, tính trên trình duyệt, vẫn có thể lưu vào lịch sử cá nhân nhưng không cấp XP và không được tính vào BXH. XP/BXH mới yêu cầu `attempt_id` của lượt thi đã được API phòng thi chấm ở máy chủ.

## Lưu ý quan trọng

Bản source này đã thay đổi cấu trúc/logic một số API, nhưng chưa thể kiểm thử trên tài khoản, Redis, Blob hay cấu hình production của bạn từ ZIP. Hãy dùng Preview deployment và checklist kiểm thử trước khi đưa lên Production. Không xóa key Redis hoặc chạy migration phá hủy dữ liệu để “làm sạch” dashboard.


## Academic Notebook UI refresh (2026-10-27)

- `assets/phuck9-academic-ui.css` styles the existing shell as a warm study-notebook interface (paper, soft lavender, mint and peach) and provides a separate touch-first mobile layout.
- `assets/phuck9-academic-ui.js` adds short page entrances, one-time reveal transitions and active navigation sync. It respects `prefers-reduced-motion`; it does not use continuous decorative animation.
- The forced exam-bank maintenance overlays were removed so the existing internal/server exam-bank UI can render again. If the server returns an empty list, the app should show its real empty/error state rather than a fake maintenance screen.
- Low-performance mode no longer turns off every transition/shadow solely because the device has four or fewer CPU threads. It still avoids expensive blur when manually enabled or when the network/device profile warrants it.
- `sw.js` cache version changed to `phuc-k9-app-v3-academic-ui`; exam-center asset URLs were versioned to prevent an older static asset from being reused.

Deploy on a Preview first. Test light/dark theme, mobile navigation, login, Admin exam management and a complete attempt. UI refresh has not been deployed to the live Vercel project by this ZIP.
