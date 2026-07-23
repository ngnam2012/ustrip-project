import json
import logging
from google import genai
from google.genai import types
from src.config.settings import settings

logger = logging.getLogger(__name__)

_ai_client = None

def get_ai():
    global _ai_client
    if not _ai_client and settings.GEMINI_API_KEY:
        _ai_client = genai.Client(api_key=settings.GEMINI_API_KEY)
    return _ai_client

async def generate_itinerary(destination: str, days: int, budget: str, style: str, group: int):
    client = get_ai()
    if not client:
        raise ValueError('API key của Google Gemini chưa được cấu hình. Vui lòng thêm GEMINI_API_KEY vào .env.')
        
    prompt = f"""
Bạn là một chuyên gia du lịch am hiểu về các điểm đến.
Hãy lên một lịch trình chuyến đi chi tiết với các thông tin sau:
- Điểm đến: {destination}
- Số ngày: {days} ngày
- Ngân sách dự kiến: {budget}
- Phong cách du lịch: {style}
- Quy mô nhóm: {group} người

Trả về kết quả dưới định dạng JSON với cấu trúc mảng các ngày. Mỗi ngày gồm có tiêu đề ngày và danh sách các hoạt động chi tiết.
Đối với mỗi địa điểm, hãy cố gắng cung cấp toạ độ (latitude, longitude) chính xác nhất có thể để hiển thị trên bản đồ.
Đối với mỗi hoạt động, hãy ước tính chi phí tham khảo (estimated_cost) bằng đơn vị VNĐ dạng số nguyên (ví dụ: 150000). Chi phí phải hợp lý theo mức giá thực tế tại điểm đến, tính cho {group} người.
Không được kèm theo text Markdown ở ngoài, chỉ trả về đúng mảng JSON theo format sau:
[
  {{
    "day": 1,
    "title": "Tên chủ đề ngày (vd: Check-in & Khám phá văn hoá)",
    "activities": [
      {{
        "time": "08:00",
        "title": "Ăn sáng tại quán X",
        "location": "Tên địa điểm cụ thể",
        "latitude": 11.9404,
        "longitude": 108.4583,
        "description": "Mô tả chi tiết",
        "estimated_cost": 150000
      }}
    ]
  }}
]
"""
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash', # Or the specific version we want
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.7,
                response_mime_type="application/json"
            )
        )
        
        text = response.text
        json_str = text.replace('```json', '').replace('```', '').strip()
        return json.loads(json_str)
    except Exception as e:
        logger.error(f'Error calling Gemini API: {e}')
        raise Exception('Đã có lỗi xảy ra khi tạo gợi ý từ AI. Vui lòng thử lại sau.')

async def suggest_places(destination: str, category: str):
    client = get_ai()
    if not client:
        raise ValueError('API key của Google Gemini chưa được cấu hình. Vui lòng thêm GEMINI_API_KEY vào .env.')
        
    prompt = f"""
Bạn là một chuyên gia du lịch am hiểu về các điểm đến.
Hãy đề xuất 5 địa điểm nổi bật thuộc danh mục "{category}" tại "{destination}".

Trả về kết quả dưới định dạng JSON với cấu trúc mảng.
Mỗi địa điểm phải có tọa độ (latitude, longitude) chính xác để hiển thị trên bản đồ.
Đối với mỗi địa điểm, hãy ước tính chi phí tham khảo (estimated_cost) bằng đơn vị VNĐ dạng số nguyên (ví dụ: 150000). Nếu miễn phí thì ghi 0. Chi phí phải hợp lý theo mức giá thực tế.
Không được kèm theo text Markdown ở ngoài, chỉ trả về đúng mảng JSON theo format sau:
[
  {{
    "title": "Tên địa điểm",
    "location": "Địa chỉ cụ thể",
    "latitude": 11.9404,
    "longitude": 108.4583,
    "description": "Mô tả ngắn gọn về điểm nổi bật",
    "estimated_cost": 150000
  }}
]
"""
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.7,
                response_mime_type="application/json"
            )
        )
        
        text = response.text
        json_str = text.replace('```json', '').replace('```', '').strip()
        return json.loads(json_str)
    except Exception as e:
        logger.error(f'Error calling Gemini API for places: {e}')
        raise Exception('Đã có lỗi xảy ra khi lấy gợi ý địa điểm. Vui lòng thử lại sau.')
