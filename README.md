# UsTrip (Dự án Quản Lý Chuyến Đi)

UsTrip là một ứng dụng quản lý chuyến đi toàn diện, cung cấp cho nhóm bạn bè, gia đình, hoặc cá nhân khả năng lên kế hoạch, thống kê chi phí, và liên lạc thời gian thực trong chuyến du lịch.

Hệ thống hỗ trợ đa nền tảng: Giao diện Web (cho quản lý bao quát) và Giao diện Mobile (tiện dụng trong quá trình di chuyển).

## 📸 Giao Diện Của Ứng Dụng (Screenshots)

## 🌟 Tính năng Nổi bật

UsTrip giúp giải quyết mọi vấn đề thường gặp khi du lịch nhóm:

- **Lịch trình thông minh (AI)**: Sử dụng Gemini AI để tự động sinh ra gợi ý lịch trình chuyến đi dựa trên ngân sách và số ngày.
- **Tài chính minh bạch**: Tính toán khoản nợ, các khoản chi tiêu nhóm/cá nhân, lập quỹ chung và thanh toán thông qua **MoMo**. Tự động tính toán phương án trả nợ thông minh.
- **Tương tác thời gian thực**: Trò chuyện (Chat), Push notification nhắc nhở đóng quỹ, cảnh báo vượt chi phí trực tiếp trên thiết bị (Sử dụng Socket.IO & Expo Notifications).

## 🛠️ Công Nghệ (Tech Stack)

Dự án là một Full-stack Application với kiến trúc tách biệt rõ ràng. Tham khảo thêm tại [Kiến trúc hệ thống](docs/ARCHITECTURE.md).

- **Web Frontend**: React 19, Vite, TailwindCSS, Recharts. Đọc thêm tại [WEB.md](docs/WEB.md).
- **Mobile Frontend**: React Native Expo, React Navigation, Maps. Đọc thêm tại [MOBILE.md](docs/MOBILE.md).
- **Backend API**: Python FastAPI, Socket.IO, Pydantic, GenAI. Đọc thêm tại [API.md](docs/API.md) và [API Flow](docs/API_FLOW.md).
- **Database**: Supabase (PostgreSQL). Đọc thêm tại [DATABASE.md](docs/DATABASE.md) và [ERD](docs/ERD.md).
- **Dịch vụ phụ trợ**: MoMo Payment Gateway, Cloudinary, Google Gemini.

## 📂 Cấu trúc dự án

Toàn bộ mã nguồn sử dụng cơ chế Monorepo (để Frontend cạnh nhau) và chia thành các khối độc lập:

```text
ustrip-project/
├── apps/               # Mã nguồn Client
│   ├── web/            # (React + Vite)
│   └── mobile/         # (React Native + Expo)
├── server/             # Mã nguồn Backend API (Python FastAPI)
├── database/           # Scripts SQL khởi tạo Database & Migrations
└── docs/               # Chứa toàn bộ các Tài liệu Kỹ Thuật (Docs)
```

## 🚀 Cách Chạy Ứng Dụng (Quick Start)

### 1. Đồng bộ Database

Chạy lệnh sau tại thư mục gốc để đẩy tự động các file SQL (schema và migrations) lên Supabase:

```bash
npm run db:push
```

### 2. Chạy Backend (Python FastAPI)

Vì Backend được viết bằng Python, bạn cần cài đặt thư viện trước khi chạy (khuyên dùng môi trường ảo `venv`):

```bash
cd server
python -m venv venv
source venv/bin/activate  # Trên Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn src.main:socket_app --host 0.0.0.0 --port 5000 --reload
```
*(Hoặc nếu đã cài thư viện, bạn có thể chạy nhanh bằng lệnh `npm run dev:server` ở thư mục gốc).*

### 3. Chạy Frontend Web (React)

Mở terminal mới ở thư mục gốc:

```bash
cd apps/web
npm install
npm run dev
```
*(Hoặc chạy lệnh `npm run dev:web` ở thư mục gốc).*

### 4. Chạy Frontend Mobile (Expo)

Mở terminal mới ở thư mục gốc:

```bash
cd apps/mobile
npm install
npm run start
```
*(Hoặc chạy lệnh `npm run dev:mobile` ở thư mục gốc).*

### 5. Chạy Cả Hệ Thống Bằng Lệnh Tổng (Tùy chọn)

Nếu bạn đã cài xong `pip install` cho Backend và `npm install` cho các Frontend, bạn có thể khởi động cả 3 cùng lúc ở thư mục gốc bằng lệnh:

```bash
npm install
npm run dev
```

> [!NOTE]
> Đảm bảo bạn đã thiết lập đúng các file `.env` trước khi chạy. Vui lòng xem hướng dẫn chi tiết từng bước tại **[Hướng Dẫn Cài Đặt (SETUP.md)](docs/SETUP.md)**.

## 📚 Tổng Hợp Tài Liệu

Hãy nhấp vào các liên kết dưới đây để xem tài liệu chi tiết cho từng phần của dự án:

### Kiến Trúc và Thiết Lập

- [Kiến trúc Tổng thể (ARCHITECTURE.md)](docs/ARCHITECTURE.md)
- [Hướng dẫn Cài đặt (SETUP.md)](docs/SETUP.md)
- [Hướng dẫn Triển khai (DEPLOYMENT.md)](docs/DEPLOYMENT.md)
- [Lộ trình phát triển (ROADMAP.md)](docs/ROADMAP.md)

### Database và Backend

- [Cơ sở dữ liệu (DATABASE.md)](docs/DATABASE.md)
- [Sơ đồ Thực thể ERD (ERD.md)](docs/ERD.md)
- [Danh sách APIs (API.md)](docs/API.md)
- [Luồng API và Xử lý logic (API_FLOW.md)](docs/API_FLOW.md)
- [Bảo mật Hệ thống (SECURITY.md)](docs/SECURITY.md)
- [Cơ chế Xác thực (AUTH.md)](docs/AUTH.md)

### Frontend (Web & Mobile)

- [Ứng dụng Web (WEB.md)](docs/WEB.md)
- [Ứng dụng Mobile (MOBILE.md)](docs/MOBILE.md)
- [Luồng Network & Real-time (NETWORK.md)](docs/NETWORK.md)
- [Quản lý State (STATE.md)](docs/STATE.md)
- [Custom Hooks (HOOKS.md)](docs/HOOKS.md)
- [UI Components (COMPONENTS.md)](docs/COMPONENTS.md)

## 🤝 Đóng Góp

- Đọc [Hướng Dẫn Đóng Góp (CONTRIBUTING.md)](CONTRIBUTING.md).
- Xem lịch sử [Changelog](CHANGELOG.md).
- Giấy phép mã nguồn: [MIT License](LICENSE).
