# HỌC CÙNG PHÚC K9 — Exam Center V3

## Trạng thái triển khai

Bản ZIP này **giữ website ở chế độ KHÓA APP** như yêu cầu trước đó.

- `index.html`: màn hình thông báo KHÓA APP đang được phục vụ.
- `sw.js`: service worker của màn hình khóa.
- `index.original.html`: ứng dụng đầy đủ đã tích hợp Exam Center V3.
- `sw.original.js`: service worker của ứng dụng đầy đủ, đã tăng phiên bản cache.

Khi cập nhật repository bằng bản ZIP này, trang live vẫn hiện KHÓA APP. Khi muốn mở lại website, xem mục “Mở khóa website”.

## Exam Center V3 có gì?

- Mount module Exam Center vào tab Kho đề; nạp CSS và JavaScript đúng vị trí.
- Bố cục làm bài chia đôi: PDF bên trái, phiếu trả lời và câu hỏi bên phải; trên màn hình nhỏ tự xếp dọc.
- Bộ điều hướng câu hỏi, trạng thái đã trả lời/đánh dấu xem lại, câu trắc nghiệm, đúng-sai và trả lời ngắn.
- Đồng hồ dựa trên mốc thời gian máy chủ; không có nút tạm dừng. Máy chủ từ chối lưu câu trả lời sau hạn. Khi tab còn hoạt động, giao diện tự gửi yêu cầu nộp khi đồng hồ về 0; nếu đóng tab hoặc mất kết nối đúng lúc đó, lượt thi được phát hiện hết hạn khi người dùng mở lại/tiếp tục, và chỉ phần đã đồng bộ lên máy chủ trước hạn được chấm.
- Chấm điểm ở API máy chủ, không tin điểm hoặc phần chữa bài do trình duyệt gửi lên.
- Modal kết quả, số câu đúng/sai/bỏ trống, điểm và lời giải từng câu.
- Phân tích lịch sử theo lần thi và môn học; phân tích điểm yếu theo chuyên đề khi câu hỏi có trường `topic`.
- Admin import có kiểm tra cấu trúc trước khi lưu nháp.
- Sửa đường khôi phục bài thi (`action=resume`), đường tải PDF private qua Vercel Blob, và phản hồi trạng thái hết giờ từ API.

## Cấu hình cần có trên Vercel

Giữ nguyên các biến môi trường đang dùng cho website. Các tính năng cũ (đăng nhập, Redis, AI, v.v.) vẫn phụ thuộc cấu hình hiện tại của project.

Nếu đề được lưu trong private Vercel Blob và có `sourceId`, cần có biến `BLOB_READ_WRITE_TOKEN` trong Vercel. Hai PDF mẫu nội bộ dùng `sourceFile` trỏ trực tiếp tới `/exam-sources/` nên không cần Blob.

## Cách cập nhật GitHub mà vẫn giữ màn hình khóa

1. Tải ZIP, giải nén.
2. Mở thư mục `phuc-k9-web-main`.
3. Trên GitHub, mở đúng repository đang kết nối Vercel.
4. Chọn **Add file → Upload files**.
5. Kéo các file và thư mục bên trong `phuc-k9-web-main` vào trang upload (không upload nguyên file ZIP và không tạo thêm một cấp thư mục lồng).
6. Nếu GitHub hỏi ghi đè file trùng tên, chấp nhận cập nhật. Giữ các file gốc hiện có trong ZIP, đặc biệt `index.html`, `sw.js`, `index.original.html`, `sw.original.js`.
7. Chọn **Commit changes**. Vercel sẽ tự tạo deployment theo cấu hình kết nối GitHub.

Không upload `.env`, mật khẩu, API key hay token lên GitHub. Nếu repository có file bí mật hoặc dữ liệu thật không nên công khai, để repository Private.

## Mở khóa website khi sẵn sàng hoạt động lại

Trong bản đã giải nén, **tạo bản sao** rồi ghi đè hai file ở thư mục gốc:

- Sao chép `index.original.html` thành `index.html` (ghi đè màn hình khóa).
- Sao chép `sw.original.js` thành `sw.js` (ghi đè service worker của màn hình khóa).

Sau đó upload/commit hai file `index.html` và `sw.js` đã thay đổi lên cùng repository GitHub. Giữ lại `index.original.html` và `sw.original.js` để làm bản dự phòng.

## Kiểm tra sau deploy

- Khi đang khóa: mở domain và xác nhận màn hình KHÓA APP vẫn xuất hiện.
- Khi mở khóa: đăng nhập, vào Kho đề, kiểm tra đề mẫu, mở PDF, bắt đầu bài, chọn đáp án, chờ lưu máy chủ, nộp bài, xem lời giải và mở Lịch sử thi.
- Thử một lượt trên màn hình điện thoại và một lượt trên PC.
- Nếu PDF private không mở được, kiểm tra `BLOB_READ_WRITE_TOKEN`, quyền truy cập Blob và `sourceId` trong dữ liệu đề.

Lưu ý: mã nguồn đã được kiểm tra cú pháp JavaScript, CSS và các script inline. Không thể xác nhận Redis/Blob production, đăng nhập thực tế hoặc giao diện trên domain cho đến khi deploy vào môi trường của bạn.
