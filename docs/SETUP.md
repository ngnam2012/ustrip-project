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
2. Mở tab **SQL Editor**.
3. Mở file `database/schema.sql` trong mã nguồn và chạy toàn bộ nội dung để khởi tạo các bảng.
4. Chạy tiếp các file trong `database/migrations/` (nếu có cập nhật mới).
5. (Tuỳ chọn) Chạy file `database/seed_new_users.sql` để tạo dữ liệu giả lập.
6. Vào **Project Settings -> API** để lấy `SUPABASE_URL` và `SUPABASE_SERVICE_ROLE_KEY`.

## 3. Cài Đặt Backend (FastAPI Server)
1. Mở terminal, đi vào thư mục server:
   ```bash
   cd server
   ```
2. Cài đặt các thư viện Python:
   ```bash
   pip install -r requirements.txt
   ```
3. Tạo file `.env` từ `.env.example` (hoặc tạo mới) với nội dung:
   ```env
   # .env
   PORT=5000
   CLIENT_URL=http://localhost:5173
   MOBILE_CLIENT_URL=exp://192.168.x.x:8081
   JWT_SECRET=your_super_secret_key
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your_supabase_service_role_key
   GEMINI_API_KEY=your_gemini_api_key
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   MOMO_PARTNER_CODE=your_momo_code
   MOMO_ACCESS_KEY=your_momo_access
   MOMO_SECRET_KEY=your_momo_secret
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
   VITE_API_URL=http://localhost:5000
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
- **Lỗi CORS trên Web**: Đảm bảo cổng chạy web của bạn (thường là 5173) khớp với `CLIENT_URL` trong Backend `.env`.
- **Mobile không kết nối được Backend**: Đảm bảo điện thoại và máy tính cùng chung 1 mạng Wi-Fi và bạn đã nhập đúng địa chỉ IP máy tính vào `.env` của Mobile. Tắt tường lửa (Firewall) nếu cần.
- **Không gửi được tin nhắn chat**: Đảm bảo `socket_app` đang chạy (Socket.IO port là port chung của FastAPI server - 5000).
