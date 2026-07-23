# Tài Liệu Giao Tiếp Mạng (Network & API Client)

Tài liệu này trình bày luồng giao tiếp mạng giữa Client (Web/Mobile) và Server (FastAPI).

## 1. API Client (`lib/api.js`)

Ứng dụng không dùng thư viện `axios` mà sử dụng `fetch` API gốc của trình duyệt để gọi REST API, được gói gọn trong file `api.js`.

### Luồng gọi API
- Mọi request đều gọi hàm helper `fetchAPI(endpoint, options)`.
- Hàm `fetchAPI` thực hiện:
  1. Gắn **Base URL** (biến môi trường `VITE_API_URL` hoặc `EXPO_PUBLIC_API_URL`).
  2. Lấy **JWT Token** từ Local Storage / Secure Store.
  3. Tự động đính kèm header `Authorization: Bearer <token>`.
  4. Đính kèm header `Content-Type: application/json` (trừ khi gửi form data).
  5. Gọi request.
  6. **Xử lý lỗi**: Kiểm tra HTTP status. Nếu `!response.ok`, sẽ ném ra lỗi (throw Error) với thông điệp từ server để UI hiển thị.

### Token Refresh & Offline Strategy
- Hiện tại dự án sử dụng **Long-lived JWT Token** (không có refresh token).
- Nếu token hết hạn (Status `401`), hàm xử lý lỗi sẽ tự động đăng xuất người dùng (`logout()`) và xóa token.
- **Offline Strategy**: Ứng dụng hiển thị thông báo lỗi "Network request failed" thông qua `react-hot-toast` nếu không có mạng. (Hiện chưa hỗ trợ offline-first mode qua PouchDB hay WatermelonDB).

## 2. Real-time Communication (Socket.IO)

Để hỗ trợ tính năng chat, thông báo tức thời, và tự động cập nhật danh sách chi tiêu, ứng dụng dùng `socket.io-client`.

- **Luồng kết nối**:
  1. Khi user đăng nhập thành công, app sẽ kết nối Socket (`io()`).
  2. Truyền token vào query params hoặc auth payload của socket để Server xác thực.
  3. App tham gia vào "phòng" (Room) ứng với `trip_id` (`socket.emit('join_trip', trip_id)`).
- **Lắng nghe sự kiện**: Khi có tin nhắn mới hoặc cập nhật chi phí, server phát sự kiện. Component lắng nghe sự kiện (`socket.on('new_expense', ...)`) và gọi hàm fetch lại dữ liệu mới nhất mà không cần tải lại trang.
