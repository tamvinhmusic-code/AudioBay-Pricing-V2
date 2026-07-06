/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Category, Tier, PackageConfig, PackagesAdminData, PackageCardConfig, FeatureRow } from './types';

export const STARTER_F: string[] = [
  "Phát nhạc không giới hạn trong không gian được cấp phép",
  "Giấy phép bản quyền đầy đủ, hồ sơ minh bạch",
  "Không lo Content ID claim trên mạng xã hội",
  "Cập nhật nhạc mới hàng tuần",
  "20.000+ bài nhạc độc quyền AudioBay",
  "Hỗ trợ kỹ thuật trong giờ hành chính",
];

export const BUSINESS_F: string[] = [
  ...STARTER_F,
  "App quản lý nhạc trên iOS & Android",
  "Dashboard web quản lý từ xa",
  "Lập lịch phát nhạc tự động theo khung giờ",
  "Playlist tùy chỉnh theo thương hiệu",
];

export const PROFESSIONAL_F: string[] = [
  ...BUSINESS_F,
  "Quản lý nhiều khu vực âm thanh (multi-zone)",
  "Hỗ trợ kỹ thuật ưu tiên — phản hồi trong 8 giờ",
];

export const ENTERPRISE_F: string[] = [
  ...PROFESSIONAL_F.slice(0, -1),
  "Quản lý nhiều khu vực âm thanh (multi-zone)",
  "Hỗ trợ kỹ thuật 24/7 — phản hồi trong 4 giờ",
  "Account Manager chuyên trách",
  "SLA cam kết uptime 99.9%",
];

export const defaultPackagesAdmin: PackagesAdminData = {
  cards: [
    { id: 'starter', name: 'STARTER', subtitle: 'Hộ cá thể, cửa hàng nhỏ ≤ 50m² (1 zone phát nhạc cơ bản mặc định)', priceDisplay: '149.000', badge: 'PHỔ BIẾN NHẤT', color: '#6ee7b7', ctaText: 'TÍNH GIÁ GÓI NÀY', highlighted: false },
    { id: 'business', name: 'BUSINESS', subtitle: 'Quán vừa, chuỗi cửa hàng, spa (diện tích 80-300m² hoặc ≤10 phòng, hỗ trợ 2-3 zones)', priceDisplay: '449.000', badge: 'KHUYÊN DÙNG', color: '#4ade80', ctaText: 'TÍNH GIÁ GÓI NÀY', highlighted: true },
    { id: 'professional', name: 'PROFESSIONAL', subtitle: 'Không gian cao cấp, trung tâm thể thao, showroom (>300m² hoặc >10 phòng, đa vùng âm thanh)', priceDisplay: '699.000', badge: '', color: '#818cf8', ctaText: 'TÍNH GIÁ GÓI NÀY', highlighted: false },
    { id: 'enterprise', name: 'ENTERPRISE', subtitle: 'Resort, khách sạn, đại siêu thị (quy mô lớn đặc thù, hỗ trợ AM riêng và cam kết SLA)', priceDisplay: 'LIÊN HỆ', badge: '', color: '#f59e0b', ctaText: 'YÊU CẦU TƯ VẤN RIÊNG', highlighted: false },
  ],
  features: [
    { id: '1', content: 'Phát nhạc không giới hạn trong không gian được cấp phép', tierFrom: 'starter', order: 1 },
    { id: '2', content: 'Giấy phép bản quyền đầy đủ, hồ sơ minh bạch', tierFrom: 'starter', order: 2 },
    { id: '3', content: 'Không lo Content ID claim trên mạng xã hội', tierFrom: 'starter', order: 3 },
    { id: '4', content: 'Cập nhật nhạc mới hàng tuần', tierFrom: 'starter', order: 4 },
    { id: '5', content: '20.000+ bài nhạc độc quyền AudioBay', tierFrom: 'starter', order: 5 },
    { id: '6', content: 'Hỗ trợ kỹ thuật trong giờ hành chính', tierFrom: 'starter', order: 6 },
    { id: '7', content: 'App quản lý nhạc trên iOS & Android', tierFrom: 'business', order: 7 },
    { id: '8', content: 'Dashboard web quản lý từ xa', tierFrom: 'business', order: 8 },
    { id: '9', content: 'Lập lịch phát nhạc tự động theo khung giờ', tierFrom: 'business', order: 9 },
    { id: '10', content: 'Playlist tùy chỉnh theo thương hiệu', tierFrom: 'business', order: 10 },
    { id: '11', content: 'Quản lý nhiều khu vực âm thanh (multi-zone)', tierFrom: 'professional', order: 11 },
    { id: '12', content: 'Hỗ trợ kỹ thuật ưu tiên — phản hồi trong 8 giờ', tierFrom: 'professional', order: 12 },
    { id: '13', content: 'Hỗ trợ kỹ thuật 24/7 — phản hồi trong 4 giờ', tierFrom: 'enterprise', order: 13 },
    { id: '14', content: 'Account Manager chuyên trách', tierFrom: 'enterprise', order: 14 },
    { id: '15', content: 'SLA cam kết uptime 99.9%', tierFrom: 'enterprise', order: 15 },
  ]
};

