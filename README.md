# UsTrip

UsTrip is an all-in-one group travel planner and shared finance manager. This repository contains a connected React web app, Expo mobile app, Express API, Supabase PostgreSQL schema, Cloudinary uploads, API docs, and Postman tests.

## Structure

```text
apps/web       React + Vite + Tailwind
apps/mobile    React Native + Expo
server         Express REST API
database       Supabase schema and sample seed
docs           Setup and API documentation
postman        Postman collection
```

## Quick start

```bash
npm install
cp server/.env.example server/.env
cp apps/web/.env.example apps/web/.env
cp apps/mobile/.env.example apps/mobile/.env
npm run dev:server
npm run dev:web
npm run dev:mobile
```

Đọc [hướng dẫn cài đặt tiếng Việt](docs/SETUP.md) trước lần chạy đầu tiên. Xem [ERD cơ sở dữ liệu](docs/ERD.md) để hiểu cấu trúc và quan hệ giữa các bảng.

Sau khi cấu hình các file `.env`, chạy toàn bộ chương trình bằng:

```bash
npm run dev
```

Trên Windows cũng có thể nhấp đúp `run.bat`.

## Sample account

After running `database/seed.sql`, use `an@ustrip.vn` / `Password123!`.

## Main capabilities

- JWT authentication and protected routes
- Owner/member authorization for trip resources
- Trip, member, itinerary, shared fund, contribution, expense, and reminder management
- Equal expense splitting and settlement tracking
- Cloudinary image uploads with file type and size validation
- Financial summaries and notification records
- Responsive Stitch-inspired web UI and Expo mobile UI
- UI-only AI itinerary suggestion placeholder
- Đóng góp quỹ qua MoMo gateway với IPN/signature verification và mock mode
- Bản đồ OpenStreetMap/Leaflet trên web và OpenStreetMap tile trên Android/iOS, không cần Google Maps API key
