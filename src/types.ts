/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Tier {
  id: string;
  name: string;
  area: string;
  areaMin?: number;
  areaMax?: number;
  roomsMin?: number;
  roomsMax?: number;
  zones: number;
  price_month: number | null;  // null = contactOnly
  notes: string;
  features: string[];
  contactOnly?: boolean;
  isFlexible?: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  inputType: 'area' | 'rooms';
  inputLabel?: string;
  description?: string;
  isChain?: boolean;
  tiers: Tier[];
}

export interface CustomerInfo {
  name: string;
  company: string;
  phone: string;
  email: string;
  notes: string;
}

export interface CompanyInfo {
  name: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  slogan?: string;
  tagline?: string;
  librarySize?: string;
}

export interface QuoteParams {
  category: Category;
  tier: Tier;
  inputValue: number;
  extraZones: number;
  branches: number;
  paymentCycle: 'monthly' | 'yearly';
  chainDiscount: number;
  basePrice: number;
  zoneAddon: number;
  totalAmount: number;
  saving: number;
  originalTotalAmount?: number; // Giá gốc trước mọi chiết khấu
  customerInfo: CustomerInfo;
  quoteDate: string; // ISO String or formatted string for easy serialization
  validUntil: string;
  company?: CompanyInfo;
  contractBonusPercent?: number;
  contractDuration?: string;
  selectedAddons?: Array<{ service: string; price: number; isMonthly: boolean }>;
  isInternalSales?: boolean;
  technicalFloorPrice?: number;
}

export interface PackageConfig {
  id: string;           // 'starter' | 'business' | 'professional' | 'enterprise'
  badge?: string;       // "PHỔ BIẾN NHẤT" | "KHUYÊN DÙNG" | undefined
  name: string;         // "STARTER"
  subtitle: string;     // "Phù hợp với hộ kinh doanh cá thể..."
  priceMonthly: number | null;  // null = hiển thị "LIÊN HỆ"
  features: string[];   // danh sách tính năng
  ctaText: string;      // "TÍNH GIÁ GÓI NÀY" hoặc "YÊU CẦU TƯ VẤN RIÊNG"
  highlighted: boolean; // có viền nổi bật không
}

export interface PackageCardConfig {
  id: 'starter' | 'business' | 'professional' | 'enterprise';
  name: string;           // "STARTER"
  subtitle: string;       // "Phù hợp với hộ kinh doanh cá thể..."
  priceDisplay: string;   // "199.000" hoặc "LIÊN HỆ"
  badge: string;          // "PHỔ BIẾN NHẤT" | "KHUYÊN DÙNG" | ""
  color: string;          // mã màu hex, VD: "#4ade80"
  ctaText: string;        // "TÍNH GIÁ GÓI NÀY" | "YÊU CẦU TƯ VẤN RIÊNG"
  highlighted: boolean;   // có viền nổi bật không
}

export interface FeatureRow {
  id: string;             // uuid hoặc timestamp
  content: string;        // "Phát nhạc không giới hạn trong không gian được cấp phép"
  tierFrom: 'starter' | 'business' | 'professional' | 'enterprise';
  order: number;          // thứ tự hiển thị
  hidden?: boolean;       // trạng thái ẩn hoặc hiển thị dòng nội dung
}

export interface PackagesAdminData {
  cards: PackageCardConfig[];
  features: FeatureRow[];
}

export interface AttachedFile {
  name: string;
  mimeType: string;
  size: number;
  data: string; // Base64 string
}

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  files?: AttachedFile[];
  quoteResult?: {
    modelName: string;
    matchedCategoryName: string;
    locationsCount?: number;
    inputValue: number;
    inputLabel: string;
    zones: number;
    basePriceMonthly: number;
    addonPriceMonthly: number;
    totalPriceMonthly: number;
    totalPriceYearly: number;
    savingsYearly: number;
    packageTier: string;
    features: string[];
    analysisText: string;
  };
}

export interface AICustomQuoteParams {
  modelName: string;
  matchedCategoryName: string;
  locationsCount?: number;
  inputValue: number;
  inputLabel: string;
  zones: number;
  basePriceMonthly: number;
  addonPriceMonthly: number;
  totalPriceMonthly: number;
  totalPriceYearly: number;
  savingsYearly: number;
  packageTier: string;
  features: string[];
  analysisText: string;
  customerInfo: CustomerInfo;
  quoteDate: string;
  validUntil: string;
  company?: any;
}

export interface QuoteRequest {
  id: string;
  customerInfo: CustomerInfo;
  createdAt: string;
  status: 'new' | 'processed' | 'declined';
  categoryId: string;
  categoryName: string;
  inputValue: number;
  inputLabel: string;
  branches: number;
  paymentCycle: 'monthly' | 'yearly';
  zones: number;
  estimatedPriceMonthly: number;
  estimatedPriceYearly: number;
  customPriceMonthly?: number;
  customPriceYearly?: number;
  adminNotes?: string;
}export interface Technician {
  id: string;
  email: string;
  fullName: string;
  role: 'tech_admin' | 'tech_operator' | 'support_tech';
  passkey: string;
  createdAt: string;
  lastUsedAt?: string;
  status: 'active' | 'suspended';
}
