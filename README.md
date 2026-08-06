# UsTrip — Ứng Dụng Quản Lý Chuyến Đi Nhóm

UsTrip là ứng dụng full-stack giúp nhóm bạn bè, gia đình lên kế hoạch du lịch, quản lý chi phí minh bạch và giao tiếp thời gian thực — trên cả Web lẫn Mobile.

---

## 🌟 Tính Năng Nổi Bật

| Tính năng | Mô tả |
|---|---|
| 📅 **Lịch trình AI** | Dùng Gemini AI sinh gợi ý lịch trình theo ngân sách & số ngày |
| 💰 **Tài chính minh bạch** | Quỹ chung, chi tiêu cá nhân/nhóm, thanh toán MoMo, tối ưu nợ tự động |
| 💬 **Chat thời gian thực** | Nhắn tin nhóm qua Socket.IO |
| 🔔 **Push Notification** | Nhắc đóng quỹ, cảnh báo chi phí qua Expo Notifications |
| 🗺️ **Bản đồ** | Gắn địa điểm hoạt động bằng OpenStreetMap |
| 🌐 **Chia sẻ chuyến đi** | Public/link trip để chia sẻ lịch trình với người khác |

---

## 🛠️ Tech Stack

- **Web Frontend**: React 19, Vite, TailwindCSS, Recharts
- **Mobile Frontend**: React Native (Expo), React Navigation
- **Backend API**: Python FastAPI + Socket.IO
- **Database**: Supabase (PostgreSQL) + migrations tự động
- **Dịch vụ**: MoMo Payment, Cloudinary, Google Gemini

---

## 📂 Cấu Trúc Dự Án

```text
ustrip-project/
├── apps/
│   ├── web/            # React + Vite (Web Dashboard)
│   └── mobile/         # React Native + Expo
├── server/             # Python FastAPI Backend
│   ├── src/
│   │   ├── routers/    # API routes
│   │   ├── schemas/    # Pydantic models
│   │   ├── services/   # Business logic
│   │   └── utils/
│   ├── requirements.txt
│   └── .env.example    ← copy thành .env
├── database/
│   ├── schema.sql      # Schema đầy đủ (fresh install)
│   ├── migrations/     # Incremental migrations (002–009)
│   └── migrate.js      # Migration runner (npm run db:push)
└── docs/               # Tài liệu kỹ thuật chi tiết
```

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy

### Yêu Cầu Hệ Thống

| Công cụ | Phiên bản |
|---|---|
| Node.js | ≥ 18 (khuyến nghị 20+) |
| Python | ≥ 3.12 |
| Expo Go | App trên iOS/Android |
| Tài khoản Supabase | Miễn phí tại supabase.com |

---

### Bước 0 — Chuẩn Bị API Keys

Bạn cần tài khoản và API key của các dịch vụ sau:

