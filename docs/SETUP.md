# Hướng dẫn cài đặt và chạy UsTrip

Tài liệu này hướng dẫn thiết lập toàn bộ hệ thống UsTrip gồm:

- Backend Express API
- Web React + Vite
- Mobile React Native + Expo
- Supabase PostgreSQL
- Cloudinary
- Postman

Sơ đồ cơ sở dữ liệu được mô tả tại [ERD.md](ERD.md).

## 1. Yêu cầu hệ thống

Cài đặt các công cụ sau trước khi bắt đầu:

- Node.js phiên bản 20 trở lên
- npm phiên bản 10 trở lên
- Git
- Tài khoản Supabase
- Tài khoản Cloudinary
- Postman để kiểm thử API
- Expo Go trên điện thoại để chạy ứng dụng mobile

Kiểm tra phiên bản:

```bash
node --version
npm --version
git --version
```

Các lệnh trong tài liệu này được chạy tại thư mục gốc `ustrip-project`, trừ khi có ghi chú khác.

## 2. Cấu trúc dự án

```text
ustrip-project/
├── apps/
│   ├── web/              # React + Vite + Tailwind CSS
│   └── mobile/           # React Native + Expo
├── server/               # Express REST API
├── database/
│   ├── schema.sql        # Cấu trúc database
│   └── seed.sql          # Dữ liệu mẫu
├── docs/                 # Tài liệu
└── postman/              # Postman collection
```

## 3. Tạo và cấu hình Supabase

### 3.1. Tạo project

