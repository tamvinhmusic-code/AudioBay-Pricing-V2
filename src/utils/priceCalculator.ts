/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Category, Tier, FeatureRow } from '../types';
import { ZONE_ADDON, DISCOUNT_CONFIG } from '../initialData';

/**
 * Tự động chọn tier phù hợp dựa vào diện tích hoặc số phòng
 */
export function autoSelectTier(category: Category, inputValue: number): Tier {
  if (category.tiers.length === 0) {
    throw new Error('Category has no tiers');
  }

  let found: Tier;
  if (category.inputType === 'area') {
    // Tìm tier thỏa mãn diện tích
    const match = category.tiers.find(t => {
      const hasMin = typeof t.areaMin === 'number';
      const hasMax = typeof t.areaMax === 'number';
      
      if (hasMin && hasMax) {
        return inputValue >= t.areaMin! && inputValue < t.areaMax!;
      } else if (hasMin) {
        return inputValue >= t.areaMin!;
      } else if (hasMax) {
        return inputValue <= t.areaMax!;
      }
      return false;
    });
    
    found = match || category.tiers[category.tiers.length - 1];
  } else {
    // inputType === 'rooms'
    const match = category.tiers.find(t => {
      const hasMin = typeof t.roomsMin === 'number';
      const hasMax = typeof t.roomsMax === 'number';
      
      if (hasMin && hasMax) {
        return inputValue >= t.roomsMin! && inputValue < t.roomsMax!;
      } else if (hasMin) {
        return inputValue >= t.roomsMin!;
      } else if (hasMax) {
        return inputValue <= t.roomsMax!;
      }
      return false;
    });
    
    found = match || category.tiers[category.tiers.length - 1];
  }

  // TỐI ƯU HÓA LOGIC ZONE CHO KHÔNG GIAN SIÊU NHỎ
  // Nếu là lĩnh vực tính theo diện tích và diện tích thực tế nhập vào <= 40m2,
  // thì số vùng âm thanh (zones) cơ sở mặc định tự động giới hạn ở mức 1 zone,
  // và đơn giá hàng tháng tự động được khấu trừ phần chênh lệch zone không sử dụng (giảm 99,000 VNĐ).
  if (category.inputType === 'area' && inputValue <= 40 && found.zones > 1) {
    return {
      ...found,
      zones: 1,
      price_month: found.price_month ? Math.max(150000, found.price_month - 99000) : null
    };
  }

  return found;
}

export interface CalculationResult {
  basePrice: number;
  zoneAddon: number;
  pricePerLocation: number;
  chainDiscountPercent: number; // e.g. 0.10 for 10%
  totalAmount: number;
  saving: number;
  originalTotalAmount: number; // Giá gốc trước mọi chiết khấu (để làm mỏ neo tâm lý)
  contactOnly: boolean;
}

export function charmPrice(p: number): number {
  if (p <= 0) return 0;
  if (p < 10000) return p;
  const base = Math.floor(p / 10000) * 10000 + 9000;
  return base <= p ? base : base - 10000;
}

/**
 * Tính toán báo giá chi tiết
 */
