# Tài Liệu Xác Thực và Phân Quyền (Authentication & Authorization)

Hệ thống UsTrip sử dụng cơ chế **JWT (JSON Web Token)** để quản lý phiên làm việc của người dùng.

## 1. Xác thực (Authentication)

### Luồng Đăng nhập / Đăng ký
1. Client gửi email và mật khẩu lên API (`/api/auth/login` hoặc `/api/auth/register`).
2. Server hash mật khẩu (bằng `bcrypt`) và so sánh/lưu vào DB (`profiles`).
3. Server tạo một **JWT Token** (thuật toán `HS256`) và mã hóa ID người dùng (`sub`) vào payload.
4. Client nhận được `token` và lưu vào LocalStorage (Web) hoặc SecureStore (Mobile).
5. Các request sau, Client gửi token ở Header: `Authorization: Bearer <token>`.

### Parse Token
- FastAPI sử dụng dependency `get_current_user` (tại `src/dependencies/auth.py`).
- Dependency này giải mã token. Nếu token hợp lệ và user tồn tại trong bảng `profiles`, nó sẽ trả về object `user`. Nếu không, ném ra lỗi `401 Unauthorized`.

## 2. Phân quyền (Authorization)

Hệ thống không chỉ xác thực người dùng mà còn **phân quyền theo mức độ dự án (Trip-Level Authorization)**.

### Cơ chế phân quyền chuyến đi (Trip Roles)
Người dùng chỉ có thể truy cập các tài nguyên (expense, activity, member) thuộc về chuyến đi mà họ có tham gia.

Hệ thống cung cấp các dependencies linh hoạt:
- `get_trip_member`: Yêu cầu user phải là thành viên của chuyến đi (bất kể `owner` hay `member`).
- `get_trip_owner`: Yêu cầu user phải có role là `owner` trong chuyến đi.
- `require_activity_member`, `require_expense_member`: Tự động nội suy (infer) `trip_id` từ `activity_id` hoặc `expense_id` trên URL, sau đó check xem user có trong chuyến đi đó không.

### Cách sử dụng trong Controller
Ví dụ một route yêu cầu quyền owner:
```python
@router.patch("/{tripId}")
async def update_trip(
    tripId: str,
    payload: dict,
    user: dict = Depends(get_trip_owner)
):
    # Logic chỉ được chạy nếu user là owner
```

## 3. Bảo vệ dữ liệu tại cơ sở dữ liệu (RLS)
Mặc dù mọi logic phân quyền được thực thi ở tầng FastAPI Dependency, toàn bộ các bảng trong PostgreSQL cũng đã được bật `Row Level Security (RLS)`.
- Client không thể query trực tiếp Supabase qua Anon Key.
- Server dùng **Service Role Key** để bypass RLS, tự thực hiện các luồng kiểm tra nghiệp vụ và trả về kết quả.
