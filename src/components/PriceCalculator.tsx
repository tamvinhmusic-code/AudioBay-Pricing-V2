/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Minus, 
  Check, 
  FileText, 
  Phone, 
  Mail, 
  Sliders, 
  Building2, 
  Sparkles, 
  ChevronRight, 
  AlertCircle,
  HelpCircle,
  Send,
  CheckCircle2
} from 'lucide-react';
import { Category, Tier, CustomerInfo, QuoteParams, PackagesAdminData, QuoteRequest } from '../types';
import { CATEGORIES, ZONE_ADDON, COMPANY, DISCOUNT_CONFIG, defaultPackagesAdmin } from '../initialData';
import { autoSelectTier, calculatePrice, CalculationResult, getFeaturesForPackage, getPackageIdForTier } from '../utils/priceCalculator';
import { exportQuoteToPDF, formatVND } from '../utils/exportPDF';

interface ApprovalLevel {
  level: string;
  badgeColor: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
  desc: string;
}

export function getApprovalLevel(branches: number): ApprovalLevel {
  if (branches <= 1) {
    return {
      level: 'Bán lẻ tiêu chuẩn',
      badgeColor: 'bg-zinc-100/80 text-zinc-600 border-zinc-200/50',
      textColor: 'text-zinc-500',
      bgColor: 'bg-zinc-50/50',
      borderColor: 'border-zinc-200/30',
      desc: 'Áp dụng biểu giá bán lẻ tiêu chuẩn cho cơ sở đơn lẻ.',
    };
  }
  if (branches <= 4) {
    return {
      level: 'Hệ thống tự động duyệt',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200/50',
      textColor: 'text-emerald-700',
      bgColor: 'bg-[#e8f9ee]/30',
      borderColor: 'border-[#bbf7d0]/50',
      desc: 'Mức chiết khấu chuỗi nhỏ được hệ thống tự động kích hoạt áp dụng ngay trên báo giá.',
    };
  }
  if (branches <= 9) {
    return {
      level: 'Salesperson xác nhận',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200/50',
      textColor: 'text-amber-700',
      bgColor: 'bg-[#fef3c7]/30',
      borderColor: 'border-[#fde68a]/50',
      desc: 'Cần chuyên viên kinh doanh đối chiếu điều kiện hạ tầng và kích hoạt tài khoản quản lý chuỗi.',
    };
  }
  if (branches <= 19) {
    return {
      level: 'Trưởng phòng Sales duyệt',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200/50',
      textColor: 'text-blue-700',
      bgColor: 'bg-[#dbeafe]/30',
      borderColor: 'border-[#bfdbfe]/50',
      desc: 'Cần Trưởng phòng kinh doanh phê duyệt điều khoản chiết khấu sâu và cấp độ ưu tiên SLA kỹ thuật.',
    };
  }
  if (branches <= 49) {
    return {
      level: 'Giám đốc Kinh doanh ký hợp đồng',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200/50',
      textColor: 'text-indigo-700',
      bgColor: 'bg-[#e0e7ff]/30',
      borderColor: 'border-[#c7d2fe]/50',
      desc: 'Yêu cầu làm việc với đội dự án để soạn thảo Hợp đồng dịch vụ chuỗi lớn, tích hợp hệ thống quản lý tập trung.',
    };
  }
  return {
    level: 'Phê duyệt cấp CEO / Director level',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200/50',
    textColor: 'text-rose-700',
    bgColor: 'bg-[#ffe4e6]/30',
    borderColor: 'border-[#fecdd3]/50',
    desc: 'Cần Ban Giám đốc phê duyệt trực tiếp chính sách giá sỉ siêu đặc biệt và điều khoản cam kết SLA 24/7 chuyên biệt.',
  };
}

interface PriceCalculatorProps {
  pricingData?: Category[];
  company?: any;
  packagesAdmin?: PackagesAdminData;
  quoteRequests?: QuoteRequest[];
  onSaveQuoteRequests?: (updated: QuoteRequest[]) => void;
  syncTrigger?: { packageId: string; timestamp: number } | null;
  onOpenAIConsultant?: () => void;
  airtableConfig?: any;
}