export const defaultPackages: PackageConfig[] = [
  {
    id: 'starter',
    badge: 'PHỔ BIẾN NHẤT',
    name: 'STARTER',
    subtitle: 'Hộ cá thể, cửa hàng nhỏ ≤ 50m² (1 zone phát nhạc cơ bản mặc định)',
    priceMonthly: 149000,
    features: [...STARTER_F],
    ctaText: 'TÍNH GIÁ GÓI NÀY',
    highlighted: false
  },
  {
    id: 'business',
    badge: 'KHUYÊN DÙNG',
    name: 'BUSINESS',
    subtitle: 'Quán vừa, chuỗi cửa hàng, spa (diện tích 80-300m² hoặc ≤10 phòng, hỗ trợ 2-3 zones)',
    priceMonthly: 449000,
    features: [...BUSINESS_F],
    ctaText: 'TÍNH GIÁ GÓI NÀY',
    highlighted: true
  },
  {
    id: 'professional',
    name: 'PROFESSIONAL',
    subtitle: 'Không gian cao cấp, trung tâm thể thao, showroom (>300m² hoặc >10 phòng, đa vùng âm thanh)',
    priceMonthly: 699000,
    features: [...PROFESSIONAL_F],
    ctaText: 'TÍNH GIÁ GÓI NÀY',
    highlighted: false
  },
  {
    id: 'enterprise',
    name: 'ENTERPRISE',
    subtitle: 'Resort, khách sạn, đại siêu thị (quy mô lớn đặc thù, hỗ trợ AM riêng và cam kết SLA)',
    priceMonthly: null,
    features: [...ENTERPRISE_F],
    ctaText: 'YÊU CẦU TƯ VẤN RIÊNG',
    highlighted: false
  }
];


