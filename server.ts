/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { COMPANY, INITIAL_FAQS, defaultPackagesAdmin, CATEGORIES, INITIAL_TESTIMONIALS } from './src/initialData.js';
import { autoSelectTier } from './src/utils/priceCalculator.js';
import fs from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';

dotenv.config();

// Safe path resolution for both dev (ESM) and prod (CJS bundle) environments
const __filename = typeof import.meta !== 'undefined' && import.meta.url
  ? fileURLToPath(import.meta.url)
  : '';
const __dirname = __filename ? path.dirname(__filename) : process.cwd();

const STORE_DIR = path.join(process.cwd(), 'data');
const STORE_FILE = path.join(STORE_DIR, 'store.json');

// Ensure storage directory exists
if (!fs.existsSync(STORE_DIR)) {
  fs.mkdirSync(STORE_DIR, { recursive: true });
}

function charmPrice(p: number): number {
  if (p <= 0) return 0;
  if (p < 10000) return p;
  const base = Math.floor(p / 10000) * 10000 + 9000;
  return base <= p ? base : base - 10000;
}

// Function to load the store
function loadStore() {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const data = fs.readFileSync(STORE_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading store.json:', error);
  }
  return null;
}

// Function to save the store
function saveStore(data: any) {
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Error saving store.json:', error);
    return false;
  }
}

// Firebase Firestore setup
let db: any = null;

try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    if (config.projectId) {
      const firebaseApp = initializeApp(config);
      if (config.firestoreDatabaseId) {
        db = getFirestore(firebaseApp, config.firestoreDatabaseId);
      } else {
        db = getFirestore(firebaseApp);
      }
      console.log('Firebase Client initialized successfully on server with database:', config.firestoreDatabaseId || '(default)');
    }
  }
} catch (error) {
  console.error('Error initializing Firebase Client:', error);
}

function migratePackages(packages: any): { migrated: any, modified: boolean } {
  if (!packages || !Array.isArray(packages.cards)) return { migrated: packages, modified: false };
  let modified = false;
  packages.cards = packages.cards.map((card: any) => {
    if (card.id === 'starter') {
      const isOld = card.subtitle === 'Phù hợp với hộ kinh doanh cá thể, quán nhỏ dưới 50m²' ||
                    card.subtitle === 'Phù hợp với hộ kinh doanh cá thể, cửa hàng độc lập nhỏ' ||
                    !card.subtitle.includes('≤ 50m²');
      if (isOld) {
        card.subtitle = 'Hộ cá thể, cửa hàng nhỏ ≤ 50m² (1 zone phát nhạc cơ bản mặc định)';
        modified = true;
      }
    } else if (card.id === 'business') {
      const isOld = card.subtitle === 'Tối ưu cho quán vừa, chuỗi cửa hàng, spa chăm sóc chuyên nghiệp' ||
                    card.subtitle === 'Lựa chọn tối ưu cho quán vừa/lớn, chuỗi cửa hàng tầm trung' ||
                    !card.subtitle.includes('zones');
      if (isOld) {
        card.subtitle = 'Quán vừa, chuỗi cửa hàng, spa (diện tích 80-300m² hoặc ≤10 phòng, hỗ trợ 2-3 zones)';
        modified = true;
      }
    } else if (card.id === 'professional') {
      const isOld = card.subtitle === 'Dành cho không gian cao cấp, trung tâm thể thao, showroom lớn' ||
                    card.subtitle === 'Dành cho không gian lớn, tổ hợp dịch vụ hoặc chuỗi lớn chuyên nghiệp' ||
                    !card.subtitle.includes('đa vùng âm thanh');
      if (isOld) {
        card.subtitle = 'Không gian cao cấp, trung tâm thể thao, showroom (>300m² hoặc >10 phòng, đa vùng âm thanh)';
        modified = true;
      }
    } else if (card.id === 'enterprise') {
      const isOld = card.subtitle === 'Hệ thống khách sạn, resort, bệnh viện và siêu thị quy mô lớn' ||
                    card.subtitle === 'Giải pháp may đo riêng biệt cho tập đoàn, resort, chuỗi lớn đặc thù' ||
                    !card.subtitle.includes('SLA');
      if (isOld) {
        card.subtitle = 'Resort, khách sạn, đại siêu thị (quy mô lớn đặc thù, hỗ trợ AM riêng và cam kết SLA)';
        modified = true;
      }
    }
    return card;
  });
  return { migrated: packages, modified };
}

// In-memory cache for central store sync
const memoryStore: Record<string, any> = {};

// Initialize memory cache
function initStoreCache() {
  const localData = loadStore();
  const defaultStore = {
    company: COMPANY,
    faqs: INITIAL_FAQS,
    packages: defaultPackagesAdmin,
    pricing: CATEGORIES,
    reviews: INITIAL_TESTIMONIALS,
    banner: {
      enabled: true,
      text: '🔥 CHÀO HÈ RỰC RỠ: Nhận ngay ưu đãi 14 ngày dùng thử miễn phí và hỗ trợ thiết kế playlist độc quyền cho cơ sở mới!',
    },
    quote_requests: [],
    technicians: []
  };

  const allowedKeys = ['company', 'faqs', 'packages', 'pricing', 'reviews', 'banner', 'quote_requests', 'technicians'];
  for (const key of allowedKeys) {
    if (localData && localData[key] !== undefined) {
      memoryStore[key] = localData[key];
    } else {
      memoryStore[key] = defaultStore[key as keyof typeof defaultStore];
    }
  }

  // Run initial package migration
  const { migrated, modified } = migratePackages(memoryStore['packages']);
  memoryStore['packages'] = migrated;
  if (modified) {
    saveStore(memoryStore);
  }
}

initStoreCache();

