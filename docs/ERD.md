# ERD cơ sở dữ liệu UsTrip

Sơ đồ dưới đây bám theo cấu trúc hiện tại trong `database/schema.sql`.

```mermaid
erDiagram
    profiles {
        uuid id PK
        text email UK
        text password_hash
        text full_name
        text avatar_url
        text phone
        timestamptz created_at
        timestamptz updated_at
    }

    trips {
        uuid id PK
        text name
        text destination
        date start_date
        date end_date
        numeric estimated_budget
        text description
        text cover_image_url
        uuid created_by FK
        timestamptz created_at
        timestamptz updated_at
    }

    trip_members {
        uuid id PK
        uuid trip_id FK
        uuid user_id FK
        trip_role role
        contribution_status contribution_status
        numeric paid_amount
        numeric remaining_amount
        timestamptz created_at
        timestamptz updated_at
    }

    itinerary_activities {
        uuid id PK
        uuid trip_id FK
        text title
        date activity_date
        time start_time
        time end_time
        text location
        text location_name
        text address
        numeric latitude
        numeric longitude
        text place_id
        text map_provider
        numeric estimated_cost
        text notes
        uuid created_by FK
        timestamptz created_at
        timestamptz updated_at
    }

    activity_participants {
        uuid activity_id PK, FK
        uuid user_id PK, FK
        timestamptz created_at
    }

    shared_funds {
        uuid id PK
        uuid trip_id FK, UK
        numeric target_amount
        timestamptz created_at
        timestamptz updated_at
    }

    fund_contributions {
        uuid id PK
        uuid trip_id FK
        uuid user_id FK
        numeric amount
        text payment_proof_url
        text note
        uuid payment_id FK
        text payment_method
        payment_status payment_status
        timestamptz paid_at
        timestamptz contributed_at
        timestamptz created_at
        timestamptz updated_at
    }

    payments {
        uuid id PK
        uuid trip_id FK
        uuid contribution_id FK
        uuid member_id FK
        text provider
        numeric amount
        text currency
        payment_status status
        text order_id UK
        text request_id UK
        text transaction_id
        text pay_url
        text deeplink
        text qr_code_url
        jsonb raw_request
        jsonb raw_response
        timestamptz paid_at
        timestamptz created_at
        timestamptz updated_at
    }

    expenses {
        uuid id PK
        uuid trip_id FK
        text title
        numeric amount
        expense_category category
        expense_payment_source payment_source
        uuid paid_by FK
        uuid related_activity_id FK
        split_method split_method
        text bill_image_url
        text note
        date expense_date
        timestamptz created_at
        timestamptz updated_at
    }

    expense_participants {
        uuid expense_id PK, FK
        uuid user_id PK, FK
        timestamptz created_at
    }

    expense_splits {
        uuid id PK
        uuid expense_id FK
        uuid user_id FK
        numeric amount_owed
        boolean is_settled
        timestamptz settled_at
        timestamptz created_at
        timestamptz updated_at
    }

    notifications {
        uuid id PK
        uuid user_id FK
        uuid trip_id FK
        notification_type type
        text title
        text message
        boolean is_read
        timestamptz created_at
        timestamptz updated_at
    }

    push_tokens {
        text token PK
        uuid user_id FK
        text platform
        timestamptz created_at
        timestamptz updated_at
    }

    reminders {
        uuid id PK
        uuid trip_id FK
        uuid recipient_id FK
        uuid created_by FK
        text message
        timestamptz sent_at
        timestamptz created_at
        timestamptz updated_at
    }

    profiles ||--o{ trips : "tạo chuyến đi"
    profiles ||--o{ trip_members : "tham gia"
    trips ||--o{ trip_members : "có thành viên"

    trips ||--o{ itinerary_activities : "có hoạt động"
    profiles ||--o{ itinerary_activities : "tạo hoạt động"
    itinerary_activities ||--o{ activity_participants : "có người tham gia"
    profiles ||--o{ activity_participants : "tham gia hoạt động"

    trips ||--|| shared_funds : "có quỹ chung"
    trips ||--o{ fund_contributions : "nhận đóng góp"
    profiles ||--o{ fund_contributions : "đóng góp"
    trips ||--o{ payments : "có thanh toán"
    profiles ||--o{ payments : "thực hiện thanh toán"
    fund_contributions o|--o| payments : "được thanh toán bởi"

    trips ||--o{ expenses : "có chi tiêu"
    profiles ||--o{ expenses : "thanh toán"
    itinerary_activities o|--o{ expenses : "liên kết chi tiêu"
    expenses ||--o{ expense_participants : "có người tham gia"
    profiles ||--o{ expense_participants : "tham gia chi tiêu"
    expenses ||--o{ expense_splits : "được chia thành"
    profiles ||--o{ expense_splits : "có khoản phải trả"

    profiles ||--o{ notifications : "nhận thông báo"
    trips o|--o{ notifications : "phát sinh thông báo"
    profiles ||--o{ push_tokens : "đăng ký thiết bị"

    trips ||--o{ reminders : "có nhắc thanh toán"
    profiles ||--o{ reminders : "nhận reminder"
    profiles ||--o{ reminders : "tạo reminder"
```

