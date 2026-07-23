# Tài Liệu API (UsTrip)

Tài liệu này mô tả chi tiết toàn bộ các REST API endpoints của hệ thống backend UsTrip, được sinh tự động từ mã nguồn.

## Core

### GET `/health`

**Tên**: Health Check

**Thông tin Endpoint:**
| Thuộc tính | Giá trị |
|---|---|
| Xác thực (Authentication) | Không |
| Content-Type | application/json |

**Phản hồi (Responses):**
| Mã trạng thái | Mô tả |
|---|---|
| 200 | Successful Response |

---

## auth

### POST `/api/auth/register`

**Tên**: Register

**Thông tin Endpoint:**
| Thuộc tính | Giá trị |
|---|---|
| Xác thực (Authentication) | Không |
| Content-Type | application/json |

**Body Request:**
- Tham chiếu Schema: `UserCreate`

**Phản hồi (Responses):**
| Mã trạng thái | Mô tả |
|---|---|
| 201 | Successful Response |
| 422 | Validation Error |

---

### POST `/api/auth/login`

**Tên**: Login

**Thông tin Endpoint:**
| Thuộc tính | Giá trị |
|---|---|
| Xác thực (Authentication) | Không |
| Content-Type | application/json |

**Body Request:**
- Tham chiếu Schema: `UserLogin`

**Phản hồi (Responses):**
| Mã trạng thái | Mô tả |
|---|---|
| 200 | Successful Response |
| 422 | Validation Error |

---

### GET `/api/auth/me`

**Tên**: Me

**Thông tin Endpoint:**
| Thuộc tính | Giá trị |
|---|---|
| Xác thực (Authentication) | Có |
| Content-Type | application/json |

**Phản hồi (Responses):**
| Mã trạng thái | Mô tả |
|---|---|
| 200 | Successful Response |

---

### PATCH `/api/auth/profile`

**Tên**: Update Profile

**Thông tin Endpoint:**
| Thuộc tính | Giá trị |
|---|---|
| Xác thực (Authentication) | Có |
| Content-Type | application/json |

**Body Request:**
- Tham chiếu Schema: `UserProfileUpdate`

**Phản hồi (Responses):**
| Mã trạng thái | Mô tả |
|---|---|
| 200 | Successful Response |
| 422 | Validation Error |

---

## trips

### GET `/api/trips`

**Tên**: List Trips

**Thông tin Endpoint:**
| Thuộc tính | Giá trị |
|---|---|
| Xác thực (Authentication) | Có |
| Content-Type | application/json |

**Phản hồi (Responses):**
| Mã trạng thái | Mô tả |
|---|---|
| 200 | Successful Response |

---

### POST `/api/trips`

**Tên**: Create Trip

**Thông tin Endpoint:**
| Thuộc tính | Giá trị |
|---|---|
| Xác thực (Authentication) | Có |
| Content-Type | application/json |

**Body Request:**
- Tham chiếu Schema: `TripCreate`

**Phản hồi (Responses):**
| Mã trạng thái | Mô tả |
|---|---|
| 201 | Successful Response |
| 422 | Validation Error |

---

### GET `/api/trips/{tripId}`

**Tên**: Get Trip

**Thông tin Endpoint:**
| Thuộc tính | Giá trị |
|---|---|
| Xác thực (Authentication) | Có |
| Content-Type | application/json |

**Phản hồi (Responses):**
| Mã trạng thái | Mô tả |
|---|---|
| 200 | Successful Response |

---

### DELETE `/api/trips/{tripId}`

**Tên**: Delete Trip

**Thông tin Endpoint:**
| Thuộc tính | Giá trị |
|---|---|
| Xác thực (Authentication) | Có |
| Content-Type | application/json |

**Phản hồi (Responses):**
| Mã trạng thái | Mô tả |
|---|---|
| 204 | Successful Response |

---

### PATCH `/api/trips/{tripId}`

**Tên**: Update Trip

