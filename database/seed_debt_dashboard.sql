-- Demo data for the account ec50129f-bde8-4d3b-a375-bfd964b227f4.
-- Safe to run repeatedly: only the two fixed demo trips below are replaced.
begin;

do $$
begin
  if not exists (
    select 1 from profiles
    where id = 'ec50129f-bde8-4d3b-a375-bfd964b227f4'
  ) then
    raise exception 'Không tìm thấy profile ec50129f-bde8-4d3b-a375-bfd964b227f4. Hãy đăng ký/đăng nhập tài khoản này trước khi chạy seed.';
  end if;
end $$;

delete from trips where id in (
  'debd0000-0000-4000-8000-000000000001',
  'debd0000-0000-4000-8000-000000000002'
);

insert into profiles (id, email, password_hash, full_name, avatar_url) values
  ('debd1000-0000-4000-8000-000000000001', 'lan.debt.demo@ustrip.local', '$2a$10$uUOLrIF8.w/tQRMhtiC1oOsSvn4mj4BHW9hj/8ngjX89./uscGboi', 'Ngọc Lan', 'https://i.pravatar.cc/150?img=45'),
  ('debd1000-0000-4000-8000-000000000002', 'minh.debt.demo@ustrip.local', '$2a$10$uUOLrIF8.w/tQRMhtiC1oOsSvn4mj4BHW9hj/8ngjX89./uscGboi', 'Hoàng Minh', 'https://i.pravatar.cc/150?img=12')
on conflict (id) do update set
  full_name = excluded.full_name,
  avatar_url = excluded.avatar_url,
  updated_at = now();