## Các nhóm bảng chính

| Nhóm | Bảng | Vai trò |
|---|---|---|
| Người dùng | `profiles` | Lưu tài khoản, mật khẩu đã hash và hồ sơ |
| Chuyến đi | `trips`, `trip_members` | Lưu chuyến đi và thành viên thuộc chuyến |
| Lịch trình | `itinerary_activities`, `activity_participants` | Lưu hoạt động và người tham gia |
| Quỹ chung | `shared_funds`, `fund_contributions`, `payments` | Lưu mục tiêu quỹ, đóng góp thủ công và thanh toán MoMo |
| Chi tiêu | `expenses`, `expense_participants`, `expense_splits` | Lưu khoản chi, người sử dụng và kết quả chia tiền |
| Tương tác | `notifications`, `reminders` | Lưu thông báo và lịch sử nhắc thanh toán |

## Quan hệ quan trọng

### Người dùng và chuyến đi

`profiles` và `trips` có quan hệ nhiều-nhiều thông qua `trip_members`.

- Một người dùng có thể tham gia nhiều chuyến đi.
- Một chuyến đi có nhiều thành viên.
- `trip_members.role` xác định `owner` hoặc `member`.
- Cặp `trip_id`, `user_id` là duy nhất.

### Hoạt động và người tham gia

`itinerary_activities` và `profiles` có quan hệ nhiều-nhiều thông qua `activity_participants`.

Mỗi hoạt động thuộc đúng một chuyến đi và có thể liên kết với nhiều người tham gia.

### Chuyến đi và quỹ chung

`trips` và `shared_funds` có quan hệ một-một vì `shared_funds.trip_id` có ràng buộc unique.

Mỗi lần đóng góp được lưu độc lập trong `fund_contributions`, giúp giữ lịch sử giao dịch và ảnh minh chứng thanh toán.

### Chi tiêu và chia tiền

- Mỗi `expense` thuộc một chuyến đi.
- `payment_source=shared_fund`: trừ trực tiếp số dư quỹ, `paid_by` là `NULL`, không tạo `expense_splits`.
- `payment_source=personal`: thành viên trả hộ, `paid_by` xác định người đã thanh toán; `expense_participants` chỉ chứa những người cụ thể được trả hộ.
- `related_activity_id` là tùy chọn, dùng để liên kết khoản chi với hoạt động.
- `expense_participants` lưu đúng những người được thanh toán hộ; hệ thống không tự chọn toàn bộ thành viên chuyến đi.
- `expense_splits` chia đều khoản chi cho đúng danh sách `expense_participants`, đồng thời lưu số tiền mỗi người phải trả và trạng thái quyết toán.

Số dư quỹ chỉ được tính từ đóng góp thành công và khoản chi có nguồn `shared_fund`:

```text
Số dư quỹ = tổng fund_contributions thành công - tổng expenses có payment_source=shared_fund
```

### Thông báo và nhắc thanh toán

- `notifications` thuộc về một người dùng và có thể liên kết với chuyến đi.
- `reminders` lưu người nhận, người tạo và nội dung nhắc thanh toán.

## Enum đang sử dụng

| Enum | Giá trị |
|---|---|
| `trip_role` | `owner`, `member` |
| `contribution_status` | `paid`, `partial`, `unpaid` |
| `expense_category` | `food`, `transport`, `hotel`, `ticket`, `shopping`, `other` |
| `expense_payment_source` | `shared_fund`, `personal` |
| `split_method` | `equal` |
| `notification_type` | `contribution_reminder`, `new_expense`, `itinerary_update`, `member_added` |
| `payment_status` | `pending`, `success`, `failed`, `cancelled`, `expired` |

## Quy tắc xóa dữ liệu

- Phần lớn dữ liệu con sử dụng `ON DELETE CASCADE`.
- Khi xóa chuyến đi, thành viên, hoạt động, quỹ, đóng góp, chi tiêu và reminder liên quan sẽ được xóa theo.
- Khi xóa hoạt động, `expenses.related_activity_id` được đặt thành `NULL` để không làm mất lịch sử chi tiêu.
- Các tài nguyên chỉ được truy cập thông qua backend bằng service role. RLS được bật cho toàn bộ bảng và không có policy truy cập trực tiếp cho client.