// Async background sync with Firestore
async function syncWithFirestore() {
  if (!db) {
    console.log('Firestore not initialized. Operating in local-only mode.');
    return;
  }

  console.log('Synchronizing configurations with Cloud Firestore...');
  const allowedKeys = ['company', 'faqs', 'packages', 'pricing', 'reviews', 'banner', 'quote_requests', 'technicians'];

  for (const key of allowedKeys) {
    try {
      const docRef = doc(db, 'store', key);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists() && key !== 'packages' && key !== 'pricing') {
        const firestoreData = docSnap.data();
        if (firestoreData && firestoreData.data !== undefined) {
          console.log(`Loaded configuration key '${key}' from Firestore.`);
          memoryStore[key] = firestoreData.data;
        }
      } else {
        // Document doesn't exist in Firestore yet or is 'packages'/'pricing' which we want to force-push the 10% discount updates for
        console.log(`Force syncing configuration key '${key}' from local cache to Firestore...`);
        await setDoc(docRef, { data: memoryStore[key] });
      }
    } catch (err: any) {
      console.error(`Error syncing key '${key}' with Firestore:`, err.message);
    }
  }

  // Rewrite local backup file with final merged state
  saveStore(memoryStore);
  console.log('Configuration synchronization complete.');
}

// Run background sync immediately
syncWithFirestore().catch((err) => {
  console.error('Failed to execute background Firestore sync:', err);
});

// Helper function to get live pricing data
function getLivePricing() {
  if (Array.isArray(memoryStore.pricing) && memoryStore.pricing.length > 0) {
    return memoryStore.pricing;
  }
  return CATEGORIES;
}

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Lazy-loaded or route-checked Gemini Client
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not defined in environment variables.');
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

