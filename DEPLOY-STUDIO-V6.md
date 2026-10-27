# Đưa Học Cùng Phúc K9 Studio V6 lên Vercel (an toàn)

1. Tải `phuc-k9-studio-v6-rebuilt.zip` và giải nén bằng **Extract All**.
2. Mở thư mục `phuc-k9-web-main`. Các mục `index.html`, `package.json`, `vercel.json`, `api/`, `lib/`, `assets/` phải nằm ngay trong thư mục gốc của repository, không nằm trong một thư mục lồng thêm.
3. Sao lưu repository hiện tại hoặc tạo branch mới. Đưa **các file/thư mục bên trong** `phuc-k9-web-main` vào repository; không upload ZIP như một file trong GitHub.
4. Giữ nguyên các biến môi trường đang dùng trong Vercel. Không sao chép mật khẩu/token vào source và không thay production environment bằng các giá trị mẫu.
5. Push branch để Vercel tạo Preview. Kiểm tra font tiếng Việt, desktop/mobile, dark mode, điều hướng, đăng nhập, quyền Admin, upload, kho đề, làm bài/lưu/nộp bài, kết quả và dữ liệu lịch sử.
6. Chỉ merge/promote lên Production khi Preview đạt các bài kiểm tra. Không xóa dữ liệu Redis/Blob để “làm sạch” giao diện.

## Nếu sau deploy vẫn thấy giao diện cũ
- Mở URL Preview riêng của lần deploy, không chỉ website production cũ.
- Kiểm tra trong GitHub rằng `assets/phuck9-studio-v6.css` và `assets/phuck9-studio-v6.js` nằm đúng dưới `assets/` tại repository root.
- Thử hard refresh (Ctrl+Shift+R). V6 cũng đổi namespace cache Service Worker, nhưng hãy xác minh từ Preview trước.
- Nếu giao diện vẫn cũ, không tiếp tục xóa cache/dữ liệu tùy tiện; chụp tab Deployments và cây file repository để xác định đúng commit đang được chạy.