1. Truy cập [Supabase Dashboard](https://supabase.com/dashboard).
2. Chọn **New project**.
3. Chọn organization, nhập tên project và mật khẩu database.
4. Chọn region gần người dùng nhất rồi tạo project.
5. Lưu lại mật khẩu database để lấy connection string.

### 3.2. Lấy các khóa Supabase

Trong Supabase Dashboard, mở **Project Settings > API**:

- Sao chép **Project URL** vào `SUPABASE_URL`.
- Sao chép khóa **anon public** vào `SUPABASE_ANON_KEY`.
- Sao chép khóa **service_role** vào `SUPABASE_SERVICE_ROLE_KEY`.

Lưu ý bảo mật:

- `SUPABASE_SERVICE_ROLE_KEY` chỉ được đặt trong `server/.env`.
- Không đưa service role key vào web, mobile hoặc Git.
- Web và mobile hiện giao tiếp với Supabase thông qua Express API.

### 3.3. Lấy DATABASE_URL

1. Mở **Project Settings > Database**.
2. Tìm phần **Connection string**.
3. Chọn URI và sao chép chuỗi kết nối.
4. Thay phần mật khẩu placeholder bằng mật khẩu database đã tạo.
5. Đặt chuỗi kết nối vào biến `DATABASE_URL` trong `server/.env`.

### 3.4. Tạo bảng và dữ liệu mẫu

1. Mở **SQL Editor** trong Supabase Dashboard.
2. Tạo query mới.
3. Sao chép toàn bộ nội dung `database/schema.sql` và chạy query.
4. Tạo query mới.
5. Sao chép toàn bộ nội dung `database/seed.sql` và chạy query.

`schema.sql` sẽ tạo:

- Các bảng, khóa chính và khóa ngoại
- Enum và constraint
- Index hỗ trợ truy vấn
- Trigger tự động cập nhật `updated_at`
- Row Level Security cho toàn bộ bảng

Backend sử dụng service role key nên vẫn có thể truy cập dữ liệu khi RLS được bật. Client không được phép truy cập trực tiếp các bảng.

Sau khi chạy seed, có thể đăng nhập bằng:

```text
Email: an@ustrip.vn
Mật khẩu: Password123!
```

## 4. Tạo và cấu hình Cloudinary

1. Truy cập [Cloudinary](https://cloudinary.com) và tạo tài khoản.
2. Mở Cloudinary Console.
3. Sao chép:
   - Cloud name
   - API key
   - API secret
4. Đặt các giá trị vào `server/.env`:

```env
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
CLOUDINARY_FOLDER=ustrip
```

API secret chỉ được lưu trong backend. Backend hiện giới hạn ảnh tải lên tối đa 5 MB và chỉ chấp nhận JPEG, PNG, WebP hoặc HEIC.

## 5. Tạo các file môi trường

### 5.1. Trên PowerShell

```powershell
Copy-Item server/.env.example server/.env
Copy-Item apps/web/.env.example apps/web/.env
Copy-Item apps/mobile/.env.example apps/mobile/.env
```

### 5.2. Trên macOS hoặc Linux

```bash
cp server/.env.example server/.env
cp apps/web/.env.example apps/web/.env
cp apps/mobile/.env.example apps/mobile/.env
```

### 5.3. Cấu hình backend

Mở `server/.env` và điền đầy đủ:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MOBILE_CLIENT_URL=exp://localhost:8081

SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
DATABASE_URL=your_supabase_postgres_connection_string

JWT_SECRET=your_long_random_jwt_secret
JWT_EXPIRES_IN=7d

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
CLOUDINARY_FOLDER=ustrip
```

`JWT_SECRET` nên là một chuỗi dài, ngẫu nhiên và không được commit lên Git.

### 5.4. Cấu hình web

Mở `apps/web/.env`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 5.5. Cấu hình mobile

Mở `apps/mobile/.env`:

```env
EXPO_PUBLIC_API_URL=http://your-local-ip:5000/api
EXPO_PUBLIC_EAS_PROJECT_ID=your_eas_project_id
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Khi chạy bằng điện thoại thật, không sử dụng `localhost` cho `EXPO_PUBLIC_API_URL`. Hãy dùng địa chỉ IP LAN của máy tính, ví dụ:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.20:5000/api
```

Điện thoại và máy tính cần kết nối cùng mạng Wi-Fi. Tường lửa Windows cũng phải cho phép kết nối tới cổng `5000`.

## 6. Cài đặt dependencies

Tại thư mục `ustrip-project`, chạy:

```bash
npm install
```

Dự án sử dụng npm workspaces nên lệnh này sẽ cài dependencies cho server, web và mobile.

## 7. Chạy dự án tại máy local

### Cách nhanh: chạy toàn bộ chương trình

Trên Windows, nhấp đúp `run.bat` hoặc chạy:

```powershell
.\run.bat
```

Ngoài ra, có thể chạy trực tiếp:

```bash
npm run dev
```

Lệnh này chạy đồng thời backend, web và Expo mobile trong cùng terminal. Nhấn `Ctrl+C` để dừng toàn bộ chương trình.

### Chạy từng thành phần riêng

Mở ba terminal riêng tại thư mục `ustrip-project`.

### Terminal 1: Backend

```bash
npm run dev:server
```

Địa chỉ mặc định:

- API: `http://localhost:5000/api`
- Health check: `http://localhost:5000/health`

### Terminal 2: Web

```bash
npm run dev:web
```

Web thường chạy tại `http://localhost:5173`.

### Terminal 3: Mobile

```bash
npm run dev:mobile
```

Sau khi Expo khởi động:

- Quét QR bằng Expo Go để chạy trên thiết bị thật.
- Nhấn `a` để mở Android emulator nếu đã cấu hình.
- iOS Simulator chỉ chạy trực tiếp trên macOS.

## 8. Build và kiểm tra mã nguồn

Kiểm tra backend và tạo production build cho web:

```bash
npm run check
```

Kiểm tra cấu hình Expo:

```bash
cd apps/mobile
npx expo-doctor
```

Tạo bundle Android để kiểm tra:

```bash
npx expo export --platform android
```

Tạo bundle iOS để kiểm tra:

```bash
npx expo export --platform ios
```

Lưu ý: có thể tạo iOS bundle trên Windows, nhưng để chạy iOS Simulator cần máy macOS. Build iOS production có thể thực hiện bằng EAS Cloud.

## 9. Kiểm thử API bằng Postman

1. Mở Postman.
2. Import file `postman/UsTrip.postman_collection.json`.
3. Kiểm tra collection variable:

```text
baseUrl = http://localhost:5000/api
```

4. Chạy request **Login** trước.
5. Test script của request Login sẽ tự lưu JWT vào biến `token`.
6. Cập nhật các biến `tripId`, `expenseId` hoặc resource ID khác khi cần.
7. Chạy các request còn lại.

Tài liệu endpoint chi tiết nằm trong [API.md](API.md).

## 10. Deploy backend lên Render

1. Đưa source code lên GitHub.
2. Trong Render, tạo **Web Service** mới từ repository.
3. Cấu hình:

```text
Root Directory: ustrip-project
Build Command: npm install
Start Command: npm run start -w server
```

4. Thêm toàn bộ biến môi trường từ `server/.env.example`.
5. Đặt `NODE_ENV=production`.
6. Sau khi web được deploy, cập nhật `CLIENT_URL` bằng URL Vercel.
7. Deploy lại backend.

Có thể deploy lên Railway tương tự, sử dụng start command:

```bash
npm run start -w server
```

## 11. Deploy web lên Vercel

1. Import GitHub repository vào Vercel.
2. Đặt **Root Directory** là `ustrip-project/apps/web`.
3. Chọn framework preset **Vite**.
4. Thêm biến môi trường:

```env
VITE_API_URL=https://your-backend-domain/api
```

5. Deploy.
6. Cập nhật `CLIENT_URL` trên backend thành URL Vercel vừa tạo.

## 12. Build mobile bằng EAS

### 12.1. Cài đặt và đăng nhập

```bash
npm install -g eas-cli
cd apps/mobile
eas login
eas init
eas build:configure
```

### 12.2. Build Android

```bash
eas build --platform android
```

### 12.3. Build iOS

```bash
eas build --platform ios
```

Build hoặc phát hành iOS cần tài khoản Apple Developer. Trước khi build production, đặt `EXPO_PUBLIC_API_URL` thành URL backend đã deploy.

`eas init` sẽ gắn EAS Project ID vào cấu hình ứng dụng. Mobile dùng ID này để lấy Expo push token, gửi token về backend và nhận push khi server tạo thông báo. Có thể đặt thủ công ID đó vào `EXPO_PUBLIC_EAS_PROJECT_ID`.

Để kiểm tra push notification ổn định, dùng thiết bị thật với development build hoặc production build. Sau khi đăng nhập, mục **Hồ sơ & cài đặt > Thông báo đẩy** sẽ hiển thị trạng thái đăng ký. Khi app đang mở, danh sách thông báo và badge được đồng bộ ngay khi nhận push, đồng thời có polling dự phòng mỗi 5 giây.

## 13. Xử lý lỗi thường gặp

### Mobile không kết nối được backend

- Không dùng `localhost` trên điện thoại thật.
- Dùng IP LAN của máy tính.
- Kiểm tra điện thoại và máy tính cùng Wi-Fi.
- Kiểm tra Windows Firewall.
- Kiểm tra backend đang chạy tại cổng `5000`.

### iOS báo `NativeWorklets` hoặc `Exception in HostFunction`

- Expo Go SDK 54 yêu cầu `react-native-reanimated@4.1.1` và `react-native-worklets@0.5.1`.
- Không tự nâng `react-native-worklets` lên `0.8.x`, vì JavaScript và native module trong Expo Go sẽ không tương thích.
- `apps/mobile/babel.config.js` phải có `react-native-worklets/plugin` ở cuối danh sách plugin; nếu thiếu sẽ báo `Failed to create a worklet`.
- Chạy `npm install`, đóng hẳn Expo Go, rồi khởi động lại Metro bằng `npm run dev:mobile`.
- Có thể kiểm tra xung đột bằng `cd apps/mobile` rồi chạy `npx expo-doctor`.

### Backend báo Supabase chưa được cấu hình

- Kiểm tra `server/.env`.
- Kiểm tra `SUPABASE_URL`.
- Kiểm tra `SUPABASE_SERVICE_ROLE_KEY`.
- Khởi động lại backend sau khi sửa `.env`.

### Upload ảnh thất bại

- Kiểm tra ba biến Cloudinary.
- Nếu API trả lỗi `Cloudinary rejected...`, sao chép lại chính xác Cloud name, API key và API secret từ Cloudinary Console.
- Sau khi sửa `server/.env`, khởi động lại backend.
- Kiểm tra file nhỏ hơn 5 MB.
- Kiểm tra định dạng ảnh được hỗ trợ.

### Web bị lỗi CORS

- Kiểm tra `CLIENT_URL` trong `server/.env`.
- Giá trị phải khớp chính xác origin của web.
- Khởi động lại backend.

## 14. Checklist bảo mật

- Không commit file `.env`.
- Không đưa `SUPABASE_SERVICE_ROLE_KEY` lên web hoặc mobile.
- Không đưa `JWT_SECRET` và Cloudinary API secret lên client.
- Sử dụng HTTPS khi deploy production.
- Đổi khóa ngay nếu khóa bị lộ.
- Giữ kiểm tra kích thước và loại file upload.
- Chỉ cho phép thành viên chuyến đi truy cập tài nguyên liên quan.
- Chỉ chủ chuyến được xóa chuyến đi hoặc xóa thành viên.

## 15. Nâng cấp database hiện có

Nếu Supabase đã chạy `database/schema.sql` trước khi tính năng MoMo và bản đồ được thêm, không chạy lại toàn bộ schema. Mở Supabase SQL Editor và chạy:

```text
database/migrations/002_momo_maps.sql
database/migrations/003_expense_payment_source.sql
database/migrations/004_push_notifications.sql
```

Chạy migration theo đúng thứ tự. Migration `002` thêm bảng `payments`, trạng thái thanh toán cho đóng góp và tọa độ cho hoạt động. Migration `003` tách rõ khoản chi từ quỹ chung và khoản thành viên trả hộ mà không xóa dữ liệu hiện có. Migration `004` thêm bảng `push_tokens` để lưu Expo push token theo thiết bị.

Sau migration `003`, các khoản chi cũ được giữ là `personal` để không tự động trừ tiền lịch sử khỏi quỹ chung.

Quy tắc tài chính:

- `shared_fund`: chỉ chủ chuyến được ghi nhận, trừ số dư quỹ, không tạo công nợ cá nhân.
- `personal`: thành viên trả hộ, không trừ số dư quỹ, có thể chia tiền để tạo công nợ.
- Số dư quỹ = tổng đóng góp thành công - tổng khoản chi `shared_fund`.
- Tổng chi chuyến đi = khoản chi `shared_fund` + khoản chi `personal`.

## 16. Cấu hình thanh toán MoMo

### Chế độ mock dành cho demo

Đặt trong `server/.env`:

```env
MOMO_ENV=mock
PUBLIC_API_URL=http://your-local-ip:5000
```

Backend sẽ tạo một trang thanh toán demo và nút đánh dấu thành công. Chế độ này không sử dụng tiền thật và được tách biệt khỏi sandbox/production.

### Đăng ký MoMo Business và sandbox

1. Đăng ký tài khoản MoMo for Business/M4B theo quy trình dành cho merchant của MoMo.
2. Yêu cầu hoặc tạo thông tin tích hợp sandbox trong cổng merchant.
3. Lấy `partnerCode`, `accessKey` và `secretKey`.
4. Điền các biến sau trong `server/.env`:

```env
MOMO_ENV=sandbox
MOMO_PARTNER_CODE=your_momo_partner_code
MOMO_ACCESS_KEY=your_momo_access_key
MOMO_SECRET_KEY=your_momo_secret_key
MOMO_ENDPOINT=https://test-payment.momo.vn/v2/gateway/api/create
MOMO_QUERY_ENDPOINT=https://test-payment.momo.vn/v2/gateway/api/query
MOMO_REDIRECT_URL=https://your-public-api/api/payments/momo/return
MOMO_IPN_URL=https://your-public-api/api/payments/momo/ipn
MOMO_REQUEST_TYPE=captureWallet
```

`redirectUrl` đưa người dùng trở lại ứng dụng sau thanh toán. `ipnUrl` là endpoint server-to-server để MoMo thông báo kết quả. Khi phát triển local, MoMo không thể gọi `localhost`; hãy dùng backend đã deploy hoặc tunnel HTTPS.

Mobile đã khai báo deep link `ustrip://payment-return` trong `apps/mobile/app.json`. Khi tạo thanh toán, mobile gửi URL này cho backend; backend xác minh scheme, lưu URL quay về và redirect sau khi MoMo hoặc trang mock hoàn tất. Deep link tùy chỉnh cần development build/production build, không hoạt động đầy đủ trong Expo Go.

Khi merchant được MoMo duyệt production, chuyển sang endpoint và URL public HTTPS do hợp đồng merchant cung cấp:

```env
MOMO_ENV=production
MOMO_ENDPOINT=your_production_momo_create_payment_endpoint
MOMO_QUERY_ENDPOINT=your_production_momo_query_endpoint
MOMO_REDIRECT_URL=https://your-api-domain.com/api/payments/momo/return
MOMO_NOTIFY_URL=https://your-api-domain.com/api/payments/momo/ipn
MOMO_IPN_URL=https://your-api-domain.com/api/payments/momo/ipn
```

Luồng xử lý:

1. Backend tạo contribution và payment trạng thái `pending`.
2. Backend ký HMAC-SHA256 và gửi yêu cầu tới MoMo.
3. Người dùng mở deeplink hoặc quét QR.
4. MoMo gửi IPN.
5. Backend xác minh chữ ký, order ID, request ID và số tiền.
6. Khi thành công, contribution chuyển thành `success`, quỹ và trạng thái thành viên được tính lại, sau đó tạo notification.

Ứng dụng không đọc giao dịch ví cá nhân. Chỉ sử dụng Payment Gateway merchant, redirect, IPN và API kiểm tra trạng thái chính thức.

Sandbox không sử dụng tiền thật. Phí production phụ thuộc chính sách MoMo Business, hợp đồng và điều khoản merchant tại thời điểm triển khai.

Không bao giờ đưa `MOMO_SECRET_KEY` vào web hoặc mobile.

## 17. Cấu hình bản đồ thật

UsTrip dùng OpenStreetMap làm nguồn dữ liệu bản đồ và không cần API key:

- Web dùng `Leaflet` + `react-leaflet` để hiển thị tile OpenStreetMap.
- Tìm kiếm địa điểm trên web dùng dịch vụ Nominatim.
- Android/iOS dùng `react-native-maps` với lớp `UrlTile` OpenStreetMap, không dùng Google provider.
- Hoạt động lưu `latitude`, `longitude`, địa chỉ và `map_provider=openstreetmap`.

Các biến môi trường hỗ trợ:

```env
# apps/web/.env
VITE_MAP_PROVIDER=openstreetmap
VITE_OSM_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
VITE_NOMINATIM_URL=https://nominatim.openstreetmap.org

# apps/mobile/.env
EXPO_PUBLIC_MAP_PROVIDER=openstreetmap
EXPO_PUBLIC_OSM_TILE_URL=https://tile.openstreetmap.org/{z}/{x}/{y}.png
```

Không cần cấu hình biến bản đồ ở backend vì tìm kiếm và hiển thị hiện được thực hiện ở client.

Tile OpenStreetMap và Nominatim công cộng phù hợp cho phát triển/MVP với lưu lượng thấp. Luôn giữ dòng ghi nguồn `© OpenStreetMap contributors`, không gửi tìm kiếm dồn dập và không tải hàng loạt tile. Khi triển khai production có lưu lượng lớn, cấu hình `VITE_OSM_TILE_URL`, `EXPO_PUBLIC_OSM_TILE_URL` và `VITE_NOMINATIM_URL` sang nhà cung cấp hoặc máy chủ OSM phù hợp.

Sau khi đổi biến môi trường, khởi động lại Vite và Expo để nhận cấu hình mới.