**Thông tin Endpoint:**
| Thuộc tính | Giá trị |
|---|---|
| Xác thực (Authentication) | Có |
| Content-Type | application/json |

**Body Request:**
- Tham chiếu Schema: `TripUpdate`

**Phản hồi (Responses):**
| Mã trạng thái | Mô tả |
|---|---|
| 200 | Successful Response |
| 422 | Validation Error |

---

### GET `/api/trips/{tripId}/members`

**Tên**: List Members

**Thông tin Endpoint:**
| Thuộc tính | Giá trị |
|---|---|
| Xác thực (Authentication) | Có |
| Content-Type | application/json |

**Phản hồi (Responses):**
| Mã trạng thái | Mô tả |
|---|---|
| 200 | Successful Response |

---

### POST `/api/trips/{tripId}/members`

**Tên**: Add Member

**Thông tin Endpoint:**
| Thuộc tính | Giá trị |
|---|---|
| Xác thực (Authentication) | Có |
| Content-Type | application/json |

**Body Request:**
- Tham chiếu Schema: `AddMemberRequest`

**Phản hồi (Responses):**
| Mã trạng thái | Mô tả |
|---|---|
| 201 | Successful Response |
| 422 | Validation Error |

---

### DELETE `/api/trips/{tripId}/members/{userId}`

**Tên**: Remove Member

**Thông tin Endpoint:**
| Thuộc tính | Giá trị |
|---|---|
| Xác thực (Authentication) | Có |
| Content-Type | application/json |

**Phản hồi (Responses):**
| Mã trạng thái | Mô tả |
|---|---|
| 204 | Successful Response |

---

### PATCH `/api/trips/{tripId}/members/{userId}`

**Tên**: Update Member

**Thông tin Endpoint:**
| Thuộc tính | Giá trị |
|---|---|
| Xác thực (Authentication) | Có |
| Content-Type | application/json |

**Body Request:**
- Tham chiếu Schema: `UpdateMemberRequest`

**Phản hồi (Responses):**
| Mã trạng thái | Mô tả |
|---|---|
| 200 | Successful Response |
| 422 | Validation Error |

---

### GET `/api/trips/{tripId}/reminders`

**Tên**: List Reminders

**Thông tin Endpoint:**
| Thuộc tính | Giá trị |
|---|---|
| Xác thực (Authentication) | Có |
| Content-Type | application/json |

**Phản hồi (Responses):**
| Mã trạng thái | Mô tả |
|---|---|
| 200 | Successful Response |

---

### POST `/api/trips/{tripId}/reminders`

**Tên**: Create Reminder

**Thông tin Endpoint:**
| Thuộc tính | Giá trị |
|---|---|
| Xác thực (Authentication) | Có |
| Content-Type | application/json |

**Body Request:**
- Tham chiếu Schema: `CreateReminderRequest`

**Phản hồi (Responses):**
| Mã trạng thái | Mô tả |
|---|---|
| 201 | Successful Response |
| 422 | Validation Error |

---

## activities

### GET `/api/trips/{tripId}/activities`

**Tên**: List Activities

**Thông tin Endpoint:**
| Thuộc tính | Giá trị |
|---|---|
| Xác thực (Authentication) | Có |
| Content-Type | application/json |

**Phản hồi (Responses):**
| Mã trạng thái | Mô tả |
|---|---|
| 200 | Successful Response |

---

### POST `/api/trips/{tripId}/activities`

**Tên**: Create Activity

**Thông tin Endpoint:**
| Thuộc tính | Giá trị |
|---|---|
| Xác thực (Authentication) | Có |
| Content-Type | application/json |

**Body Request:**
- Tham chiếu Schema: `ActivityCreate`

**Phản hồi (Responses):**
| Mã trạng thái | Mô tả |
|---|---|
| 201 | Successful Response |
| 422 | Validation Error |

---

### GET `/api/activities/{activityId}`

**Tên**: Get Activity

**Thông tin Endpoint:**
| Thuộc tính | Giá trị |
|---|---|
| Xác thực (Authentication) | Có |
| Content-Type | application/json |