export const CATEGORIES: Category[] = [
  {
    id: 'cafe',
    name: 'Cà phê & Trà sữa',
    icon: '☕',
    inputType: 'area',
    tiers: [
      {
        id: 'cafe-mini',
        name: 'Mini / Take-away',
        area: '≤ 50 m²',
        areaMax: 50,
        zones: 1,
        price_month: 149000,
        notes: 'Phù hợp quán nhỏ, take-away, kiosk',
        features: STARTER_F,
      },
      {
        id: 'cafe-small',
        name: 'Cà phê nhỏ',
        area: '50 – 80 m²',
        areaMin: 50,
        areaMax: 80,
        zones: 1,
        price_month: 269000,
        notes: 'Quán cà phê dưới 20 chỗ ngồi',
        features: STARTER_F,
      },
      {
        id: 'cafe-medium',
        name: 'Cà phê vừa',
        area: '80 – 150 m²',
        areaMin: 80,
        areaMax: 150,
        zones: 2,
        price_month: 449000,
        notes: '20–50 chỗ ngồi, có khu vực riêng biệt',
        features: BUSINESS_F,
      },
      {
        id: 'cafe-large',
        name: 'Cà phê lớn',
        area: '> 150 m²',
        areaMin: 150,
        zones: 3,
        price_month: 619000,
        notes: 'Trên 50 chỗ, nhiều khu vực, có thể nhiều tầng',
        features: BUSINESS_F,
      },
    ]
  },
  {
    id: 'restaurant',
    name: 'Nhà hàng',
    icon: '🍜',
    inputType: 'area',
    tiers: [
      {
        id: 'rest-small',
        name: 'Nhà hàng nhỏ',
        area: '≤ 100 m²',
        areaMax: 100,
        zones: 2,
        price_month: 449000,
        notes: 'Nhà hàng dưới 40 chỗ ngồi',
        features: BUSINESS_F,
      },
      {
        id: 'rest-medium',
        name: 'Nhà hàng vừa',
        area: '100 – 300 m²',
        areaMin: 100,
        areaMax: 300,
        zones: 3,
        price_month: 619000,
        notes: '40–100 chỗ ngồi, có phòng VIP',
        features: BUSINESS_F,
      },
      {
        id: 'rest-large',
        name: 'Nhà hàng lớn',
        area: '300 – 600 m²',
        areaMin: 300,
        areaMax: 600,
        zones: 4,
        price_month: 889000,
        notes: 'Trên 100 chỗ, nhiều khu vực riêng',
        features: PROFESSIONAL_F,
      },
      {
        id: 'rest-premium',
        name: 'Nhà hàng cao cấp',
        area: '> 600 m²',
        areaMin: 600,
        zones: 6,
        price_month: 1339000,
        notes: 'Nhà hàng fine dining, sức chứa lớn',
        features: PROFESSIONAL_F,
      },
    ]
  },
  {
    id: 'spa',
    name: 'Spa & Massage',
    icon: '💆',
    inputType: 'area',
    tiers: [
      {
        id: 'spa-mini',
        name: 'Spa nhỏ',
        area: '≤ 50 m²',
        areaMax: 50,
        zones: 1,
        price_month: 269000,
        notes: 'Massage nhỏ, 1–3 phòng trị liệu',
        features: STARTER_F,
      },
      {
        id: 'spa-small',
        name: 'Spa vừa',
        area: '50 – 150 m²',
        areaMin: 50,
        areaMax: 150,
        zones: 2,
        price_month: 449000,
        notes: '3–6 phòng trị liệu, có reception',
        features: BUSINESS_F,
      },
      {
        id: 'spa-medium',
        name: 'Spa lớn',
        area: '150 – 400 m²',
        areaMin: 150,
        areaMax: 400,
        zones: 4,
        price_month: 799000,
        notes: '6+ phòng, phòng xông hơi, hồ ngâm',
        features: PROFESSIONAL_F,
      },
      {
        id: 'spa-premium',
        name: 'Wellness / Cao cấp',
        area: '> 400 m²',
        areaMin: 400,
        zones: 8,
        price_month: 1339000,
        notes: 'Spa resort, wellness center, nhiều khu vực',
        features: PROFESSIONAL_F,
      },
    ]
  },
  {
    id: 'beauty',
    name: 'Beauty & Làm đẹp',
    icon: '💅',
    inputType: 'area',
    tiers: [
      {
        id: 'beauty-mini',
        name: 'Nail / Tóc nhỏ',
        area: '≤ 30 m²',
        areaMax: 30,
        zones: 1,
        price_month: 149000,
        notes: 'Tiệm nail, tóc quy mô nhỏ',
        features: STARTER_F,
      },
      {
        id: 'beauty-small',
        name: 'Tiệm làm đẹp',
        area: '30 – 80 m²',
        areaMin: 30,
        areaMax: 80,
        zones: 1,
        price_month: 269000,
        notes: 'Tiệm tóc, nail vừa, có 2–4 nhân viên',
        features: STARTER_F,
      },
      {
        id: 'beauty-medium',
        name: 'Trung tâm làm đẹp',
        area: '80 – 200 m²',
        areaMin: 80,
        areaMax: 200,
        zones: 2,
        price_month: 449000,
        notes: 'Salon tóc, nail bar có nhiều dịch vụ',
        features: BUSINESS_F,
      },
      {
        id: 'beauty-premium',
        name: 'Beauty Studio',
        area: '> 200 m²',
        areaMin: 200,
        zones: 3,
        price_month: 699000,
        notes: 'Studio cao cấp, PMU, thẩm mỹ viện',
        features: PROFESSIONAL_F,
      },
    ]
  },
  {
    id: 'fitness',
    name: 'Fitness & Gym',
    icon: '🏋️',
    inputType: 'area',
    tiers: [
      {
        id: 'fit-studio',
        name: 'Yoga / Pilates Studio',
        area: '≤ 100 m²',
        areaMax: 100,
        zones: 2,
        price_month: 449000,
        notes: 'Studio nhỏ, 1 phòng tập chính',
        features: BUSINESS_F,
      },
      {
        id: 'fit-small',
        name: 'Gym nhỏ',
        area: '100 – 300 m²',
        areaMin: 100,
        areaMax: 300,
        zones: 3,
        price_month: 699000,
        notes: 'Phòng tập có cardio, tạ, phòng thay đồ',
        features: PROFESSIONAL_F,
      },
      {
        id: 'fit-large',
        name: 'Gym lớn',
        area: '300 – 800 m²',
        areaMin: 300,
        areaMax: 800,
        zones: 5,
        price_month: 1159000,
        notes: 'Gym đa năng, nhiều khu vực tập khác nhau',
        features: PROFESSIONAL_F,
      },
      {
        id: 'fit-complex',
        name: 'Sports Complex',
        area: '> 800 m²',
        areaMin: 800,
        zones: 8,
        price_month: null,
        notes: 'Trung tâm thể thao lớn, nhiều môn',
        features: ENTERPRISE_F,
        contactOnly: true,
      },
    ]
  },
  {
    id: 'healthcare',
    name: 'Y tế & Nha khoa',
    icon: '🏥',
    inputType: 'area',
    tiers: [
      {
        id: 'health-small',
        name: 'Phòng khám / Nha khoa nhỏ',
        area: '≤ 100 m²',
        areaMax: 100,
        zones: 1,
        price_month: 269000,
        notes: 'Phòng khám tư, nha khoa 1–3 ghế',
        features: STARTER_F,
      },
      {
        id: 'health-medium',
        name: 'Phòng khám vừa',
        area: '100 – 300 m²',
        areaMin: 100,
        areaMax: 300,
        zones: 3,
        price_month: 439000,
        notes: 'Đa khoa nhỏ, phòng chờ + nhiều phòng khám',
        features: BUSINESS_F,
      },
      {
        id: 'health-large',
        name: 'Đa khoa / Bệnh viện',
        area: '> 300 m²',
        areaMin: 300,
        zones: 5,
        price_month: null,
        notes: 'Bệnh viện, phòng khám đa khoa lớn',
        features: ENTERPRISE_F,
        contactOnly: true,
      },
    ]
  },
  {
    id: 'retail',
    name: 'Bán lẻ & Cửa hàng',
    icon: '🛍️',
    inputType: 'area',
    tiers: [
      {
        id: 'retail-small',
        name: 'Cửa hàng nhỏ',
        area: '≤ 80 m²',
        areaMax: 80,
        zones: 1,
        price_month: 269000,
        notes: 'Shop thời trang, cửa hàng tạp hóa nhỏ',
        features: STARTER_F,
      },
      {
        id: 'retail-medium',
        name: 'Cửa hàng vừa',
        area: '80 – 200 m²',
        areaMin: 80,
        areaMax: 200,
        zones: 2,
        price_month: 449000,
        notes: 'Cửa hàng 2 tầng, boutique, concept store',
        features: BUSINESS_F,
      },
      {
        id: 'retail-large',
        name: 'Cửa hàng lớn',
        area: '200 – 500 m²',
        areaMin: 200,
        areaMax: 500,
        zones: 3,
        price_month: 699000,
        notes: 'Chuỗi cửa hàng, flagship store',
        features: PROFESSIONAL_F,
      },
      {
        id: 'retail-supermarket',
        name: 'Siêu thị mini',
        area: '> 500 m²',
        areaMin: 500,
        zones: 5,
        price_month: 1159000,
        notes: 'Siêu thị mini, cửa hàng tiện lợi lớn',
        features: PROFESSIONAL_F,
      },
    ]
  },
  {
    id: 'showroom',
    name: 'Showroom & Gallery',
    icon: '🖼️',
    inputType: 'area',
    tiers: [
      {
        id: 'show-small',
        name: 'Showroom nhỏ',
        area: '≤ 150 m²',
        areaMax: 150,
        zones: 2,
        price_month: 449000,
        notes: 'Showroom xe, nội thất, gallery nhỏ',
        features: BUSINESS_F,
      },
      {
        id: 'show-medium',
        name: 'Showroom vừa',
        area: '150 – 500 m²',
        areaMin: 150,
        areaMax: 500,
        zones: 3,
        price_month: 699000,
        notes: 'Showroom thương hiệu, triển lãm vừa',
        features: PROFESSIONAL_F,
      },
      {
        id: 'show-large',
        name: 'Showroom lớn',
        area: '> 500 m²',
        areaMin: 500,
        zones: 5,
        price_month: 1159000,
        notes: 'Trung tâm triển lãm, showroom cao cấp',
        features: PROFESSIONAL_F,
      },
      {
        id: 'show-luxury',
        name: 'Luxury Showroom',
        area: '> 1.000 m²',
        areaMin: 1000,
        zones: 8,
        price_month: null,
        notes: 'Showroom cao cấp quy mô lớn',
        features: ENTERPRISE_F,
        contactOnly: true,
      },
    ]
  },
  {
    id: 'office',
    name: 'Văn phòng & Coworking',
    icon: '🏢',
    inputType: 'area',
    tiers: [
      {
        id: 'off-small',
        name: 'Văn phòng nhỏ',
        area: '≤ 100 m²',
        areaMax: 100,
        zones: 1,
        price_month: 269000,
        notes: 'Văn phòng dưới 20 nhân viên',
        features: STARTER_F,
      },
      {
        id: 'off-medium',
        name: 'Văn phòng vừa',
        area: '100 – 300 m²',
        areaMin: 100,
        areaMax: 300,
        zones: 2,
        price_month: 439000,
        notes: '20–80 nhân viên, có reception và meeting room',
        features: BUSINESS_F,
      },
      {
        id: 'off-large',
        name: 'Văn phòng lớn',
        area: '300 – 1.000 m²',
        areaMin: 300,
        areaMax: 1000,
        zones: 3,
        price_month: 699000,
        notes: 'Văn phòng đa khu vực, nhiều tầng',
        features: PROFESSIONAL_F,
      },
      {
        id: 'off-coworking',
        name: 'Coworking Space',
        area: 'Tùy quy mô',
        zones: 3,
        price_month: 619000,
        notes: 'Không gian làm việc chung, cafe & work',
        features: PROFESSIONAL_F,
        isFlexible: true,
      },
    ]
  },
  {
    id: 'events',
    name: 'Sự kiện & Studio',
    icon: '🎪',
    inputType: 'area',
    tiers: [
      {
        id: 'evt-studio',
        name: 'Photo / Video Studio',
        area: '≤ 200 m²',
        areaMax: 200,
        zones: 2,
        price_month: 439000,
        notes: 'Studio chụp ảnh, quay phim',
        features: BUSINESS_F,
      },
      {
        id: 'evt-small',
        name: 'Event Venue nhỏ',
        area: '≤ 300 m²',
        areaMax: 300,
        zones: 3,
        price_month: 619000,
        notes: 'Không gian tổ chức sự kiện nhỏ',
        features: BUSINESS_F,
      },
      {
        id: 'evt-large',
        name: 'Event Venue lớn',
        area: '> 300 m²',
        areaMin: 300,
        zones: 5,
        price_month: 1159000,
        notes: 'Hội trường, trung tâm sự kiện',
        features: PROFESSIONAL_F,
      },
      {
        id: 'evt-convention',
        name: 'Convention / Ballroom',
        area: '> 1.000 m²',
        areaMin: 1000,
        zones: 8,
        price_month: null,
        notes: 'Trung tâm hội nghị, ballroom khách sạn',
        features: ENTERPRISE_F,
        contactOnly: true,
      },
    ]
  },
  {
    id: 'hotel',
    name: 'Khách sạn & Resort',
    icon: '🏨',
    inputType: 'rooms',
    inputLabel: 'Số phòng',
    tiers: [
      {
        id: 'hotel-1star',
        name: 'Khách sạn 1–2 sao',
        area: '≤ 30 phòng',
        roomsMax: 30,
        zones: 4,
        price_month: 1339000,
        notes: 'Mini hotel, nhà nghỉ có đầu tư',
        features: PROFESSIONAL_F,
      },
      {
        id: 'hotel-3star',
        name: 'Khách sạn 3 sao',
        area: '30 – 80 phòng',
        roomsMin: 30,
        roomsMax: 80,
        zones: 8,
        price_month: 2239000,
        notes: 'Khách sạn tiêu chuẩn, có nhà hàng',
        features: PROFESSIONAL_F,
      },
      {
        id: 'hotel-4star',
        name: 'Khách sạn 4 sao',
        area: '80 – 200 phòng',
        roomsMin: 80,
        roomsMax: 200,
        zones: 15,
        price_month: 3589000,
        notes: 'Khách sạn cao cấp, đầy đủ tiện ích',
        features: ENTERPRISE_F,
      },
      {
        id: 'hotel-5star',
        name: 'Khách sạn 5 sao / Resort',
        area: '> 200 phòng',
        roomsMin: 200,
        zones: 20,
        price_month: null,
        notes: 'Resort, khách sạn 5 sao, khu nghỉ dưỡng',
        features: ENTERPRISE_F,
        contactOnly: true,
      },
    ]
  },
  {
    id: 'chain',
    name: 'Chuỗi & Enterprise',
    icon: '🏗️',
    inputType: 'area', // default type, can change depending on sub-category selected
    isChain: true,
    description: 'Dành cho doanh nghiệp có từ 2 địa điểm trở lên. Chọn loại hình địa điểm và nhập số lượng để nhận báo giá tổng.',
    tiers: [],
  },
];

