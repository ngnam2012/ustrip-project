# Tài Liệu UI Components

Thư mục `src/components/` chứa các thành phần giao diện được đóng gói và tái sử dụng trên toàn ứng dụng. Các component này tuân thủ nguyên tắc thiết kế **Dumb Component / Presentational Component** (chỉ nhận props và hiển thị, không chứa logic gọi API).

## Danh sách Components Tiêu biểu

### 1. `Button`
Nút bấm chuẩn của ứng dụng.
- **Props**: 
  - `variant` (primary, secondary, danger, outline).
  - `size` (sm, md, lg).
  - `isLoading`: Hiển thị spinner và disable nút bấm khi đang tải.
- **Mục đích**: Giữ thiết kế nhất quán và dễ sử dụng.

### 2. `Input` / `TextField`
Ô nhập liệu chuẩn.
- **Props**: `label`, `error`, `type`, `placeholder`.
- **Mục đích**: Bao bọc input HTML mặc định, thêm label và thông báo lỗi (validation error) ở dưới.

### 3. `Modal`
Hộp thoại bật lên (Popup).
- **Props**: `isOpen`, `onClose`, `title`, `children`.
- **Mục đích**: Dùng cho Form thêm/sửa chi tiêu, thêm thành viên. Hỗ trợ animation mở/đóng bằng Framer Motion.

### 4. `ExpenseCard` / `ActivityCard`
Card hiển thị thông tin tóm tắt.
- **Props**: `data` (object chứa thông tin expense/activity), `onClick`.
- **Mục đích**: Hiển thị trên danh sách trang tổng quan.

### 5. `LoadingSpinner`
- **Mục đích**: Hiển thị hiệu ứng xoay (spinner) đang tải trang hoặc tải một phần của trang.

## Nguyên Tắc Thiết Kế (Styling)
- Sử dụng **TailwindCSS** để style trực tiếp trên class (`className`).
- Tuân thủ bảng màu chung: `primary` (màu chính của brand), `gray` (màu nền/chữ), `red` (cảnh báo).
- Không lạm dụng custom CSS. Mọi style đặc biệt (ví dụ: shadow-custom) được định nghĩa trong `tailwind.config.js`.
