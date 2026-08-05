-- Seed sample public Đà Lạt trips for testing the Shared Trips feature
-- Run against database or execute using postgres connection

-- 1. Trip 1: Đà Lạt 3N2Đ - Săn Mây & Cà Phê Chill
INSERT INTO trips (id, name, destination, start_date, end_date, estimated_budget, description, cover_image_url, created_by, visibility)
VALUES (
  '11111111-aaaa-1111-aaaa-111111111111',
  'Đà Lạt 3N2Đ - Săn Mây & Cà Phê Chill',
  'Đà Lạt, Lâm Đồng',
  '2026-11-01',
  '2026-11-03',
  5000000.00,
  'Lịch trình 3 ngày 2 đêm tối ưu cho nhóm bạn trẻ mê chụp ảnh và check-in cà phê Đà Lạt. Gồm đồi chè Cầu Đất, Lời Của Gió, lẩu gà lá é Tao Ngộ và dạo chợ đêm.',
  'https://images.unsplash.com/photo-1506929562872-bb421503ef21?q=80&w=1200&auto=format&fit=crop',
  '11111111-1111-1111-1111-111111111111',
  'public'
) ON CONFLICT (id) DO UPDATE SET visibility = 'public';

INSERT INTO trip_members (trip_id, user_id, role, contribution_status, invitation_status)
VALUES ('11111111-aaaa-1111-aaaa-111111111111', '11111111-1111-1111-1111-111111111111', 'owner', 'paid', 'accepted')
ON CONFLICT DO NOTHING;

INSERT INTO itinerary_activities (id, trip_id, title, activity_date, start_time, end_time, location, location_name, notes, created_by)
VALUES
  ('11111111-act1-1111-1111-111111111111', '11111111-aaaa-1111-aaaa-111111111111', 'Săn mây & Uống trà Đồi chè Cầu Đất', '2026-11-01', '05:30', '08:30', 'Đồi chè Cầu Đất', 'Đồi chè Cầu Đất, Thôn Cầu Đất, Xuân Trường', 'Nên đi từ 5:00 sáng để bắt trọn biển mây đẹp nhất. Mang áo ấm dày.', '11111111-1111-1111-1111-111111111111'),
  ('11111111-act2-1111-1111-111111111111', '11111111-aaaa-1111-aaaa-111111111111', 'Thưởng thức Lẩu Gà Lá É Tao Ngộ', '2026-11-01', '12:00', '13:30', 'Lẩu Gà Lá É Tao Ngộ', '3/4 đường 3 Tháng 4, Phường 3', 'Quán gốc đông khách, nên đến trước 12h. Lẩu nhỏ 200k siêu nhiều gà.', '11111111-1111-1111-1111-111111111111'),
  ('11111111-act3-1111-1111-111111111111', '11111111-aaaa-1111-aaaa-111111111111', 'Dạo Hồ Xuân Hương & Chợ Đêm Đà Lạt', '2026-11-01', '18:30', '21:30', 'Chợ Đêm Đà Lạt', 'Nguyễn Thị Minh Khai, Phường 1', 'Thử bánh tráng nướng, sữa đậu nành nóng và khoai nướng.', '11111111-1111-1111-1111-111111111111'),
  ('11111111-act4-1111-1111-111111111111', '11111111-aaaa-1111-aaaa-111111111111', 'Cà phê ngắm thung lũng Tiệm Lời Của Gió', '2026-11-02', '08:30', '11:00', 'Tiệm Cà Phê Lời Của Gió', 'Xóm Lèo, Huỳnh Tấn Phát, Phường 11', 'Góc sống ảo ngắm trọn thung lũng đèn cực phẩm.', '11111111-1111-1111-1111-111111111111'),
  ('11111111-act5-1111-1111-111111111111', '11111111-aaaa-1111-aaaa-111111111111', 'Check-in Quảng trường Lâm Viên & Hái dâu', '2026-11-02', '14:30', '17:00', 'Quảng trường Lâm Viên', 'Trần Quốc Toản, Phường 1', 'Nụ hoa Atiso khổng lồ và công viên dạo bộ.', '11111111-1111-1111-1111-111111111111')