**Supabase** (bắt buộc):
1. Đăng nhập [supabase.com](https://supabase.com) → tạo project mới
2. Vào **Project Settings → API** → lấy:
   - `SUPABASE_URL` (Project URL)
   - `SUPABASE_ANON_KEY` (anon/public key)
   - `SUPABASE_SERVICE_ROLE_KEY` (service_role key — **giữ bí mật**)
3. Vào **Project Settings → Database → Connection string** → lấy `DATABASE_URL`  
   *(chọn tab "URI", nhớ thay `[YOUR-PASSWORD]` bằng mật khẩu DB của bạn)*

**Google Gemini** (cho tính năng AI):
- Truy cập [aistudio.google.com](https://aistudio.google.com) → **Get API key**

**Cloudinary** (cho upload ảnh):
- Đăng ký [cloudinary.com](https://cloudinary.com) → Dashboard → lấy Cloud Name, API Key, API Secret

**MoMo** (thanh toán — tùy chọn):
- Mặc định `MOMO_ENV=mock` → không cần key thật, hệ thống tự mô phỏng
- Nếu muốn dùng thật: đăng nhập [business.momo.vn](https://business.momo.vn) → tạo môi trường Test

---

### Bước 1 — Cấu Hình Biến Môi Trường

#### `server/.env`
```bash
cp server/.env.example server/.env
```
Điền vào `server/.env`:
```env
PORT=5000
CLIENT_URL=http://localhost:5173
MOBILE_CLIENT_URL=exp://localhost:8081

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_URL=postgresql://postgres.your-project:password@aws-x.pooler.supabase.com:6543/postgres

JWT_SECRET=any_random_string_at_least_32_chars
JWT_EXPIRES_IN=7d

GEMINI_API_KEY=your_gemini_api_key

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_FOLDER=ustrip

MOMO_ENV=mock
# Chỉ cần điền nếu MOMO_ENV=production:
MOMO_PARTNER_CODE=your_partner_code
MOMO_ACCESS_KEY=your_access_key
MOMO_SECRET_KEY=your_secret_key
MOMO_ENDPOINT=https://test-payment.momo.vn/v2/gateway/api/create
MOMO_QUERY_ENDPOINT=https://test-payment.momo.vn/v2/gateway/api/query
MOMO_REDIRECT_URL=http://localhost:5000/api/payments/momo/return
MOMO_IPN_URL=http://localhost:5000/api/payments/momo/ipn
MOMO_REQUEST_TYPE=captureWallet
```

#### `apps/web/.env`
```bash
# Tạo file mới (không có .env.example cho web)
```
Nội dung `apps/web/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

#### `apps/mobile/.env`
```bash
cp apps/mobile/.env.example apps/mobile/.env
```
Điền vào `apps/mobile/.env`:
```env
EXPO_PUBLIC_API_URL=http://<IP_LAN_CUA_BAN>:5000/api
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
EXPO_PUBLIC_MAP_PROVIDER=openstreetmap
EXPO_PUBLIC_OSM_TILE_URL=https://tile.openstreetmap.org/{z}/{x}/{y}.png
EXPO_PUBLIC_EAS_PROJECT_ID=your_eas_project_id
```

> **Lưu ý IP LAN cho Mobile:** Trên Windows, mở CMD → gõ `ipconfig` → tìm **IPv4 Address** (ví dụ `192.168.1.100`). Điền IP này vào `EXPO_PUBLIC_API_URL` để điện thoại kết nối được với máy tính.

---

### Bước 2 — Đồng Bộ Database

```bash
# Tại thư mục gốc
npm install
npm run db:push
```

Lệnh này sẽ:
- Kết nối đến Supabase qua `DATABASE_URL` trong `server/.env`
- Nếu DB trống → chạy `schema.sql` (fresh install)
- Nếu DB đã có → chỉ chạy các migrations chưa được apply
- Tự động tracking bằng bảng `schema_migrations`

Kết quả thành công trông như sau:
```
✅ Đã kết nối thành công!
ℹ️  DB đã có dữ liệu — bỏ qua schema.sql, chỉ chạy migrations.
✅ Không có migration nào cần chạy — DB đã cập nhật!
🎉 TOÀN BỘ QUÁ TRÌNH MIGRATION ĐÃ HOÀN TẤT!
```

---

### Bước 3 — Cài & Chạy Backend (Python FastAPI)

```bash
cd server

# Tạo môi trường ảo (chỉ cần làm 1 lần)
py -3.12 -m venv venv

# Kích hoạt môi trường ảo
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# Cài thư viện (chỉ cần làm 1 lần)
pip install -r requirements.txt

# Chạy server
uvicorn src.main:socket_app --host 0.0.0.0 --port 5000 --reload
```

Kiểm tra server đang chạy: mở [http://localhost:5000/health](http://localhost:5000/health)  
Xem toàn bộ API docs tại: [http://localhost:5000/docs](http://localhost:5000/docs)

---

### Bước 4 — Chạy Web Frontend (React + Vite)

```bash
cd apps/web
npm install
npm run dev
```

Truy cập ứng dụng tại [http://localhost:5173](http://localhost:5173)

---

### Bước 5 — Chạy Mobile (React Native + Expo)

```bash
cd apps/mobile
npm install
npm run start
```

Quét mã QR hiện ra bằng app **Expo Go** trên điện thoại (cùng mạng Wi-Fi với máy tính).

---

### Chạy Cả 3 Cùng Lúc (Tùy Chọn)

Sau khi đã `pip install` và `npm install` xong cho từng phần, có thể chạy tất cả từ thư mục gốc:

```bash
npm run dev
```

---

## 🔧 Troubleshooting

| Lỗi | Nguyên nhân | Cách fix |
|---|---|---|
| `type "trip_role" already exists` khi `db:push` | Chạy schema.sql trên DB đã có → đã fix trong migrate.js mới | Chạy lại `npm run db:push` |
| `DATABASE_URL chưa được thiết lập` | File `server/.env` chưa có hoặc URL bị sai định dạng | Kiểm tra `server/.env` có đúng tên key không |
| Mobile không kết nối Backend | IP sai hoặc khác mạng Wi-Fi | Điền đúng IPv4 LAN máy tính vào `EXPO_PUBLIC_API_URL` |
| CORS error trên Web | `CLIENT_URL` trong `server/.env` không khớp | Đảm bảo `CLIENT_URL=http://localhost:5173` |
| `function update_updated_at_column() does not exist` | Migration 005 cũ dùng sai tên function | Đã fix trong codebase — chạy lại `db:push` |

---

## 🌱 Seed Dữ Liệu Mẫu

```bash
# Seed cơ bản (user demo)
npm run db:push -- --seed

# Seed chuyến đi mẫu (chạy trực tiếp qua Supabase SQL Editor)
# database/seed_shared_trips.sql
# database/seed_debt_dashboard.sql
```

> **Lưu ý:** Các file seed có UUID cứng — đọc comment đầu file để biết tài khoản cần đăng ký trước.

---

## 📚 Tài Liệu Kỹ Thuật

| Tài liệu | Nội dung |
|---|---|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Kiến trúc tổng thể hệ thống |
| [SETUP.md](docs/SETUP.md) | Hướng dẫn cài đặt chi tiết |
| [DATABASE.md](docs/DATABASE.md) | Thiết kế database, các table |
| [ERD.md](docs/ERD.md) | Sơ đồ thực thể quan hệ |
| [API.md](docs/API.md) | Danh sách đầy đủ API endpoints |
| [API_FLOW.md](docs/API_FLOW.md) | Luồng xử lý business logic |
| [AUTH.md](docs/AUTH.md) | Cơ chế xác thực JWT |
| [SECURITY.md](docs/SECURITY.md) | Bảo mật hệ thống |
| [WEB.md](docs/WEB.md) | Ứng dụng Web |
| [MOBILE.md](docs/MOBILE.md) | Ứng dụng Mobile |
| [NETWORK.md](docs/NETWORK.md) | Luồng Network & Real-time |
| [DEPLOYMENT.md](docs/DEPLOYMENT.md) | Triển khai production |
