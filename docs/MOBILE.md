# Tài Liệu Ứng Dụng Mobile (React Native / Expo)

Dự án Mobile được xây dựng bằng **React Native** thông qua nền tảng **Expo**.

## Cấu trúc ứng dụng

```
apps/mobile/
├── src/          # Chứa toàn bộ mã nguồn ứng dụng (components, screens, utils)
├── App.js        # Điểm bắt đầu (Entry point), thiết lập Navigation
├── app.json      # Cấu hình Expo (tên app, icon, splash screen, plugins)
└── eas.json      # Cấu hình Expo Application Services (build & submit)
```

## Kiến trúc Navigation

Sử dụng thư viện **React Navigation v7**:
1. **Stack Navigator**: Quản lý luồng đăng nhập, đăng ký và chuyển đổi giữa các màn hình chi tiết (Ví dụ: Danh sách chuyến đi -> Chi tiết chuyến đi).
2. **Bottom Tabs Navigator**: Quản lý thanh điều hướng dưới cùng (Ví dụ: Khám phá, Chuyến đi, Tài khoản).

## Các tính năng Native & Expo Plugins
- **Bản đồ**: Tích hợp `react-native-maps` để hiển thị địa điểm trong lịch trình.
- **Thông báo**: Sử dụng `expo-notifications` để nhận Push Notification (nhắc nhở đóng góp, tin nhắn).
- **Camera & Thư viện ảnh**: Sử dụng `expo-image-picker` để upload avatar, ảnh hóa đơn.
- **Lưu trữ bảo mật**: Sử dụng `expo-secure-store` để lưu trữ JWT Token một cách an toàn.
- **Animation**: Tích hợp `react-native-reanimated` cho hiệu ứng hiệu suất cao 60fps.

## Kết nối Realtime

Tương tự như bản Web, ứng dụng Mobile cũng sử dụng `socket.io-client` để đồng bộ trạng thái theo thời gian thực (tin nhắn chat, cập nhật chi tiêu) ngay khi đang mở app.

## Build & Deploy
- Sử dụng **EAS Build** (`eas build -p android` / `eas build -p ios`) để tạo các tệp cài đặt (APK/AAB cho Android, IPA cho iOS).
- Hỗ trợ Over-The-Air (OTA) updates thông qua EAS Update (nếu có cấu hình).
