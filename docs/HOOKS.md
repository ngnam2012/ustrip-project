# Tài Liệu Hooks (Custom Hooks)

Dự án có định nghĩa một số Custom Hooks trong thư mục `src/hooks/` để đóng gói logic tái sử dụng.

## `useRemote`

Hook quan trọng dùng để gọi API (Fetch) một cách dễ dàng, tự động quản lý trạng thái loading, error, và dữ liệu trả về.

**Input parameters:**
- `apiFunc`: Hàm gọi API (từ `lib/api.js`).
- `options`: Các tùy chọn (ví dụ: `autoFetch` = true/false).

**Output (Returns):**
- `data`: Dữ liệu nhận được từ API.
- `loading`: Trạng thái đang tải (boolean).
- `error`: Lỗi nếu có (string).
- `execute`: Hàm để gọi lại API bằng tay (hữu ích cho form submit).

**Ví dụ sử dụng:**
```javascript
import useRemote from '../hooks/useRemote';
import api from '../lib/api';

const { data: trip, loading, error } = useRemote(() => api.getTrip(tripId));

if (loading) return <LoadingSpinner />;
if (error) return <ErrorMessage message={error} />;
return <TripDetail trip={trip} />;
```

## Các hook mặc định của React
Dự án sử dụng rộng rãi:
- `useState`: Quản lý state cục bộ.
- `useEffect`: Theo dõi thay đổi và gọi API lần đầu (hoặc cleanup event listeners).
- `useContext`: Lấy thông tin xác thực (`AuthContext`).
- `useCallback` & `useMemo`: Tối ưu hóa hiệu suất để không re-render không cần thiết.