export const ZONE_ADDON = {
  price_month: 89000,
  price_year: 889000,
};

export const DISCOUNT_CONFIG = {
  yearly: 0.17,
  chain: {
    auto: {
      min: 2,
      max: 4,
      monthly: 0.10,
      yearly: 0.18,
    },
    contact: {
      threshold: 101,
    },
  },
};

export const COMPANY = {
  name: 'AudioBay',
  email: 'label@audiobay.net',
  phone: '0969 224 334',
  website: 'audiobay.vn',
  address: 'Việt Nam',
};

export const INTERNAL_GUIDE = {
  enterprisePricing: [
    { type: 'Khách sạn 5★ / Resort', floor: 5000000, target: '6.000.000 – 10.000.000', note: 'Tùy số zones thực tế' },
    { type: 'Bệnh viện / Đa khoa lớn', floor: 2000000, target: '3.000.000 – 5.000.000', note: '' },
    { type: 'Sports Complex', floor: 2000000, target: '2.500.000 – 4.000.000', note: '' },
    { type: 'Shopping Mall / TTTM', floor: 5000000, target: '8.000.000 – 15.000.000', note: 'Hoặc bán per-tenant' },
    { type: 'Convention / Ballroom lớn', floor: 2500000, target: '3.500.000 – 6.000.000', note: '' },
    { type: 'Luxury Showroom (>1.000m²)', floor: 1500000, target: '2.000.000 – 3.500.000', note: '' },
  ],
  chainDiscounts: [
    { range: '2 – 4 địa điểm', monthly: '10%', yearly: '18%', compound: '32%', note: 'Tự động trên app' },
    { range: '5 – 9 địa điểm', monthly: '16%', yearly: '25%', compound: '38%', note: 'Salesperson xác nhận' },
    { range: '10 – 19 địa điểm', monthly: '21%', yearly: '31%', compound: '43%', note: 'Trưởng phòng Sales duyệt' },
    { range: '20 – 49 địa điểm', monthly: '25%', yearly: '35%', compound: '46%', note: 'Giám đốc KD ký hợp đồng' },
    { range: '50+ địa điểm', monthly: '28%', yearly: '38%', compound: '49%', note: 'CEO/Director level' },
  ],
  contractBonus: [
    { duration: '1 năm', bonus: '0% (đã tính trong yearly)' },
    { duration: '2 năm', bonus: 'Thêm 5% (tổng ~22%)' },
    { duration: '3 năm', bonus: 'Thêm 8% (tổng ~25%)' },
  ],
  addons: [
    { service: 'Curation playlist theo thương hiệu', price: '2.000.000 – 5.000.000 (one-time)' },
    { service: 'Dedicated Account Manager', price: '+500.000đ/tháng' },
    { service: 'SLA ưu tiên phản hồi < 4h', price: '+300.000đ/tháng' },
    { service: 'Onboarding & training (2 giờ)', price: '1.000.000đ (one-time)' },
  ],
  formula: 'Số zones thực tế × 200.000 = giá sàn/tháng. Không báo thấp hơn giá sàn.',
  salesScript: 'Khi khách hỏi Enterprise: "Địa điểm anh/chị có khoảng bao nhiêu khu vực phát nhạc riêng biệt? (lobby, nhà hàng, spa…) Để tôi tính giá chính xác nhất."',
};

