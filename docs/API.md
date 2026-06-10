# UsTrip API

Base URL: `http://localhost:5000/api`

Protected routes require `Authorization: Bearer <token>`. JSON request bodies use `Content-Type: application/json`. Upload routes use multipart form data with the field name `image`.

## Authentication

| Method | Path | Description |
|---|---|---|
| POST | `/auth/register` | Register with `full_name`, `email`, `password` |
| POST | `/auth/login` | Login and receive JWT |
| GET | `/auth/me` | Current profile |
| PATCH | `/auth/profile` | Update profile |

## Trips and members

| Method | Path | Description |
|---|---|---|
| GET, POST | `/trips` | List/create trips |
| GET, PATCH, DELETE | `/trips/:tripId` | Read/update/delete trip |
| GET, POST | `/trips/:tripId/members` | List/invite members |
| PATCH, DELETE | `/trips/:tripId/members/:userId` | Update/remove member |

Only the owner can delete trips, invite/remove members, update roles, and update the fund target.

## Itinerary, funds, and expenses

| Method | Path | Description |
|---|---|---|
| GET, POST | `/trips/:tripId/activities` | List/create activities |
| GET, PATCH, DELETE | `/activities/:activityId` | Activity detail/update/delete |
| GET, PATCH | `/trips/:tripId/fund` | Fund summary/update target |
| GET, POST | `/trips/:tripId/contributions` | List/add contributions |
| PATCH | `/contributions/:contributionId` | Update contribution |
| GET, POST | `/trips/:tripId/expenses` | List/add expenses |
| GET, PATCH, DELETE | `/expenses/:expenseId` | Expense detail/update/delete |
| POST | `/expenses/:expenseId/split` | Generate equal splits |
| GET | `/trips/:tripId/settlements` | Settlement summary |
| PATCH | `/splits/:splitId/settled` | Mark split settled |

### Quy tắc quỹ chung và chi tiêu

Mỗi khoản chi phải có một `payment_source`:

- `shared_fund`: chi trực tiếp từ quỹ chung. Chỉ chủ chuyến được tạo, số tiền không được vượt số dư quỹ, `paid_by` phải là `null`, và khoản chi không tạo công nợ.
- `personal`: thành viên trả hộ. Khoản chi không làm giảm số dư quỹ, `paid_by` phải là thành viên của chuyến đi, và `participants` bắt buộc chứa đúng những người được thanh toán hộ.
- Khi gọi endpoint chia tiền, backend chỉ chia đều cho danh sách `participants` đã lưu; client không thể tự thay danh sách ở bước chia.

Các công thức được dùng thống nhất:

```text
Số dư quỹ = tổng đóng góp thành công - tổng khoản chi shared_fund
Tổng chi chuyến đi = tổng khoản chi shared_fund + tổng khoản chi personal
```

`GET /trips/:tripId/fund` trả các trường rõ nghĩa: `total_collected`, `fund_spent`, `personal_spent`, `total_trip_expenses`, `current_balance` và `remaining_to_target`.

Ví dụ tạo khoản thành viên trả hộ:

```json
{
  "title": "Ăn tối",
  "amount": 600000,
  "category": "food",
  "payment_source": "personal",
  "paid_by": "uuid-nguoi-tra-ho",
  "participants": [
    "uuid-nguoi-duoc-tra-ho-1",
    "uuid-nguoi-duoc-tra-ho-2"
  ]
}
```

Ví dụ tạo khoản chi từ quỹ chung:

```json
{
  "title": "Vé tham quan",
  "amount": 300000,
  "category": "ticket",
  "payment_source": "shared_fund"
}
```

## Dashboard, reminders, notifications, uploads

| Method | Path | Description |
|---|---|---|
| GET | `/trips/:tripId/dashboard` | Trip dashboard |
| GET | `/trips/:tripId/financial-summary` | Financial dashboard |
| GET, POST | `/trips/:tripId/reminders` | Reminder history/create reminder |
| GET | `/notifications` | Current user's notifications |
| PATCH | `/notifications/:notificationId/read` | Mark notification read |
| PUT | `/notifications/push-token` | Register/update current device Expo push token |
| DELETE | `/notifications/push-token` | Remove current device Expo push token |
| POST | `/upload/bill` | Upload bill image |
| POST | `/upload/payment-proof` | Upload payment proof |
| POST | `/upload/avatar` | Upload avatar |
| POST | `/upload/trip-cover` | Upload cover |

## Thanh toán MoMo

| Method | Path | Description |
|---|---|---|
| POST | `/trips/:tripId/contributions/momo/create` | Tạo yêu cầu đóng góp qua MoMo |
| POST | `/payments/momo/ipn` | IPN công khai để MoMo gửi kết quả; backend xác minh chữ ký |
| GET | `/payments/momo/return` | Redirect từ MoMo sau khi thanh toán |
| GET | `/payments/:paymentId/status` | Kiểm tra trạng thái payment trong database |
| POST | `/payments/momo/query` | Truy vấn trạng thái trực tiếp từ MoMo |
| GET, POST | `/payments/:paymentId/mock`, `/payments/:paymentId/mock-success` | Trang demo, chỉ hoạt động khi `MOMO_ENV=mock` |

Body tạo thanh toán:

```json
{
  "amount": 100000,
  "member_id": "uuid-thanh-vien-tuy-chon",
  "return_url": "ustrip://payment-return"
}
```

`return_url` là tùy chọn. Backend chỉ chấp nhận scheme mobile `ustrip://` hoặc cùng origin với `CLIENT_URL`, tránh open redirect. Kết quả thanh toán chính thức luôn được xác nhận ở backend qua IPN/query, không tin trực tiếp tham số trả về từ client.

Validation errors return HTTP `422`; unauthenticated and unauthorized requests return `401` and `403`.
