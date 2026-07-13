/**
 * AI Service kết nối trực tiếp với Google Gemini API.
 * Tư vấn sản phẩm thực tế từ App Context mà không sử dụng mock API hay data fake.
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL || 'gemini-1.5-flash';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;


/**
 * Định dạng danh sách sản phẩm sang văn bản ngắn để đưa vào System Instruction
 * @param {Array} products Danh sách sản phẩm lấy từ AppContext
 */
const formatProductsContext = (products) => {
  if (!products || products.length === 0) {
    return 'Hiện tại chưa có sản phẩm nào được tải từ cửa hàng.';
  }

  return products
    .map((p) => {
      const discountText = p.discount > 0 ? ` (Đang giảm giá ${p.discount}%)` : '';
      const originalPriceText = p.discount > 0 ? `, Giá gốc: ${p.originalPrice.toLocaleString('vi-VN')}đ` : '';
      return `- [ID: ${p.id}] ${p.name} | Thương hiệu: ${p.brand} | Danh mục: ${p.category} | Giá bán: ${p.price.toLocaleString('vi-VN')}đ${originalPriceText}${discountText} | Đánh giá: ${p.rating}/5 (${p.reviewsCount} lượt đánh giá).`;
    })
    .join('\n');
};

/**
 * Gửi tin nhắn tới Gemini API
 * @param {string} userMessage Tin nhắn mới từ người dùng
 * @param {Array} chatHistory Lịch sử chat [{ role: 'user'|'model', text: '...' }]
 * @param {Array} products Danh sách sản phẩm thực tế
 * @returns {Promise<string>} Phản hồi từ AI
 */
export const askGemini = async (userMessage, chatHistory = [], products = []) => {
  if (!GEMINI_API_KEY) {
    throw new Error('API_KEY_MISSING');
  }

  // 1. Xây dựng System Instruction để hướng dẫn AI
  const productsListText = formatProductsContext(products);
  const systemInstruction = `Bạn là Trợ lý Mua sắm AI thông minh, thân thiện của cửa hàng thiết bị công nghệ "My Store".
Nhiệm vụ của bạn là tư vấn cho khách hàng tìm kiếm và chọn mua các sản phẩm phù hợp.

Dưới đây là danh sách sản phẩm THỰC TẾ đang có trong kho hàng của cửa hàng (HÃY CHỈ sử dụng và tư vấn các sản phẩm này, tuyệt đối không bịa ra hoặc giới thiệu sản phẩm không có trong danh sách):
${productsListText}

Quy tắc trả lời:
1. Hãy luôn trả lời bằng Tiếng Việt, lịch sự, thân thiện và chuyên nghiệp.
2. Dựa trên nhu cầu của khách hàng (như tầm giá, mục đích sử dụng, thương hiệu), hãy gợi ý sản phẩm phù hợp nhất trong danh sách trên.
3. Khi giới thiệu sản phẩm, hãy nêu rõ Tên sản phẩm, Thương hiệu, Giá bán hiện tại (được giảm giá nếu có), và ưu điểm của nó. Có thể dùng định dạng Markdown để câu trả lời rõ ràng (in đậm tên sản phẩm, gạch đầu dòng các thông số).
4. Bạn có thể định dạng tên sản phẩm kèm link liên kết giả định theo ID nếu cần thiết, ví dụ: [Tên sản phẩm](#product-detail) hoặc nhắc khách hàng bấm vào sản phẩm đó trên màn hình để xem chi tiết.
5. Nếu khách hỏi về sản phẩm không có trong danh sách, hãy khéo léo phản hồi rằng hiện tại cửa hàng chưa kinh doanh dòng sản phẩm đó và gợi ý các sản phẩm cùng loại hoặc tương tự có sẵn trong danh sách.
6. Tuyệt đối KHÔNG giả tạo thông tin sản phẩm, không tự bịa ra thông số kỹ thuật không có hoặc giá bán khác với danh sách được cung cấp.`;

  // 2. Chuyển đổi lịch sử chat sang định dạng của Gemini API (contents)
  const contents = [];

  // Thêm lịch sử trò chuyện
  chatHistory.forEach((msg) => {
    contents.push({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }],
    });
  });

  // Thêm tin nhắn hiện tại của user
  contents.push({
    role: 'user',
    parts: [{ text: userMessage }],
  });

  // 3. Chuẩn bị request body
  const requestBody = {
    contents,
    systemInstruction: {
      parts: [{ text: systemInstruction }],
    },
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2000,
    },
  };

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Gemini API Error details:', errorData);
      throw new Error(errorData?.error?.message || `Yêu cầu thất bại với mã ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiResponse) {
      throw new Error('Không nhận được phản hồi hợp lệ từ mô hình AI.');
    }

    return aiResponse;
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw error;
  }
};
