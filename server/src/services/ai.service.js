import { GoogleGenAI } from '@google/genai';

let ai = null;

const getAI = () => {
  if (!ai && process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return ai;
};

export const generateItinerary = async ({ destination, days, budget, style, group }) => {
  const genAI = getAI();
  if (!genAI) {
    throw new Error('API key của Google Gemini chưa được cấu hình. Vui lòng thêm GEMINI_API_KEY vào .env.');
  }

  const prompt = `
Bạn là một chuyên gia du lịch am hiểu về các điểm đến.
Hãy lên một lịch trình chuyến đi chi tiết với các thông tin sau:
- Điểm đến: ${destination}
- Số ngày: ${days} ngày
- Ngân sách dự kiến: ${budget}
- Phong cách du lịch: ${style}
- Quy mô nhóm: ${group} người

Trả về kết quả dưới định dạng JSON với cấu trúc mảng các ngày. Mỗi ngày gồm có tiêu đề ngày và danh sách các hoạt động chi tiết.
Đối với mỗi địa điểm, hãy cố gắng cung cấp toạ độ (latitude, longitude) chính xác nhất có thể để hiển thị trên bản đồ.
Không được kèm theo text Markdown ở ngoài, chỉ trả về đúng mảng JSON theo format sau:
[
  {
    "day": 1,
    "title": "Tên chủ đề ngày (vd: Check-in & Khám phá văn hoá)",
    "activities": [
      {
        "time": "08:00",
        "title": "Ăn sáng tại quán X",
        "location": "Tên địa điểm cụ thể",
        "latitude": 11.9404,
        "longitude": 108.4583,
        "description": "Mô tả chi tiết"
      }
    ]
  }
]
`;

  try {
    const response = await genAI.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        temperature: 0.7,
        responseMimeType: 'application/json'
      }
    });

    const text = response.text;
    // In case the model returns markdown wrapped json despite the instructions
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw new Error('Đã có lỗi xảy ra khi tạo gợi ý từ AI. Vui lòng thử lại sau.');
  }
};

export const suggestPlaces = async (destination, category) => {
  const genAI = getAI();
  if (!genAI) {
    throw new Error('API key của Google Gemini chưa được cấu hình. Vui lòng thêm GEMINI_API_KEY vào .env.');
  }

  const prompt = `
Bạn là một chuyên gia du lịch am hiểu về các điểm đến.
Hãy đề xuất 5 địa điểm nổi bật thuộc danh mục "${category}" tại "${destination}".

Trả về kết quả dưới định dạng JSON với cấu trúc mảng.
Mỗi địa điểm phải có tọa độ (latitude, longitude) chính xác để hiển thị trên bản đồ.
Không được kèm theo text Markdown ở ngoài, chỉ trả về đúng mảng JSON theo format sau:
[
  {
    "title": "Tên địa điểm",
    "location": "Địa chỉ cụ thể",
    "latitude": 11.9404,
    "longitude": 108.4583,
    "description": "Mô tả ngắn gọn về điểm nổi bật",
    "estimated_cost": "Khoảng giá dự kiến (nếu có)"
  }
]
`;

  try {
    const response = await genAI.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        temperature: 0.7,
        responseMimeType: 'application/json'
      }
    });

    const text = response.text;
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Error calling Gemini API for places:', error);
    throw new Error('Đã có lỗi xảy ra khi lấy gợi ý địa điểm. Vui lòng thử lại sau.');
  }
};