export default function PriceCalculator({
  pricingData = CATEGORIES,
  company = COMPANY,
  packagesAdmin = defaultPackagesAdmin,
  quoteRequests = [],
  onSaveQuoteRequests,
  syncTrigger,
  onOpenAIConsultant,
  airtableConfig = { active: false, integrationType: 'api', embedUrl: '' },
}: PriceCalculatorProps) {
  // State quản lý lựa chọn
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('cafe');
  
  // State đặc biệt cho chuỗi chi nhánh
  const [chainSubCategoryId, setChainSubCategoryId] = useState<string>('cafe');
  
  // State diện tích hoặc số phòng
  const [inputValue, setInputValue] = useState<number>(60); // mặc định diện tích 60m2
  
  // State cho số zones bổ sung ngoài gói
  const [hasExtraZones, setHasExtraZones] = useState<boolean>(false);
  const [extraZones, setExtraZones] = useState<number>(1);
  
  // State Form đặc biệt cho Mô hình Kinh doanh Khác
  const [customModelForm, setCustomModelForm] = useState({
    name: '',
    phone: '',
    email: '',
    company: '',
    modelName: '',
    scaleValue: 100,
    scaleLabel: 'm2',
    branches: 1,
    zones: 2,
    paymentCycle: 'yearly' as 'monthly' | 'yearly',
    notes: ''
  });
  const [customFormSubmitting, setCustomFormSubmitting] = useState(false);
  const [customFormSuccess, setCustomFormSuccess] = useState(false);
  const [customRequestCode, setCustomRequestCode] = useState('');
  const [customFormError, setCustomFormError] = useState<string | null>(null);
  
  // State số địa điểm (branches)
  const [branches, setBranches] = useState<number>(1);
  
  // State chu kỳ thanh toán
  const [paymentCycle, setPaymentCycle] = useState<'monthly' | 'yearly'>('yearly');

  // Trạng thái hiển thị AI Consultant đã được chuyển thành floating toàn cục

  // State Modal thông tin khách hàng
  const [showModal, setShowModal] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [createdRequestCode, setCreatedRequestCode] = useState<string>('');

  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    company: '',
    phone: '',
    email: '',
    notes: '',
  });

  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  // Đồng bộ hóa cấu hình máy tính dựa trên Gói Cốt Lõi được chọn bên dưới
  useEffect(() => {
    if (!syncTrigger) return;
    const { packageId } = syncTrigger;
    
    let label = '';
    if (packageId === 'starter') {
      setSelectedCategoryId('cafe');
      setInputValue(30); // 30m2 => Starter (Mini / Take-away <= 50m2)
      setBranches(1);
      setHasExtraZones(false);
      setExtraZones(0);
      label = 'STARTER';
    } else if (packageId === 'business') {
      setSelectedCategoryId('cafe');
      setInputValue(100); // 100m2 => Business (Cà phê vừa 80-150m2)
      setBranches(1);
      setHasExtraZones(false);
      setExtraZones(0);
      label = 'BUSINESS';
    } else if (packageId === 'professional') {
      setSelectedCategoryId('fitness');
      setInputValue(200); // 200m2 => Professional (Gym nhỏ 100-300m2)
      setBranches(1);
      setHasExtraZones(false);
      setExtraZones(0);
      label = 'PROFESSIONAL';
    } else if (packageId === 'enterprise') {
      setSelectedCategoryId('chain'); // Kích hoạt tab Chuỗi & Enterprise
      setBranches(5); // Kích hoạt mức Enterprise / Liên hệ (>= 5 chi nhánh)
      setHasExtraZones(false);
      setExtraZones(0);
      label = 'ENTERPRISE';
    }

    setSyncNotice(`Hệ thống đã tự động cấu hình Bộ tính giá phù hợp với gói ${label}!`);
    const timer = setTimeout(() => {
      setSyncNotice(null);
    }, 4500);

    return () => clearTimeout(timer);
  }, [syncTrigger]);

  // Lấy Category đang được chọn
  const currentCategory = useMemo(() => {
    if (selectedCategoryId === 'custom_model') {
      return { id: 'custom_model', name: 'Mô hình khác...', icon: '❓', isChain: false, inputType: 'area', inputLabel: 'm2', tiers: [], description: 'Mô hình kinh doanh đặc thù tùy chỉnh' } as any;
    }
    return pricingData.find(c => c.id === selectedCategoryId) || pricingData[0];
  }, [selectedCategoryId, pricingData]);

  // Nếu chọn "Chuỗi & Enterprise" -> sử dụng subCategory làm category tính giá
  const activeCalcCategory = useMemo(() => {
    if (currentCategory.id === 'custom_model') {
      return currentCategory;
    }
    if (currentCategory.isChain) {
      return pricingData.find(c => c.id === chainSubCategoryId && !c.isChain) || pricingData[0];
    }
    return currentCategory;
  }, [currentCategory, chainSubCategoryId]);

  // Chọn tier tự động
  const selectedTier = useMemo(() => {
    if (activeCalcCategory.id === 'custom_model') {
      return { id: 'custom', name: 'Gói tùy chỉnh', zones: 2, price_month: 0, features: [] } as any;
    }
    return autoSelectTier(activeCalcCategory, inputValue);
  }, [activeCalcCategory, inputValue]);

  // Lấy các tính năng động đồng bộ của selectedTier dựa trên tên gói dịch vụ
  const dynamicFeaturesOfSelectedTier = useMemo(() => {
    if (selectedCategoryId === 'custom_model') {
      const list = packagesAdmin?.features || defaultPackagesAdmin.features;
      return list.filter(f => !f.hidden && f.tierFrom === 'business').map(f => f.content);
    }
    const packageId = getPackageIdForTier(selectedTier);
    const featuresList = packagesAdmin?.features || defaultPackagesAdmin.features;
    return getFeaturesForPackage(featuresList, packageId);
  }, [packagesAdmin, selectedTier, selectedCategoryId]);

  // Cập nhật giá trị mặc định cho slider khi chuyển Category để tránh giá trị ngoài tầm
  const handleCategoryChange = (catId: string) => {
    setSelectedCategoryId(catId);
    if (catId === 'custom_model') {
      return;
    }
    const cat = pricingData.find(c => c.id === catId) || pricingData[0];
    
    if (cat.isChain) {
      // Nếu chọn chuỗi, số địa điểm ít nhất là 2
      if (branches < 2) setBranches(2);
      const subCat = pricingData.find(c => c.id === chainSubCategoryId && !c.isChain) || pricingData[0];
      setInputValue(subCat.inputType === 'area' ? 100 : 40);
    } else {
      // Standard category
      setInputValue(cat.inputType === 'area' ? 60 : 25);
    }
  };

  const handleChainSubCategoryChange = (subCatId: string) => {
    setChainSubCategoryId(subCatId);
    const subCat = pricingData.find(c => c.id === subCatId && !c.isChain) || pricingData[0];
    setInputValue(subCat.inputType === 'area' ? 100 : 40);
  };

  // Tính toán kết quả báo giá chi tiết
  const calcResult = useMemo<CalculationResult>(() => {
    return calculatePrice({
      category: activeCalcCategory,
      tier: selectedTier,
      inputValue,
      extraZones: hasExtraZones ? extraZones : 0,
      branches,
      paymentCycle,
    });
  }, [activeCalcCategory, selectedTier, inputValue, hasExtraZones, extraZones, branches, paymentCycle]);

  // Xử lý nộp form xuất PDF
  const handleExportPDF = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!customerInfo.name || !customerInfo.company) {
      alert('Vui lòng điền đầy đủ Tên liên hệ và Tên doanh nghiệp!');
      return;
    }

    // Thiết lập ngày
    const today = new Date();
    const expiry = new Date();
    expiry.setDate(today.getDate() + 30);

    const formattedToday = today.toLocaleDateString('vi-VN');
    const formattedExpiry = expiry.toLocaleDateString('vi-VN');

    const quoteParams: QuoteParams = {
      category: activeCalcCategory,
      tier: selectedTier,
      inputValue,
      extraZones: hasExtraZones ? extraZones : 0,
      branches,
      paymentCycle,
      chainDiscount: calcResult.chainDiscountPercent,
      basePrice: calcResult.basePrice,
      zoneAddon: calcResult.zoneAddon,
      totalAmount: calcResult.totalAmount,
      saving: calcResult.saving,
      originalTotalAmount: calcResult.originalTotalAmount,
      customerInfo,
      quoteDate: formattedToday,
      validUntil: formattedExpiry,
      company: company,
    };

    exportQuoteToPDF(quoteParams);
  };

  // Xử lý gửi yêu cầu về cho AudioBay (đồng bộ với AdminPanel)
  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerInfo.name || !customerInfo.company) {
      alert('Vui lòng điền đầy đủ Tên liên hệ và Tên doanh nghiệp!');
      return;
    }

    const today = new Date();
    const formattedToday = today.toLocaleDateString('vi-VN');

    const requestCode = `AB-REQ-${Math.floor(100000 + Math.random() * 900000)}`;

    const newRequest: QuoteRequest = {
      id: requestCode,
      customerInfo: customerInfo,
      createdAt: formattedToday,
      status: 'new',
      categoryId: activeCalcCategory.id,
      categoryName: activeCalcCategory.name,
      inputValue: inputValue,
      inputLabel: activeCalcCategory.inputLabel || (activeCalcCategory.inputType === 'area' ? 'm²' : 'phòng'),
      branches: currentCategory.isChain ? branches : 1,
      paymentCycle: paymentCycle,
      zones: selectedTier.zones + (hasExtraZones ? extraZones : 0),
      estimatedPriceMonthly: calcResult.totalAmount,
      estimatedPriceYearly: calcResult.totalAmount * (paymentCycle === 'yearly' ? 12 : 1),
    };

    if (onSaveQuoteRequests) {
      onSaveQuoteRequests([newRequest, ...quoteRequests]);
    } else {
      try {
        const saved = localStorage.getItem('audiobay_quote_requests');
        const list = saved ? JSON.parse(saved) : [];
        localStorage.setItem('audiobay_quote_requests', JSON.stringify([newRequest, ...list]));
      } catch (err) {
        console.error('Lỗi lưu yêu cầu báo giá:', err);
      }
    }

    setCreatedRequestCode(requestCode);
    setSubmitSuccess(true);
  };

  // Xử lý gửi yêu cầu tư vấn cho Mô hình khác
  const handleCustomFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customModelForm.name || !customModelForm.phone || !customModelForm.modelName) {
      alert('Vui lòng điền đầy đủ Họ tên, Số điện thoại và Tên mô hình kinh doanh!');
      return;
    }

    setCustomFormSubmitting(true);
    setCustomFormError(null);

    try {
      const today = new Date();
      const formattedToday = today.toLocaleDateString('vi-VN');
      const requestCode = `AB-REQ-CUSTOM-${Math.floor(100000 + Math.random() * 900000)}`;

      // Tính chi phí dự kiến tạm tính
      const baseEstMonthly = customModelForm.branches > 1 ? 449100 : 269100;
      const estZoneAddon = Math.max(0, customModelForm.zones - 1) * 89000;
      const estMonthlyTotal = (baseEstMonthly + estZoneAddon) * customModelForm.branches;

      const newRequest: QuoteRequest = {
        id: requestCode,
        customerInfo: {
          name: customModelForm.name,
          phone: customModelForm.phone,
          email: customModelForm.email,
          company: customModelForm.company || customModelForm.modelName,
          notes: `[Mô hình Khác] Quy mô: ${customModelForm.scaleValue} ${customModelForm.scaleLabel}, Số zones: ${customModelForm.zones}. Chi tiết: ${customModelForm.notes}`,
        },
        createdAt: formattedToday,
        status: 'new',
        categoryId: 'custom_model',
        categoryName: `Mô hình khác: ${customModelForm.modelName}`,
        inputValue: Number(customModelForm.scaleValue),
        inputLabel: customModelForm.scaleLabel,
        branches: Number(customModelForm.branches),
        paymentCycle: customModelForm.paymentCycle,
        zones: Number(customModelForm.zones),
        estimatedPriceMonthly: estMonthlyTotal,
        estimatedPriceYearly: estMonthlyTotal * (customModelForm.paymentCycle === 'yearly' ? 12 : 1),
      };

      if (onSaveQuoteRequests) {
        onSaveQuoteRequests([newRequest, ...quoteRequests]);
      } else {
        const saved = localStorage.getItem('audiobay_quote_requests');
        const list = saved ? JSON.parse(saved) : [];
        localStorage.setItem('audiobay_quote_requests', JSON.stringify([newRequest, ...list]));
      }

      setCustomRequestCode(requestCode);
      setCustomFormSuccess(true);
    } catch (err: any) {
      setCustomFormError(err.message || 'Đã xảy ra lỗi khi gửi yêu cầu.');
    } finally {
      setCustomFormSubmitting(false);
    }
  };

  return (
    <section id="calculator" className="py-16 bg-[#f5f7ff] border-b border-[#e2e8f5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Tiêu đề & Badge */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#263b96] bg-[#f0f4ff] border border-[#e2e8f5] rounded-full mb-3 uppercase tracking-wider font-mono">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Công cụ báo giá tự động
          </span>
          <h2 className="text-3xl font-extrabold text-[#0d1b3e] sm:text-4xl tracking-tight">
            Tính toán chi phí bản quyền nhạc nền
          </h2>
          <p className="mt-4 text-base text-[#5a6d9a]">
            Chọn mô hình, nhập quy mô và nhận báo giá chi tiết, minh bạch ngay lập tức phù hợp với không gian kinh doanh của bạn.
          </p>
        </div>

        {/* Banner đồng bộ gói */}
        <AnimatePresence>
          {syncNotice && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="mb-6"
            >
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-500 text-white rounded-full p-1 shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-emerald-800 leading-none">Cấu hình tự động</p>
                    <p className="text-[11px] text-emerald-700 mt-1 font-medium">{syncNotice}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSyncNotice(null)}
                  className="text-emerald-500 hover:text-emerald-800 font-bold text-xs p-1 cursor-pointer transition-colors animate-none"
                >
                  ✕
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* BƯỚC 1: Chọn loại hình kinh doanh */}
        <div className="mb-10 bg-[#ffffff] border border-[#e2e8f5] rounded-3xl p-6 shadow-xs">
          <label className="block text-xs font-bold text-[#0d1b3e] uppercase tracking-wider mb-5 text-center font-mono">
            Bước 1: Chọn mô hình kinh doanh của bạn
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {[...pricingData, { id: 'custom_model', name: 'Mô hình khác...', icon: '❓', isChain: false }].map((cat) => {
              const isSelected = selectedCategoryId === cat.id;
              return (
                <button
                  key={cat.id}
                  id={`cat-btn-${cat.id}`}
                  onClick={() => handleCategoryChange(cat.id)}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'bg-[#263b96] text-white border-[#263b96] shadow-lg shadow-[#263b96]/10 transform -translate-y-0.5'
                      : 'bg-[#ffffff] text-[#0d1b3e] border-[#e2e8f5] hover:border-[#263b96] hover:bg-[#f5f7ff]'
                  }`}
                >
                  <span className="text-2xl mb-2" role="img" aria-label={cat.name}>
                    {cat.icon}
                  </span>
                  <span className="text-xs font-bold leading-tight">{cat.name}</span>
                </button>
              );
            })}
          </div>

          {/* Banner gợi ý Tư vấn AI (Tối ưu cho Sales) */}
          <div className="mt-6 pt-6 border-t border-[#e2e8f5] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-start gap-3 text-left">
              <Sparkles className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0 animate-pulse" />
              <div>
                <h4 className="text-xs font-bold text-[#0d1b3e] uppercase tracking-wider font-mono">Dự án đặc thù hoặc chuỗi siêu lớn?</h4>
                <p className="text-xs text-[#5a6d9a] mt-0.5">Sử dụng Trợ lý AI để phác thảo nhanh phương án, tính toán chính sách chiết khấu và tự động phân bổ Zone.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onOpenAIConsultant?.()}
              className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-550 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-indigo-600/10 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-emerald-300 shrink-0" /> Phân tích & Tính giá với AI
            </button>
          </div>
        </div>

        {/* Khối Calculator Layout hoặc Custom Model Form */}
        {selectedCategoryId === 'custom_model' ? (
          <div className="max-w-4xl mx-auto w-full">
            {airtableConfig.active && airtableConfig.integrationType === 'embed' && airtableConfig.embedUrl ? (
              /* CHẾ ĐỘ nhúng Airtable Form */
              <div className="bg-[#ffffff] rounded-3xl border border-[#e2e8f5] shadow-xs overflow-hidden">
                <div className="bg-[#1a3a7a] p-6 text-white text-center">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/20 text-white text-[10px] font-bold rounded-full uppercase tracking-wider mb-2 font-mono">
                    Airtable Integration
                  </span>
                  <h3 className="text-lg font-black tracking-tight uppercase">Báo Giá Mô Hình Đặc Thù</h3>
                  <p className="text-xs text-white/80 mt-1 max-w-xl mx-auto">Vui lòng điền thông tin vào biểu mẫu Airtable dưới đây để chuyên viên kinh doanh AudioBay nhận và hỗ trợ tư vấn nhanh nhất.</p>
                </div>
                <div className="relative w-full overflow-hidden bg-slate-50" style={{ height: '700px' }}>
                  <iframe 
                    src={airtableConfig.embedUrl} 
                    width="100%" 
                    height="100%" 
                    style={{ background: 'transparent', border: 'none' }}
                    className="w-full h-full"
                    title="Airtable Form"
                  />
                </div>
                <div className="p-4 bg-slate-50 border-t border-[#e2e8f5] text-center text-xs text-[#8a9ab5]">
                  Gặp vấn đề hiển thị? <a href={airtableConfig.embedUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 font-bold underline hover:text-[#263b96]">Bấm vào đây để mở Form trực tiếp trong tab mới ↗</a>
                </div>
              </div>
            ) : (
              /* CHẾ ĐỘ Native Form tích hợp đồng bộ API */
              <div className="bg-[#ffffff] rounded-3xl border border-[#e2e8f5] shadow-xs overflow-hidden text-[#0d1b3e]">
                <div className="bg-[#1a3a7a] p-6 text-white text-center">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/20 text-white text-[10px] font-bold rounded-full uppercase tracking-wider mb-2 font-mono">
                    Tư vấn giải pháp đặc thù
                  </span>
                  <h3 className="text-lg font-black tracking-tight">YÊU CẦU BÁO GIÁ CHO MÔ HÌNH RIÊNG BIỆT</h3>
                  <p className="text-xs text-white/80 mt-1 max-w-xl mx-auto">Nếu quý khách có mô hình kinh doanh đặc thù hoặc chuỗi chi nhánh đặc thù chưa được liệt kê sẵn, hãy điền thông tin để chuyên viên AudioBay liên hệ tư vấn nhanh nhất.</p>
                </div>

                {customFormSuccess ? (
                  <div className="p-8 text-center space-y-6">
                    <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
                      <Check className="w-8 h-8 font-extrabold" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-lg font-extrabold text-[#0d1b3e]">Gửi yêu cầu thành công!</h4>
                      <p className="text-xs text-[#5a6d9a] max-w-md mx-auto">Cảm ơn quý khách. Mã yêu cầu của quý khách là <strong className="font-mono text-indigo-600">{customRequestCode}</strong>. Chuyên viên CSKH của AudioBay sẽ liên hệ lại trong vòng 5 phút.</p>
                    </div>
                    {airtableConfig.active && (
                      <p className="text-[11px] text-emerald-600 font-bold">✓ Đã tự động đồng bộ sang bảng quản trị Airtable trung tâm.</p>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setCustomFormSuccess(false);
                        setCustomModelForm({
                          name: '',
                          phone: '',
                          email: '',
                          company: '',
                          modelName: '',
                          scaleValue: 100,
                          scaleLabel: 'm2',
                          branches: 1,
                          zones: 2,
                          paymentCycle: 'yearly',
                          notes: ''
                        });
                      }}
                      className="px-6 py-2.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline bg-transparent border-none cursor-pointer"
                    >
                      Tạo yêu cầu mới
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleCustomFormSubmit} className="p-6 sm:p-8 space-y-5">
                    {customFormError && (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                        Lỗi: {customFormError}
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[#5a6d9a] uppercase tracking-wider mb-1 font-mono">
                          Họ và tên khách hàng <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Ví dụ: Nguyễn Văn A"
                          value={customModelForm.name}
                          onChange={(e) => setCustomModelForm(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full text-sm bg-white border border-[#e2e8f5] text-[#0d1b3e] rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-600 focus:outline-none font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#5a6d9a] uppercase tracking-wider mb-1 font-mono">
                          Số điện thoại liên hệ <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          required
                          placeholder="Ví dụ: 0912345xxx"
                          value={customModelForm.phone}
                          onChange={(e) => setCustomModelForm(prev => ({ ...prev, phone: e.target.value }))}
                          className="w-full text-sm bg-white border border-[#e2e8f5] text-[#0d1b3e] rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-600 focus:outline-none font-bold font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[#5a6d9a] uppercase tracking-wider mb-1 font-mono">
                          Địa chỉ Email
                        </label>
                        <input
                          type="email"
                          placeholder="Ví dụ: name@company.com"
                          value={customModelForm.email}
                          onChange={(e) => setCustomModelForm(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full text-sm bg-white border border-[#e2e8f5] text-[#0d1b3e] rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#5a6d9a] uppercase tracking-wider mb-1 font-mono">
                          Tên cơ sở / Tên thương hiệu
                        </label>
                        <input
                          type="text"
                          placeholder="Ví dụ: Tổ hợp Sáng tạo The Box"
                          value={customModelForm.company}
                          onChange={(e) => setCustomModelForm(prev => ({ ...prev, company: e.target.value }))}
                          className="w-full text-sm bg-white border border-[#e2e8f5] text-[#0d1b3e] rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-600 focus:outline-none font-bold"
                        />
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 border border-[#e2e8f5] rounded-2xl space-y-4">
                      <h4 className="text-xs font-bold text-[#0d1b3e] uppercase tracking-wider font-mono">Thông tin về mô hình đặc thù của bạn:</h4>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-bold text-[#5a6d9a] uppercase tracking-wider mb-1 font-mono">
                            Mô tả mô hình kinh doanh cụ thể <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Ví dụ: Sân Pickleball, Phòng tập nhảy, Khu triển lãm tranh..."
                            value={customModelForm.modelName}
                            onChange={(e) => setCustomModelForm(prev => ({ ...prev, modelName: e.target.value }))}
                            className="w-full text-sm bg-white border border-[#e2e8f5] text-[#0d1b3e] rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-600 focus:outline-none font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-[#5a6d9a] uppercase tracking-wider mb-1 font-mono">
                            Đơn vị tính quy mô
                          </label>
                          <select
                            value={customModelForm.scaleLabel}
                            onChange={(e) => setCustomModelForm(prev => ({ ...prev, scaleLabel: e.target.value }))}
                            className="w-full text-sm bg-white border border-[#e2e8f5] text-[#0d1b3e] rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-600 focus:outline-none font-bold"
                          >
                            <option value="m2">Mét vuông (m²)</option>
                            <option value="phòng">Phòng nghỉ</option>
                            <option value="bàn">Bàn</option>
                            <option value="giường">Giường điều trị</option>
                            <option value="khu vực">Khu vực riêng biệt</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold text-[#5a6d9a] uppercase tracking-wider mb-1 font-mono">
                            Quy mô không gian (Giá trị số) <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            required
                            min="1"
                            value={customModelForm.scaleValue}
                            onChange={(e) => setCustomModelForm(prev => ({ ...prev, scaleValue: Number(e.target.value) }))}
                            className="w-full text-sm bg-white border border-[#e2e8f5] text-[#0d1b3e] rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-600 focus:outline-none font-bold font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-[#5a6d9a] uppercase tracking-wider mb-1 font-mono">
                            Số lượng địa điểm đăng ký (Cơ sở) <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            required
                            min="1"
                            value={customModelForm.branches}
                            onChange={(e) => setCustomModelForm(prev => ({ ...prev, branches: Number(e.target.value) }))}
                            className="w-full text-sm bg-white border border-[#e2e8f5] text-[#0d1b3e] rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-600 focus:outline-none font-bold font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-[#5a6d9a] uppercase tracking-wider mb-1 font-mono">
                            Số khu vực cần phát nhạc riêng biệt <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            required
                            min="1"
                            value={customModelForm.zones}
                            onChange={(e) => setCustomModelForm(prev => ({ ...prev, zones: Number(e.target.value) }))}
                            className="w-full text-sm bg-white border border-[#e2e8f5] text-[#0d1b3e] rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-600 focus:outline-none font-bold font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center pt-2">
                      <div>
                        <label className="block text-xs font-bold text-[#5a6d9a] uppercase tracking-wider mb-1 font-mono">
                          Chu kỳ thanh toán đề xuất
                        </label>
                        <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                          <button
                            type="button"
                            onClick={() => setCustomModelForm(prev => ({ ...prev, paymentCycle: 'monthly' }))}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer border-none ${
                              customModelForm.paymentCycle === 'monthly'
                                ? 'bg-white text-[#0d1b3e] shadow-xs'
                                : 'bg-transparent text-[#5a6d9a] hover:text-[#0d1b3e]'
                            }`}
                          >
                            Hàng tháng
                          </button>
                          <button
                            type="button"
                            onClick={() => setCustomModelForm(prev => ({ ...prev, paymentCycle: 'yearly' }))}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer border-none ${
                              customModelForm.paymentCycle === 'yearly'
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'bg-transparent text-[#5a6d9a] hover:text-indigo-600'
                            }`}
                          >
                            Hàng năm (Tiết kiệm 17%)
                          </button>
                        </div>
                      </div>
                      
                      <div className="text-xs text-[#5a6d9a] leading-normal pt-4">
                        💡 <strong>Lợi ích thanh toán năm:</strong> AudioBay miễn phí hoàn toàn 14 ngày dùng thử, tặng trọn gói dịch vụ tư vấn playlist âm nhạc độc quyền cho thương hiệu và chiết khấu thẳng 17% tổng phí.
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#5a6d9a] uppercase tracking-wider mb-1 font-mono">
                        Yêu cầu âm nhạc / hạ tầng loa hoặc mô tả chi tiết thêm
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Ví dụ: Cần nhạc năng động cho sảnh, nhạc dịu nhẹ cho phòng xông hơi, hệ thống loa đang dùng là của Bose..."
                        value={customModelForm.notes}
                        onChange={(e) => setCustomModelForm(prev => ({ ...prev, notes: e.target.value }))}
                        className="w-full text-sm bg-white border border-[#e2e8f5] text-[#0d1b3e] rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                      />
                    </div>

                    <div className="pt-4 border-t border-[#e2e8f5] flex items-center justify-between">
                      <span className="text-[11px] text-[#8a9ab5] font-medium">✓ Đồng bộ tự động thời gian thực tới CSKH AudioBay</span>
                      <button
                        type="submit"
                        disabled={customFormSubmitting}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer border-none"
                      >
                        {customFormSubmitting ? (
                          <span>Đang gửi yêu cầu...</span>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            Gửi yêu cầu & Liên hệ nhanh
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* CỘT TRÁI: CẤU HÌNH THÔNG SỐ (7 cột) */}
          <div className="lg:col-span-7 bg-[#ffffff] rounded-3xl border border-[#e2e8f5] shadow-xs p-6 sm:p-8 space-y-8 text-[#0d1b3e]">
            
            {/* THÔNG BÁO CHO CHUỖI NẾU CHỌN CHAIN */}
            {currentCategory.isChain && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-[#e8f9ee] border border-[#bbf7d0] rounded-2xl space-y-3"
              >
                <div className="flex items-start gap-2.5">
                  <Building2 className="w-5 h-5 text-[#0a5c30] mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-[#0a5c30]">Giải pháp chuỗi chi nhánh</h4>
                    <p className="text-xs text-[#0a5c30]/90 mt-0.5 leading-relaxed font-medium">
                      {currentCategory.description}
                    </p>
                  </div>
                </div>
                
                {/* Chọn loại hình cơ sở trong chuỗi */}
                <div className="pt-2 border-t border-[#bbf7d0]">
                  <label className="block text-xs font-bold text-[#0a5c30] uppercase tracking-wider mb-2 font-mono">
                    Loại hình cơ sở trong chuỗi
                  </label>
                  <select
                    value={chainSubCategoryId}
                    onChange={(e) => handleChainSubCategoryChange(e.target.value)}
                    className="w-full text-sm bg-white border border-[#bbf7d0] text-[#0a5c30] rounded-xl p-2.5 focus:ring-2 focus:ring-[#59ca6d] focus:outline-none font-bold"
                  >
                    {pricingData.filter(c => !c.isChain).map(c => (
                      <option key={c.id} value={c.id} className="bg-white text-[#0d1b3e]">
                        {c.icon} {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </motion.div>
            )}

            {/* BƯỚC 2: Thông số không gian */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-bold text-[#0d1b3e] uppercase tracking-wider flex items-center gap-1.5 font-mono">
                  <Sliders className="w-4 h-4 text-[#263b96]" />
                  Bước 2: Quy mô địa điểm
                </label>
                <span className="text-xs font-semibold text-[#263b96] bg-[#f0f4ff] border border-[#e2e8f5] px-2.5 py-1 rounded-full font-mono">
                  {activeCalcCategory.inputType === 'area' ? 'Diện tích sàn' : activeCalcCategory.inputLabel || 'Số lượng'}
                </span>
              </div>

              {/* Slider / Range Input */}
              {activeCalcCategory.inputType === 'area' ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-[#f5f7ff] p-4 rounded-2xl border border-[#e2e8f5]">
                    <span className="text-sm text-[#5a6d9a]">Diện tích không gian kinh doanh:</span>
                    <span className="text-xl font-extrabold text-[#0d1b3e] font-mono">
                      {inputValue} m²
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="2000"
                    step="10"
                    value={inputValue}
                    onChange={(e) => setInputValue(Number(e.target.value))}
                    className="w-full h-2 bg-[#e2e8f5] rounded-lg appearance-none cursor-pointer accent-[#263b96]"
                  />
                  <div className="flex justify-between text-xs text-[#8a9ab5] font-mono px-1">
                    <span>10 m²</span>
                    <span>500 m²</span>
                    <span>1,000 m²</span>
                    <span>2,000 m²</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-[#f5f7ff] p-4 rounded-2xl border border-[#e2e8f5]">
                    <span className="text-sm text-[#5a6d9a]">Quy mô phòng nghỉ khách sạn:</span>
                    <span className="text-xl font-extrabold text-[#0d1b3e] font-mono">
                      {inputValue} Phòng
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="500"
                    step="1"
                    value={inputValue}
                    onChange={(e) => setInputValue(Number(e.target.value))}
                    className="w-full h-2 bg-[#e2e8f5] rounded-lg appearance-none cursor-pointer accent-[#263b96]"
                  />
                  <div className="flex justify-between text-xs text-[#8a9ab5] font-mono px-1">
                    <span>1 phòng</span>
                    <span>100 phòng</span>
                    <span>250 phòng</span>
                    <span>500 phòng</span>
                  </div>
                </div>
              )}

              {/* Tự động gợi ý gói */}
              <div className="mt-4 p-3.5 bg-[#f0f4ff] border border-[#e2e8f5] rounded-2xl flex items-start gap-2.5">
                <AlertCircle className="w-4.5 h-4.5 text-[#263b96] mt-0.5 flex-shrink-0" />
                <div className="text-xs text-[#5a6d9a] leading-relaxed">
                  Dựa trên không gian của bạn, hệ thống tự động đề xuất gói <strong className="font-bold text-[#263b96]">{selectedTier.name}</strong>. Gói này hỗ trợ tối đa <strong className="font-bold text-[#263b96]">{selectedTier.zones} khu vực phát nhạc (zones)</strong> độc lập.
                </div>
              </div>
            </div>

            {/* BƯỚC 3: Thêm zone phụ */}
            <div className="pt-6 border-t border-[#e2e8f5]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="checkbox-extra-zones"
                    checked={hasExtraZones}
                    onChange={(e) => setHasExtraZones(e.target.checked)}
                    className="w-4.5 h-4.5 rounded bg-white border-[#e2e8f5] text-[#263b96] focus:ring-[#263b96] cursor-pointer accent-[#263b96]"
                  />
                  <label htmlFor="checkbox-extra-zones" className="text-sm font-bold text-[#0d1b3e] cursor-pointer">
                    Địa điểm có nhiều khu vực phát nhạc riêng biệt? (Multi-zone)
                  </label>
                </div>
                <span className="text-xs font-semibold text-[#0a5c30] bg-[#e8f9ee] px-2.5 py-1 rounded-full border border-[#bbf7d0] font-mono">
                  +99Kđ/zone/tháng
                </span>
              </div>
              <p className="text-xs text-[#5a6d9a] ml-6 mb-4 leading-relaxed">
                Phát các playlist khác nhau trong cùng một địa điểm (ví dụ: khu vực đón khách, phòng VIP, khu vực ngoài trời).
              </p>

              <AnimatePresence>
                {hasExtraZones && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden ml-6 bg-[#f5f7ff] p-4 rounded-2xl border border-[#e2e8f5] space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#5a6d9a]">Số lượng khu vực (zones) muốn mua thêm:</span>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setExtraZones(prev => Math.max(1, prev - 1))}
                          className="w-7 h-7 flex items-center justify-center bg-white border border-[#e2e8f5] rounded-lg hover:bg-[#f0f4ff] text-[#0d1b3e] cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-sm font-extrabold text-[#0d1b3e] w-6 text-center font-mono">{extraZones}</span>
                        <button
                          type="button"
                          onClick={() => setExtraZones(prev => Math.min(10, prev + 1))}
                          className="w-7 h-7 flex items-center justify-center bg-white border border-[#e2e8f5] rounded-lg hover:bg-[#f0f4ff] text-[#0d1b3e] cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="text-[11px] text-[#8a9ab5] font-mono">
                      Tổng số zones hoạt động thực tế: <strong className="text-[#0d1b3e]">{selectedTier.zones + extraZones} zones</strong> ({selectedTier.zones} kèm gói + {extraZones} mua thêm).
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* BƯỚC 4: Số địa điểm chi nhánh */}
            <div className="pt-6 border-t border-[#e2e8f5] space-y-4">
              <label className="block text-sm font-bold text-[#0d1b3e] uppercase tracking-wider font-mono">
                Bước 3: Số lượng địa điểm đăng ký
              </label>
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#f5f7ff] p-4 rounded-2xl border border-[#e2e8f5]">
                <div>
                  <div className="text-sm font-extrabold text-[#0d1b3e] flex items-center gap-1.5 font-mono">
                    {branches} địa điểm kinh doanh
                  </div>
                  <p className="text-xs text-[#5a6d9a] mt-0.5 leading-relaxed">
                    {branches <= 1 ? (
                      "Đăng ký từ 2 chi nhánh trở lên để nhận chiết khấu chuỗi sỉ tự động lên đến 38%"
                    ) : (
                      <span>
                        Áp dụng Chiết khấu chuỗi: <strong className="text-[#0a5c30] font-bold">-{Math.round(calcResult.chainDiscountPercent * 100)}%</strong>
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setBranches(prev => Math.max(currentCategory.isChain ? 2 : 1, prev - 1))}
                    className="w-10 h-10 flex items-center justify-center bg-white border border-[#e2e8f5] rounded-xl hover:bg-[#f0f4ff] text-[#0d1b3e] cursor-pointer font-extrabold"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    value={branches}
                    min={currentCategory.isChain ? 2 : 1}
                    max={100}
                    onChange={(e) => {
                      const val = Math.max(currentCategory.isChain ? 2 : 1, Math.min(100, Number(e.target.value) || 1));
                      setBranches(val);
                    }}
                    className="w-12 text-center font-mono font-extrabold text-base text-[#0d1b3e] bg-transparent focus:outline-none focus:ring-2 focus:ring-[#263b96] rounded-lg border border-[#e2e8f5] p-1 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setBranches(prev => Math.min(100, prev + 1))}
                    disabled={branches >= 100}
                    className="w-10 h-10 flex items-center justify-center bg-white border border-[#e2e8f5] rounded-xl hover:bg-[#f0f4ff] text-[#0d1b3e] disabled:opacity-50 cursor-pointer font-extrabold"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Slider kéo chọn nhanh số lượng chi nhánh */}
              <div className="px-1 py-1">
                <input
                  type="range"
                  min={currentCategory.isChain ? 2 : 1}
                  max="100"
                  step="1"
                  value={branches}
                  onChange={(e) => setBranches(Number(e.target.value))}
                  className="w-full h-2 bg-[#e2e8f5] rounded-lg appearance-none cursor-pointer accent-[#263b96]"
                />
                <div className="flex justify-between text-[10px] text-[#8a9ab5] font-mono px-1 mt-1">
                  <span>{currentCategory.isChain ? '2 chi nhánh' : '1 chi nhánh'}</span>
                  <span>10</span>
                  <span>25</span>
                  <span>50</span>
                  <span>100 chi nhánh</span>
                </div>
              </div>

              {/* Thẻ quy trình phê duyệt B2B chuyên nghiệp */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={`approval-banner-${branches}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className={`p-4 rounded-2xl border ${getApprovalLevel(branches).bgColor} ${getApprovalLevel(branches).borderColor} flex gap-3`}
                >
                  <AlertCircle className={`w-5 h-5 ${getApprovalLevel(branches).textColor} mt-0.5 flex-shrink-0`} />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h5 className={`text-xs font-extrabold uppercase tracking-wider font-mono ${getApprovalLevel(branches).textColor}`}>
                        Quy trình phê duyệt chuỗi
                      </h5>
                      <span className={`px-2.5 py-0.5 text-[9px] font-bold rounded-full border ${getApprovalLevel(branches).badgeColor} uppercase tracking-wider font-mono`}>
                        {getApprovalLevel(branches).level}
                      </span>
                    </div>
                    <p className={`text-xs mt-1.5 leading-relaxed opacity-90 ${getApprovalLevel(branches).textColor} font-medium`}>
                      {getApprovalLevel(branches).desc}
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* BƯỚC 5: Chu kỳ thanh toán */}
            <div className="pt-6 border-t border-[#e2e8f5]">
              <label className="block text-sm font-bold text-[#0d1b3e] uppercase tracking-wider mb-3 font-mono">
                Bước 4: Chu kỳ thanh toán áp dụng
              </label>
              <div className="grid grid-cols-2 gap-3 p-1.5 bg-[#f5f7ff] rounded-2xl border border-[#e2e8f5]">
                <button
                  type="button"
                  onClick={() => setPaymentCycle('monthly')}
                  className={`py-3 text-sm font-bold rounded-xl transition-all duration-200 cursor-pointer ${
                    paymentCycle === 'monthly'
                      ? 'bg-white text-[#263b96] shadow-xs border border-[#e2e8f5]'
                      : 'text-[#5a6d9a] hover:text-[#263b96]'
                  }`}
                >
                  Thanh toán Hàng tháng
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentCycle('yearly')}
                  className={`relative py-3 text-sm font-bold rounded-xl transition-all duration-200 cursor-pointer ${
                    paymentCycle === 'yearly'
                      ? 'bg-[#263b96] text-white shadow-sm'
                      : 'text-[#5a6d9a] hover:text-[#263b96]'
                  }`}
                >
                  Thanh toán Hàng năm
                  <span className="absolute -top-2.5 right-2 bg-[#59ca6d] text-[#0a3a12] text-[9px] px-2.5 py-0.5 rounded-full font-bold shadow-md uppercase tracking-wider font-mono">
                    Tiết kiệm 17%
                  </span>
                </button>
              </div>
            </div>

          </div>

          {/* CỘT PHẢI: BẢNG GIÁ & CTA (5 cột) */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-6">
            
            <div className="bg-[#ffffff] text-[#0d1b3e] rounded-3xl shadow-lg overflow-hidden border border-[#e2e8f5]">
              
              {/* Header Box */}
              <div className="p-6 bg-[#f5f7ff] border-b border-[#e2e8f5] flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#0a5c30] font-mono">
                      Báo giá từ AudioBay
                    </h3>
                    <p className="text-sm text-[#5a6d9a] font-medium mt-0.5">
                      Gói tối ưu: <span className="text-[#263b96] font-extrabold">{selectedTier.name}</span>
                    </p>
                  </div>
                </div>
                <span className="text-2xl bg-white w-10 h-10 rounded-full shadow-xs flex items-center justify-center" role="img" aria-label={activeCalcCategory.name}>
                  {activeCalcCategory.icon}
                </span>
              </div>

              {/* Giá cả & Thông số chính */}
              <div className="p-6 sm:p-8 space-y-6">
                
                {/* HIỂN THỊ NẾU LÀ GÓI LIÊN HỆ TRỰC TIẾP */}
                {calcResult.contactOnly ? (
                  <div className="space-y-4">
                    <div className="bg-[#f5f7ff] border border-[#e2e8f5] rounded-2xl p-5 text-center space-y-2">
                      <div className="text-sm font-bold text-[#0a5c30] uppercase tracking-wide font-mono">Giải pháp Enterprise</div>
                      <div className="text-2xl font-black text-[#0d1b3e]">BÁO GIÁ THEO YÊU CẦU</div>
                      <p className="text-xs text-[#5a6d9a] leading-relaxed">
                        Mô hình của bạn có quy mô đặc thù hoặc vượt quá giới hạn tính phí thông thường. Hãy liên hệ trực tiếp để được kỹ thuật viên khảo sát hạ tầng âm thanh và báo giá may đo.
                      </p>
                    </div>

                    <div className="space-y-2.5">
                      <a
                        href={`tel:${company.phone.replace(/\s+/g, '')}`}
                        className="flex items-center justify-center gap-2 w-full py-3.5 bg-[#59ca6d] hover:bg-[#3da854] text-[#0a3a12] font-bold text-sm rounded-xl transition-all shadow-lg hover:shadow-[#59ca6d]/20 cursor-pointer"
                      >
                        <Phone className="w-4 h-4" /> Gọi ngay: {company.phone}
                      </a>
                      <a
                        href={`mailto:${company.email}?subject=Yêu cầu báo giá đặc biệt cho ${activeCalcCategory.name}`}
                        className="flex items-center justify-center gap-2 w-full py-3.5 bg-[#f5f7ff] border border-[#e2e8f5] hover:bg-[#f0f4ff] text-[#263b96] font-bold text-sm rounded-xl transition-all cursor-pointer"
                      >
                        <Mail className="w-4 h-4 text-[#263b96]" /> Gửi email: {company.email}
                      </a>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Bảng giá trực tiếp với cơ chế Neo giá thông minh */}
                    <div className="text-center bg-[#f0f9f4]/60 border border-[#bbf7d0]/40 rounded-2xl p-5 mb-2 shadow-xs">
                      <div className="text-xs font-extrabold text-[#0a5c30] uppercase tracking-wider mb-2 font-mono">
                        Tổng cộng thanh toán
                      </div>
                      
                      {calcResult.originalTotalAmount > calcResult.totalAmount ? (
                        <div className="space-y-1">
                          {/* Khu vực mỏ neo giá gốc */}
                          <div className="flex items-center justify-center gap-1.5">
                            <span className="text-xs line-through text-[#8fa0c5] font-mono font-medium">
                              {formatVND(calcResult.originalTotalAmount)}
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase font-mono tracking-tight animate-pulse">
                              Ưu đãi kép tích lũy {Math.round((calcResult.originalTotalAmount - calcResult.totalAmount) / calcResult.originalTotalAmount * 100)}%
                            </span>
                          </div>
                          
                          {/* Giá chính thức sau chiết khấu */}
                          <div className="text-3xl sm:text-4xl font-black tracking-tight text-emerald-600 font-mono">
                            {formatVND(calcResult.totalAmount)}
                          </div>
                        </div>
                      ) : (
                        <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0d1b3e] font-mono">
                          {formatVND(calcResult.totalAmount)}
                        </div>
                      )}

                      <div className="text-[10px] text-[#5a6d9a] font-medium mt-2 leading-relaxed">
                        Chính sách ưu đãi áp dụng: <br />
                        <span className="text-emerald-700 font-extrabold">
                          {paymentCycle === 'yearly' && calcResult.chainDiscountPercent > 0 
                            ? `Gói Năm & Chiết khấu hệ thống ${branches} chi nhánh (Giảm kép)` 
                            : paymentCycle === 'yearly' 
                              ? 'Ưu đãi đóng phí năm' 
                              : calcResult.chainDiscountPercent > 0 
                                ? `Chiết khấu hệ thống ${branches} chi nhánh` 
                                : 'Đơn giá sỉ tiêu chuẩn'}
                        </span>
                      </div>
                      
                      {/* Huy hiệu tiết kiệm nếu có */}
                      {calcResult.saving > 0 && (
                        <div className="inline-flex flex-col items-center gap-0.5 mt-3 px-3.5 py-1.5 bg-emerald-50 text-emerald-800 text-[10px] font-extrabold rounded-xl border border-emerald-200/60 font-mono w-full max-w-[280px] mx-auto">
                          <div className="flex items-center gap-1">
                            <Check className="w-3 h-3 text-emerald-600" /> TIẾT KIỆM {formatVND(calcResult.saving)}{paymentCycle === 'yearly' ? ' / năm' : ' / tháng'}
                          </div>
                          <span className="text-[8.5px] font-normal text-emerald-600/70 italic font-sans">(Đã tối ưu trực tiếp vào tổng thanh toán)</span>
                        </div>
                      )}
                    </div>

                    {/* Breakdown chi tiết các khoản phí */}
                    <div className="space-y-3 pt-6 border-t border-[#e2e8f5] text-xs">
                      
                      <div className="flex justify-between items-center text-[#5a6d9a]">
                        <span>Giá gói gốc ({selectedTier.name}):</span>
                        <span className="font-semibold text-[#0d1b3e] font-mono">{formatVND(calcResult.basePrice)}/tháng/cơ sở</span>
                      </div>

                      {hasExtraZones && (
                        <div className="flex justify-between items-center text-[#5a6d9a]">
                          <span>Phí thêm {extraZones} zones:</span>
                          <span className="font-semibold text-[#0d1b3e] font-mono">+{formatVND(calcResult.zoneAddon)}/tháng/cơ sở</span>
                        </div>
                      )}

                      <div className="flex justify-between items-center text-[#5a6d9a]">
                        <span>Số địa điểm:</span>
                        <span className="font-semibold text-[#0d1b3e] font-mono">x {branches} chi nhánh</span>
                      </div>

                      {/* Tổng chiết khấu tích lũy gộp theo Phương án C */}
                      {calcResult.originalTotalAmount > calcResult.totalAmount && (
                        <div className="flex justify-between items-center text-[#0a5c30] font-bold">
                          <span>Tổng chiết khấu áp dụng:</span>
                          <span className="font-mono">
                            -{Math.round((calcResult.originalTotalAmount - calcResult.totalAmount) / calcResult.originalTotalAmount * 100)}% (đã áp dụng)
                          </span>
                        </div>
                      )}

                      {/* Cấp duyệt yêu cầu */}
                      <div className="flex justify-between items-center text-[#5a6d9a] pt-1 border-t border-dashed border-[#e2e8f5]">
                        <span>Cấp phê duyệt đề xuất:</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${getApprovalLevel(branches).badgeColor}`}>
                          {getApprovalLevel(branches).level}
                        </span>
                      </div>

                      <div className="pt-3 border-t border-[#e2e8f5] flex justify-between items-center font-bold text-sm">
                        <span>Đơn giá trung bình / cơ sở:</span>
                        <span className="text-[#0a5c30] font-mono">
                          {formatVND(Math.round(calcResult.totalAmount / (paymentCycle === 'yearly' ? 12 : 1) / branches))}/tháng
                        </span>
                      </div>
                    </div>

                    {/* Nút Xuất PDF / Gửi form */}
                    <button
                      type="button"
                      onClick={() => {
                        setSubmitSuccess(false);
                        setCreatedRequestCode('');
                        setShowModal(true);
                      }}
                      className="flex items-center justify-center gap-2 w-full py-4 bg-[#59ca6d] hover:bg-[#3da854] text-[#0a3a12] font-black text-sm rounded-xl transition-all shadow-lg hover:shadow-[#59ca6d]/15 uppercase tracking-wider cursor-pointer"
                    >
                      <FileText className="w-4.5 h-4.5" />
                      Xuất báo giá PDF bản quyền
                    </button>
                  </>
                )}

                {/* Danh sách tính năng của gói */}
                <div className="pt-6 border-t border-[#e2e8f5]">
                  <h4 className="text-xs font-bold text-[#5a6d9a] uppercase tracking-wider mb-3 font-mono">
                    Tính năng gói {selectedTier.name} bao gồm:
                  </h4>
                  <ul className="space-y-2.5">
                    {dynamicFeaturesOfSelectedTier.slice(0, 6).map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-[#0d1b3e]">
                        <Check className="w-3.5 h-3.5 text-[#0a5c30] mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>
              
            </div>

            {/* Thông tin hỗ trợ nhanh */}
            <div className="bg-[#ffffff] rounded-2xl border border-[#e2e8f5] p-5 flex items-start gap-3 shadow-xs">
              <Phone className="w-5 h-5 text-[#263b96] mt-0.5 flex-shrink-0" />
              <div>
                <h5 className="text-sm font-bold text-[#0d1b3e]">Liên hệ trực tiếp hỗ trợ kỹ thuật</h5>
                <p className="text-xs text-[#5a6d9a] mt-1">
                  Đội ngũ AudioBay hỗ trợ đo đạc, lập phương án âm thanh đa vùng miễn phí 24/7 toàn quốc.
                </p>
                <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold text-[#263b96] font-mono">
                  <span>Hotline: {company.phone}</span>
                  <span>Email: {company.email}</span>
                </div>
              </div>
            </div>

          </div>

        </div>
        )}

      </div>

      {/* MODAL THÔNG TIN KHÁCH HÀNG ĐỂ XUẤT PDF HOẶC GỬI YÊU CẦU */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
            {/* Background Backdrop */}
            <div 
              className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity" 
              onClick={() => setShowModal(false)}
            />

            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative transform overflow-hidden rounded-3xl bg-[#ffffff] text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg border border-[#e2e8f5]"
              >
                {/* Header */}
                <div className="bg-[#f5f7ff] px-6 py-4 flex justify-between items-center text-[#0d1b3e] border-b border-[#e2e8f5]">
                  <div>
                    <h3 className="text-base font-bold font-mono">Yêu cầu báo giá & Giải pháp</h3>
                    <p className="text-xs text-[#5a6d9a] mt-0.5">Nhập thông tin đồng bộ trực tiếp tới hệ thống AudioBay</p>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setShowModal(false)}
                    className="text-[#5a6d9a] hover:text-[#0d1b3e] font-semibold text-lg cursor-pointer bg-transparent border-none"
                  >
                    ✕
                  </button>
                </div>

                {submitSuccess ? (
                  /* SUCCESS VIEW */
                  <div className="p-8 text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-100">
                      <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                    </div>
                    <div className="space-y-1.5">
                      <h4 className="text-lg font-black text-emerald-600 uppercase tracking-tight">Gửi yêu cầu thành công!</h4>
                      <p className="text-xs font-bold text-[#5a6d9a] font-mono uppercase">Mã số: {createdRequestCode}</p>
                    </div>
                    <p className="text-sm text-[#0d1b3e] leading-relaxed max-w-sm mx-auto">
                      Thông tin yêu cầu của quý khách đã được đồng bộ trực tiếp tới bộ phận Admin của <strong>AudioBay</strong>. Chúng tôi sẽ nhanh chóng soạn báo giá chiết khấu đặc biệt riêng và phản hồi trong vòng 24h.
                    </p>
                    <div className="pt-4 border-t border-[#e2e8f5] flex flex-col sm:flex-row gap-3 justify-center">
                      <button
                        type="button"
                        onClick={() => handleExportPDF()}
                        className="px-5 py-2.5 text-xs font-bold text-[#263b96] bg-[#f0f4ff] hover:bg-[#e2e8f5] rounded-xl flex items-center justify-center gap-1.5 cursor-pointer border-none"
                      >
                        <FileText className="w-4 h-4" />
                        Tải PDF tham khảo ngay
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowModal(false)}
                        className="px-5 py-2.5 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl cursor-pointer border-none"
                      >
                        Đồng ý & Đóng [✕]
                      </button>
                    </div>
                  </div>
                ) : (
                  /* FORM VIEW */
                  <form onSubmit={handleSubmitRequest} className="p-6 space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-[#5a6d9a] uppercase tracking-wider mb-1 font-mono">
                        Tên người nhận báo giá <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ví dụ: Nguyễn Văn A"
                        value={customerInfo.name}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full text-sm bg-white border border-[#e2e8f5] text-[#0d1b3e] rounded-xl p-2.5 focus:ring-2 focus:ring-[#263b96] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#5a6d9a] uppercase tracking-wider mb-1 font-mono">
                        Tên Cơ sở / Doanh nghiệp <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ví dụ: Cà phê Thảnh Thơi"
                        value={customerInfo.company}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, company: e.target.value }))}
                        className="w-full text-sm bg-white border border-[#e2e8f5] text-[#0d1b3e] rounded-xl p-2.5 focus:ring-2 focus:ring-[#263b96] focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-[#5a6d9a] uppercase tracking-wider mb-1 font-mono">
                          Số điện thoại <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          required
                          placeholder="Ví dụ: 0912345xxx"
                          value={customerInfo.phone}
                          onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                          className="w-full text-sm bg-white border border-[#e2e8f5] text-[#0d1b3e] rounded-xl p-2.5 focus:ring-2 focus:ring-[#263b96] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#5a6d9a] uppercase tracking-wider mb-1 font-mono">
                          Địa chỉ Email
                        </label>
                        <input
                          type="email"
                          placeholder="Ví dụ: abc@company.com"
                          value={customerInfo.email}
                          onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full text-sm bg-white border border-[#e2e8f5] text-[#0d1b3e] rounded-xl p-2.5 focus:ring-2 focus:ring-[#263b96] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#5a6d9a] uppercase tracking-wider mb-1 font-mono">
                        Yêu cầu đặc biệt hoặc ghi chú thêm
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Ví dụ: Cần playlist nhạc Jazz cổ điển riêng biệt cho phòng VIP..."
                        value={customerInfo.notes}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, notes: e.target.value }))}
                        className="w-full text-sm bg-white border border-[#e2e8f5] text-[#0d1b3e] rounded-xl p-2.5 focus:ring-2 focus:ring-[#263b96] focus:outline-none"
                      />
                    </div>

                    <div className="p-3 bg-[#f0f4ff] border border-blue-100 rounded-xl text-[11px] text-[#263b96] leading-relaxed">
                      💡 <strong>Yên tâm gửi thông tin:</strong> Hệ thống của chúng tôi bảo mật và đồng bộ hóa tức thì với bảng quản trị admin của AudioBay để chuyên viên hỗ trợ soạn báo giá tối ưu nhất cho bạn.
                    </div>

                    <div className="pt-4 border-t border-[#e2e8f5] flex flex-col sm:flex-row gap-3 justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          handleExportPDF();
                          setShowModal(false);
                        }}
                        className="px-4 py-2.5 text-xs font-bold text-[#5a6d9a] hover:text-[#0d1b3e] bg-white border border-[#e2e8f5] rounded-xl cursor-pointer"
                      >
                        Chỉ tải PDF tham khảo
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2.5 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer border-none"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Gửi yêu cầu tới AudioBay
                      </button>
                    </div>
                  </form>
                )}
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

    </section>
  );
}
