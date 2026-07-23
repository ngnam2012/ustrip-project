from fastapi import APIRouter, Depends, Request
from typing import Any, Dict
from pydantic import BaseModel
from datetime import datetime
from src.dependencies.auth import get_trip_member
from src.config.db import db
from src.utils.api import ApiError
from src.services.notifications_service import notify_trip_members
from src.routers.expenses import available_fund_balance
from src.utils.split import compute_equal_splits

router = APIRouter(tags=["mock-ota"])

MOCK_SERVICES = [
    # TRANSPORT
    {
        "id": "limousine-thanhbuoi",
        "category": "transport",
        "title": "Vé xe Limousine Thành Bưởi (Sài Gòn - Đà Lạt)",
        "price": 350000,
        "image": "https://limousinevn.vn/wp-content/uploads/2020/09/xe-thanh-buoi-limousine-3.jpg",
        "description": "Limousine 9 chỗ VIP, ghế massage, wifi miễn phí, có cổng sạc USB, phục vụ nước uống."
    },
    {
        "id": "xe-phuongtrang",
        "category": "transport",
        "title": "Xe giường nằm Phương Trang (Sài Gòn - Đà Lạt)",
        "price": 300000,
        "image": "https://saomaifly.com/Uploads/Images/2022/10/24/xe-phuong-trang-di-da-lat_1.jpg", 
        "description": "Xe giường nằm 40 chỗ đời mới, chạy êm, an toàn, khởi hành liên tục mỗi giờ."
    },
    {
        "id": "taxi-lienkhuong",
        "category": "transport",
        "title": "Xe đưa đón Sân bay Liên Khương - Đà Lạt",
        "price": 250000,
        "image": "https://taxilienkhuong.com/wp-content/uploads/2019/08/taxi-lien-khuong-da-lat-giare.jpg",
        "description": "Xe 4 chỗ đời mới đưa đón tận nơi từ Sân bay Liên Khương về trung tâm TP Đà Lạt."
    },
    {
        "id": "thue-xe-may",
        "category": "transport",
        "title": "Thuê xe máy tay ga Đà Lạt (Air Blade/Vision)",
        "price": 150000,
        "image": "https://motogo.vn/wp-content/uploads/2020/02/thue-xe-may-da-lat-1.jpg",
        "description": "Xe tay ga đời mới, máy mạnh leo dốc tốt, giao nhận xe tận khách sạn miễn phí."
    },
    
    # ACCOMMODATION
    {
        "id": "homestay-dalat",
        "category": "accommodation",
        "title": "Homestay Cù Dú Đà Lạt",
        "price": 1200000,
        "image": "https://cf.bstatic.com/xdata/images/hotel/max1024x768/332219001.jpg?k=f64c1265eaab06d7d4c2fa07b4694b7be6b8e39f3796cdbb58b859942a731efc&o=&hp=1",
        "description": "Phòng đôi view thung lũng, ban công rộng, có khu vực nướng BBQ, gần trung tâm."
    },
    {
        "id": "hotel-colline",
        "category": "accommodation",
        "title": "Hôtel Colline Đà Lạt (4 sao)",
        "price": 1800000,
        "image": "https://cf.bstatic.com/xdata/images/hotel/max1024x768/222384755.jpg?k=b4e941df025fcb1f09bb67efbe5db6a8b7ea843be7352fc70763ddc67b2ab1ff&o=&hp=1",
        "description": "Khách sạn 4 sao đẳng cấp ngay trung tâm chợ Đà Lạt, thiết kế độc đáo mang đậm phong cách Pháp."
    },
    {
        "id": "resort-tuyenlam",
        "category": "accommodation",
        "title": "Swiss-Belresort Tuyền Lâm Đà Lạt",
        "price": 2500000,
        "image": "https://cf.bstatic.com/xdata/images/hotel/max1024x768/56910626.jpg?k=df6b69fa03e83b4b8f06eb3638dbf91ebcc0577fc7986b51bf738f61c367ed9d&o=&hp=1",
        "description": "Resort 5 sao phong cách Châu Âu ven hồ Tuyền Lâm, bao quanh bởi rừng thông tĩnh lặng."
    },
    
    # ACTIVITY
    {
        "id": "ticket-thunglung",
        "category": "activity",
        "title": "Vé tham quan Thung Lũng Tình Yêu",
        "price": 250000,
        "image": "https://res.klook.com/image/upload/c_fill,w_750,h_500/q_80/w_80,x_15,y_15,g_south_west,l_Klook_water_br_trans_yhcmh3/activities/cbbk77t0zohjipn264ce.webp",
        "description": "Bao gồm vé vào cổng, xe điện di chuyển trong khuôn viên và vé đạp vịt trên hồ Đa Thiện."
    },
    {
        "id": "tour-sanmay",
        "category": "activity",
        "title": "Tour Săn Mây Đồi Chè Cầu Đất (Nửa ngày)",
        "price": 450000,
        "image": "https://res.klook.com/image/upload/c_fill,w_750,h_500/q_80/w_80,x_15,y_15,g_south_west,l_Klook_water_br_trans_yhcmh3/activities/e3xebvpxb62j9tljnjc8.webp",
        "description": "Đón bình minh trên thảm mây bồng bềnh, tham quan đồi chè Cầu Đất và vườn hồng treo gió."
    },
    {
        "id": "ticket-datanla-coaster",
        "category": "activity",
        "title": "Vé Alpine Coaster - Xe trượt ống thác Datanla",
        "price": 190000,
        "image": "https://res.klook.com/image/upload/c_fill,w_750,h_500/q_80/w_80,x_15,y_15,g_south_west,l_Klook_water_br_trans_yhcmh3/activities/vzryxchm5q90y9goy92y.webp",
        "description": "Trải nghiệm hệ thống máng trượt dài nhất Đông Nam Á xuyên qua rừng thông tuyệt đẹp."
    },
    {
        "id": "ticket-lumiere",
        "category": "activity",
        "title": "Vé tham quan Vườn Ánh Sáng Lumiere Đà Lạt",
        "price": 120000,
        "image": "https://res.klook.com/image/upload/c_fill,w_750,h_500/q_80/w_80,x_15,y_15,g_south_west,l_Klook_water_br_trans_yhcmh3/activities/cndw615x5cixg40d12g1.webp",
        "description": "Khám phá không gian nghệ thuật số độc đáo với công nghệ trình chiếu ánh sáng hiện đại."
    },

    # FOOD
    {
        "id": "buffet-leguda",
        "category": "food",
        "title": "Buffet rau Leguda đồi Ro-bin",
        "price": 299000,
        "image": "https://cdn.vntrip.vn/cam-nang/wp-content/uploads/2019/12/buffet-rau-leguda-da-lat-1.jpg",
        "description": "Thưởng thức lẩu rau không giới hạn với view ngắm toàn cảnh thành phố Đà Lạt từ đồi Ro-bin."
    },
    {
        "id": "combo-la-e",
        "category": "food",
        "title": "Lẩu gà lá é Tao Ngộ",
        "price": 300000,
        "image": "https://cdn.vntrip.vn/cam-nang/wp-content/uploads/2019/08/lau-ga-la-e-tao-ngo-da-lat-3.jpg",
        "description": "Đặc sản lẩu gà lá é trứ danh, thịt gà thả đồi dai ngon, nước lẩu ngọt thanh, thơm mùi lá é."
    },
    {
        "id": "combo-botoa",
        "category": "food",
        "title": "Lẩu bò Ba Toa quán Gỗ",
        "price": 350000,
        "image": "https://mia.vn/media/uploads/blog-du-lich/lau-bo-ba-toa-quan-go-1647413645.jpeg",
        "description": "Lẩu bò nổi tiếng với những miếng thịt bò dày, gân mềm, nước dùng đậm đà hương vị núi rừng."
    },
    {
        "id": "dinner-rungthongmo",
        "category": "food",
        "title": "Bữa tối BBQ tại Rừng Thông Mơ",
        "price": 850000,
        "image": "https://mia.vn/media/uploads/blog-du-lich/rung-thong-mo-farm-bistro-3-1647414059.jpg",
        "description": "Thưởng thức set BBQ lãng mạn giữa rừng thông với steak thượng hạng, rượu vang và nhạc acoustic."
    }
]