**Phản hồi (Responses):**
| Mã trạng thái | Mô tả |
|---|---|
| 200 | Successful Response |

---

### DELETE `/api/activities/{activityId}`

**Tên**: Delete Activity

**Thông tin Endpoint:**
| Thuộc tính | Giá trị |
|---|---|
| Xác thực (Authentication) | Có |
| Content-Type | application/json |

**Phản hồi (Responses):**
| Mã trạng thái | Mô tả |
|---|---|
| 204 | Successful Response |

---

### PATCH `/api/activities/{activityId}`

**Tên**: Update Activity

**Thông tin Endpoint:**
| Thuộc tính | Giá trị |
|---|---|
| Xác thực (Authentication) | Có |
| Content-Type | application/json |

**Body Request:**
- Tham chiếu Schema: `ActivityUpdate`

**Phản hồi (Responses):**
| Mã trạng thái | Mô tả |
|---|---|
| 200 | Successful Response |
| 422 | Validation Error |

---

## funds

### GET `/api/trips/{tripId}/fund`

**Tên**: Get Fund

**Thông tin Endpoint:**
| Thuộc tính | Giá trị |
|---|---|
| Xác thực (Authentication) | Có |
| Content-Type | application/json |

**Phản hồi (Responses):**
| Mã trạng thái | Mô tả |
|---|---|
| 200 | Successful Response |

---

### PATCH `/api/trips/{tripId}/fund`

**Tên**: Update Fund

**Thông tin Endpoint:**
| Thuộc tính | Giá trị |
|---|---|
| Xác thực (Authentication) | Có |
| Content-Type | application/json |

**Body Request:**
- Tham chiếu Schema: `FundUpdate`

**Phản hồi (Responses):**
| Mã trạng thái | Mô tả |
|---|---|
| 200 | Successful Response |
| 422 | Validation Error |

---

### GET `/api/trips/{tripId}/contributions`

**Tên**: List Contributions

**Thông tin Endpoint:**
| Thuộc tính | Giá trị |
|---|---|
| Xác thực (Authentication) | Có |
| Content-Type | application/json |

**Phản hồi (Responses):**
| Mã trạng thái | Mô tả |
|---|---|
| 200 | Successful Response |

---

### POST `/api/trips/{tripId}/contributions`

**Tên**: Add Contribution

**Thông tin Endpoint:**
| Thuộc tính | Giá trị |
|---|---|
| Xác thực (Authentication) | Có |
| Content-Type | application/json |

**Body Request:**
- Tham chiếu Schema: `ContributionCreate`

**Phản hồi (Responses):**
| Mã trạng thái | Mô tả |
|---|---|
| 201 | Successful Response |
| 422 | Validation Error |

---

### PATCH `/api/contributions/{contributionId}`

**Tên**: Update Contribution

**Thông tin Endpoint:**
| Thuộc tính | Giá trị |
|---|---|
| Xác thực (Authentication) | Có |
| Content-Type | application/json |

**Body Request:**
- Tham chiếu Schema: `ContributionUpdate`

**Phản hồi (Responses):**
| Mã trạng thái | Mô tả |
|---|---|
| 200 | Successful Response |
| 422 | Validation Error |

---

## expenses

### GET `/api/trips/{tripId}/expenses`

**Tên**: List Expenses

**Thông tin Endpoint:**
| Thuộc tính | Giá trị |
|---|---|
| Xác thực (Authentication) | Có |
| Content-Type | application/json |

**Phản hồi (Responses):**
| Mã trạng thái | Mô tả |
|---|---|
| 200 | Successful Response |

---

### POST `/api/trips/{tripId}/expenses`

**Tên**: Create Expense

**Thông tin Endpoint:**
| Thuộc tính | Giá trị |
|---|---|
| Xác thực (Authentication) | Có |
| Content-Type | application/json |

**Body Request:**
- Tham chiếu Schema: `ExpenseCreate`

