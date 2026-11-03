# PHÚC K9 — TẠM KHÓA APP

Gói này đặt website ở chế độ thông báo tạm ngưng hoạt động. Trang hiện tại là `index.html`; các chức năng học tập không được tải vào trang người dùng.

## Triển khai lên Vercel

1. Giải nén ZIP.
2. Đưa **nội dung bên trong** thư mục `phuc-k9-web-main` vào đúng repository đang kết nối với Vercel (giữ `index.html` ở thư mục gốc).
3. Giữ nguyên các thư mục `api/`, `lib/`, `assets/` và các file cấu hình. Chúng được bảo toàn để không làm mất backend hoặc dữ liệu triển khai.
4. Commit và deploy Production như cách ông vẫn deploy project.
5. Sau khi deploy, mở website bằng tab ẩn danh hoặc refresh mạnh (Ctrl + Shift + R) để kiểm tra màn hình khóa.

## Mở lại website khi sẵn sàng

1. Sao chép `index.original.html` đè lên `index.html`.
2. Sao chép `sw.original.js` đè lên `sw.js`.
3. Commit và deploy lại.
4. Mở website, refresh mạnh. Nếu thiết bị vẫn giữ bản cũ, đóng tab/app rồi mở lại khi có mạng để Service Worker cập nhật.

## Nội dung hiển thị

- Tiêu đề lớn: **KHÓA APP**.
- Thông báo: “Vì bị hạ hạnh kiểm, nên xin phép ngưng hoạt động 1 thời gian để ổn định lại.”
- Lời cảm ơn: “CẢM ƠN VÌ SỰ ỦNG HỘ”.

“hành kiểm” được sửa thành “hạnh kiểm” cho đúng chính tả.

## Lưu ý

- ZIP bảo toàn `api/`, `lib/`, `assets/`, `package.json`, cấu hình Vercel và source gốc `index.original.html`.
- Trang khóa không có nút đăng nhập, học tập hay liên kết thao tác; nó chỉ hiển thị thông báo.
- Google Fonts là tùy chọn; nếu mạng chặn Google Fonts, font hệ thống sẽ được dùng thay thế.
- Các API vẫn còn trong project để có thể khôi phục app; trang giao diện không gọi chúng. Nếu cần vô hiệu hóa cả API/backend trong thời gian dài, cần cấu hình riêng ở Vercel.
