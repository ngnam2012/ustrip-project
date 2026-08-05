import os
import sys
from src.config.db import db

def seed():
    profiles = db.table('profiles').select('id,full_name').limit(3).execute().data
    if not profiles:
        print("No profiles found!")
        return
    
    author_id = profiles[0]['id']
    author_name = profiles[0]['full_name']
    reviewer_id = profiles[1]['id'] if len(profiles) > 1 else author_id

    print(f"Creating sample Đà Lạt trips with author {author_name} ({author_id})...")

    trips_data = [
        {
            "id": "11111111-aaaa-1111-aaaa-111111111111",
            "name": "Đà Lạt 3N2Đ - Săn Mây & Cà Phê Chill",
            "destination": "Đà Lạt, Lâm Đồng",
            "start_date": "2026-11-01",
            "end_date": "2026-11-03",
            "estimated_budget": 5000000.0,
            "description": "Lịch trình 3 ngày 2 đêm tối ưu cho nhóm bạn trẻ mê chụp ảnh và check-in cà phê Đà Lạt. Gồm đồi chè Cầu Đất, Lời Của Gió, lẩu gà lá é Tao Ngộ và dạo chợ đêm.",
            "cover_image_url": "https://images.unsplash.com/photo-1506929562872-bb421503ef21?q=80&w=1200&auto=format&fit=crop",
            "created_by": author_id,
            "visibility": "public",
            "activities": [
                {
                    "id": "11111111-1111-1111-1111-111111111101",
                    "title": "Săn mây & Uống trà Đồi chè Cầu Đất",
                    "activity_date": "2026-11-01",
                    "start_time": "05:30",
                    "end_time": "08:30",
                    "location": "Đồi chè Cầu Đất",
                    "location_name": "Đồi chè Cầu Đất, Thôn Cầu Đất, Xuân Trường",
                    "notes": "Nên đi từ 5:00 sáng để bắt trọn biển mây đẹp nhất. Mang áo ấm dày.",
                    "created_by": author_id
                },
                {
                    "id": "11111111-1111-1111-1111-111111111102",
                    "title": "Thưởng thức Lẩu Gà Lá É Tao Ngộ",
                    "activity_date": "2026-11-01",
                    "start_time": "12:00",
                    "end_time": "13:30",
                    "location": "Lẩu Gà Lá É Tao Ngộ",
                    "location_name": "3/4 đường 3 Tháng 4, Phường 3",
                    "notes": "Quán gốc đông khách, nên đến trước 12h. Lẩu nhỏ 200k siêu nhiều gà.",
                    "created_by": author_id
                },
                {
                    "id": "11111111-1111-1111-1111-111111111103",
                    "title": "Dạo Hồ Xuân Hương & Chợ Đêm Đà Lạt",
                    "activity_date": "2026-11-01",
                    "start_time": "18:30",
                    "end_time": "21:30",
                    "location": "Chợ Đêm Đà Lạt",
                    "location_name": "Nguyễn Thị Minh Khai, Phường 1",
                    "notes": "Thử bánh tráng nướng, sữa đậu nành nóng và khoai nướng.",
                    "created_by": author_id
                },
                {
                    "id": "11111111-1111-1111-1111-111111111104",
                    "title": "Cà phê ngắm thung lũng Tiệm Lời Của Gió",
                    "activity_date": "2026-11-02",
                    "start_time": "08:30",
                    "end_time": "11:00",
                    "location": "Tiệm Cà Phê Lời Của Gió",
                    "location_name": "Xóm Lèo, Huỳnh Tấn Phát, Phường 11",
                    "notes": "Góc sống ảo ngắm trọn thung lũng đèn cực phẩm.",
                    "created_by": author_id
                }
            ],
            "comments": [
                {"user_id": reviewer_id, "content": "Lịch trình quá chi tiết và hợp lý! Mình đã bấm Sao chép để chuẩn bị đi tháng 11 ❤️"},
                {"user_id": author_id, "content": "Kinh nghiệm săn mây Cầu Đất đi tầm 5h sáng từ trung tâm là đẹp nhất nha mọi người!"}
            ]
        },
        {
            "id": "22222222-bbbb-2222-bbbb-222222222222",
            "name": "Đà Lạt Camping & Trekking 4N3Đ",
            "destination": "Đà Lạt, Lâm Đồng",
            "start_date": "2026-11-10",
            "end_date": "2026-11-13",
            "estimated_budget": 8500000.0,
            "description": "Hành trình trải nghiệm thiên nhiên dành cho hội yêu thích vận động: Chèo SUP ngắm hoàng hôn Hồ Tuyền Lâm, trekking đỉnh Langbiang và cắm trại qua đêm Đồi Cây Thông Cô Đơn.",
            "cover_image_url": "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1200&auto=format&fit=crop",
            "created_by": author_id,
            "visibility": "public",
            "activities": [
                {
                    "id": "22222222-2222-2222-2222-222222222201",
                    "title": "Chèo SUP ngắm hoàng hôn Hồ Tuyền Lâm",
                    "activity_date": "2026-11-10",
                    "start_time": "15:00",
                    "end_time": "17:30",
                    "location": "Hồ Tuyền Lâm",
                    "location_name": "Khu du lịch Hồ Tuyền Lâm, Phường 4",
                    "notes": "Thuê SUP trọn gói có HDV hướng dẫn và chụp ảnh chèo thuyền.",
                    "created_by": author_id
                },
                {
                    "id": "22222222-2222-2222-2222-222222222202",
                    "title": "Trekking đỉnh núi Langbiang",
                    "activity_date": "2026-11-11",
                    "start_time": "08:00",
                    "end_time": "13:00",
                    "location": "Núi Langbiang",
                    "location_name": "Thị trấn Lạc Dương, Lâm Đồng",
                    "notes": "Trekking tuyến đường rừng thông khoảng 3-4 tiếng lên đỉnh Radar.",
                    "created_by": author_id
                },
                {
                    "id": "22222222-2222-2222-2222-222222222203",
                    "title": "Cắm trại đêm Đồi Cây Thông Cô Đơn",
                    "activity_date": "2026-11-12",
                    "start_time": "14:00",
                    "end_time": "22:00",
                    "location": "Cây Thông Cô Đơn",
                    "location_name": "Hồ Suối Vàng, Lạc Dương",
                    "notes": "Thuê lều trại chống nước, đồ nướng BBQ và đốt lửa trại ngắm sao.",
                    "created_by": author_id
                }
            ],
            "comments": [
                {"user_id": reviewer_id, "content": "Buổi chèo SUP Hồ Tuyền Lâm chiều tà đỉnh thực sự! Recommend mọi người thử."}
            ]
        },
        {
            "id": "33333333-cccc-3333-cccc-333333333333",
            "name": "Đà Lạt Food Tour - Ăn Sập 15 Món Ngon",
            "destination": "Đà Lạt, Lâm Đồng",
            "start_date": "2026-11-20",
            "end_date": "2026-11-22",
            "estimated_budget": 3500000.0,
            "description": "Chuyến đi ẩm thực dành riêng cho các tín đồ ăn uống: Bánh ướt lòng gà Long, Quán nướng Chu, Lẩu bò Ba Toa Quán Gỗ, Bánh xíu mại Hoàng Diệu và Kem bơ Thanh Thảo.",
            "cover_image_url": "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=1200&auto=format&fit=crop",
            "created_by": author_id,
            "visibility": "public",
            "activities": [
                {
                    "id": "33333333-3333-3333-3333-333333333301",
                    "title": "Bánh ướt lòng gà Long & Kem bơ Thanh Thảo",
                    "activity_date": "2026-11-20",
                    "start_time": "10:00",
                    "end_time": "12:00",
                    "location": "Hẻm 202 Phan Đình Phùng",
                    "location_name": "Hẻm 202 Phan Đình Phùng, Phường 2",
                    "notes": "Bánh ướt dẻo thơm, gà xé đậm vị. Ăn xong tráng miệng kem bơ.",
                    "created_by": author_id
                },
                {
                    "id": "33333333-3333-3333-3333-333333333302",
                    "title": "Quán nướng ngói Chu & Chè Hé",
                    "activity_date": "2026-11-20",
                    "start_time": "18:00",
                    "end_time": "21:00",
                    "location": "Quán Nướng Chu",
                    "location_name": "3 Phạm Ngũ Lão, Phường 1",
                    "notes": "Nướng ngói thơm lừng. Ăn xong tạt qua Chè Hé thưởng thức chè trôi nước.",
                    "created_by": author_id
                },
                {
                    "id": "33333333-3333-3333-3333-333333333303",
                    "title": "Lẩu Bò Ba Toa (Quán Gỗ Gốc)",
                    "activity_date": "2026-11-21",
                    "start_time": "12:00",
                    "end_time": "14:00",
                    "location": "Lẩu Bò Ba Toa Quán Gỗ",
                    "location_name": "1/29 Hoàng Diệu, Phường 5",
                    "notes": "Quán gỗ trong hẻm sâu, lẩu bò đầy đặn súp thơm ngậy.",
                    "created_by": author_id
                }
            ],
            "comments": []
        }
    ]

    for data in trips_data:
        acts = data.pop("activities", [])
        comments = data.pop("comments", [])

        # Upsert trip
        db.table('trips').upsert(data).execute()

        # Add member if not exists
        mem = db.table('trip_members').select('id').eq('trip_id', data['id']).eq('user_id', author_id).execute().data
        if not mem:
            db.table('trip_members').insert({
                "trip_id": data["id"],
                "user_id": author_id,
                "role": "owner",
                "contribution_status": "paid",
                "invitation_status": "accepted"
            }).execute()

        # Upsert activities
        for act in acts:
            act["trip_id"] = data["id"]
            db.table('itinerary_activities').upsert(act).execute()

        # Ratings
        if reviewer_id != author_id:
            db.table('trip_ratings').upsert({
                "trip_id": data["id"],
                "user_id": reviewer_id,
                "rating": 5
            }, on_conflict='trip_id,user_id').execute()

        # Comments
        for c in comments:
            existing = db.table('trip_comments').select('id').eq('trip_id', data['id']).eq('user_id', c['user_id']).eq('content', c['content']).execute().data
            if not existing:
                db.table('trip_comments').insert({
                    "trip_id": data["id"],
                    "user_id": c["user_id"],
                    "content": c["content"]
                }).execute()

        print(f"  ✓ Added: {data['name']}")

    print("Done seeding sample Đà Lạt shared trips!")

if __name__ == "__main__":
    seed()