export const INITIAL_FAQS = [
  {
    q: 'AudioBay có giấy phép bản quyền không?',
    a: 'Có. AudioBay sở hữu hoặc được cấp phép toàn bộ 20.000+ bài nhạc trong thư viện. Khi doanh nghiệp sử dụng dịch vụ, chúng tôi cấp Giấy phép Sử dụng Nhạc kèm theo hợp đồng.'
  },
  {
    q: 'Tôi có thể dùng thử trước khi mua không?',
    a: 'Có. AudioBay cung cấp 14 ngày dùng thử miễn phí, không cần thẻ tín dụng. Liên hệ label@audiobay.net để được kích hoạt.'
  },
  {
    q: 'Zone âm thanh là gì?',
    a: 'Mỗi zone là một khu vực phát nhạc độc lập trong địa điểm của bạn. Ví dụ: một cửa hàng có khu trưng bày và khu thanh toán cần 2 zones để phát nhạc khác nhau.'
  },
  {
    q: 'Tôi có thể thay đổi gói sau khi đã đăng ký không?',
    a: 'Hoàn toàn có thể. Bạn có thể nâng cấp gói bất kỳ lúc nào. Khi nâng cấp, phần chênh lệch sẽ được tính theo ngày sử dụng thực tế.'
  },
  {
    q: 'Hình thức thanh toán nào được chấp nhận?',
    a: 'AudioBay chấp nhận chuyển khoản ngân hàng, thẻ tín dụng/ghi nợ, và thanh toán qua ví điện tử (MoMo, ZaloPay). Hóa đơn VAT được xuất theo yêu cầu.'
  },
  {
    q: 'Tôi có thể tùy chỉnh danh sách nhạc không?',
    a: 'Gói Business trở lên cho phép tạo playlist tùy chỉnh theo thương hiệu. Gói Professional và Enterprise còn có dịch vụ curation nhạc chuyên nghiệp.'
  },
  {
    q: 'Nếu internet bị ngắt, nhạc có tiếp tục phát không?',
    a: 'Ứng dụng AudioBay hỗ trợ offline mode — nhạc được tải sẵn để phát liên tục kể cả khi mất kết nối tạm thời. Dữ liệu sẽ đồng bộ lại khi có mạng.'
  },
  {
    q: 'Doanh nghiệp có nhiều chi nhánh thì đăng ký như thế nào?',
    a: 'Bạn đăng ký theo số lượng địa điểm và nhận chiết khấu tự động từ 2 địa điểm trở lên. Từ 5 địa điểm, liên hệ label@audiobay.net để nhận báo giá đặc biệt.'
  },
];

