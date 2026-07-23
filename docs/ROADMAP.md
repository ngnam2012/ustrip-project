# Lộ Trình Phát Triển (Roadmap)

Tài liệu này theo dõi các tính năng hiện tại, tính năng đang phát triển, và nợ kỹ thuật (Technical Debt) của UsTrip.

## Các tính năng đã hoàn thiện (Current Implemented Features)
- [x] Đăng ký, đăng nhập và quản lý tài khoản.
- [x] Tạo và quản lý thông tin chuyến đi (Ngày đi, ngày về, ngân sách, ảnh bìa).
- [x] Thêm/xóa thành viên vào chuyến đi.
- [x] Lên lịch trình, gợi ý lịch trình bằng AI (Gemini).
- [x] Quản lý chi tiêu cá nhân và chi tiêu nhóm.
- [x] Thuật toán chia sẻ chi tiêu (Expense Splits).
- [x] Quỹ chung chuyến đi.
- [x] Tích hợp thanh toán MoMo để nạp quỹ.
- [x] Chat realtime qua Socket.IO.
- [x] Thống kê tài chính (Dashboard) trực quan bằng biểu đồ.
- [x] Nhắc nhở và Push Notifications.
- [x] Hỗ trợ cả 2 nền tảng Web và Mobile.

## Các tính năng đang lên kế hoạch (Planned Features)
- [ ] Tính năng chia tiền không đều (Percentage split, Exact amount split).
- [ ] Đồng bộ hóa Offline (Offline-first support) cho Mobile App.
- [ ] Chế độ tối (Dark Mode) toàn diện cho Web và Mobile.
- [ ] Export báo cáo tài chính ra file PDF/Excel.
- [ ] Đăng nhập bằng Google / Facebook (Social Login).
- [ ] Đa ngôn ngữ (i18n).

## Nợ kỹ thuật (Technical Debt Identified)
- **Test Coverage**: Thiếu Unit Tests cho Backend và Frontend. Cần tích hợp `pytest` (cho FastAPI) và `vitest` (cho React).
- **CI/CD Pipeline**: Hiện tại việc build và deploy vẫn phụ thuộc vào cá nhân, cần thiết lập GitHub Actions để tự động hóa linting và testing.
- **Tối ưu Database**: Bảng `trip_messages` (Chat) nếu phát triển lớn sẽ rất nặng, cần xem xét chia phân vùng (partitioning) hoặc chuyển qua NoSQL.
- **Quản lý Token**: Hiện tại JWT token không có cơ chế Refresh Token, cần nâng cấp để trải nghiệm người dùng không bị gián đoạn khi token hết hạn.