**Phản hồi (Responses):**
| Mã trạng thái | Mô tả |
|---|---|
| 201 | Successful Response |
| 422 | Validation Error |

---

### GET `/api/expenses/{expenseId}`

**Tên**: Get Expense

**Thông tin Endpoint:**
| Thuộc tính | Giá trị |
|---|---|
| Xác thực (Authentication) | Có |
| Content-Type | application/json |

**Phản hồi (Responses):**
| Mã trạng thái | Mô tả |
|---|---|
| 200 | Successful Response |

---

### DELETE `/api/expenses/{expenseId}`

**Tên**: Delete Expense

**Thông tin Endpoint:**
| Thuộc tính | Giá trị |
|---|---|
| Xác thực (Authentication) | Có |
| Content-Type | application/json |

**Phản hồi (Responses):**
| Mã trạng thái | Mô tả |
|---|---|
| 204 | Successful Response |

---

### PATCH `/api/expenses/{expenseId}`

**Tên**: Update Expense

**Thông tin Endpoint:**
| Thuộc tính | Giá trị |
|---|---|
| Xác thực (Authentication) | Có |
| Content-Type | application/json |

**Body Request:**
- Tham chiếu Schema: `ExpenseUpdate`

**Phản hồi (Responses):**
| Mã trạng thái | Mô tả |
|---|---|
| 200 | Successful Response |
| 422 | Validation Error |

---

### POST `/api/expenses/{expenseId}/split`

**Tên**: Split Expense

**Thông tin Endpoint:**
| Thuộc tính | Giá trị |
|---|---|
| Xác thực (Authentication) | Có |
| Content-Type | application/json |

**Phản hồi (Responses):**
| Mã trạng thái | Mô tả |
|---|---|
| 201 | Successful Response |

---

### GET `/api/trips/{tripId}/settlements`

**Tên**: Get Settlements

**Thông tin Endpoint:**
| Thuộc tính | Giá trị |
|---|---|
| Xác thực (Authentication) | Có |
| Content-Type | application/json |

**Phản hồi (Responses):**
| Mã trạng thái | Mô tả |
|---|---|
| 200 | Successful Response |

---

### PATCH `/api/splits/{splitId}/settled`

**Tên**: Settle Split

**Thông tin Endpoint:**
| Thuộc tính | Giá trị |
|---|---|
| Xác thực (Authentication) | Có |
| Content-Type | application/json |

**Body Request:**
- Tham chiếu Schema: `SettleSplitRequest`

**Phản hồi (Responses):**
| Mã trạng thái | Mô tả |
|---|---|
| 200 | Successful Response |
| 422 | Validation Error |

---

### GET `/api/trips/{tripId}/optimized-settlements`

**Tên**: Get Optimized Settlements

**Thông tin Endpoint:**
| Thuộc tính | Giá trị |
|---|---|
| Xác thực (Authentication) | Có |
| Content-Type | application/json |

**Phản hồi (Responses):**
| Mã trạng thái | Mô tả |
|---|---|
| 200 | Successful Response |

---

## dashboard

### GET `/api/trips/{tripId}/financial-summary`

**Tên**: Financial Summary

**Thông tin Endpoint:**
| Thuộc tính | Giá trị |
|---|---|
| Xác thực (Authentication) | Có |
| Content-Type | application/json |

**Phản hồi (Responses):**
| Mã trạng thái | Mô tả |
|---|---|
| 200 | Successful Response |

---

### GET `/api/trips/{tripId}/dashboard`

**Tên**: Dashboard

**Thông tin Endpoint:**
| Thuộc tính | Giá trị |
|---|---|
| Xác thực (Authentication) | Có |
| Content-Type | application/json |

**Phản hồi (Responses):**
| Mã trạng thái | Mô tả |
|---|---|
| 200 | Successful Response |

---

## misc

### GET `/api/notifications`

**Tên**: Get Notifications

**Thông tin Endpoint:**
| Thuộc tính | Giá trị |
|---|---|
| Xác thực (Authentication) | Có |
| Content-Type | application/json |