insert into trips (id, name, destination, start_date, end_date, estimated_budget, description, cover_image_url, created_by) values
  ('debd0000-0000-4000-8000-000000000001', 'Demo công nợ Đà Lạt', 'Đà Lạt, Lâm Đồng', '2026-09-12', '2026-09-14', 1800000, 'Chuyến mẫu: bạn nợ quỹ và nợ Ngọc Lan.', 'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=1200&auto=format&fit=crop', 'ec50129f-bde8-4d3b-a375-bfd964b227f4'),
  ('debd0000-0000-4000-8000-000000000002', 'Demo công nợ Vũng Tàu', 'Vũng Tàu, Bà Rịa - Vũng Tàu', '2026-10-03', '2026-10-05', 1500000, 'Chuyến mẫu: quỹ nợ bạn và các thành viên nợ bạn.', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop', 'ec50129f-bde8-4d3b-a375-bfd964b227f4');

insert into trip_members (trip_id, user_id, role, contribution_status, paid_amount, remaining_amount, invitation_status) values
  ('debd0000-0000-4000-8000-000000000001', 'ec50129f-bde8-4d3b-a375-bfd964b227f4', 'owner', 'partial', 300000, 300000, 'accepted'),
  ('debd0000-0000-4000-8000-000000000001', 'debd1000-0000-4000-8000-000000000001', 'member', 'paid', 500000, 0, 'accepted'),
  ('debd0000-0000-4000-8000-000000000001', 'debd1000-0000-4000-8000-000000000002', 'member', 'unpaid', 0, 600000, 'accepted'),
  ('debd0000-0000-4000-8000-000000000002', 'ec50129f-bde8-4d3b-a375-bfd964b227f4', 'owner', 'paid', 700000, 0, 'accepted'),
  ('debd0000-0000-4000-8000-000000000002', 'debd1000-0000-4000-8000-000000000001', 'member', 'unpaid', 0, 400000, 'accepted'),
  ('debd0000-0000-4000-8000-000000000002', 'debd1000-0000-4000-8000-000000000002', 'member', 'unpaid', 0, 400000, 'accepted');

insert into shared_funds (trip_id, target_amount) values
  ('debd0000-0000-4000-8000-000000000001', 1800000),
  ('debd0000-0000-4000-8000-000000000002', 1500000);

insert into fund_contributions (id, trip_id, user_id, amount, note, payment_method, payment_status, paid_at) values
  ('debd2000-0000-4000-8000-000000000001', 'debd0000-0000-4000-8000-000000000001', 'ec50129f-bde8-4d3b-a375-bfd964b227f4', 300000, 'Đóng quỹ demo', 'manual', 'success', now()),
  ('debd2000-0000-4000-8000-000000000002', 'debd0000-0000-4000-8000-000000000001', 'debd1000-0000-4000-8000-000000000001', 500000, 'Đóng quỹ demo', 'manual', 'success', now()),
  ('debd2000-0000-4000-8000-000000000003', 'debd0000-0000-4000-8000-000000000002', 'ec50129f-bde8-4d3b-a375-bfd964b227f4', 700000, 'Đóng quỹ demo', 'manual', 'success', now()),
  ('debd2000-0000-4000-8000-000000000004', 'debd0000-0000-4000-8000-000000000002', 'ec50129f-bde8-4d3b-a375-bfd964b227f4', 900000, 'Giao dịch thất bại để kiểm tra bộ lọc', 'manual', 'failed', null);

insert into expenses (id, trip_id, title, amount, category, payment_source, paid_by, note, expense_date) values
  ('debd3000-0000-4000-8000-000000000001', 'debd0000-0000-4000-8000-000000000001', 'Xe tham quan Đà Lạt', 800000, 'transport', 'shared_fund', null, 'Bạn dùng 400.000đ từ quỹ', '2026-09-12'),
  ('debd3000-0000-4000-8000-000000000002', 'debd0000-0000-4000-8000-000000000001', 'Bữa tối nhóm', 600000, 'food', 'personal', 'debd1000-0000-4000-8000-000000000001', 'Ngọc Lan trả hộ', '2026-09-12'),
  ('debd3000-0000-4000-8000-000000000003', 'debd0000-0000-4000-8000-000000000001', 'Vé cà phê đã hoàn', 200000, 'ticket', 'personal', 'debd1000-0000-4000-8000-000000000002', 'Khoản đã thanh toán, không lên dashboard', '2026-09-13'),
  ('debd3000-0000-4000-8000-000000000004', 'debd0000-0000-4000-8000-000000000002', 'Thuê xe máy Vũng Tàu', 600000, 'transport', 'shared_fund', null, 'Bạn dùng 200.000đ từ quỹ', '2026-10-03'),
  ('debd3000-0000-4000-8000-000000000005', 'debd0000-0000-4000-8000-000000000002', 'Hải sản buổi tối', 400000, 'food', 'personal', 'ec50129f-bde8-4d3b-a375-bfd964b227f4', 'Ngọc Lan cần hoàn lại cho bạn', '2026-10-03'),
  ('debd3000-0000-4000-8000-000000000006', 'debd0000-0000-4000-8000-000000000002', 'Vé tham quan', 200000, 'ticket', 'personal', 'ec50129f-bde8-4d3b-a375-bfd964b227f4', 'Hoàng Minh cần hoàn lại cho bạn', '2026-10-04');

insert into expense_participants (expense_id, user_id) values
  ('debd3000-0000-4000-8000-000000000001', 'ec50129f-bde8-4d3b-a375-bfd964b227f4'),
  ('debd3000-0000-4000-8000-000000000001', 'debd1000-0000-4000-8000-000000000001'),
  ('debd3000-0000-4000-8000-000000000002', 'ec50129f-bde8-4d3b-a375-bfd964b227f4'),
  ('debd3000-0000-4000-8000-000000000002', 'debd1000-0000-4000-8000-000000000001'),
  ('debd3000-0000-4000-8000-000000000003', 'ec50129f-bde8-4d3b-a375-bfd964b227f4'),
  ('debd3000-0000-4000-8000-000000000004', 'ec50129f-bde8-4d3b-a375-bfd964b227f4'),
  ('debd3000-0000-4000-8000-000000000004', 'debd1000-0000-4000-8000-000000000001'),
  ('debd3000-0000-4000-8000-000000000004', 'debd1000-0000-4000-8000-000000000002'),
  ('debd3000-0000-4000-8000-000000000005', 'debd1000-0000-4000-8000-000000000001'),
  ('debd3000-0000-4000-8000-000000000006', 'debd1000-0000-4000-8000-000000000002');

insert into expense_splits (expense_id, user_id, amount_owed, is_settled, settled_at) values
  ('debd3000-0000-4000-8000-000000000001', 'ec50129f-bde8-4d3b-a375-bfd964b227f4', 400000, false, null),
  ('debd3000-0000-4000-8000-000000000001', 'debd1000-0000-4000-8000-000000000001', 400000, false, null),
  ('debd3000-0000-4000-8000-000000000002', 'ec50129f-bde8-4d3b-a375-bfd964b227f4', 300000, false, null),
  ('debd3000-0000-4000-8000-000000000002', 'debd1000-0000-4000-8000-000000000001', 300000, false, null),
  ('debd3000-0000-4000-8000-000000000003', 'ec50129f-bde8-4d3b-a375-bfd964b227f4', 200000, true, now()),
  ('debd3000-0000-4000-8000-000000000004', 'ec50129f-bde8-4d3b-a375-bfd964b227f4', 200000, false, null),
  ('debd3000-0000-4000-8000-000000000004', 'debd1000-0000-4000-8000-000000000001', 200000, false, null),
  ('debd3000-0000-4000-8000-000000000004', 'debd1000-0000-4000-8000-000000000002', 200000, false, null),
  ('debd3000-0000-4000-8000-000000000005', 'debd1000-0000-4000-8000-000000000001', 400000, false, null),
  ('debd3000-0000-4000-8000-000000000006', 'debd1000-0000-4000-8000-000000000002', 200000, false, null);

commit;
