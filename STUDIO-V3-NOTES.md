# Học Cùng Phúc K9 — Studio V3 Rebuild

## Những thay đổi có trong source ZIP

- Thay hoàn toàn template trang chủ `rev-hero` kiểu cũ bằng bố cục mới: hero dạng sổ tay, minh họa notebook vẽ bằng CSS, lối tắt, thẻ môn học, tiến độ, mục tiêu học tập và lộ trình chương.
- Thay bộ ngôn ngữ giao diện toàn cục bằng giấy kem, lavender, mint, peach và vàng bơ nhạt; thanh điều hướng desktop, header, input, card và mobile bottom navigation được đồng bộ.
- Dark mode đổi từ navy/blue sang than tím ấm, lavender và xanh sage dịu. Giữ nguyên nút chuyển theme.
- Mobile có cách sắp xếp riêng: hero dọc, nút chạm lớn, khu vực lối tắt/môn học hai cột, tiến độ dọc và lộ trình hai cột.
- Thêm animation xuất hiện theo vùng nhìn thấy bằng `IntersectionObserver`, chuyển động hover/tap ngắn và hỗ trợ `prefers-reduced-motion`. Không dùng hiệu ứng phát sáng hoặc animation chạy vô hạn.
- Gỡ các script/style `phuck9-ui-v6-cinematic` đã ép khu Kho luyện đề vào trạng thái bảo trì; xóa thông điệp bảo trì khỏi template trang chủ.
- Đổi cache Service Worker sang `phuc-k9-studio-v3` để cập nhật cache version khi deploy.
- Không thay đổi các API nghiệp vụ hoặc cấu trúc Redis/Blob trong lần thiết kế lại này.

## Kiểm tra đã thực hiện

- 73 inline JavaScript blocks đã qua `node --check`.
- JSON trong source đã parse hợp lệ.
- CSS mới đã qua kiểm tra parser; không có lỗi parse ở stylesheet mới.
- ZIP được đóng gói lại với `index.html` ở thư mục gốc `phuc-k9-web-main/`; không lồng thêm thư mục trùng tên.
- Đã xác nhận hai script maintenance và hai stylesheet `phuck9-ui-v6-cinematic` không còn trong source.

## Giới hạn cần nói rõ

Môi trường kiểm thử không cho phép mở trang qua Chromium (`ERR_BLOCKED_BY_ADMINISTRATOR`), vì vậy chưa có ảnh chụp browser xác nhận pixel-perfect hay kiểm thử click end-to-end. Chưa deploy lên Vercel, chưa kết nối Redis/Blob production. Trước Production, hãy push lên branch Preview, thử cả light/dark, desktop/mobile, tài khoản, admin, upload và kho đề.
