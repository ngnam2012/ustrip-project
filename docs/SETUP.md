# Hướng Dẫn Cài Đặt (Setup Guide)

Tài liệu này hướng dẫn cách cài đặt và chạy toàn bộ hệ thống UsTrip ở môi trường Local.

## 1. Yêu Cầu Hệ Thống (Requirements)
- **Node.js**: Phiên bản 18 trở lên (khuyến nghị 20). Dùng để chạy Web và Mobile.
- **Python**: Phiên bản 3.12 trở lên. Dùng để chạy Backend FastAPI.
- **Tài khoản Supabase**: Đăng ký miễn phí tại [Supabase](https://supabase.com).
- **Tài khoản Cloudinary**: Dùng để lưu trữ ảnh.
- **Expo Go**: Tải app Expo Go trên điện thoại (iOS/Android) để chạy Mobile app.
- **Trình duyệt**: Chrome, Firefox hoặc Edge.

## 2. Cài Đặt Cơ Sở Dữ Liệu (Database Setup)
Dự án sử dụng PostgreSQL thông qua Supabase.
1. Tạo một Project mới trên Supabase.
2. Vào **Project Settings → API** để lấy `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
3. Vào **Project Settings → Database → Connection string (URI)** để lấy `DATABASE_URL`. Thay `[YOUR-PASSWORD]` bằng mật khẩu DB.
4. Điền vào `server/.env` (xem Bước 3), rồi chạy lệnh sau tại thư mục gốc:
   ```bash
   npm run db:push
   ```
   Lệnh này tự động chạy schema + migrations và tracking các migration đã apply (idempotent).
5. (Tuỳ chọn) Seed dữ liệu mẫu:
   ```bash
   npm run db:push -- --seed
   ```

## 3. Cài Đặt Backend (FastAPI Server)
1. Mở terminal, đi vào thư mục server:
   ```bash
   cd server
   ```
2. Cài đặt các thư viện Python:
   ```bash
   pip install -r requirements.txt
   ```
3. Tạo file `.env` từ `.env.example`:
   ```bash
   cp .env.example .env    # macOS/Linux
   copy .env.example .env  # Windows
   ```
   Nội dung cần điền vào `server/.env`:
   ```env
   PORT=5000
   CLIENT_URL=http://localhost:5173
   MOBILE_CLIENT_URL=exp://localhost:8081
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   DATABASE_URL=postgresql://postgres.xxx:password@aws-x.pooler.supabase.com:6543/postgres
   JWT_SECRET=any_random_string_32_chars
   JWT_EXPIRES_IN=7d
   GEMINI_API_KEY=your_gemini_api_key
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   CLOUDINARY_FOLDER=ustrip
   MOMO_ENV=mock
   ```
4. Chạy server (sử dụng Uvicorn):
   ```bash
   npm run dev:server
   # Hoặc chạy lệnh trực tiếp trong thư mục server:
   # uvicorn src.main:socket_app --host 0.0.0.0 --port 5000 --reload
   ```

## 4. Cài Đặt Frontend Web (React + Vite)
1. Mở terminal mới, đi vào thư mục web:
   ```bash
   cd apps/web
   ```
2. Cài đặt dependencies:
   ```bash
   npm install
   ```
3. Tạo file `.env` trong `apps/web`:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```
4. Chạy Web:
   ```bash
   npm run dev
   ```
5. Mở trình duyệt ở địa chỉ `http://localhost:5173`.

## 5. Cài Đặt Frontend Mobile (React Native + Expo)
1. Mở terminal mới, đi vào thư mục mobile:
   ```bash
   cd apps/mobile
   ```
2. Cài đặt dependencies:
   ```bash
   npm install
   ```
3. Tạo file `.env` trong `apps/mobile`:
   ```env
   EXPO_PUBLIC_API_URL=http://<IP_LAN_CUA_MAY_TINH>:5000
   ```
   *Lưu ý*: Đối với Mobile, bạn phải sử dụng địa chỉ IP LAN (VD: 192.168.1.5) thay vì `localhost`. Bạn cũng cần cập nhật IP này vào biến `MOBILE_CLIENT_URL` của Backend.
4. Khởi động Expo:
   ```bash
   npm run start
   ```
5. Dùng ứng dụng Expo Go trên điện thoại quét mã QR hiện ra ở Terminal.

## 6. Chạy Cả 3 Cùng Lúc
Dự án có hỗ trợ npm script để chạy đồng thời thông qua thư viện `concurrently`. Tại thư mục gốc (root), bạn chỉ cần chạy:
```bash
npm install
npm run dev
```

## 7. Troubleshooting (Lỗi Thường Gặp)
- **`type "trip_role" already exists`**: migrate.js mới đã fix — chạy lại `npm run db:push`.
- **`DATABASE_URL chưa được thiết lập`**: Kiểm tra `server/.env` có đúng tên key và không bị dòng trống đầu file.
- **Lỗi CORS trên Web**: Đảm bảo `CLIENT_URL=http://localhost:5173` trong `server/.env`.
- **Mobile không kết nối được Backend**: Điện thoại và máy tính phải cùng Wi-Fi. Điền đúng IPv4 LAN vào `EXPO_PUBLIC_API_URL` trong `apps/mobile/.env`.
- **Không gửi được tin nhắn chat**: Đảm bảo server đang chạy trên port 5000 (Socket.IO dùng cùng port với FastAPI).