class BookServiceRequest(BaseModel):
    service_id: str
    quantity: int = 1

@router.get("/trips/{tripId}/mock-ota/services")
async def get_mock_services(request: Request, current_user: Dict[str, Any] = Depends(get_trip_member)):
    return MOCK_SERVICES

@router.post("/trips/{tripId}/mock-ota/book")
async def book_mock_service(request: Request, book_req: BookServiceRequest, current_user: Dict[str, Any] = Depends(get_trip_member)):
    trip_id = request.path_params.get('tripId')
    service = next((s for s in MOCK_SERVICES if s["id"] == book_req.service_id), None)
    
    if not service:
        raise ApiError(404, "Service not found")
        
    total_amount = service['price'] * book_req.quantity
    balance = await available_fund_balance(trip_id)
    
    payment_source = 'shared_fund'
    paid_by = None
    
    if balance < total_amount:
        payment_source = 'personal'
        paid_by = current_user['id']
        
    payload = {
        'trip_id': trip_id,
        'title': f"{service['title']} (x{book_req.quantity})",
        'amount': total_amount,
        'payment_source': payment_source,
        'paid_by': paid_by,
        'expense_date': datetime.utcnow().isoformat(),
        'category': service.get('category', 'other')
    }
    
    res = db.table('expenses').insert(payload).execute()
    if not res.data:
        raise ApiError(500, 'Failed to create expense')
    expense = res.data[0]
    
    if payment_source == 'personal':
        members_res = db.table('trip_members').select('user_id').eq('trip_id', trip_id).execute()
        participant_ids = [m['user_id'] for m in members_res.data] if members_res.data else [current_user['id']]
        
        db.table('expense_participants').insert([{'expense_id': expense['id'], 'user_id': uid} for uid in participant_ids]).execute()
        
        splits = compute_equal_splits(total_amount, participant_ids, expense['id'])
        db.table('expense_splits').insert(splits).execute()
    
    src_text = 'từ quỹ chung' if payment_source == 'shared_fund' else 'thành viên ứng trước'
    await notify_trip_members(trip_id, current_user['id'], 'new_expense', 'Chi tiêu mới (OTA)', f"Đã đặt {expense['title']} qua OTA: {expense['amount']} VND ({src_text})")
    
    return {"message": "Service booked successfully", "expense": expense}