/**
 * API: Chat và Phân tích mô hình đặc thù bằng AI
 */
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, history, files } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Nội dung tin nhắn không được để trống.' });
    }

    const livePricing = getLivePricing();

    const systemInstruction = `
Bạn là "Chuyên viên Báo giá AI" chính thức và cực kỳ chuyên nghiệp của AudioBay (nền tảng cung cấp nhạc nền bản quyền hàng đầu tại Việt Nam).
Nhiệm vụ của bạn là lắng nghe mô tả của khách hàng về mô hình kinh doanh đặc thù hoặc đặc biệt của họ (những mô hình KHÔNG nằm trong danh sách 12 mô hình chuẩn như Cafe, Nhà hàng, Spa, Beauty, v.v.), sau đó phân tích và áp dụng bảng giá thực tế của AudioBay để đưa ra báo giá tham khảo nhanh, tối ưu, chính xác và có độ tin cậy tuyệt đối.

Dữ liệu bảng giá hiện tại của AudioBay được gửi kèm dưới dạng JSON trong yêu cầu. Bạn phải dựa vào dữ liệu này để tính giá và trích xuất thông tin:
${JSON.stringify(livePricing, null, 2)}

Nguyên tắc tính toán và đề xuất:
1. Xác định mô hình của khách: Áp dụng tư duy tương đương để ánh xạ (map) mô hình đặc thù của họ sang một mô hình chuẩn gần nhất. Ví dụ:
   - "Phòng tập nhảy", "Khu leo núi", "Sân cầu lông" -> Mapped sang "Fitness & Gym"
   - "Quán trà đạo", "Tiệm bánh ngọt", "Khu ẩm thực ngoài trời" -> Mapped sang "Cà phê & Trà sữa"
   - "Khu vui chơi trẻ em", "Art Studio", "Phòng triển lãm tranh" -> Mapped sang "Sự kiện & Studio" hoặc "Bán lẻ & Cửa hàng"
   - "Trường mầm non tư thục", "Phòng khám thú y" -> Mapped sang "Y tế & Nha khoa" hoặc "Văn phòng & Coworking"
2. Xác định thông số quy mô: Đọc từ tin nhắn diện tích (m2) hoặc số phòng/số giường/thiết bị của họ. Nếu không có, hãy tự ước lượng một con số hợp lý dựa trên loại hình kinh doanh (ví dụ: một phòng tập nhảy cỡ vừa thường khoảng 100 - 150m2, một homestay thường khoảng 10 - 20 phòng).
3. Xác định số lượng địa điểm (locationsCount):
   - Nếu khách hàng là chuỗi (ví dụ: chuỗi 14 chi nhánh, hệ thống 5 cơ sở), hãy bóc tách chính xác số chi nhánh đó thành thuộc tính "locationsCount" (ví dụ: locationsCount = 14).
   - Nếu khách chỉ đề cập 1 cửa hàng/địa điểm đơn lẻ hoặc không nói gì thêm, đặt locationsCount = 1.
   - Giữ tên mô hình kinh doanh (modelName) "sạch sẽ" và ngắn gọn, KHÔNG chèn thêm thông tin số chi nhánh dạng "(14 chi nhánh)" vào modelName nữa vì đã có ô số lượng địa điểm riêng.
4. Đề xuất số Zone âm thanh tối ưu: Dựa trên mô tả hoặc tự động tính số zone hợp lý (ví dụ: khu reception, khu tập luyện chính, khu thay đồ -> 3 zones).
5. Ánh xạ vào Tier (gói dịch vụ) phù hợp:
   - Đối chiếu quy mô (diện tích/số phòng) với các Tier trong Category đã ánh xạ để tìm Tier tối ưu nhất (ví dụ: gói STARTER cho quy mô nhỏ, BUSINESS cho quy mô vừa, PROFESSIONAL cho quy mô lớn, ENTERPRISE cho quy mô siêu lớn hoặc chuỗi).
6. Công thức tính giá chuẩn xác:
   - Giá gốc hàng tháng (Base Price Monthly): Là giá của Tier đã ánh xạ (ví dụ: 449.100đ cho gói Cafe vừa).
   - Zone bổ sung ngoài gói: Mỗi zone vượt quá số zone đi kèm của Tier sẽ được tính thêm 89.100đ/tháng (ví dụ: Tier chuẩn có 2 zones, nhưng khách cần 3 zones -> 1 zone bổ sung -> thêm 89.100đ/tháng).
   - Tổng phí tháng: Giá gốc + Giá zone bổ sung.
   - Tổng phí năm (đã tính chiết khấu): Tổng phí tháng * 12 * 0.83 (chiết khấu 17% khi thanh toán 1 năm, tức giảm giá 17%, tiết kiệm được 17%).
   - Số tiền tiết kiệm được mỗi năm: Tổng phí tháng * 12 * 0.17.
7. Thuyết phục và chuyên nghiệp: Câu trả lời của bạn phải thật rõ ràng, ân cần, chi tiết từng bước tính để khách hàng tin tưởng. Trình bày bằng tiếng Việt.
8. PHÂN TÍCH TÀI LIỆU & HÌNH ẢNH (MULTIMODAL): Khách hàng có thể tải lên tài liệu mô tả dự án (văn bản như TXT, PDF, CSV, JSON, MD...) hoặc hình ảnh bản vẽ, thiết kế mặt bằng, danh sách thiết bị âm thanh. Bạn CẦN phân tích kỹ các tài liệu hoặc hình ảnh này (nếu được đính kèm cùng tin nhắn) để:
   - Nhận diện hoặc ước lượng chính xác diện tích mặt bằng (m²), số phòng, hoặc số chi nhánh/vị trí.
   - Phát hiện các yêu cầu kỹ thuật âm thanh, số khu vực phát nhạc (zones) mong muốn để đưa ra đề xuất gói tối ưu nhất.
   - Hãy đề cập rõ trong "replyText" và "analysisText" rằng bạn đã phân tích tài liệu/hình ảnh đính kèm (Ví dụ: "Dựa trên tài liệu bản vẽ mặt bằng PDF/hình ảnh bạn cung cấp, chúng tôi nhận thấy không gian của bạn rộng khoảng...").

9. YÊU CẦU ĐẶC BIỆT VỀ CẤU TRÚC VĂN BẢN VÀ THÔNG TIN (SỬA LỖI TỪ KHÁCH HÀNG):
   - TUYỆT ĐỐI KHÔNG sử dụng ký tự tiêu đề Markdown có dấu thăng như '#', '##', '###', '####', v.v. Để ngăn chặn các dấu ký tự đặc biệt hiển thị lộn xộn, hãy dùng chữ in hoa bôi đậm, ví dụ: **📊 PHÂN TÍCH THÔNG SỐ KHÔNG GIAN:** hoặc **💡 ĐỀ XUẤT GÓI DỊCH VỤ:** làm tiêu đề phân chia các phần.
   - TUYỆT ĐỐI KHÔNG tự sáng tạo thêm, tự diễn giải chi tiết hay bịa đặt thêm (hallucinate) các mô tả tính năng dịch vụ/ứng dụng ngoài thực tế không tồn tại trong danh sách tính năng gốc của gói (ví dụ: KHÔNG được đưa vào các câu/nội dung như 'Quản lý thông minh: App AudioBay trên iOS & Android kết hợp Dashboard Web giúp bạn điều khiển nhạc từ xa cực dễ dàng', hay 'Tính năng lập lịch tự động: Bạn có thể lập lịch tự động cho khu vui chơi chỉ phát nhạc thiếu nhi giờ cao điểm, khu ăn uống phát nhạc nhẹ nhàng buổi trưa/tối.').
   - CHỈ ĐƯỢC trích dẫn và sử dụng đúng các tính năng thực tế có sẵn trong mảng 'features' được đồng bộ của gói đã chọn trong dữ liệu JSON. Khi muốn giải thích sự phù hợp của tính năng với không gian của khách, hãy viết ngắn gọn, khách quan, trung thực, tuyệt đối không thêu dệt thêm các chức năng giả định.

YÊU CẦU ĐẦU RA: Bạn BẮT BUỘC phải trả về một chuỗi JSON hợp lệ, tuân thủ cấu trúc sau (không viết thêm chữ nào khác ngoài JSON, không bọc trong thẻ block h3 hay markdown khác, chỉ trả về chuỗi JSON thô để hệ thống parse):

{
  "replyText": "Nội dung phản hồi của bạn viết dưới dạng Markdown thân thiện, chào hỏi, phân tích, liệt kê cách tính giá chi tiết, các ưu điểm của gói đề xuất, và kết luận thuyết phục. Nhớ TUYỆT ĐỐI KHÔNG dùng dấu '#', '##', '###'!",
  "modelName": "Tên mô hình đặc thù của khách hàng (VD: Studio Chụp Ảnh The Fuji Studio)",
  "matchedCategoryName": "Tên danh mục chuẩn được ánh xạ (VD: Bán lẻ & Cửa hàng)",
  "matchedCategoryId": "ID danh mục chuẩn tương ứng: 'cafe' | 'restaurant' | 'spa' | 'beauty' | 'fitness' | 'healthcare' | 'retail' | 'showroom' | 'office' | 'events' | 'hotel'",
  "locationsCount": 14, // Số lượng địa điểm bóc tách được (ví dụ: 14)
  "inputValue": 1118, // Số quy mô (diện tích hoặc số phòng) được parse hoặc ước lượng
  "inputLabel": "m2", // "m2" hoặc "phòng"
  "zones": 23, // Tổng số zone đề xuất
  "basePriceMonthly": 449100, // Giá gốc hàng tháng của Tier được chọn
  "addonPriceMonthly": 89100, // Tổng tiền zone bổ sung hàng tháng (số zone vượt mức x 89100)
  "totalPriceMonthly": 538200, // basePriceMonthly + addonPriceMonthly
  "totalPriceYearly": 5360472, // (totalPriceMonthly * 12) * 0.83
  "savingsYearly": 1097928, // (totalPriceMonthly * 12) * 0.17
  "packageTier": "BUSINESS", // "STARTER" | "BUSINESS" | "PROFESSIONAL" | "ENTERPRISE"
  "features": [
    "Phát nhạc không giới hạn trong không gian được cấp phép",
    "App quản lý nhạc trên iOS & Android",
    "Dashboard web quản lý từ xa",
    "Lập lịch phát nhạc tự động theo khung giờ",
    "Playlist tùy chỉnh theo thương hiệu"
  ], // Các tính năng đi kèm gói, lấy chính xác từ dữ liệu pricingData gửi lên
  "analysisText": "Đề xuất tối ưu cho không gian phòng tập nhảy 120m2 chia làm 3 khu vực âm thanh riêng biệt."
}
`;

    // Chuẩn bị tin nhắn hội thoại bao gồm lịch sử chat
    const chatHistoryParts: any[] = [];
    if (history && Array.isArray(history)) {
      // Bỏ qua tin nhắn chào mừng ban đầu (model) nếu nó đứng đầu để tránh lỗi API (hội thoại phải bắt đầu bằng user)
      let foundFirstUser = false;
      history.forEach((msg: any) => {
        if (msg.role === 'user') {
          foundFirstUser = true;
        }
        if (foundFirstUser) {
          chatHistoryParts.push({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }],
          });
        }
      });
    }

    // Thêm tin nhắn hiện tại kèm các tệp đính kèm nếu có
    const currentUserParts: any[] = [
      {
        text: `Yêu cầu khách hàng: "${message}". 
Hãy phân tích và tính toán dựa trên bảng giá thực tế được cung cấp ở system instruction. Trả về đúng định dạng JSON yêu cầu.`,
      }
    ];

    if (files && Array.isArray(files)) {
      files.forEach((f: any) => {
        let base64Data = f.data;
        if (base64Data.includes(';base64,')) {
          base64Data = base64Data.split(';base64,')[1];
        }
        currentUserParts.push({
          inlineData: {
            mimeType: f.mimeType,
            data: base64Data,
          }
        });
      });
    }

    chatHistoryParts.push({
      role: 'user',
      parts: currentUserParts,
    });

    let parsedResult;
    try {
      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: chatHistoryParts,
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: 'application/json',
        },
      });

      const textOutput = response.text || '{}';
      parsedResult = JSON.parse(textOutput.trim());
    } catch (e: any) {
      console.log('Kích hoạt Bộ phân tích quy tắc AudioBay thông minh (Chế độ tự động offline/local)...');
      
      // BỘ PHÂN TÍCH QUY TẮC AUDIOBAY THÔNG MINH (INTELLIGENT RULE-BASED ADVISOR)
      let matchedId = 'cafe';
      let matchedName = 'Cà phê & Trà sữa';
      const text = message.toLowerCase();

      if (text.includes('nhà hàng') || text.includes('quán ăn') || text.includes('buffet') || text.includes('ẩm thực') || text.includes('tàu') || text.includes('du thuyền') || text.includes('ăn uống')) {
        matchedId = 'restaurant';
        matchedName = 'Nhà hàng & Quán ăn';
      } else if (text.includes('spa') || text.includes('gội đầu') || text.includes('massage') || text.includes('thảo mộc') || text.includes('trị liệu')) {
        matchedId = 'spa';
        matchedName = 'Spa & Massage';
      } else if (text.includes('beauty') || text.includes('salon') || text.includes('thẩm mỹ') || text.includes('làm đẹp') || text.includes('tóc') || text.includes('nails') || text.includes('makeup')) {
        matchedId = 'beauty';
        matchedName = 'Beauty Salon & Tiệm tóc';
      } else if (text.includes('gym') || text.includes('fitness') || text.includes('thể hình') || text.includes('yoga') || text.includes('phòng tập') || text.includes('nhảy') || text.includes('cầu lông') || text.includes('bể bơi') || text.includes('thể thao')) {
        matchedId = 'fitness';
        matchedName = 'Fitness & Gym';
      } else if (text.includes('bệnh viện') || text.includes('phòng khám') || text.includes('nha khoa') || text.includes('y tế') || text.includes('dược') || text.includes('bác sĩ')) {
        matchedId = 'healthcare';
        matchedName = 'Y tế & Nha khoa';
      } else if (text.includes('showroom') || text.includes('triển lãm') || text.includes('trưng bày') || text.includes('ô tô') || text.includes('xe máy')) {
        matchedId = 'showroom';
        matchedName = 'Showroom & Trưng bày';
      } else if (text.includes('văn phòng') || text.includes('office') || text.includes('co-working') || text.includes('công ty') || text.includes('làm việc')) {
        matchedId = 'office';
        matchedName = 'Văn phòng & Coworking';
      } else if (text.includes('sự kiện') || text.includes('studio') || text.includes('triển lãm') || text.includes('rạp') || text.includes('chụp ảnh') || text.includes('quay phim')) {
        matchedId = 'events';
        matchedName = 'Sự kiện & Studio';
      } else if (text.includes('khách sạn') || text.includes('hotel') || text.includes('homestay') || text.includes('resort') || text.includes('nhà nghỉ') || text.includes('b&b') || text.includes('villa')) {
        matchedId = 'hotel';
        matchedName = 'Khách sạn & Resort';
      } else if (text.includes('siêu thị') || text.includes('bán lẻ') || text.includes('cửa hàng') || text.includes('shop') || text.includes('tiệm') || text.includes('tạp hóa') || text.includes('store')) {
        matchedId = 'retail';
        matchedName = 'Bán lẻ & Cửa hàng';
      }

      let scaleValue = 100;
      let scaleLabel = matchedId === 'hotel' ? 'phòng' : 'm2';

      const m2Matches = [...text.matchAll(/(\d+(?:\.\d+)?)\s*(?:m2|mét vuông|met vuong|sqm)/gi)];
      const roomMatches = [...text.matchAll(/(\d+)\s*(?:phòng|phong|giường|giuong|bed|room)/gi)];

      if (matchedId === 'hotel' && roomMatches.length > 0) {
        scaleValue = parseInt(roomMatches[0][1], 10);
        scaleLabel = 'phòng';
      } else if (m2Matches.length > 0) {
        let totalM2 = 0;
        m2Matches.forEach(m => { totalM2 += parseFloat(m[1]); });
        scaleValue = totalM2 > 0 ? Math.round(totalM2) : 100;
        scaleLabel = 'm2';
      } else if (roomMatches.length > 0) {
        scaleValue = parseInt(roomMatches[0][1], 10);
        scaleLabel = 'phòng';
      } else {
        const anyNumMatch = text.match(/\b(\d+)\b/);
        if (anyNumMatch) {
          const val = parseInt(anyNumMatch[1], 10);
          if (val > 5 && val < 5000) scaleValue = val;
        }
      }

      let locations = 1;
      const locMatch = text.match(/(\d+)\s*(?:chi\s*nhánh|địa\s*điểm|cơ\s*sở|cửa\s*hàng|showroom|phòng\s*tập|văn\s*phòng|tàu|chi\s*nhanh|dia\s*diem|co\s*so|cua\s*hang|tau)/i);
      if (locMatch) {
        locations = parseInt(locMatch[1], 10);
      } else {
        const tauMatches = [...text.matchAll(/(\d+)\s*tàu/gi)];
        if (tauMatches.length > 0) {
          let sumTaus = 0;
          tauMatches.forEach(m => { sumTaus += parseInt(m[1], 10); });
          if (sumTaus > 0) locations = sumTaus;
        }
      }

      let zones = 1;
      const zoneMatch = text.match(/(\d+)\s*(?:zone|khu\s*vực|khu\s*vuc|loa|hệ\s*thống|he\s*thong)/i);
      if (zoneMatch) {
        zones = parseInt(zoneMatch[1], 10);
      } else {
        if (scaleValue > 500) zones = 4;
        else if (scaleValue > 200) zones = 3;
        else if (scaleValue > 80) zones = 2;
        else zones = 1;
      }

      const livePricing = getLivePricing();
      const category = livePricing.find(c => c.id === matchedId) || livePricing[0];
      const tier = autoSelectTier(category, scaleValue);

      let packageTier = 'BUSINESS';
      let basePriceMonthly = 449000;
      let addonPriceMonthly = 0;
      let features: string[] = [];

      if (tier) {
        packageTier = tier.name.toUpperCase().includes('STARTER') ? 'STARTER' :
                      tier.name.toUpperCase().includes('BUSINESS') ? 'BUSINESS' :
                      tier.name.toUpperCase().includes('PROFESSIONAL') ? 'PROFESSIONAL' :
                      tier.price_month === null ? 'ENTERPRISE' : 'BUSINESS';

        if (tier.price_month !== null && locations === 1) {
          basePriceMonthly = charmPrice(tier.price_month);
          const extraZones = Math.max(0, zones - tier.zones);
          addonPriceMonthly = extraZones > 0 ? charmPrice(extraZones * 89000) : 0;
        } else if (tier.price_month !== null && locations > 1 && locations < 5) {
          const singleBasePrice = tier.price_month;
          const extraZones = Math.max(0, zones - tier.zones);
          const singleAddonPrice = extraZones * 89000;
          basePriceMonthly = charmPrice(Math.round(singleBasePrice * locations * 0.9));
          addonPriceMonthly = extraZones > 0 ? charmPrice(Math.round(singleAddonPrice * locations * 0.9)) : 0;
          packageTier = 'BUSINESS';
        } else {
          const basePerBranch = Math.max(269000, zones * 45000);
          basePriceMonthly = charmPrice(basePerBranch * locations);
          addonPriceMonthly = 0;
          packageTier = 'ENTERPRISE';
        }
        features = tier.features;
      }

      const totalPriceMonthly = charmPrice(basePriceMonthly + addonPriceMonthly);
      const rawYearlyWithoutDiscount = totalPriceMonthly * 12;
      const totalPriceYearly = charmPrice(Math.round(totalPriceMonthly * 12 * 0.83));
      const savingsYearly = charmPrice(Math.max(0, rawYearlyWithoutDiscount - totalPriceYearly));

      // Làm đẹp mô tả dựa trên từ khóa người dùng
      let extractedModelName = message.substring(0, 45).trim() + (message.length > 45 ? '...' : '');
      if (text.includes('tàu') || text.includes('du thuyền')) {
        extractedModelName = 'Tàu du lịch / Du thuyền Nhà hàng';
      } else if (text.includes('phòng tập') || text.includes('nhảy') || text.includes('gym')) {
        extractedModelName = 'Trung tâm Thể thao & Gym';
      }

      let replyText = `Chào bạn, **AudioBay** rất vinh hạnh được tư vấn giải pháp âm nhạc nền bản quyền tối ưu cho mô hình kinh doanh của bạn.

Dưới đây là phân tích chi tiết từ thuật toán báo giá thông minh của AudioBay dựa trên mô tả của bạn:

**📊 PHÂN TÍCH THÔNG SỐ KHÔNG GIAN:**
- **Mô hình kinh doanh**: **${matchedName}** (Được quy đổi tương đương từ mô tả của bạn)
- **Tổng quy mô**: **${scaleValue} ${scaleLabel}**
- **Số lượng chi nhánh/địa điểm**: **${locations}** cơ sở
- **Số khu vực phát nhạc đề xuất (Zones)**: **${zones}** zone riêng biệt

---

**💡 ĐỀ XUẤT GÓI DỊCH VỤ: GÓI ${packageTier}**
Chúng tôi đề xuất áp dụng **Gói ${packageTier}** để đảm bảo đầy đủ các tính năng vận hành âm thanh thông minh và phân quyền quản lý chuyên nghiệp.

**💰 CHI TIẾT BÁO GIÁ DỰ KIẾN:**
1. **Phí thuê bao cơ bản**: **${basePriceMonthly.toLocaleString('vi-VN')}đ** / tháng (Đã áp dụng ưu đãi hệ thống${locations > 1 ? ' giảm 10% cho chuỗi' : ''})
2. **Phí khu vực âm thanh bổ sung (nếu có)**: **${addonPriceMonthly.toLocaleString('vi-VN')}đ** / tháng
3. **Tổng phí dịch vụ hàng tháng**: **${totalPriceMonthly.toLocaleString('vi-VN')}đ** / tháng (Chưa VAT)

---

**🎁 ƯU ĐÃI ĐẶC BIỆT KHI THANH TOÁN TRẢ TRƯỚC 1 NĂM (TIẾT KIỆM 17%):**
- **Tổng chi phí 12 tháng**: ~~${(totalPriceMonthly * 12).toLocaleString('vi-VN')}đ~~
- **Giá ưu đãi trọn gói 1 năm**: **${totalPriceYearly.toLocaleString('vi-VN')}đ** / năm
- **Số tiền tiết kiệm ngay**: **${savingsYearly.toLocaleString('vi-VN')}đ** (Tương đương hơn 2 tháng sử dụng miễn phí!)

---

**🌟 CÁC TÍNH NĂNG ĐỘC QUYỀN ĐI KÈM GÓI:**
${features.map(f => `- ✅ ${f}`).join('\n')}

---

**📞 KHUYẾN NGHỊ VẬN HÀNH:**
Đối với mô hình của bạn, việc phân bổ **${zones} zones** âm thanh sẽ giúp tối ưu hóa cảm xúc khách hàng ở từng khu vực khác nhau. Bạn có thể dễ dàng quản lý toàn bộ hệ thống phát nhạc thông qua ứng dụng và tài khoản quản trị được đồng bộ từ AudioBay.

*Báo giá trên đã được tính toán tự động khớp với bảng giá niêm yết của AudioBay. Quý khách có thể xuất file báo giá PDF chính thức hoặc nhấn nút đăng ký để đội ngũ chuyên viên liên hệ hỗ trợ trực tiếp!*`;

      parsedResult = {
        replyText: replyText,
        modelName: extractedModelName,
        matchedCategoryName: matchedName,
        matchedCategoryId: matchedId,
        locationsCount: locations,
        inputValue: scaleValue,
        inputLabel: scaleLabel,
        zones: zones,
        basePriceMonthly: basePriceMonthly,
        addonPriceMonthly: addonPriceMonthly,
        totalPriceMonthly: totalPriceMonthly,
        totalPriceYearly: totalPriceYearly,
        savingsYearly: savingsYearly,
        packageTier: packageTier,
        features: features,
        analysisText: `Đề xuất tối ưu cho ${extractedModelName} quy mô ${scaleValue} ${scaleLabel} chia làm ${zones} khu vực âm thanh riêng biệt.`
      };
    }

    // --- BỘ ĐỒNG BỘ VÀ HIỆU CHỈNH TOÁN HỌC CHÍNH XÁC TUYỆT ĐỐI (AUDIOBAY PRECISION ENGINE) ---
    try {
      // 1. Chuẩn hóa đầu vào số học & bóc tách số chi nhánh tự động bằng Regex thông minh từ tin nhắn & modelName
      let locations = Number(parsedResult.locationsCount) || 1;
      const combinedText = (message + ' ' + (parsedResult.modelName || '')).toLowerCase();
      const branchMatch = combinedText.match(/(\d+)\s*(chi\s*nhánh|địa\s*điểm|cơ\s*sở|cửa\s*hàng|showroom|phòng\s*tập|văn\s*phòng)/);
      if (branchMatch && locations === 1) {
        const parsedBranches = parseInt(branchMatch[1], 10);
        if (parsedBranches > 1 && parsedBranches < 1000) {
          locations = parsedBranches;
        }
      }

      parsedResult.locationsCount = locations;
      parsedResult.inputValue = Number(parsedResult.inputValue) || 100;
      parsedResult.zones = Number(parsedResult.zones) || 1;

      // Làm sạch modelName để tránh lặp thông tin chi nhánh và ký tự thừa ở cuối
      if (parsedResult.modelName) {
        parsedResult.modelName = parsedResult.modelName
          .replace(/\(\s*\d+\s*(chi\s*nhánh|địa\s*điểm|cơ\s*sở|cửa\s*hàng|vùng|zone|địa\s*bàn)\s*\)/gi, '')
          .replace(/-\s*\d+\s*(chi\s*nhánh|địa\s*điểm|cơ\s*sở|cửa\s*hàng|vùng|zone|địa\s*bàn)/gi, '')
          .replace(/\d+\s*(chi\s*nhánh|địa\s*điểm|cơ\s*sở|cửa\s*hàng|vùng|zone|địa\s*bàn)/gi, '')
          .replace(/\s+[\s\(\-\)]+$/g, '')
          .trim();
        
        // Nếu làm sạch xong bị rỗng, khôi phục lại giá trị gốc nhưng cắt gọn
        if (!parsedResult.modelName) {
          parsedResult.modelName = 'Mô hình tùy chỉnh';
        }
      }

      // 2. Tìm kiếm danh mục phù hợp trong dữ liệu chuẩn để đồng bộ hóa
      const matchedId = (parsedResult.matchedCategoryId || '').toLowerCase().trim();
      const matchedName = (parsedResult.matchedCategoryName || '').toLowerCase().trim();

      const livePricing = getLivePricing();
      const category = livePricing.find(c => c.id === matchedId) ||
                       livePricing.find(c => c.name.toLowerCase() === matchedName) ||
                       livePricing.find(c => matchedName.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(matchedName)) ||
                       livePricing.find(c => c.id === 'cafe') ||
                       livePricing[0];

      if (category) {
        parsedResult.matchedCategoryId = category.id;
        parsedResult.matchedCategoryName = category.name;
        parsedResult.inputLabel = category.inputType === 'area' ? 'm2' : 'phòng';
        
        // Chọn Tier tự động dựa trên quy mô đo đạc chuẩn của AudioBay
        const tier = autoSelectTier(category, parsedResult.inputValue);
        if (tier) {
          parsedResult.packageTier = tier.name.toUpperCase().includes('STARTER') ? 'STARTER' :
                                     tier.name.toUpperCase().includes('BUSINESS') ? 'BUSINESS' :
                                     tier.name.toUpperCase().includes('PROFESSIONAL') ? 'PROFESSIONAL' :
                                     tier.price_month === null ? 'ENTERPRISE' : 'BUSINESS';
          
          if (tier.price_month !== null && locations === 1) {
            // Trường hợp 1 địa điểm đơn lẻ thuộc Gói chuẩn
            parsedResult.basePriceMonthly = charmPrice(tier.price_month);
            const extraZones = Math.max(0, parsedResult.zones - tier.zones);
            parsedResult.addonPriceMonthly = extraZones > 0 ? charmPrice(extraZones * 89000) : 0;
          } else if (tier.price_month !== null && locations > 1 && locations < 5) {
            // Trường hợp chuỗi nhỏ (2-4 địa điểm), áp dụng chiết khấu chuỗi tự động của AudioBay (giảm 10% hàng tháng)
            const singleBasePrice = tier.price_month;
            const extraZones = Math.max(0, parsedResult.zones - tier.zones);
            const singleAddonPrice = extraZones * 89000;
            
            // Tính tổng hàng tháng sau giảm giá chuỗi 10%
            parsedResult.basePriceMonthly = charmPrice(Math.round(singleBasePrice * locations * 0.9));
            parsedResult.addonPriceMonthly = extraZones > 0 ? charmPrice(Math.round(singleAddonPrice * locations * 0.9)) : 0;
            parsedResult.packageTier = 'BUSINESS';
          } else {
            // Trường hợp Enterprise / Chuỗi lớn >= 5 địa điểm (Thường là báo giá may đo đặc thù)
            let proposedBase = Number(parsedResult.basePriceMonthly) || 0;
            if (proposedBase <= 0) {
              // Ước lượng giá sàn theo công thức chuỗi của AudioBay: zones x 200k x số chi nhánh, chiết khấu chuỗi lớn
              const basePerBranch = Math.max(269000, parsedResult.zones * 45000);
              proposedBase = basePerBranch * locations;
            }
            parsedResult.basePriceMonthly = charmPrice(proposedBase);
            parsedResult.addonPriceMonthly = 0;
            parsedResult.packageTier = 'ENTERPRISE';
          }

          // Cập nhật danh sách tính năng đồng bộ nếu trống hoặc không khớp
          if (!parsedResult.features || !Array.isArray(parsedResult.features) || parsedResult.features.length === 0) {
            parsedResult.features = tier.features;
          }
        }
      }

      // 3. Đảm bảo tính toán chính xác tuyệt đối không sai số tài chính
      const basePrice = Number(parsedResult.basePriceMonthly) || 0;
      const addonPrice = Number(parsedResult.addonPriceMonthly) || 0;

      parsedResult.basePriceMonthly = basePrice;
      parsedResult.addonPriceMonthly = addonPrice;
      parsedResult.totalPriceMonthly = charmPrice(basePrice + addonPrice);

      // Tính tổng tiền thanh toán theo chu kỳ năm (được giảm 17%)
      // Đảm bảo tổng tiền năm + tiết kiệm năm đúng bằng 12 tháng tổng phí hàng tháng để tránh lệch số liệu
      const rawYearlyWithoutDiscount = parsedResult.totalPriceMonthly * 12;
      parsedResult.totalPriceYearly = charmPrice(Math.round(parsedResult.totalPriceMonthly * 12 * 0.83));
      parsedResult.savingsYearly = charmPrice(Math.max(0, rawYearlyWithoutDiscount - parsedResult.totalPriceYearly));

    } catch (calcError) {
      console.error('Lỗi hiệu chỉnh toán học cho báo giá AI:', calcError);
    }

    res.json(parsedResult);
  } catch (error: any) {
    console.error('Lỗi API Chat:', error);
    res.status(500).json({ error: 'Đã xảy ra lỗi khi xử lý yêu cầu bằng AI.', details: error.message });
  }
});

