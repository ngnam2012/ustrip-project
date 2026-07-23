# Quản lý Trạng thái (State Management)

Tài liệu này giải thích cách quản lý trạng thái luồng dữ liệu bên trong Web và Mobile App.

## 1. Global State với React Context

Chúng ta sử dụng **Context API** có sẵn của React thay vì Redux hay Zustand để giữ cho ứng dụng nhẹ và nhanh.

### `AuthContext`
- **Mục đích**: Lưu trữ thông tin người dùng hiện tại đang đăng nhập (`user`) và hàm `logout`.
- **Luồng dữ liệu**:
  1. Khi app khởi động (trong `App.jsx`), `AuthContext.Provider` bọc toàn bộ app.
  2. Nó gọi `/api/auth/me` để lấy thông tin user dựa vào token lưu trong `localStorage`.
  3. Bất kỳ component nào cần thông tin người dùng đều gọi `const { user } = useAuth()`.
  
## 2. Local State
Hầu hết các màn hình (Pages) đều quản lý state của riêng nó thông qua `useState`.
- **Ví dụ**: Trang Quản lý Chi tiêu (`ExpensePage.jsx`) sẽ có `expenses`, `showModal`, `editingExpense`, v.v.

## 3. Form State
Ứng dụng sử dụng Native HTML forms (`onSubmit`, `FormData`) kết hợp với Controlled Components để quản lý trạng thái form. Không dùng thư viện bên thứ 3 như React Hook Form để giảm thiểu dependency.

## 4. Server State (Dữ liệu từ API)
Được quản lý thông qua **Custom Hook `useRemote`**.
- State của dữ liệu gọi từ Server được giữ ở mức Local (trong component gọi hook).
- Khi có thay đổi (Create, Update, Delete), component sẽ gọi hàm fetch lại danh sách hoặc cập nhật trực tiếp state cục bộ để UI phản hồi ngay lập tức (Optimistic UI).
