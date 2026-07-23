-- Create new users with password: password123
-- The password hash uses bcrypt: $2b$12$AZnQ0TYgR0l9pqPNn/I3tOJ7ehHQntaCO49LgIDtxpXnuJOZqpHRO
insert into profiles (id, email, password_hash, full_name, avatar_url) values
('44444444-4444-4444-4444-444444444444', 'dat@ustrip.vn', '$2b$12$AZnQ0TYgR0l9pqPNn/I3tOJ7ehHQntaCO49LgIDtxpXnuJOZqpHRO', 'Quốc Đạt', 'https://i.pravatar.cc/150?img=11'),
('55555555-5555-5555-5555-555555555555', 'mai@ustrip.vn', '$2b$12$AZnQ0TYgR0l9pqPNn/I3tOJ7ehHQntaCO49LgIDtxpXnuJOZqpHRO', 'Phương Mai', 'https://i.pravatar.cc/150?img=5');

-- Add new users to the existing trip group ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
insert into trip_members (trip_id, user_id, role, contribution_status, paid_amount, remaining_amount) values
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '44444444-4444-4444-4444-444444444444', 'member', 'unpaid', 0, 4000000),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '55555555-5555-5555-5555-555555555555', 'member', 'unpaid', 0, 4000000);