/**
 * API: Tạo đánh giá khách hàng ngẫu nhiên bằng AI (Không lấy nhãn hàng lớn tránh bản quyền)
 */
app.post('/api/ai/generate-reviews', async (req, res) => {
  try {
    const systemInstruction = `
Bạn là một trợ lý ảo thông minh của AudioBay. Hãy tạo ra đúng 4 đánh giá khách hàng (testimonials/reviews) ngẫu nhiên, tự nhiên và chân thực bằng tiếng Việt cho dịch vụ "AudioBay - Nhạc nền bản quyền cho doanh nghiệp".

YÊU CẦU QUAN TRỌNG VỀ PHÁP LÝ & TRÁNH BẢN QUYỀN THƯƠNG HIỆU:
1. TUYỆT ĐỐI KHÔNG sử dụng tên của các thương hiệu, tập đoàn, chuỗi kinh doanh lớn hay nổi tiếng (Ví dụ: KHÔNG dùng McDonald's, Starbucks, Highlands Coffee, Phúc Long, The Coffee House, CGV, K-Pub, Golden Gate, v.v.).
2. Hãy dùng các tên cửa hàng, mô hình kinh doanh nhỏ, mang tính chất bất kỳ, ngẫu nhiên và tự nhiên (Ví dụ: "Cafe Sách Đông Tây", "Spa Thảo Mộc Hoa Sữa", "Nha khoa Thẩm mỹ Hà Nội", "Khách sạn Boutique Cát Bà", "Phòng Gym Động Lực", "Văn phòng Co-working Green Space", "Boutique Homestay Đà Lạt", "Tiệm bánh ngọt Mật Ong", "Nhà hàng Chay An Lạc", "Salon Tóc Minh Vũ").
3. Tên khách hàng phải là các tên người Việt Nam phổ biến, nghe tự nhiên (Ví dụ: "Nguyễn Văn Nam", "Phạm Thanh Thảo", "Lê Hồng Quân", "Bùi Anh Tuấn", "Nguyễn Thu Trang", "Đặng Minh Triết").
4. Chức danh/mô hình: Phù hợp với mô hình kinh doanh (ví dụ: "Chủ sáng lập", "Quản lý vận hành", "Giám đốc cơ sở").
5. Nội dung phản hồi: Viết khoảng 2-3 câu ngắn gọn, văn văn phong tự nhiên, chân thực, nêu bật trải nghiệm thực tế (ví dụ: danh sách nhạc phong phú, cập nhật liên tục, không bị lỗi tắt nhạc, giúp không gian thêm sang trọng/ấm cúng, dịch vụ chăm sóc khách hàng chu đáo, giải quyết nỗi lo hóa đơn bản quyền phiền phức, v.v.). Mỗi review nên tập trung vào một khía cạnh thực tế khác nhau để tránh trùng lặp ý.
6. Chữ viết tắt Avatar: 2 chữ cái viết tắt của Họ và Tên (Ví dụ: "Nguyễn Minh Tuấn" -> "MT", "Trần Vy" -> "TV").
7. Rating (đánh giá): Số nguyên từ 4 đến 5.

Định dạng trả về: Bạn BẮT BUỘC phải trả về một chuỗi JSON chứa mảng các đánh giá, tuân thủ cấu trúc sau:
[
  {
    "name": "Tên khách hàng",
    "role": "Chức vụ - Tên mô hình kinh doanh",
    "content": "Nội dung đánh giá",
    "avatar": "Chữ viết tắt Avatar (2 chữ)",
    "rating": 5
  },
  ...
]
`;

    let parsedResult;
    try {
      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: 'Hãy tạo ngay 4 đánh giá khách hàng tự nhiên theo đúng yêu cầu dưới dạng JSON thô.',
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: 'application/json',
        },
      });

      const textOutput = response.text || '[]';
      parsedResult = JSON.parse(textOutput.trim());
    } catch (error: any) {
      console.log('Kích hoạt dữ liệu mẫu đánh giá khách hàng AudioBay chất lượng cao (Chế độ tự động offline/local)...');
      parsedResult = [
        {
          "name": "Nguyễn Thanh Sơn",
          "role": "Chủ sở hữu - The Morning Cafe",
          "content": "Từ ngày chuyển sang dùng dịch vụ nhạc nền của AudioBay, tôi không còn phải lo lắng về việc bản quyền âm nhạc nữa. Khách hàng khen danh sách phát của quán rất tinh tế, thư giãn, giúp tăng thời gian lưu trú của khách hàng.",
          "avatar": "TS",
          "rating": 5
        },
        {
          "name": "Phạm Thu Trang",
          "role": "Giám đốc vận hành - Bloom Beauty Spa",
          "content": "Hệ thống quản lý đa phân vùng (multi-zone) rất tiện lợi. Tôi có thể phát nhạc nhẹ nhàng thư giãn ở phòng massage trong khi sảnh chờ vẫn phát nhạc đón khách tươi vui. Đội ngũ kỹ thuật hỗ trợ cực kỳ nhiệt tình!",
          "avatar": "TT",
          "rating": 5
        },
        {
          "name": "Lê Hồng Quân",
          "role": "Quản lý chuỗi - Phoenix Fitness & Gym",
          "content": "Nhạc tập gym của AudioBay cực bốc và tràn đầy năng lượng, giúp khách hàng hào hứng tập luyện hơn hẳn. Việc lên lịch phát tự động theo khung giờ giúp nhân viên của tôi rảnh tay tập trung vào công việc chuyên môn.",
          "avatar": "HQ",
          "rating": 5
        },
        {
          "name": "Đặng Minh Triết",
          "role": "Chủ sáng lập - Horizon Boutique Homestay",
          "content": "Cực kỳ ấn tượng với kho nhạc khổng lồ và giao diện trực quan của AudioBay. Chúng tôi đã cài đặt ứng dụng trên toàn bộ hệ thống 5 cơ sở homestay, âm thanh đồng bộ và vô cùng sang trọng.",
          "avatar": "MT",
          "rating": 5
        }
      ];
    }
    res.json(parsedResult);
  } catch (error: any) {
    console.error('Lỗi API Generate Reviews:', error);
    res.status(500).json({ error: 'Đã xảy ra lỗi khi tạo đánh giá bằng AI.', details: error.message });
  }
});