ON CONFLICT (id) DO NOTHING;

INSERT INTO trip_ratings (trip_id, user_id, rating)
VALUES
  ('11111111-aaaa-1111-aaaa-111111111111', '22222222-2222-2222-2222-222222222222', 5),
  ('11111111-aaaa-1111-aaaa-111111111111', '33333333-3333-3333-3333-333333333333', 5)
ON CONFLICT (trip_id, user_id) DO UPDATE SET rating = EXCLUDED.rating;

INSERT INTO trip_comments (id, trip_id, user_id, content)
VALUES
  ('11111111-com1-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Lịch trình quá chi tiết và hợp lý! Mình đã bấm Copy to My Trips để chuẩn bị đi vào tháng 11 tới ❤️'),
  ('11111111-com2-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'Kinh nghiệm săn mây Cầu Đất đi tầm 5h sáng từ trung tâm là đẹp nhất nha mọi người, đi trễ sẽ bị đông.')
ON CONFLICT (id) DO NOTHING;

-- 2. Trip 2: Đà Lạt Camping & Trekking 4N3Đ
INSERT INTO trips (id, name, destination, start_date, end_date, estimated_budget, description, cover_image_url, created_by, visibility)
VALUES (
  '22222222-bbbb-2222-bbbb-222222222222',
  'Đà Lạt Camping & Trekking 4N3Đ',
  'Đà Lạt, Lâm Đồng',
  '2026-11-10',
  '2026-11-13',
  8500000.00,
  'Hành trình trải nghiệm thiên nhiên dành cho hội yêu thích vận động: Chèo SUP ngắm hoàng hôn Hồ Tuyền Lâm, trekking đỉnh Langbiang và cắm trại qua đêm Đồi Cây Thông Cô Đơn.',
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1200&auto=format&fit=crop',
  '22222222-2222-2222-2222-222222222222',
  'public'
) ON CONFLICT (id) DO UPDATE SET visibility = 'public';

INSERT INTO trip_members (trip_id, user_id, role, contribution_status, invitation_status)
VALUES ('22222222-bbbb-2222-bbbb-222222222222', '22222222-2222-2222-2222-222222222222', 'owner', 'paid', 'accepted')
ON CONFLICT DO NOTHING;

INSERT INTO itinerary_activities (id, trip_id, title, activity_date, start_time, end_time, location, location_name, notes, created_by)
VALUES
  ('22222222-act1-2222-2222-222222222222', '22222222-bbbb-2222-bbbb-222222222222', 'Chèo SUP ngắm hoàng hôn Hồ Tuyền Lâm', '2026-11-10', '15:00', '17:30', 'Hồ Tuyền Lâm', 'Khu du lịch Hồ Tuyền Lâm, Phường 4', 'Thuê SUP trọn gói có HDV hướng dẫn và chụp ảnh chèo thuyền.', '22222222-2222-2222-2222-222222222222'),
  ('22222222-act2-2222-2222-222222222222', '22222222-bbbb-2222-bbbb-222222222222', 'Trekking đỉnh núi Langbiang', '2026-11-11', '08:00', '13:00', 'Núi Langbiang', 'Thị trấn Lạc Dương, Lâm Đồng', 'Trekking tuyến đường rừng thông khoảng 3-4 tiếng lên đỉnh Radar.', '22222222-2222-2222-2222-222222222222'),
  ('22222222-act3-2222-2222-222222222222', '22222222-bbbb-2222-bbbb-222222222222', 'Cắm trại đêm Đồi Cây Thông Cô Đơn', '2026-11-12', '14:00', '22:00', 'Cây Thông Cô Đơn', 'Hồ Suối Vàng, Lạc Dương', 'Thuê lều trại chống nước, đồ nướng BBQ và đốt lửa trại ngắm sao.', '22222222-2222-2222-2222-222222222222')
ON CONFLICT (id) DO NOTHING;

INSERT INTO trip_ratings (trip_id, user_id, rating)
VALUES ('22222222-bbbb-2222-bbbb-222222222222', '11111111-1111-1111-1111-111111111111', 5)
ON CONFLICT (trip_id, user_id) DO UPDATE SET rating = EXCLUDED.rating;

INSERT INTO trip_comments (id, trip_id, user_id, content)
VALUES ('22222222-com1-2222-2222-222222222222', '22222222-bbbb-2222-bbbb-222222222222', '11111111-1111-1111-1111-111111111111', 'Buổi chèo SUP Hồ Tuyền Lâm chiều tà đỉnh thực sự! Recommend mọi người thử.')
ON CONFLICT (id) DO NOTHING;

-- 3. Trip 3: Đà Lạt Food Tour - Ăn Sập 15 Món Ngon
INSERT INTO trips (id, name, destination, start_date, end_date, estimated_budget, description, cover_image_url, created_by, visibility)
VALUES (
  '33333333-cccc-3333-cccc-333333333333',
  'Đà Lạt Food Tour - Ăn Sập 15 Món Ngon',
  'Đà Lạt, Lâm Đồng',
  '2026-11-20',
  '2026-11-22',
  3500000.00,
  'Chuyến đi ẩm thực dành riêng cho các tín đồ ăn uống: Bánh ướt lòng gà Long, Quán nướng Chu, Lẩu bò Ba Toa Quán Gỗ, Bánh xíu mại Hoàng Diệu và Kem bơ Thanh Thảo.',
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=1200&auto=format&fit=crop',
  '33333333-3333-3333-3333-333333333333',
  'public'
) ON CONFLICT (id) DO UPDATE SET visibility = 'public';

INSERT INTO trip_members (trip_id, user_id, role, contribution_status, invitation_status)
VALUES ('33333333-cccc-3333-cccc-333333333333', '33333333-3333-3333-3333-333333333333', 'owner', 'paid', 'accepted')
ON CONFLICT DO NOTHING;

INSERT INTO itinerary_activities (id, trip_id, title, activity_date, start_time, end_time, location, location_name, notes, created_by)
VALUES
  ('33333333-act1-3333-3333-333333333333', '33333333-cccc-3333-cccc-333333333333', 'Bánh ướt lòng gà Long & Kem bơ Thanh Thảo', '2026-11-20', '10:00', '12:00', 'Hẻm 202 Phan Đình Phùng', 'Hẻm 202 Phan Đình Phùng, Phường 2', 'Bánh ướt dẻo thơm, gà xé đậm vị. Ăn xong tráng miệng kem bơ số 76 Nguyễn Văn Trỗi.', '33333333-3333-3333-3333-333333333333'),
  ('33333333-act2-3333-3333-333333333333', '33333333-cccc-3333-cccc-333333333333', 'Quán nướng ngói Chu & Chè Hé', '2026-11-20', '18:00', '21:00', 'Quán Nướng Chu', '3 Phạm Ngũ Lão, Phường 1', 'Nướng ngói thơm lừng không bị cháy. Ăn xong tạt qua Chè Hé thưởng thức chè trôi nước.', '33333333-3333-3333-3333-333333333333'),
  ('33333333-act3-3333-3333-333333333333', '33333333-cccc-3333-cccc-333333333333', 'Lẩu Bò Ba Toa (Quán Gỗ Gốc)', '2026-11-21', '12:00', '14:00', 'Lẩu Bò Ba Toa Quán Gỗ', '1/29 Hoàng Diệu, Phường 5', 'Quán gỗ trong hẻm sâu, lẩu bò đầy đặn súp thơm ngậy.', '33333333-3333-3333-3333-333333333333')
ON CONFLICT (id) DO NOTHING;

INSERT INTO trip_ratings (trip_id, user_id, rating)
VALUES ('33333333-cccc-3333-cccc-333333333333', '22222222-2222-2222-2222-222222222222', 4)
ON CONFLICT (trip_id, user_id) DO UPDATE SET rating = EXCLUDED.rating;