**Phản hồi (Responses):**
| Mã trạng thái | Mô tả |
|---|---|
| 200 | Successful Response |

---

### PATCH `/api/notifications/{notificationId}/read`

**Tên**: Read Notification

**Thông tin Endpoint:**
| Thuộc tính | Giá trị |
|---|---|
| Xác thực (Authentication) | Có |
| Content-Type | application/json |

**Phản hồi (Responses):**
| Mã trạng thái | Mô tả |
|---|---|
| 200 | Successful Response |

---

### PUT `/api/notifications/push-token`

**Tên**: Register Push Token

**Thông tin Endpoint:**
| Thuộc tính | Giá trị |
|---|---|
| Xác thực (Authentication) | Có |
| Content-Type | application/json |

**Body Request:**
- Tham chiếu Schema: `PushTokenRequest`

**Phản hồi (Responses):**
| Mã trạng thái | Mô tả |
|---|---|
| 200 | Successful Response |
| 422 | Validation Error |

---

### DELETE `/api/notifications/push-token`

**Tên**: Remove Push Token

**Thông tin Endpoint:**
| Thuộc tính | Giá trị |
|---|---|
| Xác thực (Authentication) | Có |
| Content-Type | application/json |

**Body Request:**
- Tham chiếu Schema: `RemovePushTokenRequest`

**Phản hồi (Responses):**
| Mã trạng thái | Mô tả |
|---|---|
| 204 | Successful Response |
| 422 | Validation Error |

---

### POST `/api/upload/{kind}`

**Tên**: Upload Image

**Thông tin Endpoint:**
| Thuộc tính | Giá trị |
|---|---|
| Xác thực (Authentication) | Có |
| Content-Type | application/json |

**Body Request:**

**Phản hồi (Responses):**
| Mã trạng thái | Mô tả |
|---|---|
| 201 | Successful Response |
| 422 | Validation Error |

---

## ai

### POST `/api/trips/{tripId}/ai/itinerary`

**Tên**: Suggest Itinerary

**Thông tin Endpoint:**
| Thuộc tính | Giá trị |
|---|---|
| Xác thực (Authentication) | Có |
| Content-Type | application/json |

**Body Request:**
- Tham chiếu Schema: `SuggestItineraryRequest`

**Phản hồi (Responses):**
| Mã trạng thái | Mô tả |
|---|---|
| 200 | Successful Response |
| 422 | Validation Error |

---

### POST `/api/trips/{tripId}/ai/places`

**Tên**: Suggest Places

**Thông tin Endpoint:**
| Thuộc tính | Giá trị |
|---|---|
| Xác thực (Authentication) | Có |
| Content-Type | application/json |

**Body Request:**
- Tham chiếu Schema: `SuggestPlacesRequest`

**Phản hồi (Responses):**
| Mã trạng thái | Mô tả |
|---|---|
| 200 | Successful Response |
| 422 | Validation Error |

---

## chat

### GET `/api/trips/{tripId}/messages`

**Tên**: Get Messages

**Thông tin Endpoint:**
| Thuộc tính | Giá trị |
|---|---|
| Xác thực (Authentication) | Có |
| Content-Type | application/json |

**Phản hồi (Responses):**
| Mã trạng thái | Mô tả |
|---|---|
| 200 | Successful Response |

---

### POST `/api/trips/{tripId}/messages`

**Tên**: Send Message

**Thông tin Endpoint:**
| Thuộc tính | Giá trị |
|---|---|
| Xác thực (Authentication) | Có |
| Content-Type | application/json |

**Body Request:**
- Tham chiếu Schema: `SendMessageRequest`

**Phản hồi (Responses):**
| Mã trạng thái | Mô tả |
|---|---|
| 201 | Successful Response |
| 422 | Validation Error |

---

## payments

### POST `/api/trips/{tripId}/contributions/momo/create`

**Tên**: Create