/**
 * API: Lấy toàn bộ trạng thái cấu hình và dữ liệu từ Store trung tâm trên máy chủ
 */
/**
 * API: Lấy toàn bộ trạng thái cấu hình và dữ liệu từ Store trung tâm trên máy chủ
 */
app.get('/api/store', async (req, res) => {
  const allowedKeys = ['company', 'faqs', 'packages', 'pricing', 'reviews', 'banner', 'quote_requests', 'technicians'];
  const responseStore: Record<string, any> = {};

  if (db) {
    try {
      const querySnapshot = await getDocs(collection(db, 'store'));
      querySnapshot.forEach((docSnap: any) => {
        const key = docSnap.id;
        if (allowedKeys.includes(key)) {
          const docData = docSnap.data();
          if (docData && docData.data !== undefined) {
            let val = docData.data;
            if (key === 'packages') {
              const { migrated, modified } = migratePackages(val);
              val = migrated;
              if (modified) {
                // Save migrated back to Firestore in background
                const docRef = doc(db, 'store', 'packages');
                setDoc(docRef, { data: val }).catch(err => console.error('Error saving migrated packages to firestore:', err));
              }
            }
            responseStore[key] = val;
            memoryStore[key] = val; // Keep in-memory cache synchronized
          }
        }
      });
    } catch (error: any) {
      console.error('Error fetching live store from Firestore:', error.message);
    }
  }

  // Fill in any key that wasn't retrieved from Firestore using local memoryStore
  for (const key of allowedKeys) {
    if (responseStore[key] === undefined) {
      // Migrate local packages if needed
      if (key === 'packages' && memoryStore[key]) {
        const { migrated, modified } = migratePackages(memoryStore[key]);
        memoryStore[key] = migrated;
        if (modified) {
          saveStore(memoryStore);
        }
      }
      responseStore[key] = memoryStore[key];
    }
  }

  res.json(responseStore);
});

/**
 * API: Lưu một cấu hình con cụ thể vào Store trung tâm trên máy chủ để đồng bộ hóa cho mọi thiết bị
 */
app.post('/api/store/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { data } = req.body;

    const allowedKeys = ['company', 'faqs', 'packages', 'pricing', 'reviews', 'banner', 'quote_requests', 'technicians'];
    if (!allowedKeys.includes(key)) {
      return res.status(400).json({ error: 'Mã cấu hình (key) không hợp lệ.' });
    }

    // Update in-memory cache and write local file backup
    memoryStore[key] = data;
    saveStore(memoryStore);

    // Write to Firestore if available
    if (db) {
      try {
        const docRef = doc(db, 'store', key);
        await setDoc(docRef, { data });
        console.log(`Successfully saved key '${key}' to Firestore.`);
      } catch (fireErr: any) {
        console.error(`Failed to save key '${key}' to Firestore:`, fireErr.message);
        // We still return success: true because we have the local in-memory cache & local backup saved
      }
    }

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Lỗi khi lưu dữ liệu lên máy chủ.', details: error.message });
  }
});

// Vite middleware hoặc serve static files
async function setupServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

setupServer();