export function calculatePrice(params: {
  category: Category;
  tier: Tier;
  inputValue: number;
  extraZones: number;
  branches: number;
  paymentCycle: 'monthly' | 'yearly';
  isInternal?: boolean;
  customBasePrice?: number;
}): CalculationResult {
  const { tier, extraZones, branches, paymentCycle, isInternal = false, customBasePrice } = params;

  // Nếu gói thuộc diện liên hệ trực tiếp
  if ((tier.price_month === null || tier.contactOnly) && !isInternal) {
    return {
      basePrice: 0,
      zoneAddon: 0,
      pricePerLocation: 0,
      chainDiscountPercent: 0,
      totalAmount: 0,
      saving: 0,
      originalTotalAmount: 0,
      contactOnly: true,
    };
  }

  // Nếu số địa điểm từ 5 trở lên thì chuyển sang liên hệ trực tiếp (theo DISCOUNT_CONFIG.chain.contact)
  if (branches >= DISCOUNT_CONFIG.chain.contact.threshold && !isInternal) {
    return {
      basePrice: 0,
      zoneAddon: 0,
      pricePerLocation: 0,
      chainDiscountPercent: 0,
      totalAmount: 0,
      saving: 0,
      originalTotalAmount: 0,
      contactOnly: true,
    };
  }

  const basePrice = typeof customBasePrice === 'number' ? customBasePrice : (tier.price_month || 0);
  
  // Xác định chiết khấu chuỗi dựa trên số chi nhánh và chu kỳ thanh toán (Mô hình Phi tuyến tính Tối ưu)
  let chainDiscountPercent = 0;
  if (branches >= 2) {
    if (branches <= 4) {
      chainDiscountPercent = paymentCycle === 'monthly' ? 0.10 : 0.18;
    } else if (branches <= 9) {
      chainDiscountPercent = paymentCycle === 'monthly' ? 0.16 : 0.25;
    } else if (branches <= 19) {
      chainDiscountPercent = paymentCycle === 'monthly' ? 0.21 : 0.31;
    } else if (branches <= 49) {
      chainDiscountPercent = paymentCycle === 'monthly' ? 0.25 : 0.35;
    } else {
      chainDiscountPercent = paymentCycle === 'monthly' ? 0.28 : 0.38;
    }
  }

  let totalAmount = 0;
  let saving = 0;
  let zoneAddon = 0;
  let pricePerLocation = 0;

  const rawUnitPrice = Math.max(100000, basePrice + (extraZones * ZONE_ADDON.price_month));
  const originalTotalAmount = paymentCycle === 'monthly' ? rawUnitPrice * branches : rawUnitPrice * branches * 12;

  if (paymentCycle === 'monthly') {
    // Giá addon zone hàng tháng (hỗ trợ cả âm để chiết khấu khấu trừ zone không sử dụng)
    zoneAddon = extraZones !== 0 ? Math.round(extraZones * ZONE_ADDON.price_month) : 0;
    // Đảm bảo đơn giá cơ sở sau giảm trừ không xuống dưới mức giá trị tối thiểu hợp lý (ví dụ: tối thiểu 100,000đ/cơ sở/tháng)
    pricePerLocation = charmPrice(Math.max(100000, basePrice + zoneAddon));
    
    // Tổng số tiền hàng tháng sau khi áp dụng chiết khấu chuỗi (nếu có)
    totalAmount = charmPrice(pricePerLocation * branches * (1 - chainDiscountPercent));
    
    // Nếu có chiết khấu chuỗi ở chu kỳ tháng, tính số tiền tiết kiệm được
    saving = Math.max(0, originalTotalAmount - totalAmount);
  } else {
    // Tính giá trị theo năm
    // Gói năm được giảm 17% đối với giá cơ bản, zone addon tính theo đơn giá năm (990,000đ/zone/năm thay vì 1,188,000đ)
    const basePriceYearlyMonthly = basePrice * (1 - DISCOUNT_CONFIG.yearly); // Giảm 17%
    const zoneAddonYearlyMonthly = extraZones * (ZONE_ADDON.price_year / 12); // ~82.5k thay vì 99k
    
    pricePerLocation = charmPrice(Math.max(80000, basePriceYearlyMonthly + zoneAddonYearlyMonthly));
    
    // Tổng thanh toán 12 tháng sau khi áp dụng chiết khấu chuỗi (nếu có)
    totalAmount = charmPrice(pricePerLocation * branches * (1 - chainDiscountPercent) * 12);
    
    // Tính số tiền tiết kiệm so với thanh toán từng tháng trong 12 tháng
    saving = Math.max(0, originalTotalAmount - totalAmount);
    if (saving > 0) {
      saving = charmPrice(saving);
    }
  }

  return {
    basePrice,
    zoneAddon: paymentCycle === 'monthly' ? (extraZones !== 0 ? Math.round(extraZones * ZONE_ADDON.price_month) : 0) : (extraZones !== 0 ? Math.round(extraZones * (ZONE_ADDON.price_year / 12)) : 0),
    pricePerLocation,
    chainDiscountPercent,
    totalAmount,
    saving,
    originalTotalAmount,
    contactOnly: false,
  };
}

const TIER_ORDER = ['starter', 'business', 'professional', 'enterprise'];

// Kiểm tra xem tier có hỗ trợ feature không
export function tierHasFeature(packageId: string, tierFrom: string): boolean {
  return TIER_ORDER.indexOf(packageId) >= TIER_ORDER.indexOf(tierFrom);
}

// Lấy danh sách features của 1 package (dùng cho PackagesSection cards)
export function getFeaturesForPackage(features: FeatureRow[], packageId: string): string[] {
  return features
    .filter(f => !f.hidden && tierHasFeature(packageId, f.tierFrom))
    .sort((a, b) => a.order - b.order)
    .map(f => f.content);
}

/**
 * Xác định core package ID ('starter' | 'business' | 'professional' | 'enterprise') từ một Tier
 * dựa trên các đặc tính tính năng và thông tin bổ sung.
 */
export function getPackageIdForTier(tier: Tier): 'starter' | 'business' | 'professional' | 'enterprise' {
  const features = tier.features || [];
  
  // 1. Kiểm tra tính năng Enterprise đặc trưng
  const hasEnterprise = features.some(f => 
    f.includes('SLA') || 
    f.includes('Account Manager') || 
    f.includes('24/7') || 
    f.includes('chuyên trách')
  );
  if (hasEnterprise) return 'enterprise';
  
  // 2. Kiểm tra tính năng Professional đặc trưng
  const hasProfessional = features.some(f => 
    f.includes('multi-zone') || 
    f.includes('8 giờ') || 
    f.includes('khu vực âm thanh')
  );
  if (hasProfessional) return 'professional';
  
  // 3. Kiểm tra tính năng Business đặc trưng
  const hasBusiness = features.some(f => 
    f.includes('App quản lý') || 
    f.includes('Dashboard') || 
    f.includes('Lập lịch') || 
    f.includes('Playlist')
  );
  if (hasBusiness) return 'business';
  
  // 4. Kiểm tra fallback chuỗi ký tự theo ID hoặc Tên nếu danh sách tính năng bị rỗng/tùy chỉnh
  const id = (tier.id || '').toLowerCase();
  const name = (tier.name || '').toLowerCase();
  
  if (id.includes('enterprise') || name.includes('enterprise')) {
    return 'enterprise';
  }
  if (
    id.includes('professional') || 
    id.includes('premium') || 
    name.includes('professional') || 
    name.includes('cao cấp')
  ) {
    return 'professional';
  }
  if (id.includes('business') || name.includes('business')) {
    return 'business';
  }
  
  return 'starter';
}

