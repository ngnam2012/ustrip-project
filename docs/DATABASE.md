# Tài Liệu Cơ Sở Dữ Liệu (Database Documentation)

Hệ thống sử dụng **PostgreSQL** (thông qua Supabase) làm cơ sở dữ liệu chính. Toàn bộ logic tương tác DB từ Client được khóa lại bằng Row Level Security (RLS) để bắt buộc gọi thông qua REST API của Backend.

## Cấu trúc các bảng

### 1. `profiles`
Lưu trữ thông tin xác thực và hồ sơ người dùng.
- `id` (UUID, PK)
- `email` (Text, Unique)
- `password_hash` (Text)
- `full_name` (Text)
- Các trường phụ: `avatar_url`, `phone`

### 2. `trips`
Chuyến đi.
- `id` (UUID, PK)
- `name` (Text, 2-120 chars)
- `destination` (Text)
- `start_date`, `end_date` (Date)
- `estimated_budget` (Numeric, >= 0)
- `created_by` (UUID, FK -> profiles)

### 3. `trip_members`
Thành viên chuyến đi.
- `trip_id` (UUID, FK -> trips)
- `user_id` (UUID, FK -> profiles)
- `role` (Enum: `owner`, `member`)
- `contribution_status` (Enum: `paid`, `partial`, `unpaid`)
- `paid_amount`, `remaining_amount` (Numeric)

### 4. Bảng liên quan Lịch trình (Itinerary)
- **`itinerary_activities`**: Lưu chi tiết một hoạt động (thời gian, địa điểm, tọa độ, chi phí dự kiến, địa điểm Google Map/Place ID).
- **`activity_participants`**: Bảng trung gian (Many-to-Many) liên kết hoạt động và user.

### 5. Bảng liên quan Tài chính (Quỹ và Chi tiêu)
- **`shared_funds`**: Mỗi chuyến đi có 1 quỹ (1-to-1). Chứa `target_amount`.
- **`fund_contributions`**: Mỗi người đóng góp quỹ bao nhiêu. Hỗ trợ thanh toán Momo (`payment_method`).
- **`payments`**: Lưu giao dịch gọi cổng thanh toán MoMo, order ID, trạng thái thanh toán (pending, success, failed).
- **`expenses`**: Lưu hóa đơn chi tiêu. 
  - Có thể trả bằng `shared_fund` hoặc tiền mặt cá nhân (`personal`).
  - Phân loại (category): food, transport, hotel, v.v.
- **`expense_splits`**: Số tiền nợ cần trả của từng user cho mỗi chi phí.
- **`expense_participants`**: Danh sách user chia sẻ một chi phí.

### 6. Bảng Phụ (Chat, Thông báo, Nhắc nhở)
- **`notifications`**: Thông báo hệ thống gửi đến người dùng (nhắc nợ, cập nhật lịch trình).
- **`push_tokens`**: Token dùng cho Expo Push Notification.
- **`reminders`**: Lưu trữ nhắc nhở.
- **`trip_messages`**: Lưu trữ tin nhắn chat realtime của chuyến đi (Migration: `005_chat_messages.sql`).

## Triggers và Functions

Hệ thống sử dụng các function và trigger của PostgreSQL để tự động hóa:
- **`set_updated_at`**: Trigger tự động cập nhật trường `updated_at` mỗi khi có bản ghi thay đổi.
  - Được gắn vào hầu hết tất cả các bảng.

## Bảo mật (Row Level Security - RLS)

> [!CAUTION]
> Toàn bộ các bảng đều được bật `ENABLE ROW LEVEL SECURITY`.
> 
> Hệ thống không cấp quyền (Policy) cho phép gọi trực tiếp từ client ẩn danh. Mọi thao tác truy xuất dữ liệu bắt buộc phải đi qua **FastAPI Backend**, nơi sử dụng "Service Role Key" để vượt qua RLS và tự thực hiện logic phân quyền (Authorization) ở mức Application Layer.

## Migration Strategy

Migrations được quản lý bằng các script SQL tĩnh lưu tại `database/migrations/`.
- `002_momo_maps.sql`
- `003_expense_payment_source.sql`
- `004_push_notifications.sql`
- `005_chat_messages.sql`
