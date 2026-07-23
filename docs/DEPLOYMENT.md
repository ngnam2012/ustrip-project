# Hướng Dẫn Triển Khai (Deployment)

Tài liệu này hướng dẫn cách build và đưa ứng dụng UsTrip lên môi trường Production.

## 1. Triển Khai Database (Supabase)
Môi trường Database Production có thể được giữ chung tài khoản Supabase nhưng nên tạo một Project riêng (môi trường Staging/Prod).
- Chạy lại các file SQL trong `database/` (bao gồm schema và migrations) ở Project Supabase mới.
- Thiết lập Backups tự động nếu là Production.

## 2. Triển Khai Backend (FastAPI)
- Backend có thể deploy lên **Render, Railway, Fly.io, hoặc VPS (DigitalOcean, AWS EC2)**.
- Đảm bảo thiết lập đầy đủ các biến môi trường (Environment Variables) trên Server Production. Cập nhật `CLIENT_URL` và `MOBILE_CLIENT_URL` trỏ về domain thật.

### Docker (Tùy chọn)
Nếu sử dụng Docker, bạn cần viết một `Dockerfile` cho thư mục `server`:
```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "src.main:socket_app", "--host", "0.0.0.0", "--port", "5000"]
```

## 3. Triển Khai Web (React + Vite)
Web App là ứng dụng Static SPA, có thể host miễn phí trên **Vercel, Netlify, hoặc Cloudflare Pages**.
1. Đảm bảo `.env.production` (hoặc biến môi trường trên Vercel) có `VITE_API_URL` trỏ tới domain của Backend (Ví dụ: `https://api.ustrip.com`).
2. Build code:
   ```bash
   cd apps/web
   npm run build
   ```
3. Thư mục `dist/` sẽ chứa các file nén (HTML, CSS, JS). Bạn đẩy thư mục này lên server. Nếu deploy trên Vercel, nó sẽ tự động chạy lệnh `npm run build` và host thư mục `dist`.

## 4. Triển Khai Mobile (React Native Expo)
Deploy ứng dụng Mobile tốn nhiều công sức hơn vì cần đẩy lên App Store và Google Play.
- Sử dụng **EAS Build** (Expo Application Services).
1. Cài đặt EAS CLI: `npm install -g eas-cli`
2. Đăng nhập: `eas login`
3. Cấu hình file `eas.json` cho môi trường production.
4. Khởi chạy quá trình build:
   ```bash
   eas build --platform android --profile production
   eas build --platform ios --profile production
   ```
5. Đẩy bản build (AAB cho Android, IPA cho iOS) lên cửa hàng ứng dụng (Dùng `eas submit`).

## 5. Giám sát (Monitoring)
- Giám sát Database thông qua Dashboard của Supabase (Băng thông, API Requests).
- Đọc log Backend bằng các công cụ như Datadog hoặc Sentry để phát hiện lỗi người dùng.
