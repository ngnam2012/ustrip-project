# Tài Liệu Bảo Mật (Security)

Bảo mật là yếu tố hàng đầu trong hệ thống quản lý tài chính và thông tin chuyến đi.

## 1. Xác thực và Phân quyền (Authentication & Authorization)
- **Mã hóa mật khẩu**: Sử dụng `bcrypt` (thông qua `passlib` của Python). Mật khẩu người dùng được băm (hash) kết hợp với muối (salt) tự sinh, chống lại các cuộc tấn công Rainbow Table.
- **JSON Web Token (JWT)**: Quản lý phiên làm việc bằng chuỗi token sử dụng thuật toán HMAC-SHA256 (`HS256`).
- **Trip-Level Authorization**: Bất kể API nào liên quan đến chuyến đi (Trip) đều có kiểm tra quyền người dùng (`owner` hay `member`) trước khi thực thi truy vấn tới cơ sở dữ liệu.

## 2. Row Level Security (RLS) - Cấp độ Database
- Hệ thống cơ sở dữ liệu Supabase (PostgreSQL) được bật RLS trên **tất cả** các bảng.
- Không có bất kỳ Policy nào cho người dùng nặc danh (Anon). Mọi request đọc/ghi từ client Web hoặc Mobile mà cố tình gọi thẳng API Supabase đều sẽ bị từ chối (`401 Unauthorized`).
- Mọi logic DB phải đi qua Backend FastAPI (dùng `Service Role Key` có quyền cao nhất để bypass RLS).

## 3. Web Security (FastAPI)
- **CORS (Cross-Origin Resource Sharing)**: API Backend chỉ cho phép nhận request từ các origin xác định (biến môi trường `CLIENT_URL` và `MOBILE_CLIENT_URL`).
- **Input Validation**: Tự động xác thực và làm sạch (sanitize) đầu vào nhờ sức mạnh của `pydantic`. Tránh SQL Injection do không viết SQL thô tay.

## 4. Quản lý Secret & Biến môi trường
Mọi khóa bảo mật đều được đưa ra biến môi trường (`.env`):
- `JWT_SECRET`: Khóa bí mật ký token.
- `SUPABASE_SERVICE_KEY`: Khóa quyền lực để gọi DB (Không bao giờ gửi cho Client).
- `SUPABASE_URL`: Đường dẫn DB.
- Không đưa file `.env` lên Git.

## 5. Security Headers (Mobile/Web)
- Client sử dụng HTTPS trong môi trường Production để chống tấn công Man-in-the-Middle (MitM) khi truyền tải token.