export const INITIAL_TESTIMONIALS = [
  {
    name: 'Nguyễn Minh Trang',
    role: "Quản lý — McDonald's Việt Nam",
    content: 'AudioBay giúp chúng tôi quản lý nhạc đồng bộ cho toàn chuỗi mà không lo vấn đề bản quyền. Đội ngũ hỗ trợ rất chuyên nghiệp.',
    rating: 5,
  },
  {
    name: 'Hoàng Thùy Tiên',
    role: 'Giám đốc — Oriental Retreat Spa',
    content: 'Chúng tôi cần nhạc khác nhau cho reception, phòng trị liệu và khu xông hơi. AudioBay quản lý tất cả trong một dashboard duy nhất.',
    rating: 5,
  },
  {
    name: 'Cao Huy',
    role: 'Chủ — Atelier Café 68',
    content: 'Trước đây tôi lo ngại về bản quyền nhạc. Từ khi dùng AudioBay, tôi hoàn toàn yên tâm và nhạc cũng hay hơn hẳn nhạc Youtube.',
    rating: 5,
  },
  {
    name: 'Nguyễn Quang Huy',
    role: 'Manager — An Hội An Cà Phê',
    content: 'Tính năng lập lịch nhạc theo khung giờ rất tiện. Buổi sáng nhạc nhẹ nhàng, buổi chiều sôi động hơn — tự động hoàn toàn.',
    rating: 5,
  },
];
