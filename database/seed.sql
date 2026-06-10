-- Password for all sample users: Password123!
insert into profiles (id, email, password_hash, full_name, avatar_url) values
('11111111-1111-1111-1111-111111111111', 'an@ustrip.vn', '$2a$10$uUOLrIF8.w/tQRMhtiC1oOsSvn4mj4BHW9hj/8ngjX89./uscGboi', 'Minh An', 'https://i.pravatar.cc/150?img=12'),
('22222222-2222-2222-2222-222222222222', 'linh@ustrip.vn', '$2a$10$uUOLrIF8.w/tQRMhtiC1oOsSvn4mj4BHW9hj/8ngjX89./uscGboi', 'Thảo Linh', 'https://i.pravatar.cc/150?img=47'),
('33333333-3333-3333-3333-333333333333', 'khoa@ustrip.vn', '$2a$10$uUOLrIF8.w/tQRMhtiC1oOsSvn4mj4BHW9hj/8ngjX89./uscGboi', 'Tuấn Khoa', 'https://i.pravatar.cc/150?img=33');

insert into trips (id, name, destination, start_date, end_date, estimated_budget, description, cover_image_url, created_by) values
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Phượt Đà Lạt', 'Đà Lạt, Lâm Đồng', '2026-10-12', '2026-10-15', 12000000, 'Bốn ngày săn mây, cà phê và khám phá Đà Lạt.', 'https://images.unsplash.com/photo-1528127269322-539801943592', '11111111-1111-1111-1111-111111111111');

insert into trip_members (trip_id, user_id, role, contribution_status, paid_amount, remaining_amount) values
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'owner', 'paid', 4000000, 0),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'member', 'partial', 2000000, 2000000),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', 'member', 'unpaid', 0, 4000000);

insert into shared_funds (trip_id, target_amount) values
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 12000000);

insert into fund_contributions (trip_id, user_id, amount, note) values
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 4000000, 'Đóng quỹ lần đầu'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 2000000, 'Đóng trước một phần');

insert into itinerary_activities (id, trip_id, title, activity_date, start_time, end_time, location, estimated_cost, notes, created_by) values
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Ăn sáng bánh căn', '2026-10-12', '07:30', '08:30', 'Bánh căn Nhà Chung', 360000, 'Gặp nhau tại quán', '11111111-1111-1111-1111-111111111111'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Săn mây Cầu Đất', '2026-10-12', '09:00', '12:00', 'Đồi chè Cầu Đất', 600000, 'Mang áo ấm', '11111111-1111-1111-1111-111111111111');

update itinerary_activities set location_name = location, address = location,
  latitude = case when id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' then 11.940419 else 11.832689 end,
  longitude = case when id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' then 108.438335 else 108.582073 end
where trip_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

insert into expenses (id, trip_id, title, amount, category, payment_source, paid_by, related_activity_id, note, expense_date) values
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Bữa sáng bánh căn', 360000, 'food', 'personal', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Minh An trả hộ cho Thảo Linh và Tuấn Khoa', '2026-10-12');

insert into expense_participants (expense_id, user_id) values
('dddddddd-dddd-dddd-dddd-dddddddddddd', '22222222-2222-2222-2222-222222222222'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', '33333333-3333-3333-3333-333333333333');

insert into expense_splits (expense_id, user_id, amount_owed, is_settled) values
('dddddddd-dddd-dddd-dddd-dddddddddddd', '22222222-2222-2222-2222-222222222222', 180000, false),
('dddddddd-dddd-dddd-dddd-dddddddddddd', '33333333-3333-3333-3333-333333333333', 180000, false);
