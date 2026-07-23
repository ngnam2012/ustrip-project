# Tài Liệu Ứng Dụng Web (React 19)

Dự án Web được xây dựng bằng **React 19**, **Vite**, và **TailwindCSS**.

## Cấu trúc thư mục (`apps/web/src`)

```
src/
├── components/   # Các UI components dùng chung (Button, Input, Modal, ...)
├── context/      # React Context (AuthContext, SocketContext)
├── hooks/        # Custom React Hooks
├── lib/          # Utilities, config API client
├── pages/        # Các trang màn hình chính (ứng với Route)
├── App.jsx       # Cấu hình Routing chính của ứng dụng
├── main.jsx      # Điểm entry của React (Root)
└── index.css     # File CSS toàn cục (chứa biến Tailwind)
```

## Kiến trúc Routing

Dự án sử dụng `react-router-dom` cho việc chuyển trang.
Các route được định nghĩa trong `App.jsx` và chia thành 2 nhóm chính:

1. **Public Routes**: `/login`, `/register`. Không yêu cầu đăng nhập.
2. **Protected Routes**: Các route còn lại. Yêu cầu đăng nhập, nếu chưa đăng nhập sẽ bị đẩy về `/login`.
   - Sử dụng một component bọc (Wrapper) để kiểm tra Auth Context trước khi render.

## State Management

Ứng dụng không sử dụng thư viện quản lý trạng thái bên thứ 3 cồng kềnh (như Redux). Thay vào đó, sử dụng:
1. **Context API**: Cho các state toàn cục (Global State) như Thông tin User (`AuthContext`) và kết nối Socket.IO (`SocketContext`).
2. **Local State**: `useState` và `useReducer` cho các state cục bộ của component.

## Công nghệ & Thư viện Chính
- **Vite**: Build tool cực nhanh.
- **TailwindCSS**: Tiện ích styling (Utility-first CSS).
- **Framer Motion**: Animation mượt mà.
- **Recharts**: Vẽ biểu đồ tài chính.
- **Leaflet / react-leaflet**: Hiển thị bản đồ lịch trình.
- **Socket.IO Client**: Kết nối realtime với Backend.
- **react-hot-toast**: Hiển thị thông báo (toast).