**Thông tin Endpoint:**
| Thuộc tính | Giá trị |
|---|---|
| Xác thực (Authentication) | Có |
| Content-Type | application/json |

**Body Request:**
- Tham chiếu Schema: `PaymentCreateRequest`

**Phản hồi (Responses):**
| Mã trạng thái | Mô tả |
|---|---|
| 201 | Successful Response |
| 422 | Validation Error |

---

### POST `/api/payments/momo/ipn`

**Tên**: Ipn

**Thông tin Endpoint:**
| Thuộc tính | Giá trị |
|---|---|
| Xác thực (Authentication) | Không |
| Content-Type | application/json |

**Phản hồi (Responses):**
| Mã trạng thái | Mô tả |
|---|---|
| 204 | Successful Response |

---

### GET `/api/payments/momo/return`

**Tên**: Return Result

**Thông tin Endpoint:**
| Thuộc tính | Giá trị |
|---|---|
| Xác thực (Authentication) | Không |
| Content-Type | application/json |

**Phản hồi (Responses):**
| Mã trạng thái | Mô tả |
|---|---|
| 200 | Successful Response |

---

### GET `/api/payments/{paymentId}/status`

**Tên**: Payment Status

**Thông tin Endpoint:**
| Thuộc tính | Giá trị |
|---|---|
| Xác thực (Authentication) | Có |
| Content-Type | application/json |

**Phản hồi (Responses):**
| Mã trạng thái | Mô tả |
|---|---|
| 200 | Successful Response |

---

### POST `/api/payments/momo/query`

**Tên**: Query

**Thông tin Endpoint:**
| Thuộc tính | Giá trị |
|---|---|
| Xác thực (Authentication) | Có |
| Content-Type | application/json |

**Body Request:**
- Tham chiếu Schema: `PaymentQueryRequest`

**Phản hồi (Responses):**
| Mã trạng thái | Mô tả |
|---|---|
| 200 | Successful Response |
| 422 | Validation Error |

---

### GET `/api/payments/{paymentId}/mock`

**Tên**: Mock Page

**Thông tin Endpoint:**
| Thuộc tính | Giá trị |
|---|---|
| Xác thực (Authentication) | Không |
| Content-Type | application/json |

**Phản hồi (Responses):**
| Mã trạng thái | Mô tả |
|---|---|
| 200 | Successful Response |

---

### GET `/api/payments/{paymentId}/mock-success`

**Tên**: Mock Success

**Thông tin Endpoint:**
| Thuộc tính | Giá trị |
|---|---|
| Xác thực (Authentication) | Không |
| Content-Type | application/json |

**Phản hồi (Responses):**
| Mã trạng thái | Mô tả |
|---|---|
| 200 | Successful Response |

---

### POST `/api/payments/{paymentId}/mock-success`

**Tên**: Mock Success

**Thông tin Endpoint:**
| Thuộc tính | Giá trị |
|---|---|
| Xác thực (Authentication) | Không |
| Content-Type | application/json |

**Phản hồi (Responses):**
| Mã trạng thái | Mô tả |
|---|---|
| 200 | Successful Response |

---

## mock-ota

### GET `/api/trips/{tripId}/mock-ota/services`

**Tên**: Get Mock Services

**Thông tin Endpoint:**
| Thuộc tính | Giá trị |
|---|---|
| Xác thực (Authentication) | Có |
| Content-Type | application/json |

**Phản hồi (Responses):**
| Mã trạng thái | Mô tả |
|---|---|
| 200 | Successful Response |

---

### POST `/api/trips/{tripId}/mock-ota/book`

**Tên**: Book Mock Service

**Thông tin Endpoint:**
| Thuộc tính | Giá trị |
|---|---|
| Xác thực (Authentication) | Có |
| Content-Type | application/json |

**Body Request:**
- Tham chiếu Schema: `BookServiceRequest`

**Phản hồi (Responses):**
| Mã trạng thái | Mô tả |
|---|---|
| 200 | Successful Response |
| 422 | Validation Error |

---

