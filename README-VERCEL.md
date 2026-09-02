# HỌC CÙNG PHÚC K9 — bản sửa Vercel

Bản này chuyển toàn bộ backend cũ từ PHP sang Vercel Functions, Upstash Redis và Vercel Blob.

## Cấu trúc

- `index.html`: giao diện đã sửa endpoint + upload trực tiếp tới Blob
- `api/auth.js`: đăng ký / đăng nhập / session / save-state / logout
- `api/ai.js`: AI Tutor qua OpenAI Responses API
- `api/community.js`: danh sách + tìm kiếm kho tài liệu
- `api/blob.js`: phát token upload Blob và lưu metadata sau khi upload
- `api/health.js`: kiểm tra Redis / Blob / OpenAI env
- `lib/auth.js`: cookie/session/password/CSRF
- `lib/redis.js`: Redis client

## Trên Vercel cần làm

1. Upload toàn bộ thư mục này vào project, giữ `index.html` ở root.
2. `npm install`/deploy để Vercel cài `@upstash/redis`, `@vercel/blob`, `openai`.
3. Vercel → Storage → tạo/connect **Upstash Redis**. Upstash hiện khuyến nghị `@upstash/redis` và các biến `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`.
4. Vercel → Storage → tạo/connect **Blob**. Vercel sẽ thêm `BLOB_READ_WRITE_TOKEN` cho project.
5. Vercel → Settings → Environment Variables: thêm `OPENAI_API_KEY`. Có thể thêm `OPENAI_MODEL` nếu muốn dùng model khác.
6. Redeploy Production.

## Vì sao upload không đi qua `/api/community`

Vercel Functions giới hạn request body 4.5 MB. Trang cũ cho phép tới 25 MB nhưng lại POST file trực tiếp vào PHP endpoint, nên thiết kế đó không phù hợp với Vercel. Bản sửa dùng Vercel Blob Client Upload: browser gửi file trực tiếp tới Blob, còn function `/api/blob` chỉ cấp token + ghi metadata. Đây là luồng được Vercel khuyến nghị cho file lớn hơn 4.5 MB.

## Lưu ý

- Bản này dùng public Blob URL để nút “Tải về” hoạt động trực tiếp cho cộng đồng. Nếu cần tài liệu private, phải đổi sang private Blob + presigned URL.
- Account được lưu server-side trong Redis; session nằm trong cookie HttpOnly nên reload/F5/F12 không tự làm mất đăng nhập.
- Mật khẩu được hash bằng `scrypt` ở server, không lưu plaintext.
