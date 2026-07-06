/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Lock, 
  Settings, 
  Eye, 
  EyeOff, 
  Plus, 
  Trash2, 
  Save, 
  Printer, 
  ChevronRight, 
  HelpCircle,
  Building,
  DollarSign,
  Briefcase,
  Layers,
  Sparkles,
  Info,
  ArrowUp,
  ArrowDown,
  BarChart3,
  Package,
  MessageSquare,
  BookOpen,
  Sliders,
  Download,
  Upload,
  RefreshCw,
  CheckCircle,
  Star,
  Users,
  ClipboardList,
  Bot,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Power,
  Key,
  Copy,
  LockKeyhole,
  Shield,
  Database,
  Wifi
} from 'lucide-react';
import { COMPANY, INTERNAL_GUIDE, INITIAL_FAQS, defaultPackagesAdmin, CATEGORIES, INITIAL_TESTIMONIALS } from '../initialData';
import { PackagesAdminData, PackageCardConfig, FeatureRow, Category, Tier, QuoteRequest, QuoteParams, Technician } from '../types';
import { exportQuoteToPDF } from '../utils/exportPDF';
import { calculatePrice, autoSelectTier } from '../utils/priceCalculator';
import AIConsultant from './AIConsultant';

interface AdminPanelProps {
  company: any;
  onCompanyUpdate: (updated: any) => void;
  faqs: any[];
  onFaqsUpdate: (updated: any[]) => void;
  banner: any;
  onBannerUpdate: (updated: any) => void;
  packagesAdmin: PackagesAdminData;
  onSavePackages: (updated: PackagesAdminData) => void;
  pricingData: Category[];
  onPricingDataUpdate: (updated: Category[]) => void;
  reviews: any[];
  onReviewsUpdate: (updated: any[]) => void;
  quoteRequests?: QuoteRequest[];
  onSaveQuoteRequests?: (updated: QuoteRequest[]) => void;
  technicians?: any[];
  onSaveTechnicians?: (updated: any[]) => void;
  airtableConfig?: any;
  onAirtableConfigUpdate?: (updated: any) => void;
}

const formatVND = (num: number): string => {
  return num.toLocaleString('vi-VN') + ' VNĐ';
};

export default function AdminPanel({ 
  company, 
  onCompanyUpdate, 
  faqs, 
  onFaqsUpdate, 
  banner, 
  onBannerUpdate,
  packagesAdmin,
  onSavePackages,
  pricingData,
  onPricingDataUpdate,
  reviews,
  onReviewsUpdate,
  quoteRequests = [],
  onSaveQuoteRequests,
  technicians = [],
  onSaveTechnicians,
  airtableConfig = { active: false, integrationType: 'api', embedUrl: '', apiKey: '', baseId: '', tableName: '' },
  onAirtableConfigUpdate,
}: AdminPanelProps) {
  // Trạng thái hiển thị modal admin chính
  const [isOpen, setIsOpen] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('audiobay_admin_is_open') === 'true';
    } catch {
      return false;
    }
  });
  
  // Trạng thái đăng nhập
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('audiobay_admin_authenticated') === 'true';
    } catch {
      return false;
    }
  });
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string>('');

  // Trạng thái vai trò của người dùng hiện tại (Phục vụ phân quyền kỹ thuật kỹ lưỡng)
  const [currentUserRole, setCurrentUserRole] = useState<'admin' | 'tech_admin' | 'tech_operator' | 'support_tech'>(() => {
    try {
      return (sessionStorage.getItem('audiobay_admin_role') as any) || 'admin';
    } catch {
      return 'admin';
    }
  });

  const isMasterAdminOnly = currentUserRole === 'admin';

  const [currentUserEmail, setCurrentUserEmail] = useState<string>(() => {
    try {
      return sessionStorage.getItem('audiobay_admin_email') || 'admin@audiobay.vn';
    } catch {
      return 'admin@audiobay.vn';
    }
  });

  // Chế độ đăng nhập: 'password' (Admin chính) hoặc 'technician' (Kỹ thuật viên chia sẻ)
  const [loginMode, setLoginMode] = useState<'password' | 'technician'>('password');
  const [techEmailInput, setTechEmailInput] = useState<string>('');
  const [techPasskeyInput, setTechPasskeyInput] = useState<string>('');

  // Form mời kỹ thuật viên mới
  const [newTechEmail, setNewTechEmail] = useState<string>('');
  const [newTechName, setNewTechName] = useState<string>('');
  const [newTechRole, setNewTechRole] = useState<'tech_admin' | 'tech_operator' | 'support_tech'>('tech_admin');
  const [recentlyCreatedTech, setRecentlyCreatedTech] = useState<any | null>(null);

  // Copy feedback state
  const [copiedTechId, setCopiedTechId] = useState<string | null>(null);

  // Lấy mật khẩu hiện tại trong hệ thống
  const getSystemPassword = (): string => {
    return localStorage.getItem('audiobay_admin_password') || 'audiobay2025';
  };

  // Quản lý Tabs trong Admin Panel
  const [activeTab, setActiveTab] = useState<string>(() => {
    try {
      return sessionStorage.getItem('audiobay_admin_active_tab') || 'overview';
    } catch {
      return 'overview';
    }
  });

  // Lưu trạng thái vào sessionStorage khi thay đổi
  useEffect(() => {
    try {
      sessionStorage.setItem('audiobay_admin_is_open', isOpen ? 'true' : 'false');
    } catch {}
  }, [isOpen]);

  useEffect(() => {
    try {
      sessionStorage.setItem('audiobay_admin_authenticated', isAuthenticated ? 'true' : 'false');
    } catch {}
  }, [isAuthenticated]);

  useEffect(() => {
    try {
      sessionStorage.setItem('audiobay_admin_active_tab', activeTab);
    } catch {}
  }, [activeTab]);

  useEffect(() => {
    try {
      sessionStorage.setItem('audiobay_admin_role', currentUserRole);
    } catch {}
  }, [currentUserRole]);

  useEffect(() => {
    try {
      sessionStorage.setItem('audiobay_admin_email', currentUserEmail);
    } catch {}
  }, [currentUserEmail]);

  // Trạng thái chỉnh sửa cục bộ (Cloned states khi mở modal)
  const [editedCompany, setEditedCompany] = useState<any>(company);
  const [editedFaqs, setEditedFaqs] = useState<any[]>(faqs);
  const [editedBanner, setEditedBanner] = useState<any>(banner);
  const [editedPackagesAdmin, setEditedPackagesAdmin] = useState<PackagesAdminData>(packagesAdmin);
  const [editedPricingData, setEditedPricingData] = useState<Category[]>(pricingData);
  const [editedReviews, setEditedReviews] = useState<any[]>(reviews);
  const [editedAirtableConfig, setEditedAirtableConfig] = useState<any>(() => airtableConfig || {
    active: false,
    integrationType: 'api',
    embedUrl: '',
    token: '',
    baseId: '',
    tableName: ''
  });

  // Sync state của các trường chỉnh sửa mỗi khi modal mở ra hoặc dữ liệu gốc thay đổi
  useEffect(() => {
    if (isOpen) {
      setEditedCompany(company);
      setEditedFaqs(faqs);
      setEditedBanner(banner);
      setEditedPackagesAdmin(packagesAdmin);
      setEditedPricingData(pricingData);
      setEditedReviews(reviews);
      setEditedAirtableConfig(airtableConfig || {
        active: false,
        integrationType: 'api',
        embedUrl: '',
        token: '',
        baseId: '',
        tableName: ''
      });
    }
  }, [isOpen, company, faqs, banner, packagesAdmin, pricingData, reviews, airtableConfig]);

  // Quản lý Category đang chỉnh sửa trong Tab 2
  const [selectedCatIdToEdit, setSelectedCatIdToEdit] = useState<string>('cafe');

  const currentCatToEdit = useMemo(() => {
    return editedPricingData.find(c => c.id === selectedCatIdToEdit) || editedPricingData[0];
  }, [editedPricingData, selectedCatIdToEdit]);

  // Trạng thái tìm kiếm và bộ lọc cho Yêu cầu báo giá
  const [filterStatus, setFilterStatus] = useState<'all' | 'new' | 'processed' | 'declined'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [editingNotesRequestId, setEditingNotesRequestId] = useState<string>('');
  const [editingNotesValue, setEditingNotesValue] = useState<string>('');

  // Quản lý sub-tab cho Tab 5 (Đánh giá & FAQ)
  const [tab5SubMode, setTab5SubMode] = useState<'reviews' | 'faqs'>('reviews');

  // Trạng thái kiểm tra kết nối & lưu Airtable
  const [isTestingAirtable, setIsTestingAirtable] = useState(false);
  const [airtableTestResult, setAirtableTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showAirtableToken, setShowAirtableToken] = useState(false);

  // Trạng thái đổi mật khẩu trong Tab 7
  const [oldPassword, setOldPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmNewPassword, setConfirmNewPassword] = useState<string>('');
  const [passwordChangeMsg, setPasswordChangeMsg] = useState<{ text: string; error: boolean } | null>(null);

  // Trạng thái cho tính năng AI tự viết đánh giá
  const [isGeneratingReviews, setIsGeneratingReviews] = useState<boolean>(false);
  const [aiAutoUpdateWeekly, setAiAutoUpdateWeekly] = useState<boolean>(() => {
    try {
      return localStorage.getItem('audiobay_ai_auto_update_reviews') === 'true';
    } catch {
      return false;
    }
  });
  const [aiGenerationError, setAiGenerationError] = useState<string>('');

  // Form thêm FAQ mới
  const [newFaqQ, setNewFaqQ] = useState<string>('');
  const [newFaqA, setNewFaqA] = useState<string>('');

  // Form thêm Đánh giá mới
  const [newRevName, setNewRevName] = useState<string>('');
  const [newRevRole, setNewRevRole] = useState<string>('');
  const [newRevAvatar, setNewRevAvatar] = useState<string>('');
  const [newRevContent, setNewRevContent] = useState<string>('');
  const [newRevRating, setNewRevRating] = useState<number>(5);

  // Form thêm Mô hình kinh doanh mới (Version 3)
  const [showAddCatForm, setShowAddCatForm] = useState<boolean>(false);
  const [newCatName, setNewCatName] = useState<string>('');
  const [newCatIcon, setNewCatIcon] = useState<string>('💼');
  const [newCatInputType, setNewCatInputType] = useState<'area' | 'rooms'>('area');
  const [newCatLabel, setNewCatLabel] = useState<string>('m²');
  const [newCatDesc, setNewCatDesc] = useState<string>('');

  // Trạng thái cho tab 9: Báo giá Chuỗi & Enterprise (Dành cho nội bộ)
  const [calcCatId, setCalcCatId] = useState<string>('cafe');
  const [calcInputValue, setCalcInputValue] = useState<number>(60);
  const [calcExtraZones, setCalcExtraZones] = useState<number>(0);
  const [calcBranches, setCalcBranches] = useState<number>(6); // mặc định 6 chi nhánh để kích hoạt discount > 5
  const [calcPaymentCycle, setCalcPaymentCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [calcContractDuration, setCalcContractDuration] = useState<'1year' | '2year' | '3year'>('2year');
  const [calcCustomBasePrice, setCalcCustomBasePrice] = useState<number | ''>('');
  
  const [hasCuration, setHasCuration] = useState<boolean>(false);
  const [hasDedicatedAM, setHasDedicatedAM] = useState<boolean>(false);
  const [hasPrioritySLA, setHasPrioritySLA] = useState<boolean>(false);
  const [hasOnboarding, setHasOnboarding] = useState<boolean>(false);
  
  const [curationPrice, setCurationPrice] = useState<number>(3000000);
  const [dedicatedAMPrice, setDedicatedAMPrice] = useState<number>(500000);
  const [prioritySLAPrice, setPrioritySLAPrice] = useState<number>(300000);
  const [onboardingPrice, setOnboardingPrice] = useState<number>(1000000);
  
  const [custName, setCustName] = useState<string>('');
  const [custCompany, setCustCompany] = useState<string>('');
  const [custPhone, setCustPhone] = useState<string>('');
  const [custEmail, setCustEmail] = useState<string>('');
  const [custNotes, setCustNotes] = useState<string>('');

  // Trạng thái cho hộp thoại thông báo/xác nhận tùy chỉnh
  const [customDialog, setCustomDialog] = useState<{
    isOpen: boolean;
    type: 'confirm' | 'alert';
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
  }>({
    isOpen: false,
    type: 'alert',
    title: '',
    message: '',
    confirmText: 'Đồng ý',
    cancelText: 'Hủy bỏ'
  });

  const showCustomAlert = (title: string, message: string, onConfirm?: () => void) => {
    setCustomDialog({
      isOpen: true,
      type: 'alert',
      title,
      message,
      confirmText: 'Đồng ý',
      onConfirm: () => {
        setCustomDialog(prev => ({ ...prev, isOpen: false }));
        if (onConfirm) onConfirm();
      }
    });
  };

  const showCustomConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText = 'Xác nhận',
    cancelText = 'Hủy bỏ'
  ) => {
    setCustomDialog({
      isOpen: true,
      type: 'confirm',
      title,
      message,
      confirmText,
      cancelText,
      onConfirm: () => {
        setCustomDialog(prev => ({ ...prev, isOpen: false }));
        onConfirm();
      },
      onCancel: () => {
        setCustomDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Đăng nhập
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginMode === 'password') {
      if (passwordInput === getSystemPassword()) {
        setIsAuthenticated(true);
        setCurrentUserRole('admin');
        setCurrentUserEmail('admin@audiobay.vn');
        setLoginError('');
        setPasswordInput('');
      } else {
        setLoginError('Mật khẩu quản trị chưa chính xác. Vui lòng thử lại!');
      }
    } else {
      // Đăng nhập Kỹ thuật viên bằng Email & Mã Passkey
      const emailLower = techEmailInput.trim().toLowerCase();
      const passkeyTrimmed = techPasskeyInput.trim();
      
      if (!emailLower || !passkeyTrimmed) {
        setLoginError('Vui lòng điền đầy đủ Email và mã Passkey kỹ thuật.');
        return;
      }
      
      const matchedTech = technicians.find(
        tech => tech.email.toLowerCase() === emailLower && tech.passkey === passkeyTrimmed
      );
      
      if (matchedTech) {
        if (matchedTech.status === 'suspended') {
          setLoginError('Tài khoản kỹ thuật viên này đang bị tạm khóa. Vui lòng liên hệ Admin chính!');
          return;
        }
        
        setIsAuthenticated(true);
        setCurrentUserRole(matchedTech.role);
        setCurrentUserEmail(matchedTech.email);
        setLoginError('');
        setTechEmailInput('');
        setTechPasskeyInput('');
        
        // Cập nhật lastUsedAt và sync lên server
        const updatedTechs = technicians.map(tech => {
          if (tech.id === matchedTech.id) {
            return { ...tech, lastUsedAt: new Date().toISOString() };
          }
          return tech;
        });
        if (onSaveTechnicians) {
          onSaveTechnicians(updatedTechs);
        }
        
        // Điều hướng thông minh nếu là kỹ thuật viên hỗ trợ
        if (matchedTech.role === 'support_tech') {
          setActiveTab('feedback-faq');
        } else {
          setActiveTab('overview');
        }
      } else {
        setLoginError('Không tìm thấy kỹ thuật viên hợp lệ với thông tin trên. Vui lòng thử lại!');
      }
    }
  };

  // Đăng xuất
  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUserRole('admin');
    setCurrentUserEmail('admin@audiobay.vn');
    setActiveTab('overview');
    try {
      sessionStorage.removeItem('audiobay_admin_authenticated');
      sessionStorage.removeItem('audiobay_admin_role');
      sessionStorage.removeItem('audiobay_admin_email');
    } catch {}
  };

  // Trình xử lý xuất PDF trực tiếp từ yêu cầu lưu trữ
  const handleExportPdfFromRequest = (req: QuoteRequest) => {
    const cat = pricingData.find(c => c.id === req.categoryId) || pricingData[0];
    const tier: Tier = cat.tiers.find(t => t.zones === req.zones) || cat.tiers[0] || {
      id: 'custom',
      name: 'Custom Tier',
      zones: req.zones,
      area: `${req.inputValue} ${req.inputLabel}`,
      price_month: req.estimatedPriceMonthly,
      notes: '',
      features: []
    };

    const extraZones = req.zones > tier.zones ? req.zones - tier.zones : 0;
    const calcResult = calculatePrice({
      category: cat,
      tier: tier,
      inputValue: req.inputValue,
      extraZones: extraZones,
      branches: req.branches,
      paymentCycle: req.paymentCycle,
      isInternal: true,
    });

    const quoteParams: QuoteParams = {
      category: cat,
      tier: tier,
      inputValue: req.inputValue,
      extraZones: extraZones,
      branches: req.branches,
      paymentCycle: req.paymentCycle,
      chainDiscount: calcResult.chainDiscountPercent,
      basePrice: tier.price_month,
      zoneAddon: calcResult.zoneAddon,
      totalAmount: req.paymentCycle === 'yearly' ? req.estimatedPriceYearly / 12 : req.estimatedPriceMonthly,
      saving: calcResult.saving,
      customerInfo: req.customerInfo,
      quoteDate: req.createdAt,
      validUntil: (() => {
        try {
          const parts = req.createdAt.split('/');
          if (parts.length === 3) {
            const d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
            d.setDate(d.getDate() + 30);
            return d.toLocaleDateString('vi-VN');
          }
        } catch (e) {}
        return req.createdAt;
      })(),
      company: company,
    };

    exportQuoteToPDF(quoteParams);
  };

  // Trình xử lý lưu ghi chú Admin
  const handleSaveRequestNotes = (id: string, notes: string) => {
    const updated = quoteRequests.map(r => r.id === id ? { ...r, adminNotes: notes } : r);
    if (onSaveQuoteRequests) {
      onSaveQuoteRequests(updated);
    }
    setEditingNotesRequestId('');
  };

  // 1. TỔNG QUAN STATS CALCULATIONS
  const totalCategoriesCount = useMemo(() => {
    return editedPricingData.filter(c => !c.isChain).length;
  }, [editedPricingData]);

  const totalPricingTiersCount = useMemo(() => {
    return editedPricingData.reduce((acc, c) => acc + c.tiers.length, 0);
  }, [editedPricingData]);

  const lowestPriceMonth = useMemo(() => {
    let min = Infinity;
    editedPricingData.forEach(c => {
      c.tiers.forEach(t => {
        if (t.price_month && t.price_month < min) {
          min = t.price_month;
        }
      });
    });
    return min === Infinity ? 0 : min;
  }, [editedPricingData]);

  const highestPriceMonth = useMemo(() => {
    let max = 0;
    editedPricingData.forEach(c => {
      c.tiers.forEach(t => {
        if (t.price_month && t.price_month > max) {
          max = t.price_month;
        }
      });
    });
    return max;
  }, [editedPricingData]);

  const categoryAverageStats = useMemo(() => {
    return editedPricingData.filter(c => !c.isChain).map(c => {
      const prices = c.tiers.map(t => t.price_month).filter(p => p && p > 0);
      const min = prices.length ? Math.min(...prices) : 0;
      const max = prices.length ? Math.max(...prices) : 0;
      const avg = prices.length ? Math.round(prices.reduce((sum, p) => sum + p, 0) / prices.length) : 0;
      return {
        id: c.id,
        name: c.name,
        icon: c.icon,
        count: c.tiers.length,
        min,
        max,
        avg
      };
    });
  }, [editedPricingData]);

  // 2. BẢNG GIÁ ACTIONS
  const handleUpdateCategoryFields = (catId: string, field: string, value: any) => {
    setEditedPricingData(prev => prev.map(c => c.id === catId ? { ...c, [field]: value } : c));
  };

  const handleUpdateTierValue = (catId: string, tierIndex: number, field: string, value: any) => {
    setEditedPricingData(prev => prev.map(c => {
      if (c.id === catId) {
        const updatedTiers = [...c.tiers];
        updatedTiers[tierIndex] = { ...updatedTiers[tierIndex], [field]: value };
        return { ...c, tiers: updatedTiers };
      }
      return c;
    }));
  };

  const handleAddTierToCategory = (catId: string) => {
    setEditedPricingData(prev => prev.map(c => {
      if (c.id === catId) {
        const newTier: Tier = {
          id: `tier_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: `Phân khúc ${c.tiers.length + 1}`,
          area: c.inputType === 'area' ? '80 - 120 m²' : '30 - 50 phòng',
          areaMin: c.inputType === 'area' ? 80 : 30,
          areaMax: c.inputType === 'area' ? 120 : 50,
          zones: 1,
          price_month: 250000,
          notes: '',
          features: []
        };
        return { ...c, tiers: [...c.tiers, newTier] };
      }
      return c;
    }));
  };

  const handleDeleteTierFromCategory = (catId: string, tierIndex: number) => {
    const category = editedPricingData.find(c => c.id === catId);
    if (category) {
      if (category.tiers.length <= 1) {
        showCustomAlert('Cảnh báo', 'Mỗi lĩnh vực kinh doanh cần có ít nhất một phân khúc biểu giá!');
        return;
      }
      showCustomConfirm(
        'Xóa phân khúc',
        `Bạn có chắc chắn muốn xóa phân khúc "${category.tiers[tierIndex]?.name || 'này'}"?`,
        () => {
          setEditedPricingData(prev => prev.map(c => {
            if (c.id === catId) {
              const updatedTiers = c.tiers.filter((_, idx) => idx !== tierIndex);
              return { ...c, tiers: updatedTiers };
            }
            return c;
          }));
        }
      );
    }
  };

  const handleSavePricingData = () => {
    if (currentUserRole === 'tech_operator') {
      showCustomAlert('Hạn chế quyền', '🔒 Tài khoản của bạn ở chế độ Tech Operator (Chỉ Xem). Không có quyền thay đổi cấu hình hệ thống!');
      return;
    }
    if (currentUserRole === 'support_tech') {
      showCustomAlert('Hạn chế quyền', '🔒 Tài khoản của bạn ở chế độ Support Tech. Chỉ được phép phản hồi Đánh giá và cập nhật FAQ!');
      return;
    }
    onPricingDataUpdate(editedPricingData);
    showCustomAlert('Thành công', '✅ Đã lưu cấu hình Bảng giá phân khúc của toàn bộ mô hình thành công!');
  };

  // Các hàm CRUD mô hình kinh doanh bổ sung cho Version 3
  const sanitizeId = (name: string): string => {
    let str = name.toLowerCase();
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
    str = str.replace(/đ/g, 'd');
    str = str.replace(/[^a-z0-9\s-]/g, ''); // loại bỏ ký tự đặc biệt
    str = str.replace(/\s+/g, '-'); // thay khoảng trắng bằng dấu gạch ngang
    str = str.replace(/-+/g, '-'); // rút gọn các gạch ngang liên tiếp
    return str || 'custom-' + Date.now();
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      showCustomAlert('Cảnh báo', 'Vui lòng nhập tên mô hình kinh doanh!');
      return;
    }

    const catId = sanitizeId(newCatName);
    
    // Kiểm tra trùng lặp ID
    if (editedPricingData.some(c => c.id === catId)) {
      showCustomAlert('Lỗi', `Mô hình kinh doanh này đã tồn tại hoặc mã "${catId}" bị trùng lặp. Vui lòng thử tên khác!`);
      return;
    }

    // Khởi tạo các phân khúc mặc định chất lượng cao cho mô hình mới
    const defaultTiers: Tier[] = newCatInputType === 'area' ? [
      {
        id: `${catId}-small`,
        name: `${newCatName} nhỏ`,
        area: '< 50 m²',
        areaMax: 50,
        zones: 1,
        price_month: 249000,
        notes: 'Dành cho cơ sở quy mô hộ gia đình, diện tích nhỏ',
        features: []
      },
      {
        id: `${catId}-medium`,
        name: `${newCatName} vừa`,
        area: '50 – 150 m²',
        areaMin: 50,
        areaMax: 150,
        zones: 2,
        price_month: 499000,
        notes: 'Dành cho không gian tầm trung, bố trí tối ưu',
        features: []
      },
      {
        id: `${catId}-large`,
        name: `${newCatName} lớn`,
        area: '> 150 m²',
        areaMin: 150,
        zones: 4,
        price_month: 990000,
        notes: 'Dành cho cơ sở quy mô lớn, nhiều tầng/khu vực',
        features: []
      }
    ] : [
      {
        id: `${catId}-small`,
        name: 'Quy mô nhỏ',
        area: '< 20 phòng',
        roomsMax: 20,
        zones: 2,
        price_month: 499000,
        notes: 'Hệ thống quy mô nhỏ hoặc homestay cao cấp',
        features: []
      },
      {
        id: `${catId}-medium`,
        name: 'Quy mô vừa',
        area: '20 – 100 phòng',
        roomsMin: 20,
        roomsMax: 100,
        zones: 6,
        price_month: 1490000,
        notes: 'Cơ sở tiêu chuẩn, có nhiều khu vực phát nhạc chung',
        features: []
      },
      {
        id: `${catId}-large`,
        name: 'Quy mô lớn / Resort',
        area: '> 100 phòng',
        roomsMin: 100,
        zones: 15,
        price_month: null,
        notes: 'Mô hình quy mô lớn, liên hệ tư vấn giải pháp May đo',
        features: []
      }
    ];

    const newCategory: Category = {
      id: catId,
      name: newCatName.trim(),
      icon: newCatIcon.trim() || '💼',
      inputType: newCatInputType,
      inputLabel: newCatLabel.trim() || (newCatInputType === 'area' ? 'm²' : 'phòng'),
      description: newCatDesc.trim() || `Giải pháp báo giá và kiểm toán chi phí bản quyền tối ưu cho ${newCatName}.`,
      tiers: defaultTiers
    };

    // Thêm vào danh sách trước phần tử "Chuỗi & Enterprise" để phần tử đó luôn ở cuối cùng
    setEditedPricingData(prev => {
      const chainIndex = prev.findIndex(c => c.isChain);
      if (chainIndex !== -1) {
        const next = [...prev];
        next.splice(chainIndex, 0, newCategory);
        return next;
      }
      return [...prev, newCategory];
    });

    setSelectedCatIdToEdit(catId);
    setShowAddCatForm(false);
    
    // Reset form
    setNewCatName('');
    setNewCatIcon('💼');
    setNewCatInputType('area');
    setNewCatLabel('m²');
    setNewCatDesc('');

    showCustomAlert('Thành công', `🎉 Đã khởi tạo mô hình "${newCatName}" thành công! Vui lòng kiểm tra và lưu cấu hình phân khúc ở bên dưới.`);
  };

  const handleDeleteCategory = (catId: string) => {
    const category = editedPricingData.find(c => c.id === catId);
    if (!category) return;
    
    if (category.isChain) {
      showCustomAlert('Cảnh báo', 'Không thể xóa mô hình Chuỗi & Enterprise mặc định!');
      return;
    }
    
    // Đếm số lượng loại hình kinh doanh thông thường (trừ chuỗi)
    const normalCategories = editedPricingData.filter(c => !c.isChain);
    if (normalCategories.length <= 1) {
      showCustomAlert('Cảnh báo', 'Hệ thống cần giữ lại ít nhất một mô hình kinh doanh!');
      return;
    }

    showCustomConfirm(
      'Xóa mô hình kinh doanh',
      `Bạn chắc chắn muốn xóa toàn bộ mô hình kinh doanh "${category.icon} ${category.name}" và tất cả phân khúc tính giá của nó không? Việc xóa mô hình này có thể khiến một số dữ liệu tính giá cũ bị thay đổi.`,
      () => {
        const remaining = editedPricingData.filter(c => c.id !== catId);
        setEditedPricingData(remaining);
        // Chọn một mô hình khác để tiếp tục chỉnh sửa
        const fallback = remaining.find(c => !c.isChain) || remaining[0];
        setSelectedCatIdToEdit(fallback.id);
        showCustomAlert('Đã xóa', `Đã xóa mô hình kinh doanh "${category.name}" thành công.`);
      }
    );
  };

  // 3. GÓI DỊCH VỤ ACTIONS
  const updateCardField = (id: string, field: keyof PackageCardConfig, value: any) => {
    setEditedPackagesAdmin(prev => ({
      ...prev,
      cards: prev.cards.map(c => c.id === id ? { ...c, [field]: value } : c)
    }));
  };

  const updateFeatureField = (id: string, field: keyof FeatureRow, value: any) => {
    setEditedPackagesAdmin(prev => ({
      ...prev,
      features: prev.features.map(f => f.id === id ? { ...f, [field]: value } : f)
    }));
  };

  const handleAddFeature = () => {
    const nextOrder = editedPackagesAdmin.features.length > 0 
      ? Math.max(...editedPackagesAdmin.features.map(f => f.order)) + 1 
      : 1;
    const newFeature: FeatureRow = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 6),
      content: '',
      tierFrom: 'starter',
      order: nextOrder
    };
    setEditedPackagesAdmin(prev => ({
      ...prev,
      features: [...prev.features, newFeature]
    }));
  };

  const handleDeleteFeature = (id: string) => {
    const feature = editedPackagesAdmin.features.find(f => f.id === id);
    showCustomConfirm(
      'Xóa tính năng',
      `Bạn chắc chắn muốn xóa tính năng "${feature?.content || 'trống'}"?`,
      () => {
        setEditedPackagesAdmin(prev => ({
          ...prev,
          features: prev.features.filter(f => f.id !== id)
        }));
      }
    );
  };

  const handleMoveFeature = (index: number, direction: 'up' | 'down') => {
    const sortedFeatures = [...editedPackagesAdmin.features].sort((a, b) => a.order - b.order);
    if (direction === 'up' && index > 0) {
      const temp = sortedFeatures[index].order;
      sortedFeatures[index].order = sortedFeatures[index - 1].order;
      sortedFeatures[index - 1].order = temp;
    } else if (direction === 'down' && index < sortedFeatures.length - 1) {
      const temp = sortedFeatures[index].order;
      sortedFeatures[index].order = sortedFeatures[index + 1].order;
      sortedFeatures[index + 1].order = temp;
    }
    setEditedPackagesAdmin(prev => ({
      ...prev,
      features: sortedFeatures
    }));
  };

  const handleResetPackagesToDefault = () => {
    showCustomConfirm(
      'Đặt lại mặc định',
      'Bạn chắc chắn muốn đặt lại toàn bộ thẻ gói và tính năng về cấu hình mặc định gốc?',
      () => {
        setEditedPackagesAdmin(JSON.parse(JSON.stringify(defaultPackagesAdmin)));
      }
    );
  };

  const handleSaveAllPackages = () => {
    if (currentUserRole === 'tech_operator') {
      showCustomAlert('Hạn chế quyền', '🔒 Tài khoản của bạn ở chế độ Tech Operator (Chỉ Xem). Không có quyền thay đổi cấu hình hệ thống!');
      return;
    }
    if (currentUserRole === 'support_tech') {
      showCustomAlert('Hạn chế quyền', '🔒 Tài khoản của bạn ở chế độ Support Tech. Chỉ được phép phản hồi Đánh giá và cập nhật FAQ!');
      return;
    }
    onSavePackages(editedPackagesAdmin);
    showCustomAlert('Thành công', '✅ Đã lưu cấu hình Gói dịch vụ & Quyền lợi lên hệ thống thành công!');
  };

  // 4. THÔNG TIN CÔNG TY ACTIONS
  const handleSaveCompany = () => {
    if (currentUserRole === 'tech_operator') {
      showCustomAlert('Hạn chế quyền', '🔒 Tài khoản của bạn ở chế độ Tech Operator (Chỉ Xem). Không có quyền thay đổi cấu hình hệ thống!');
      return;
    }
    if (currentUserRole === 'support_tech') {
      showCustomAlert('Hạn chế quyền', '🔒 Tài khoản của bạn ở chế độ Support Tech. Chỉ được phép phản hồi Đánh giá và cập nhật FAQ!');
      return;
    }
    onCompanyUpdate(editedCompany);
    showCustomAlert('Thành công', '✅ Cập nhật thông tin nhận diện thương hiệu AudioBay thành công!');
  };

  // 5. ĐÁNH GIÁ & FAQ ACTIONS
  const handleAddFaq = () => {
    if (!newFaqQ || !newFaqA) {
      showCustomAlert('Thông báo', 'Vui lòng nhập đầy đủ câu hỏi và câu trả lời!');
      return;
    }
    const updated = [...editedFaqs, { q: newFaqQ, a: newFaqA }];
    setEditedFaqs(updated);
    setNewFaqQ('');
    setNewFaqA('');
  };

  const handleDeleteFaq = (index: number) => {
    const updated = editedFaqs.filter((_, idx) => idx !== index);
    setEditedFaqs(updated);
  };

  const handleMoveFaq = (index: number, direction: 'up' | 'down') => {
    const updated = [...editedFaqs];
    if (direction === 'up' && index > 0) {
      const temp = updated[index];
      updated[index] = updated[index - 1];
      updated[index - 1] = temp;
    } else if (direction === 'down' && index < updated.length - 1) {
      const temp = updated[index];
      updated[index] = updated[index + 1];
      updated[index + 1] = temp;
    }
    setEditedFaqs(updated);
  };

  const handleAddReview = () => {
    if (!newRevName || !newRevRole || !newRevContent) {
      showCustomAlert('Thông báo', 'Vui lòng điền đầy đủ Tên, Chức danh và Nội dung phản hồi của khách hàng!');
      return;
    }
    const newRev = {
      name: newRevName,
      role: newRevRole,
      content: newRevContent,
      rating: newRevRating,
      avatar: newRevAvatar || newRevName.substring(0, 2).toUpperCase()
    };
    const updated = [...editedReviews, newRev];
    setEditedReviews(updated);
    setNewRevName('');
    setNewRevRole('');
    setNewRevAvatar('');
    setNewRevContent('');
    setNewRevRating(5);
  };

  const handleDeleteReview = (index: number) => {
    const updated = editedReviews.filter((_, idx) => idx !== index);
    setEditedReviews(updated);
  };

  const handleMoveReview = (index: number, direction: 'up' | 'down') => {
    const updated = [...editedReviews];
    if (direction === 'up' && index > 0) {
      const temp = updated[index];
      updated[index] = updated[index - 1];
      updated[index - 1] = temp;
    } else if (direction === 'down' && index < updated.length - 1) {
      const temp = updated[index];
      updated[index] = updated[index + 1];
      updated[index + 1] = temp;
    }
    setEditedReviews(updated);
  };

  const handleSaveReviewsAndFaqs = () => {
    if (currentUserRole === 'tech_operator') {
      showCustomAlert('Hạn chế quyền', '🔒 Tài khoản của bạn ở chế độ Tech Operator (Chỉ Xem). Không có quyền thay đổi cấu hình hệ thống!');
      return;
    }
    onReviewsUpdate(editedReviews);
    onFaqsUpdate(editedFaqs);
    showCustomAlert('Thành công', '✅ Đã lưu danh sách Đánh giá khách hàng và FAQ thành công!');
  };

  // Trọng tâm AI tự viết nội dung thông tin đánh giá
  const handleGenerateAiReviews = async () => {
    setIsGeneratingReviews(true);
    setAiGenerationError('');
    try {
      const response = await fetch('/api/ai/generate-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Lỗi từ máy chủ khi tạo đánh giá.');
      }

      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        setEditedReviews(data);
        showCustomAlert('Thành công', '✨ Trợ lý AI đã tự viết và cập nhật thành công 4 đánh giá ngẫu nhiên tự nhiên cho AudioBay (không sử dụng nhãn hàng nổi tiếng tránh vi phạm pháp luật). Bạn có thể chỉnh sửa chúng hoặc nhấn "Lưu Đánh giá & FAQ" bên dưới để áp dụng.');
      } else {
        throw new Error('Dữ liệu trả về từ AI không đúng định dạng mảng mong muốn.');
      }
    } catch (err: any) {
      console.error('Lỗi khi sinh đánh giá tự động bằng AI:', err);
      setAiGenerationError(err.message || 'Không thể kết nối với API sinh đánh giá.');
      showCustomAlert('Lỗi', `❌ Sinh đánh giá thất bại: ${err.message || 'Vui lòng kiểm tra cấu hình GEMINI_API_KEY trong Settings.'}`);
    } finally {
      setIsGeneratingReviews(false);
    }
  };

  // Cập nhật trạng thái Tự động cập nhật hàng tuần
  const handleToggleAiWeeklyAutoUpdate = (checked: boolean) => {
    setAiAutoUpdateWeekly(checked);
    localStorage.setItem('audiobay_ai_auto_update_reviews', checked ? 'true' : 'false');
    if (checked) {
      localStorage.setItem('audiobay_last_ai_review_update', Date.now().toString());
    }
  };

  // 6. PRINT SALES GUIDE
  const handlePrintSalesGuide = () => {
    const printContent = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Tài liệu Hướng dẫn Bán hàng & Bảng giá nội bộ AudioBay</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', sans-serif; color: #1e293b; padding: 40px; line-height: 1.6; max-width: 900px; margin: 0 auto; }
    h1 { color: #1e3a5f; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; font-size: 26px; }
    h2 { color: #0f172a; font-size: 18px; margin-top: 30px; border-left: 4px solid #4ade80; padding-left: 12px; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 25px; }
    th, td { border: 1px solid #cbd5e1; padding: 12px; font-size: 13px; text-align: left; }
    th { background: #f1f5f9; font-weight: 600; color: #334155; }
    .highlight-box { background: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 16px; margin: 20px 0; font-size: 14px; }
    .script-text { font-style: italic; background: #f8fafc; padding: 14px; border-radius: 6px; border: 1px dashed #cbd5e1; }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <h1>TÀI LIỆU NỘI BỘ AUDIOBAY: HƯỚNG DẪN KINH DOANH & BÁO GIÁ ENTERPRISE</h1>
  <p style="font-size: 12px; color: #64748b;">* Tài liệu mật lưu hành nội bộ của Phòng Kinh Doanh AudioBay. Không chia sẻ ra ngoài.</p>
  
  <h2>1. Bảng giá trần đối với dự án Enterprise & Đặc thù</h2>
  <table>
    <thead>
      <tr>
        <th>Loại hình công trình</th>
        <th>Giá trị sàn (VNĐ/Tháng)</th>
        <th>Khoảng giá mục tiêu báo khách (VNĐ/Tháng)</th>
        <th>Ghi chú thương thảo</th>
      </tr>
    </thead>
    <tbody>
      ${INTERNAL_GUIDE.enterprisePricing.map(ep => `
        <tr>
          <td><strong>${ep.type}</strong></td>
          <td style="color: #b91c1c; font-weight: 600;">${ep.floor.toLocaleString('vi-VN')} đ</td>
          <td style="color: #1e3a5f; font-weight: 700;">${ep.target} đ</td>
          <td>${ep.note || '—'}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
 
  <div class="highlight-box">
    <strong>Công thức tính nhanh đề xuất:</strong><br/>
    Số Zones hoạt động thực tế × 200.000đ = Giá sàn hợp lý / tháng. 
    Không báo giá thấp hơn mức giá sàn tối thiểu trừ trường hợp ký cam kết chuỗi độc quyền dài hạn trên 3 năm.
  </div>

   <h2>2. Chính sách chiết khấu chuỗi hệ thống</h2>
  <p style="font-size: 11px; color: #4b5563; margin-top: -8px; margin-bottom: 12px; font-style: italic;">
    *Tổng ưu đãi thực tế (Kép tích lũy) là hiệu suất giảm giá thực tế trên tổng giá trị gốc chưa giảm sau khi áp dụng đồng thời ưu đãi Năm (-17%) và ưu đãi chuỗi sỉ theo cơ chế lũy tiến tuần tự (không cộng gộp cơ học 17% + % chuỗi).
  </p>
  <table>
    <thead>
      <tr>
        <th>Quy mô mạng lưới</th>
        <th>Chiết khấu chuỗi Gói Tháng</th>
        <th>Chiết khấu chuỗi Gói Năm</th>
        <th>Tổng ưu đãi thực tế (Kép tích lũy)</th>
        <th>Cấp thẩm quyền phê duyệt</th>
      </tr>
    </thead>
    <tbody>
      ${INTERNAL_GUIDE.chainDiscounts.map(cd => `
        <tr>
          <td><strong>${cd.range}</strong></td>
          <td>${cd.monthly}</td>
          <td style="font-weight: bold; color: #0284c7;">${cd.yearly}</td>
          <td style="font-weight: bold; color: #15803d; background-color: #f0fdf4;">${cd.compound || cd.yearly} (Đã gồm 17% Năm)</td>
          <td>${cd.note}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <h2>3. Chính sách cộng thưởng khi ký hợp đồng dài hạn</h2>
  <ul>
    ${INTERNAL_GUIDE.contractBonus.map(cb => `
      <li><strong>Thời hạn ký kết ${cb.duration}:</strong> Ưu đãi chiết khấu trực tiếp ${cb.bonus}.</li>
    `).join('')}
  </ul>

  <h2>4. Các hạng mục thặng dư phụ phí (Addons)</h2>
  <table>
    <thead>
      <tr>
        <th>Dịch vụ nâng cao</th>
        <th>Khoảng giá đề xuất (VNĐ)</th>
      </tr>
    </thead>
    <tbody>
      ${INTERNAL_GUIDE.addons.map(add => `
        <tr>
          <td><strong>${add.service}</strong></td>
          <td style="font-weight: 600;">${add.price}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <h2>5. Kịch bản tư vấn kinh điển (Sales Script)</h2>
  <p class="script-text">"${INTERNAL_GUIDE.salesScript}"</p>

  <p style="text-align: center; margin-top: 50px; font-size: 11px; color: #94a3b8;">
    AudioBay © 2026 - Phòng phát triển thị trường âm nhạc doanh nghiệp.
  </p>
</body>
</html>
    `;

    const blob = new Blob([printContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  // 7. HỆ THỐNG ACTIONS

  // Đổi mật khẩu
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (oldPassword !== getSystemPassword()) {
      setPasswordChangeMsg({ text: 'Mật khẩu cũ không chính xác!', error: true });
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setPasswordChangeMsg({ text: 'Mật khẩu mới phải từ 6 ký tự trở lên!', error: true });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordChangeMsg({ text: 'Xác nhận mật khẩu mới không trùng khớp!', error: true });
      return;
    }

    localStorage.setItem('audiobay_admin_password', newPassword);
    setOldPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setPasswordChangeMsg({ text: 'Đổi mật khẩu thành công!', error: false });
  };

  // Backup JSON
  const handleBackupData = () => {
    const backupObj = {
      pricingData,
      packagesAdmin,
      company,
      faqs,
      reviews,
      banner,
      adminPassword: getSystemPassword()
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupObj, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `audiobay_backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Restore JSON
  const handleRestoreData = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (currentUserRole !== 'admin') {
      showCustomAlert('Hạn chế quyền', '🔒 Chỉ Quản trị viên tối cao (Master Admin) mới được phép phục hồi dữ liệu từ file sao lưu!');
      return;
    }
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed.pricingData) {
            onPricingDataUpdate(parsed.pricingData);
            setEditedPricingData(parsed.pricingData);
          }
          if (parsed.packagesAdmin) {
            onSavePackages(parsed.packagesAdmin);
            setEditedPackagesAdmin(parsed.packagesAdmin);
          }
          if (parsed.company) {
            onCompanyUpdate(parsed.company);
            setEditedCompany(parsed.company);
          }
          if (parsed.faqs) {
            onFaqsUpdate(parsed.faqs);
            setEditedFaqs(parsed.faqs);
          }
          if (parsed.reviews) {
            onReviewsUpdate(parsed.reviews);
            setEditedReviews(parsed.reviews);
          }
          if (parsed.banner) {
            onBannerUpdate(parsed.banner);
            setEditedBanner(parsed.banner);
          }
          if (parsed.adminPassword) {
            localStorage.setItem('audiobay_admin_password', parsed.adminPassword);
          }
          showCustomAlert('Thành công', '✅ Phục hồi dữ liệu sao lưu thành công! Toàn bộ cài đặt đã được đồng bộ hóa.');
        } catch (err) {
          showCustomAlert('Lỗi', '❌ Lỗi định dạng file sao lưu JSON không hợp lệ!');
        }
      };
    }
  };

  // Factory Reset
  const handleFactoryReset = () => {
    if (currentUserRole !== 'admin') {
      showCustomAlert('Hạn chế quyền', '🔒 Chỉ Quản trị viên tối cao (Master Admin) mới được phép thực hiện khôi phục cài đặt gốc!');
      return;
    }
    showCustomConfirm(
      '🚨 CẢNH BÁO NGUY HIỂM',
      'Thao tác này sẽ xóa sạch toàn bộ các tùy chỉnh của bạn và khôi phục hệ thống về dữ liệu mặc định ban đầu! Bạn có chắc chắn muốn tiếp tục?',
      () => {
        showCustomConfirm(
          '🔥 XÁC NHẬN CUỐI CÙNG',
          'Mọi thay đổi về bảng giá, FAQs, thương hiệu và đánh giá sẽ bị mất vĩnh viễn! Bạn vẫn chắc chắn muốn tiếp tục?',
          () => {
            localStorage.removeItem('audiobay_pricing_v2');
            localStorage.removeItem('audiobay_packages_v2');
            localStorage.removeItem('audiobay_company_v2');
            localStorage.removeItem('audiobay_faq_v2');
            localStorage.removeItem('audiobay_reviews_v2');
            localStorage.removeItem('audiobay_banner_v2');
            localStorage.removeItem('audiobay_admin_password');
            showCustomAlert('Thành công', '🔄 Đã xóa sạch cấu hình. Trang web sẽ tự động làm mới để tải dữ liệu ban đầu.', () => {
              window.location.reload();
            });
          }
        );
      }
    );
  };

  // Lưu cấu hình Airtable
  const handleSaveAirtableConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onAirtableConfigUpdate) {
      onAirtableConfigUpdate(editedAirtableConfig);
      showCustomAlert('Thành công', '✅ Lưu cấu hình tích hợp Airtable thành công!');
    }
  };

  // Kiểm tra kết nối thử nghiệm tới Airtable
  const handleTestAirtableConnection = async () => {
    if (!editedAirtableConfig.token || !editedAirtableConfig.baseId || !editedAirtableConfig.tableName) {
      showCustomAlert('Thiếu thông tin', '✕ Vui lòng điền đầy đủ các trường: Personal Access Token (PAT), Base ID và Table Name để tiến hành thử nghiệm!');
      return;
    }

    setIsTestingAirtable(true);
    setAirtableTestResult(null);

    try {
      const response = await fetch('/api/airtable/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: editedAirtableConfig.token,
          baseId: editedAirtableConfig.baseId,
          tableName: editedAirtableConfig.tableName
        })
      });

      const resData = await response.json();
      if (response.ok && resData.success) {
        setAirtableTestResult({ success: true, message: resData.message });
        showCustomAlert('Thành công', '✅ ' + resData.message);
      } else {
        const errorMsg = resData.error || 'Kiểm tra kết nối thất bại.';
        setAirtableTestResult({ success: false, message: errorMsg });
        showCustomAlert('Lỗi kết nối', '✕ ' + errorMsg + (resData.details ? `\nChi tiết: ${resData.details}` : ''));
      }
    } catch (err: any) {
      const errMsg = err.message || 'Lỗi không xác định.';
      setAirtableTestResult({ success: false, message: errMsg });
      showCustomAlert('Lỗi', '✕ Lỗi kết nối tới máy chủ kiểm thử: ' + errMsg);
    } finally {
      setIsTestingAirtable(false);
    }
  };

  return (
    <>
      {/* NÚT QUẢN TRỊ VIÊN CHÍNH TRÊN NAVBAR */}
      <button
        type="button"
        id="admin-open-btn"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] rounded-xl shadow-lg transition-all cursor-pointer"
        title="Quản trị bảng giá AudioBay"
      >
        <Settings className="w-4 h-4 text-[#a1a1aa] animate-pulse" />
        <span>Quản trị viên</span>
      </button>

      {/* OVERLAY MODAL ADMIN */}
      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
              {/* Backdrop */}
              <div 
                className="fixed inset-0 bg-black/90 backdrop-blur-sm cursor-default"
              />

              {/* Main Dialog Window */}
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 10 }}
                className="relative bg-[#18181b] rounded-3xl w-full max-w-6xl h-[90vh] shadow-2xl flex flex-col border border-[#27272a] overflow-hidden"
              >
                {/* 1. HEADER MODAL */}
                <div className="bg-[#09090b] text-white px-6 py-4.5 flex justify-between items-center flex-shrink-0 border-b border-[#27272a]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600/10 flex items-center justify-center border border-indigo-500/20">
                      <Settings className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="font-black text-sm uppercase tracking-wider font-mono">Cơ sở dữ liệu quản trị AudioBay V2</h3>
                      <p className="text-[10px] text-[#a1a1aa] font-sans">Đồng bộ nhất quán 100% biểu giá, tính năng, thương hiệu và kịch bản bán hàng</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="text-[#a1a1aa] hover:text-white font-black text-xs cursor-pointer p-1.5 border border-[#27272a] bg-[#18181b] hover:bg-[#27272a] rounded-lg transition-all font-mono"
                  >
                    Đóng [✕]
                  </button>
                </div>

                {/* 2. AUTHENTICATION SHIELD */}
                {!isAuthenticated ? (
                  <div className="flex-1 overflow-y-auto flex items-center justify-center p-6 bg-[#09090b]">
                    <div className="max-w-md w-full bg-[#18181b] border border-[#27272a] rounded-2xl p-8 space-y-6 shadow-2xl">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-[#09090b] border border-indigo-500/30 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                          <Lock className="w-5 h-5 text-indigo-400" />
                        </div>
                        <h4 className="text-lg font-bold text-white tracking-tight">Yêu cầu quyền truy cập</h4>
                        <p className="text-xs text-[#a1a1aa] mt-1">Cơ sở dữ liệu chỉ dành cho cán bộ điều hành và kỹ thuật viên được phân quyền.</p>
                      </div>

                      {/* TABS CHỌN CHẾ ĐỘ ĐĂNG NHẬP */}
                      <div className="flex bg-[#09090b] p-1 rounded-xl border border-[#27272a]">
                        <button
                          type="button"
                          onClick={() => { setLoginMode('password'); setLoginError(''); }}
                          className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer border-none ${
                            loginMode === 'password' ? 'bg-[#18181b] text-emerald-400 border border-[#27272a]' : 'text-[#a1a1aa] hover:text-white'
                          }`}
                        >
                          Admin chính
                        </button>
                        <button
                          type="button"
                          onClick={() => { setLoginMode('technician'); setLoginError(''); }}
                          className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer border-none ${
                            loginMode === 'technician' ? 'bg-[#18181b] text-indigo-400 border border-[#27272a]' : 'text-[#a1a1aa] hover:text-white'
                          }`}
                        >
                          Kỹ thuật viên
                        </button>
                      </div>

                      <form onSubmit={handleLogin} className="space-y-4">
                        {loginMode === 'password' ? (
                          <div>
                            <label className="block text-[10px] font-bold text-[#a1a1aa] uppercase tracking-wider mb-1.5 font-mono">
                              Mật khẩu quản trị chính
                            </label>
                            <div className="relative">
                              <input
                                type={showPassword ? 'text' : 'password'}
                                value={passwordInput}
                                onChange={(e) => setPasswordInput(e.target.value)}
                                placeholder="Mật khẩu của bạn..."
                                className="w-full text-xs bg-[#09090b] border border-[#27272a] rounded-xl p-3 pr-10 focus:ring-2 focus:ring-[#27272a] focus:outline-none text-white font-mono"
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-3 text-[#a1a1aa] hover:text-white cursor-pointer bg-transparent border-none"
                              >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div>
                              <label className="block text-[10px] font-bold text-[#a1a1aa] uppercase tracking-wider mb-1.5 font-mono">
                                Email Kỹ thuật viên
                              </label>
                              <input
                                type="email"
                                value={techEmailInput}
                                onChange={(e) => setTechEmailInput(e.target.value)}
                                placeholder="VD: tech@audiobay.vn..."
                                className="w-full text-xs bg-[#09090b] border border-[#27272a] rounded-xl p-3 focus:ring-2 focus:ring-[#27272a] focus:outline-none text-white font-sans"
                                autoFocus
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-[#a1a1aa] uppercase tracking-wider mb-1.5 font-mono">
                                Mã Passkey Kỹ thuật viên
                              </label>
                              <input
                                type="password"
                                value={techPasskeyInput}
                                onChange={(e) => setTechPasskeyInput(e.target.value)}
                                placeholder="Nhập mã passkey được cấp..."
                                className="w-full text-xs bg-[#09090b] border border-[#27272a] rounded-xl p-3 focus:ring-2 focus:ring-[#27272a] focus:outline-none text-white font-mono"
                              />
                            </div>
                          </div>
                        )}

                        {loginError && (
                          <p className="text-xs text-red-400 font-semibold mt-2.5 flex items-center gap-1">
                            ⚠️ {loginError}
                          </p>
                        )}

                        <button
                          type="submit"
                          className={`w-full py-3 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg border-none ${
                            loginMode === 'password'
                              ? 'bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/10'
                              : 'bg-indigo-500 hover:bg-indigo-400 shadow-indigo-500/10'
                          }`}
                        >
                          Xác nhận {loginMode === 'password' ? 'Admin chính' : 'Kỹ thuật viên'}
                        </button>
                      </form>
                      
                      <div className="pt-4 border-t border-[#27272a] text-center">
                        <span className="text-[10px] text-[#71717a] font-mono leading-relaxed">
                          {loginMode === 'password' ? (
                            <>Gợi ý mật khẩu mặc định: <strong className="text-[#a1a1aa] font-bold">audiobay2025</strong></>
                          ) : (
                            <>Kỹ thuật viên vui lòng đăng nhập bằng Email và Passkey được Admin cấp phát.</>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* 3. MAIN DASHBOARD PANELS (7 TABS SIDEBAR LAYOUT) */
                  <div className="flex-1 flex overflow-hidden">
                    {/* LEFT SIDEBAR NAVIGATION */}
                    <div className="w-64 bg-[#09090b] border-r border-[#27272a] flex flex-col justify-between flex-shrink-0">
                      <div className="p-4 space-y-1.5 overflow-y-auto max-h-[calc(90vh-160px)]">
                        <div className="px-3 pb-3 border-b border-[#27272a] mb-3">
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-1 rounded-full uppercase tracking-wider font-mono">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Admin Console
                          </span>
                        </div>

                        {/* Navigation List */}
                        <button
                          onClick={() => setActiveTab('overview')}
                          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-bold transition-all border-none ${
                            activeTab === 'overview' ? 'bg-[#18181b] text-emerald-400 border border-[#27272a]' : 'text-[#a1a1aa] hover:text-white hover:bg-zinc-900 border border-transparent'
                          }`}
                        >
                          <BarChart3 className="w-4 h-4 shrink-0" />
                          <span>1. Tổng quan</span>
                        </button>

                        <button
                          onClick={() => setActiveTab('pricing')}
                          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-bold transition-all border-none ${
                            activeTab === 'pricing' ? 'bg-[#18181b] text-emerald-400 border border-[#27272a]' : 'text-[#a1a1aa] hover:text-white hover:bg-zinc-900 border border-transparent'
                          }`}
                        >
                          <DollarSign className="w-4 h-4 shrink-0" />
                          <span>2. Bảng giá hạng mục</span>
                        </button>

                        <button
                          onClick={() => setActiveTab('packages')}
                          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-bold transition-all border-none ${
                            activeTab === 'packages' ? 'bg-[#18181b] text-emerald-400 border border-[#27272a]' : 'text-[#a1a1aa] hover:text-white hover:bg-zinc-900 border border-transparent'
                          }`}
                        >
                          <Package className="w-4 h-4 shrink-0" />
                          <span>3. Gói & Tính năng</span>
                        </button>

                        <button
                          onClick={() => setActiveTab('company')}
                          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-bold transition-all border-none ${
                            activeTab === 'company' ? 'bg-[#18181b] text-emerald-400 border border-[#27272a]' : 'text-[#a1a1aa] hover:text-white hover:bg-zinc-900 border border-transparent'
                          }`}
                        >
                          <Building className="w-4 h-4 shrink-0" />
                          <span>4. Thông tin công ty</span>
                        </button>

                        <button
                          onClick={() => setActiveTab('feedback-faq')}
                          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-bold transition-all border-none ${
                            activeTab === 'feedback-faq' ? 'bg-[#18181b] text-emerald-400 border border-[#27272a]' : 'text-[#a1a1aa] hover:text-white hover:bg-zinc-900 border border-transparent'
                          }`}
                        >
                          <MessageSquare className="w-4 h-4 shrink-0" />
                          <span>5. Đánh giá & FAQ</span>
                        </button>

                        <button
                          onClick={() => setActiveTab('quote-requests')}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs font-bold transition-all border-none ${
                            activeTab === 'quote-requests' ? 'bg-[#18181b] text-emerald-400 border border-[#27272a]' : 'text-[#a1a1aa] hover:text-white hover:bg-zinc-900 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <ClipboardList className="w-4 h-4 shrink-0" />
                            <span>6. Yêu cầu báo giá</span>
                          </div>
                          {quoteRequests.filter(r => r.status === 'new').length > 0 && (
                            <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shrink-0 font-mono animate-pulse">
                              {quoteRequests.filter(r => r.status === 'new').length}
                            </span>
                          )}
                        </button>

                        <button
                          onClick={() => setActiveTab('sales-guide')}
                          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-bold transition-all border-none ${
                            activeTab === 'sales-guide' ? 'bg-[#18181b] text-emerald-400 border border-[#27272a]' : 'text-[#a1a1aa] hover:text-white hover:bg-zinc-900 border border-transparent'
                          }`}
                        >
                          <BookOpen className="w-4 h-4 shrink-0" />
                          <span>7. Hướng dẫn Sales</span>
                        </button>

                        <button
                          onClick={() => setActiveTab('sales-ai')}
                          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-bold transition-all border-none ${
                            activeTab === 'sales-ai' ? 'bg-[#18181b] text-indigo-400 border border-[#27272a]' : 'text-[#a1a1aa] hover:text-white hover:bg-zinc-900 border border-transparent'
                          }`}
                        >
                          <Bot className="w-4 h-4 shrink-0 text-indigo-400" />
                          <span className="text-indigo-400">8. Trợ lý Báo giá AI</span>
                        </button>

                        <button
                          onClick={() => setActiveTab('sales-calculator')}
                          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-bold transition-all border-none ${
                            activeTab === 'sales-calculator' ? 'bg-[#18181b] text-amber-400 border border-[#27272a]' : 'text-[#a1a1aa] hover:text-white hover:bg-zinc-900 border border-transparent'
                          }`}
                        >
                          <DollarSign className="w-4 h-4 shrink-0 text-amber-400" />
                          <span className="text-amber-400">9. Báo giá Chuỗi & Enterprise</span>
                        </button>

                        <button
                          onClick={() => setActiveTab('system')}
                          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-bold transition-all border-none ${
                            activeTab === 'system' ? 'bg-[#18181b] text-emerald-400 border border-[#27272a]' : 'text-[#a1a1aa] hover:text-white hover:bg-zinc-900 border border-transparent'
                          }`}
                        >
                          <Sliders className="w-4 h-4 shrink-0" />
                          <span>10. Hệ thống & Sao lưu</span>
                        </button>

                        <button
                          onClick={() => setActiveTab('permissions')}
                          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-bold transition-all border-none ${
                            activeTab === 'permissions' ? 'bg-[#18181b] text-indigo-400 border border-[#27272a]' : 'text-[#a1a1aa] hover:text-white hover:bg-zinc-900 border border-transparent'
                          }`}
                        >
                          <Shield className="w-4 h-4 shrink-0 text-indigo-400" />
                          <span className="text-indigo-400">11. Phân quyền kỹ thuật</span>
                        </button>
                      </div>

                      {/* Side panel footer */}
                      <div className="p-4 border-t border-[#27272a] space-y-2.5 flex-shrink-0">
                        <div className="text-[10px] text-[#a1a1aa] font-mono leading-tight bg-[#09090b] border border-[#27272a] p-2.5 rounded-xl space-y-1">
                          <div className="flex items-center gap-1 text-white font-bold">
                            <span className={`w-1.5 h-1.5 rounded-full ${currentUserRole === 'admin' ? 'bg-emerald-500 animate-pulse' : 'bg-indigo-500 animate-pulse'}`}></span>
                            <span>{currentUserRole === 'admin' ? 'Master Admin' : 'Kỹ thuật viên'}</span>
                          </div>
                          <div className="truncate text-[#71717a] font-medium" title={currentUserEmail}>{currentUserEmail}</div>
                          <div className="text-[9px] text-[#52525b]">
                            Quyền: <span className="font-bold text-[#a1a1aa] uppercase tracking-wider">
                              {currentUserRole === 'admin' && 'Tối cao (Full Admin)'}
                              {currentUserRole === 'tech_admin' && 'Tech Admin (Ghi/Đọc)'}
                              {currentUserRole === 'tech_operator' && 'Tech Operator (Xem)'}
                              {currentUserRole === 'support_tech' && 'Support Tech (Giới hạn)'}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full text-center text-xs font-bold text-rose-400 hover:text-rose-300 bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/10 hover:border-rose-500/20 py-2 rounded-xl cursor-pointer transition-colors border-none"
                        >
                          Đăng xuất [→]
                        </button>
                      </div>
                    </div>

                    {/* RIGHT SCROLLABLE CONTENT COLUMN */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                      
                      {/* ==================== TAB 1: TỔNG QUAN ==================== */}
                      {activeTab === 'overview' && (
                        <div className="space-y-6 animate-fadeIn">
                          
                          {/* Banner chào mừng */}
                          <div className="p-5 bg-gradient-to-r from-indigo-950/40 to-emerald-950/10 border border-indigo-500/20 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                            <div>
                              <h4 className="text-base font-black text-white flex items-center gap-1.5">
                                Chào mừng trở lại, Quản trị viên <Sparkles className="w-4 h-4 text-amber-400" />
                              </h4>
                              <p className="text-xs text-[#a1a1aa] mt-0.5">Dưới đây là thống kê hiện trạng và cấu hình thặng dư biểu giá trên hệ thống AudioBay.</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              <span className="text-xs font-bold text-[#fafafa] font-mono">Máy chủ: Hoạt động</span>
                            </div>
                          </div>

                          {/* 4 Stat Cards */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            
                            <div 
                              onClick={() => setActiveTab('pricing')}
                              className="bg-[#18181b] hover:bg-zinc-800/30 border border-[#27272a] hover:border-emerald-500/30 p-5 rounded-2xl cursor-pointer transition-all space-y-1.5"
                            >
                              <div className="flex items-center justify-between text-[#a1a1aa]">
                                <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Số lĩnh vực kinh doanh</span>
                                <Building className="w-4 h-4 text-emerald-400" />
                              </div>
                              <div className="text-3xl font-black text-white font-mono">{totalCategoriesCount}</div>
                              <p className="text-[10px] text-[#71717a]">Gồm Cà phê, Spa, Khách sạn...</p>
                            </div>

                            <div 
                              onClick={() => setActiveTab('pricing')}
                              className="bg-[#18181b] hover:bg-zinc-800/30 border border-[#27272a] hover:border-emerald-500/30 p-5 rounded-2xl cursor-pointer transition-all space-y-1.5"
                            >
                              <div className="flex items-center justify-between text-[#a1a1aa]">
                                <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Tổng phân khúc tính giá</span>
                                <Layers className="w-4 h-4 text-indigo-400" />
                              </div>
                              <div className="text-3xl font-black text-white font-mono">{totalPricingTiersCount}</div>
                              <p className="text-[10px] text-[#71717a]">Mốc tính diện tích m² và phòng</p>
                            </div>

                            <div 
                              onClick={() => setActiveTab('pricing')}
                              className="bg-[#18181b] hover:bg-zinc-800/30 border border-[#27272a] hover:border-emerald-500/30 p-5 rounded-2xl cursor-pointer transition-all space-y-1.5"
                            >
                              <div className="flex items-center justify-between text-[#a1a1aa]">
                                <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Giá tháng thấp nhất</span>
                                <DollarSign className="w-4 h-4 text-teal-400" />
                              </div>
                              <div className="text-3xl font-black text-emerald-400 font-mono">{formatVND(lowestPriceMonth)}</div>
                              <p className="text-[10px] text-[#71717a]">Phân khúc Take-away quy mô nhỏ</p>
                            </div>

                            <div 
                              onClick={() => setActiveTab('pricing')}
                              className="bg-[#18181b] hover:bg-zinc-800/30 border border-[#27272a] hover:border-emerald-500/30 p-5 rounded-2xl cursor-pointer transition-all space-y-1.5"
                            >
                              <div className="flex items-center justify-between text-[#a1a1aa]">
                                <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Giá tháng cao nhất</span>
                                <Sparkles className="w-4 h-4 text-amber-400" />
                              </div>
                              <div className="text-3xl font-black text-rose-400 font-mono">{formatVND(highestPriceMonth)}</div>
                              <p className="text-[10px] text-[#71717a]">Đại diện phân khúc quy mô lớn</p>
                            </div>

                          </div>

                          {/* Bảng giá trung bình các lĩnh vực */}
                          <div className="bg-[#18181b] rounded-2xl border border-[#27272a] overflow-hidden">
                            <div className="px-5 py-4.5 border-b border-[#27272a] bg-[#09090b]">
                              <h5 className="text-xs font-black uppercase tracking-wider text-white font-mono">Chỉ số giá sàn & Giá trung bình theo lĩnh vực</h5>
                              <p className="text-[10px] text-[#a1a1aa] mt-0.5">Thống kê tự động từ cơ sở dữ liệu biểu giá phân khúc (không tính chuỗi & Enterprise đặc thù)</p>
                            </div>
                            <div className="overflow-x-auto">
                              <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                  <tr className="border-b border-[#27272a] bg-[#09090b] text-[#a1a1aa] font-mono font-bold text-[10px] uppercase">
                                    <th className="py-3 px-5">Mô hình kinh doanh</th>
                                    <th className="py-3 px-4 text-center">Số phân khúc</th>
                                    <th className="py-3 px-4 text-right">Giá sàn (Min)</th>
                                    <th className="py-3 px-4 text-right">Giá trần (Max)</th>
                                    <th className="py-3 px-5 text-right text-emerald-400">Giá trung bình (Avg)</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-[#27272a]">
                                  {categoryAverageStats.map((item) => (
                                    <tr key={item.id} className="hover:bg-zinc-800/10 transition-colors">
                                      <td className="py-3 px-5 font-bold text-white flex items-center gap-2">
                                        <span>{item.icon}</span>
                                        <span>{item.name}</span>
                                      </td>
                                      <td className="py-3 px-4 text-center text-[#d4d4d8] font-mono">{item.count} mốc</td>
                                      <td className="py-3 px-4 text-right text-teal-400 font-mono">{formatVND(item.min)}</td>
                                      <td className="py-3 px-4 text-right text-rose-400 font-mono">{formatVND(item.max)}</td>
                                      <td className="py-3 px-5 text-right font-black text-emerald-400 font-mono">{formatVND(item.avg)} / tháng</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Quick Banner Action */}
                          <div className="bg-[#18181b] rounded-2xl border border-[#27272a] p-5 space-y-4">
                            <div className="flex items-center justify-between border-b border-[#27272a] pb-2">
                              <div>
                                <h5 className="text-xs font-black uppercase tracking-wider text-white font-mono">Banner thông báo đầu trang chủ</h5>
                                <p className="text-[10px] text-[#a1a1aa]">Hiển thị ưu đãi hoặc thông báo khẩn cấp cho khách hàng truy cập</p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={editedBanner.enabled}
                                  onChange={(e) => setEditedBanner(prev => ({ ...prev, enabled: e.target.checked }))}
                                  className="sr-only peer cursor-pointer"
                                />
                                <div className="w-9 h-5 bg-[#27272a] rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                                <span className="ml-2 text-[11px] font-bold text-[#a1a1aa] font-mono uppercase">Kích hoạt</span>
                              </label>
                            </div>
                            <textarea
                              rows={2}
                              value={editedBanner.text || ''}
                              onChange={(e) => setEditedBanner(prev => ({ ...prev, text: e.target.value }))}
                              className="w-full text-xs bg-[#09090b] border border-[#27272a] rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-white leading-relaxed"
                              placeholder="Nội dung khuyến mãi nổi bật..."
                            />
                            <div className="flex justify-end">
                              <button
                                type="button"
                                onClick={() => {
                                  onBannerUpdate(editedBanner);
                                  showCustomAlert('Thành công', '✅ Đã lưu cấu hình banner thông báo khẩn cấp!');
                                }}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                              >
                                <Save className="w-3.5 h-3.5" /> Lưu Banner
                              </button>
                            </div>
                          </div>

                        </div>
                      )}

                      {/* ==================== TAB 2: BẢNG GIÁ HẠNG MỤC ==================== */}
                      {activeTab === 'pricing' && (
                        <div className="space-y-6 animate-fadeIn">
                          
                          <div className="p-4 bg-indigo-950/20 border border-indigo-500/20 text-indigo-200 rounded-xl flex items-start gap-3">
                            <Info className="w-5 h-5 text-indigo-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <h5 className="text-xs font-bold text-indigo-200 font-mono uppercase">Điều chỉnh biểu giá theo m² và số phòng</h5>
                              <p className="text-[10px] text-indigo-300 mt-0.5 leading-relaxed">
                                Bạn có thể thêm/bớt phân khúc, điều chỉnh khoảng chặn Min/Max diện tích (hoặc phòng) và đơn giá tương ứng. Các thay đổi này được tích hợp trực tiếp vào thuật toán của <strong>Bộ tính giá tự động (PriceCalculator)</strong> ngoài trang chủ ngay sau khi Lưu.
                              </p>
                            </div>
                          </div>

                          {/* Chọn category con để chỉnh sửa */}
                          <div className="space-y-2">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#27272a] pb-2">
                              <label className="block text-[10px] font-bold text-[#a1a1aa] uppercase tracking-wider font-mono">
                                Chọn mô hình kinh doanh để cấu hình biểu giá:
                              </label>
                              <button
                                type="button"
                                onClick={() => setShowAddCatForm(!showAddCatForm)}
                                className={`px-2.5 py-1.5 font-extrabold text-[10px] uppercase rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                                  showAddCatForm 
                                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/20 hover:bg-rose-500/30' 
                                    : 'bg-emerald-500 text-black hover:bg-emerald-400 shadow-md'
                                }`}
                              >
                                <Plus className={`w-3.5 h-3.5 transition-transform duration-200 ${showAddCatForm ? 'rotate-45' : ''}`} />
                                {showAddCatForm ? 'Đóng Form' : 'Thêm mô hình mới'}
                              </button>
                            </div>

                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                              {editedPricingData.map((cat) => (
                                <button
                                  key={cat.id}
                                  type="button"
                                  onClick={() => setSelectedCatIdToEdit(cat.id)}
                                  className={`px-3 py-2 text-[11px] font-bold rounded-xl border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                    selectedCatIdToEdit === cat.id 
                                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' 
                                      : 'bg-[#09090b] border-[#27272a] text-[#a1a1aa] hover:border-[#3f3f46] hover:bg-[#18181b]'
                                  }`}
                                >
                                  <span>{cat.icon}</span>
                                  <span className="truncate">{cat.name}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* FORM THÊM MÔ HÌNH KINH DOANH MỚI (AnimatePresence) */}
                          <AnimatePresence>
                            {showAddCatForm && (
                              <motion.form 
                                onSubmit={handleCreateCategory}
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="bg-[#18181b] border border-emerald-500/20 rounded-2xl p-5 space-y-4 overflow-hidden"
                              >
                                <div className="border-b border-[#27272a] pb-2">
                                  <h5 className="text-xs font-black uppercase tracking-wider text-emerald-400 font-mono flex items-center gap-1.5">
                                    <span>✨ Khởi tạo mô hình kinh doanh mới (Version 3)</span>
                                  </h5>
                                  <p className="text-[10px] text-zinc-400 mt-1">
                                    Tạo mô hình báo giá riêng biệt. Hệ thống sẽ tự động khởi tạo 3 phân khúc kích thước tương ứng (Nhỏ, Vừa, Lớn) để bạn tiếp tục tùy biến đơn giá.
                                  </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                  <div>
                                    <label className="block text-[10px] font-bold text-[#a1a1aa] mb-1.5 font-mono">Tên mô hình (vd: Rạp phim, Sân golf...)</label>
                                    <input
                                      type="text"
                                      value={newCatName}
                                      onChange={(e) => setNewCatName(e.target.value)}
                                      placeholder="Tên mô hình..."
                                      className="w-full text-xs bg-[#09090b] border border-[#27272a] rounded-xl p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none font-bold text-white font-mono"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-[10px] font-bold text-[#a1a1aa] mb-1.5 font-mono">Icon hiển thị (Emoji)</label>
                                    <input
                                      type="text"
                                      value={newCatIcon}
                                      onChange={(e) => setNewCatIcon(e.target.value)}
                                      placeholder="💼"
                                      className="w-full text-xs bg-[#09090b] border border-[#27272a] rounded-xl p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none font-bold text-white text-center font-mono"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-[10px] font-bold text-[#a1a1aa] mb-1.5 font-mono">Kiểu đo lường quy mô</label>
                                    <select
                                      value={newCatInputType}
                                      onChange={(e) => {
                                        const val = e.target.value as 'area' | 'rooms';
                                        setNewCatInputType(val);
                                        setNewCatLabel(val === 'area' ? 'm²' : 'phòng');
                                      }}
                                      className="w-full text-xs bg-[#09090b] border border-[#27272a] rounded-xl p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none text-white font-bold cursor-pointer font-mono"
                                    >
                                      <option value="area">Diện tích sàn</option>
                                      <option value="rooms">Số lượng phòng</option>
                                    </select>
                                  </div>

                                  <div>
                                    <label className="block text-[10px] font-bold text-[#a1a1aa] mb-1.5 font-mono">Đơn vị hiển thị</label>
                                    <input
                                      type="text"
                                      value={newCatLabel}
                                      onChange={(e) => setNewCatLabel(e.target.value)}
                                      placeholder="m² hoặc phòng..."
                                      className="w-full text-xs bg-[#09090b] border border-[#27272a] rounded-xl p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none font-bold text-white font-mono"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-[10px] font-bold text-[#a1a1aa] mb-1.5 font-mono">Mô tả ngắn về mô hình này</label>
                                  <input
                                    type="text"
                                    value={newCatDesc}
                                    onChange={(e) => setNewCatDesc(e.target.value)}
                                    placeholder="Ví dụ: Dành cho chuỗi phòng tập fitness cao cấp, trung tâm thương mại..."
                                    className="w-full text-xs bg-[#09090b] border border-[#27272a] rounded-xl p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none text-white font-medium animate-none"
                                  />
                                </div>

                                <div className="flex justify-end gap-2 pt-2 border-t border-[#27272a]">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setShowAddCatForm(false);
                                      setNewCatName('');
                                    }}
                                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs rounded-xl cursor-pointer transition-all"
                                  >
                                    Hủy bỏ
                                  </button>
                                  <button
                                    type="submit"
                                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs rounded-xl cursor-pointer transition-all"
                                  >
                                    Tạo mô hình
                                  </button>
                                </div>
                              </motion.form>
                            )}
                          </AnimatePresence>

                          {/* Thông tin chung của Category đang chỉnh sửa */}
                          <div className="bg-[#18181b] border border-[#27272a] rounded-2xl p-5 space-y-4">
                            <div className="flex justify-between items-center border-b border-[#27272a] pb-2">
                              <h5 className="text-xs font-black uppercase tracking-wider text-emerald-400 font-mono">
                                ⚙️ Thuộc tính chung: {currentCatToEdit.icon} {currentCatToEdit.name.toUpperCase()}
                              </h5>
                              {!currentCatToEdit.isChain && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCategory(currentCatToEdit.id)}
                                  className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white font-bold text-[10px] uppercase rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Xóa mô hình này
                                </button>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                              <div>
                                <label className="block text-[10px] font-bold text-[#a1a1aa] mb-1.5 font-mono">Tên mô hình</label>
                                <input
                                  type="text"
                                  value={currentCatToEdit.name || ''}
                                  onChange={(e) => handleUpdateCategoryFields(currentCatToEdit.id, 'name', e.target.value)}
                                  className="w-full text-xs bg-[#09090b] border border-[#27272a] rounded-xl p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none font-bold text-white font-mono"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-[#a1a1aa] mb-1.5 font-mono">Mã Icon đại diện (Emoji)</label>
                                <input
                                  type="text"
                                  value={currentCatToEdit.icon || ''}
                                  onChange={(e) => handleUpdateCategoryFields(currentCatToEdit.id, 'icon', e.target.value)}
                                  className="w-full text-xs bg-[#09090b] border border-[#27272a] rounded-xl p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none font-bold text-white text-center font-mono"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-[10px] font-bold text-[#a1a1aa] mb-1.5 font-mono">Kiểu quy mô (inputType)</label>
                                <select
                                  value={currentCatToEdit.inputType || 'area'}
                                  onChange={(e) => handleUpdateCategoryFields(currentCatToEdit.id, 'inputType', e.target.value)}
                                  className="w-full text-xs bg-[#09090b] border border-[#27272a] rounded-xl p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none text-white font-bold cursor-pointer font-mono"
                                >
                                  <option value="area">Diện tích (m²)</option>
                                  <option value="rooms">Số phòng kinh doanh</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-[#a1a1aa] mb-1.5 font-mono">Đơn vị đo lường (inputLabel)</label>
                                <input
                                  type="text"
                                  value={currentCatToEdit.inputLabel || ''}
                                  onChange={(e) => handleUpdateCategoryFields(currentCatToEdit.id, 'inputLabel', e.target.value)}
                                  placeholder="Ví dụ: m2 hoặc phòng"
                                  className="w-full text-xs bg-[#09090b] border border-[#27272a] rounded-xl p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none font-bold text-white font-mono"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-[#a1a1aa] mb-1.5 font-mono">Mô tả ngắn khi chọn mô hình</label>
                              <input
                                type="text"
                                value={currentCatToEdit.description || ''}
                                onChange={(e) => handleUpdateCategoryFields(currentCatToEdit.id, 'description', e.target.value)}
                                className="w-full text-xs bg-[#09090b] border border-[#27272a] rounded-xl p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none text-white font-medium"
                              />
                            </div>
                          </div>

                          {/* Bảng danh sách các Phân khúc / Tiers */}
                          <div className="bg-[#18181b] border border-[#27272a] rounded-2xl overflow-hidden">
                            <div className="px-5 py-3.5 bg-[#09090b] border-b border-[#27272a] flex justify-between items-center">
                              <span className="text-xs font-black uppercase tracking-wider text-white font-mono">
                                📊 Danh sách phân khúc tính giá tự động
                              </span>
                              <button
                                type="button"
                                onClick={() => handleAddTierToCategory(currentCatToEdit.id)}
                                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-[11px] rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" /> Thêm phân khúc
                              </button>
                            </div>

                            <div className="overflow-x-auto">
                              <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                  <tr className="bg-[#09090b] text-[#a1a1aa] border-b border-[#27272a] font-mono uppercase font-bold text-[10px]">
                                    <th className="py-3 px-4">Tên gói phân khúc</th>
                                    <th className="py-3 px-3">Mô tả quy mô (Area Text)</th>
                                    <th className="py-3 px-3 text-center">Chặn Dưới (Min)</th>
                                    <th className="py-3 px-3 text-center">Chặn Trên (Max)</th>
                                    <th className="py-3 px-3 text-center">Zones đi kèm</th>
                                    <th className="py-3 px-4 text-right">Đơn giá tháng (VNĐ)</th>
                                    <th className="py-3 px-4 text-center w-12">Xóa</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-[#27272a]">
                                  {currentCatToEdit.tiers.map((tier, idx) => (
                                    <tr key={idx} className="hover:bg-[#09090b]/20 transition-colors">
                                      
                                      {/* Tên phân khúc */}
                                      <td className="py-3 px-4">
                                        <input
                                          type="text"
                                          value={tier.name}
                                          onChange={(e) => handleUpdateTierValue(currentCatToEdit.id, idx, 'name', e.target.value)}
                                          className="w-full bg-[#09090b] border border-[#27272a] rounded-lg p-2 text-white font-bold text-xs font-mono"
                                        />
                                      </td>

                                      {/* Mô tả diện tích */}
                                      <td className="py-3 px-3">
                                        <input
                                          type="text"
                                          value={tier.area}
                                          onChange={(e) => handleUpdateTierValue(currentCatToEdit.id, idx, 'area', e.target.value)}
                                          className="w-full bg-[#09090b] border border-[#27272a] rounded-lg p-2 text-white font-medium text-xs"
                                        />
                                      </td>

                                      {/* Chặn dưới */}
                                      <td className="py-3 px-3 text-center w-24">
                                        <input
                                          type="number"
                                          value={tier.areaMin ?? tier.roomsMin ?? 0}
                                          onChange={(e) => {
                                            const num = parseInt(e.target.value) || 0;
                                            if (currentCatToEdit.inputType === 'area') {
                                              handleUpdateTierValue(currentCatToEdit.id, idx, 'areaMin', num);
                                            } else {
                                              handleUpdateTierValue(currentCatToEdit.id, idx, 'roomsMin', num);
                                            }
                                          }}
                                          className="w-full bg-[#09090b] border border-[#27272a] rounded-lg p-2 text-center text-white font-semibold font-mono"
                                        />
                                      </td>

                                      {/* Chặn trên */}
                                      <td className="py-3 px-3 text-center w-24">
                                        <input
                                          type="number"
                                          value={tier.areaMax ?? tier.roomsMax ?? 9999}
                                          onChange={(e) => {
                                            const num = parseInt(e.target.value) || 0;
                                            if (currentCatToEdit.inputType === 'area') {
                                              handleUpdateTierValue(currentCatToEdit.id, idx, 'areaMax', num);
                                            } else {
                                              handleUpdateTierValue(currentCatToEdit.id, idx, 'roomsMax', num);
                                            }
                                          }}
                                          className="w-full bg-[#09090b] border border-[#27272a] rounded-lg p-2 text-center text-white font-semibold font-mono"
                                        />
                                      </td>

                                      {/* Zones */}
                                      <td className="py-3 px-3 text-center w-20">
                                        <input
                                          type="number"
                                          value={tier.zones}
                                          onChange={(e) => handleUpdateTierValue(currentCatToEdit.id, idx, 'zones', parseInt(e.target.value) || 1)}
                                          className="w-full bg-[#09090b] border border-[#27272a] rounded-lg p-2 text-center text-white font-semibold font-mono"
                                        />
                                      </td>

                                      {/* Giá tháng */}
                                      <td className="py-3 px-4 text-right w-36">
                                        <input
                                          type="number"
                                          value={tier.price_month || 0}
                                          onChange={(e) => handleUpdateTierValue(currentCatToEdit.id, idx, 'price_month', parseInt(e.target.value) || 0)}
                                          className="w-full bg-[#09090b] border border-[#27272a] rounded-lg p-2 text-right text-emerald-400 font-bold font-mono"
                                        />
                                      </td>

                                      {/* Delete */}
                                      <td className="py-3 px-4 text-center">
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteTierFromCategory(currentCatToEdit.id, idx)}
                                          className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 p-2 rounded-lg transition-all cursor-pointer"
                                          title="Xóa phân khúc"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </td>

                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Save Actions Button */}
                          <div className="flex justify-end pt-2 border-t border-[#27272a]">
                            <button
                              type="button"
                              onClick={handleSavePricingData}
                              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-all"
                            >
                              <Save className="w-4 h-4" />
                              Lưu biểu giá hạng mục
                            </button>
                          </div>

                        </div>
                      )}

                      {/* ==================== TAB 3: GÓI & TÍNH NĂNG ==================== */}
                      {activeTab === 'packages' && (
                        <div className="space-y-6 text-[#fafafa] animate-fadeIn">
                          
                          <div className="p-4 bg-indigo-950/20 border border-indigo-500/20 text-indigo-200 rounded-xl flex items-start gap-3">
                            <Info className="w-5 h-5 text-indigo-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <h5 className="text-xs font-bold text-indigo-200 font-mono uppercase">Quản lý cấu hình Gói cốt lõi & Tính năng</h5>
                              <p className="text-[10px] text-indigo-300 mt-0.5 leading-relaxed">
                                Đồng bộ một điểm nhất quán (Single Source of Truth). Các thay đổi về tên gói, viền nổi bật hoặc phân bổ tính năng theo mốc tier sẽ được áp dụng trực tiếp cho cả phần <strong>PackagesSection</strong> và <strong>ComparisonTable</strong> ngoài trang chủ.
                              </p>
                            </div>
                          </div>

                          {/* PHẦN A: 4 THẺ GÓI CỐT LÕI */}
                          <div className="space-y-3">
                            <h4 className="text-xs font-extrabold text-[#a1a1aa] uppercase tracking-wider font-mono flex items-center gap-1.5 border-b border-[#27272a] pb-2">
                              <span className="text-emerald-400">●</span> PHẦN 1: Cấu hình 4 thẻ gói cốt lõi
                            </h4>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {editedPackagesAdmin.cards.map((pkg) => (
                                <div 
                                  key={pkg.id} 
                                  className={`p-4 rounded-2xl border bg-[#111113]/90 space-y-3 transition-all ${
                                    pkg.highlighted 
                                      ? 'border-emerald-500/50 shadow-md ring-1 ring-emerald-500/10' 
                                      : 'border-[#27272a]'
                                  }`}
                                >
                                  <div className="flex items-center justify-between border-b border-[#27272a] pb-2">
                                    <span className="text-[10px] font-black text-[#a1a1aa] uppercase tracking-widest font-mono">
                                      MÃ GÓI: <span style={{ color: pkg.color }}>{pkg.id.toUpperCase()}</span>
                                    </span>
                                    
                                    <label className="text-[11px] font-bold text-[#fafafa] flex items-center gap-1 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={pkg.highlighted}
                                        onChange={e => updateCardField(pkg.id, 'highlighted', e.target.checked)}
                                        className="rounded border-[#27272a] bg-[#09090b] text-emerald-500 focus:ring-emerald-500 cursor-pointer w-3.5 h-3.5"
                                      />
                                      <span>Viền nổi bật</span>
                                    </label>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {/* Tên gói */}
                                    <div>
                                      <label className="block text-[11px] font-bold text-[#a1a1aa] mb-1">Tên hiển thị</label>
                                      <input
                                        type="text"
                                        value={pkg.name}
                                        onChange={e => updateCardField(pkg.id, 'name', e.target.value.toUpperCase())}
                                        className="w-full text-xs bg-[#09090b] border border-[#27272a] rounded-lg p-2 font-semibold text-white font-mono uppercase"
                                      />
                                    </div>

                                    {/* Giá hiển thị */}
                                    <div>
                                      <label className="block text-[11px] font-bold text-[#a1a1aa] mb-1">Giá hiển thị (VNĐ)</label>
                                      <input
                                        type="text"
                                        value={pkg.priceDisplay}
                                        onChange={e => updateCardField(pkg.id, 'priceDisplay', e.target.value)}
                                        className="w-full text-xs bg-[#09090b] border border-[#27272a] rounded-lg p-2 font-semibold text-white font-mono"
                                      />
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {/* Badge */}
                                    <div>
                                      <label className="block text-[11px] font-bold text-[#a1a1aa] mb-1">Nhãn Badge (Tuỳ chọn)</label>
                                      <input
                                        type="text"
                                        value={pkg.badge || ''}
                                        onChange={e => updateCardField(pkg.id, 'badge', e.target.value)}
                                        className="w-full text-xs bg-[#09090b] border border-[#27272a] rounded-lg p-2 text-white font-medium"
                                      />
                                    </div>

                                    {/* Màu HEX */}
                                    <div>
                                      <label className="block text-[11px] font-bold text-[#a1a1aa] mb-1">Mã màu HEX thương hiệu</label>
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="text"
                                          value={pkg.color || ''}
                                          onChange={e => updateCardField(pkg.id, 'color', e.target.value)}
                                          className="flex-grow text-xs bg-[#09090b] border border-[#27272a] rounded-lg p-2 font-semibold text-white font-mono"
                                        />
                                        <div 
                                          className="w-8 h-8 rounded-lg border border-[#27272a] shrink-0" 
                                          style={{ backgroundColor: pkg.color || '#ffffff' }} 
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {/* Mô tả ngắn */}
                                    <div>
                                      <label className="block text-[11px] font-bold text-[#a1a1aa] mb-1">Mô tả ngắn của gói</label>
                                      <input
                                        type="text"
                                        value={pkg.subtitle || ''}
                                        onChange={e => updateCardField(pkg.id, 'subtitle', e.target.value)}
                                        className="w-full text-xs bg-[#09090b] border border-[#27272a] rounded-lg p-2 text-white font-medium"
                                      />
                                    </div>

                                    {/* Nút CTA */}
                                    <div>
                                      <label className="block text-[11px] font-bold text-[#a1a1aa] mb-1">Nút kêu gọi hành động (CTA)</label>
                                      <input
                                        type="text"
                                        value={pkg.ctaText || ''}
                                        onChange={e => updateCardField(pkg.id, 'ctaText', e.target.value)}
                                        className="w-full text-xs bg-[#09090b] border border-[#27272a] rounded-lg p-2 font-semibold text-white"
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* PHẦN B: PHÂN BỔ TÍNH NĂNG THEO TIER */}
                          <div className="space-y-3 pt-2">
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-[#27272a] pb-2">
                              <h4 className="text-xs font-extrabold text-[#a1a1aa] uppercase tracking-wider font-mono flex items-center gap-1.5">
                                <span className="text-emerald-400">●</span> PHẦN 2: Quản lý tính năng & phân bổ theo tier
                              </h4>
                              
                              <button
                                type="button"
                                onClick={handleAddFeature}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer self-start"
                              >
                                <Plus className="w-3.5 h-3.5" /> Thêm tính năng mới
                              </button>
                            </div>

                            <div className="bg-[#18181b] rounded-2xl border border-[#27272a] overflow-hidden">
                              <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-xs">
                                  <thead>
                                    <tr className="bg-[#09090b] text-[#a1a1aa] border-b border-[#27272a] font-mono uppercase font-bold text-[10px]">
                                      <th className="py-3 px-4 w-12 text-center">Thứ tự</th>
                                      <th className="py-3 px-3">Nội dung tính năng quyền lợi</th>
                                      <th className="py-3 px-3 w-44">Kích hoạt từ Tier</th>
                                      <th className="py-3 px-3 w-24 text-center">Trạng thái</th>
                                      <th className="py-3 px-4 w-12 text-center">Xoá</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-[#27272a]">
                                    {[...editedPackagesAdmin.features]
                                      .sort((a, b) => a.order - b.order)
                                      .map((feat, idx, arr) => (
                                        <tr key={feat.id} className={`hover:bg-[#09090b]/40 transition-all ${feat.hidden ? 'opacity-60 bg-[#1e1e24]/10' : ''}`}>
                                          {/* Sắp xếp lên / xuống */}
                                          <td className="py-3 px-4 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                              <button
                                                type="button"
                                                disabled={idx === 0}
                                                onClick={() => handleMoveFeature(idx, 'up')}
                                                className="text-[#a1a1aa] hover:text-white hover:bg-zinc-800 disabled:opacity-20 disabled:pointer-events-none p-1 rounded transition-colors cursor-pointer"
                                                title="Di chuyển lên"
                                              >
                                                <ArrowUp className="w-3.5 h-3.5" />
                                              </button>
                                              <button
                                                type="button"
                                                disabled={idx === arr.length - 1}
                                                onClick={() => handleMoveFeature(idx, 'down')}
                                                className="text-[#a1a1aa] hover:text-white hover:bg-zinc-800 disabled:opacity-20 disabled:pointer-events-none p-1 rounded transition-colors cursor-pointer"
                                                title="Di chuyển xuống"
                                              >
                                                <ArrowDown className="w-3.5 h-3.5" />
                                              </button>
                                            </div>
                                          </td>

                                          {/* Nội dung */}
                                          <td className="py-3 px-3">
                                            <input
                                              type="text"
                                              value={feat.content}
                                              onChange={e => updateFeatureField(feat.id, 'content', e.target.value)}
                                              placeholder="Phát nhạc bản quyền..."
                                              className={`w-full bg-[#09090b] border border-[#27272a] rounded-lg p-2 text-white font-medium text-xs transition-all ${
                                                feat.hidden ? 'text-[#a1a1aa]/75 border-dashed italic' : ''
                                              }`}
                                            />
                                          </td>

                                          {/* Tier kích hoạt */}
                                          <td className="py-3 px-3">
                                            <select
                                              value={feat.tierFrom}
                                              onChange={e => updateFeatureField(feat.id, 'tierFrom', e.target.value as any)}
                                              className={`w-full bg-[#09090b] border border-[#27272a] rounded-lg p-2 text-white font-bold text-xs cursor-pointer font-mono transition-all ${
                                                feat.hidden ? 'text-[#a1a1aa]/75' : ''
                                              }`}
                                            >
                                              <option value="starter">STARTER</option>
                                              <option value="business">BUSINESS (S) + (M)</option>
                                              <option value="professional">PROFESSIONAL (L)</option>
                                              <option value="enterprise">ENTERPRISE (May đo)</option>
                                            </select>
                                          </td>

                                          {/* Hiển thị / Ẩn */}
                                          <td className="py-3 px-3 text-center">
                                            <button
                                              type="button"
                                              onClick={() => updateFeatureField(feat.id, 'hidden', !feat.hidden)}
                                              className={`p-2 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5 text-[10px] font-bold ${
                                                feat.hidden 
                                                  ? 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800' 
                                                  : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10'
                                              }`}
                                              title={feat.hidden ? "Đang ẩn khỏi bảng giá - Click để hiển thị" : "Đang hiển thị trên bảng giá - Click để ẩn"}
                                            >
                                              {feat.hidden ? (
                                                <>
                                                  <EyeOff className="w-4 h-4" />
                                                  <span>ẨN</span>
                                                </>
                                              ) : (
                                                <>
                                                  <Eye className="w-4 h-4 animate-pulse" />
                                                  <span>HIỆN</span>
                                                </>
                                              )}
                                            </button>
                                          </td>

                                          {/* Xoá */}
                                          <td className="py-3 px-4 text-center">
                                            <button
                                              type="button"
                                              onClick={() => handleDeleteFeature(feat.id)}
                                              className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 p-2 rounded-lg transition-colors cursor-pointer"
                                              title="Xoá tính năng"
                                            >
                                              <Trash2 className="w-4 h-4" />
                                            </button>
                                          </td>
                                        </tr>
                                      ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex justify-between items-center pt-4 border-t border-[#27272a]">
                            <button
                              type="button"
                              onClick={handleResetPackagesToDefault}
                              className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-[#f4f4f5] font-semibold text-xs rounded-xl shadow-sm transition-all cursor-pointer border border-[#27272a]"
                            >
                              Đặt lại mặc định
                            </button>
                            
                            <button
                              type="button"
                              onClick={handleSaveAllPackages}
                              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-all"
                            >
                              <Save className="w-4 h-4" />
                              Lưu Gói & Tính năng
                            </button>
                          </div>

                        </div>
                      )}

                      {/* ==================== TAB 4: THÔNG TIN CÔNG TY ==================== */}
                      {activeTab === 'company' && (
                        <div className="space-y-6 animate-fadeIn">
                          
                          <div className="bg-[#18181b] rounded-2xl border border-[#27272a] p-5 space-y-4 text-white">
                            <h4 className="text-xs font-black text-white uppercase tracking-wider border-b border-[#27272a] pb-2 font-mono text-emerald-400">
                              🏢 NHẬN DIỆN THƯƠNG HIỆU & THÔNG TIN LIÊN HỆ (PDF & FOOTER)
                            </h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[10px] font-bold text-[#a1a1aa] mb-1.5 font-mono">Tên thương hiệu</label>
                                <input
                                  type="text"
                                  value={editedCompany.name || ''}
                                  onChange={(e) => setEditedCompany(prev => ({ ...prev, name: e.target.value }))}
                                  className="w-full text-xs bg-[#09090b] border border-[#27272a] rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold text-white font-mono"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-[#a1a1aa] mb-1.5 font-mono">Slogan dịch vụ</label>
                                <input
                                  type="text"
                                  value={editedCompany.slogan || 'Nhạc nền bản quyền cho doanh nghiệp Việt'}
                                  onChange={(e) => setEditedCompany(prev => ({ ...prev, slogan: e.target.value }))}
                                  className="w-full text-xs bg-[#09090b] border border-[#27272a] rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-semibold text-white"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[10px] font-bold text-[#a1a1aa] mb-1.5 font-mono">Tagline bản quyền pháp lý</label>
                                <input
                                  type="text"
                                  value={editedCompany.tagline || 'Bản quyền nhạc hợp pháp 100% tại Việt Nam'}
                                  onChange={(e) => setEditedCompany(prev => ({ ...prev, tagline: e.target.value }))}
                                  className="w-full text-xs bg-[#09090b] border border-[#27272a] rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium text-white"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-[#a1a1aa] mb-1.5 font-mono font-mono">Website chính thức</label>
                                <input
                                  type="text"
                                  value={editedCompany.website || ''}
                                  onChange={(e) => setEditedCompany(prev => ({ ...prev, website: e.target.value }))}
                                  className="w-full text-xs bg-[#09090b] border border-[#27272a] rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-semibold text-white font-mono"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <label className="block text-[10px] font-bold text-[#a1a1aa] mb-1.5 font-mono">Hotline tư vấn</label>
                                <input
                                  type="text"
                                  value={editedCompany.phone || ''}
                                  onChange={(e) => setEditedCompany(prev => ({ ...prev, phone: e.target.value }))}
                                  className="w-full text-xs bg-[#09090b] border border-[#27272a] rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold text-white font-mono"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-[#a1a1aa] mb-1.5 font-mono">Email phòng dịch vụ</label>
                                <input
                                  type="email"
                                  value={editedCompany.email || ''}
                                  onChange={(e) => setEditedCompany(prev => ({ ...prev, email: e.target.value }))}
                                  className="w-full text-xs bg-[#09090b] border border-[#27272a] rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-semibold text-white font-mono"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-[#a1a1aa] mb-1.5 font-mono">Quy mô thư viện bài hát</label>
                                <input
                                  type="text"
                                  value={editedCompany.librarySize || '20.000+ bài hát'}
                                  onChange={(e) => setEditedCompany(prev => ({ ...prev, librarySize: e.target.value }))}
                                  className="w-full text-xs bg-[#09090b] border border-[#27272a] rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-semibold text-white"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-[#a1a1aa] mb-1.5 font-mono">Địa chỉ trụ sở chính / Ghi chú footer hoặc PDF</label>
                              <textarea
                                rows={2}
                                value={editedCompany.address || ''}
                                onChange={(e) => setEditedCompany(prev => ({ ...prev, address: e.target.value }))}
                                className="w-full text-xs bg-[#09090b] border border-[#27272a] rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-white leading-relaxed"
                                placeholder="Nhập địa chỉ đăng ký doanh nghiệp..."
                              />
                            </div>
                          </div>

                          {/* Save Action */}
                          <div className="flex justify-end pt-2 border-t border-[#27272a]">
                            <button
                              type="button"
                              onClick={handleSaveCompany}
                              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-all"
                            >
                              <Save className="w-4 h-4" />
                              Lưu thông tin công ty
                            </button>
                          </div>

                        </div>
                      )}

                      {/* ==================== TAB 5: ĐÁNH GIÁ & FAQ ==================== */}
                      {activeTab === 'feedback-faq' && (
                        <div className="space-y-6 animate-fadeIn">
                          
                          {/* Sub-tab Toggle (Reviews vs FAQs) */}
                          <div className="flex bg-[#09090b] border border-[#27272a] rounded-xl p-1 shrink-0 max-w-sm">
                            <button
                              type="button"
                              onClick={() => setTab5SubMode('reviews')}
                              className={`flex-1 text-center py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                tab5SubMode === 'reviews' ? 'bg-[#18181b] text-emerald-400 border border-[#27272a] shadow-sm' : 'text-[#a1a1aa] hover:text-white'
                              }`}
                            >
                              <Users className="w-3.5 h-3.5" />
                              1. Đánh giá khách hàng
                            </button>
                            <button
                              type="button"
                              onClick={() => setTab5SubMode('faqs')}
                              className={`flex-1 text-center py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                tab5SubMode === 'faqs' ? 'bg-[#18181b] text-emerald-400 border border-[#27272a] shadow-sm' : 'text-[#a1a1aa] hover:text-white'
                              }`}
                            >
                              <HelpCircle className="w-3.5 h-3.5" />
                              2. Câu hỏi FAQ
                            </button>
                          </div>

                          {/* SUB-MODE A: REVIEWS TESTIMONIALS MANAGER */}
                          {tab5SubMode === 'reviews' && (
                            <div className="space-y-6">
                              {/* Trợ lý AI tự sinh đánh giá */}
                              <div className="bg-[#18181b] rounded-2xl border border-[#27272a] p-5 space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                  <div>
                                    <h5 className="text-xs font-black text-emerald-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                                      <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse animate-duration-1000" /> Trợ lý viết Đánh giá bằng AI (Gemini)
                                    </h5>
                                    <p className="text-[11px] text-[#a1a1aa] mt-1 leading-relaxed">
                                      Tự động viết nội dung phản hồi khách hàng tự nhiên, ngẫu nhiên từ các mô hình kinh doanh nhỏ lẻ thực tế (như quán cafe sách, spa thảo mộc, homestay...). Tuyệt đối không sử dụng tên nhãn hàng lớn tránh rắc rối bản quyền.
                                    </p>
                                  </div>
                                  <div className="shrink-0">
                                    <button
                                      type="button"
                                      disabled={isGeneratingReviews}
                                      onClick={handleGenerateAiReviews}
                                      className={`px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2 cursor-pointer transition-all ${
                                        isGeneratingReviews ? 'opacity-50 cursor-not-allowed font-medium' : ''
                                      }`}
                                    >
                                      {isGeneratingReviews ? (
                                        <>
                                          <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                          Đang viết...
                                        </>
                                      ) : (
                                        <>
                                          <Sparkles className="w-3.5 h-3.5 text-black" />
                                          AI Tự Viết Đánh Giá
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </div>

                                <div className="p-3.5 bg-[#09090b] rounded-xl border border-[#27272a] flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-2.5">
                                    <input
                                      type="checkbox"
                                      id="ai_auto_update_weekly"
                                      checked={aiAutoUpdateWeekly}
                                      onChange={(e) => handleToggleAiWeeklyAutoUpdate(e.target.checked)}
                                      className="w-4 h-4 rounded border-[#27272a] bg-[#18181b] text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                                    />
                                    <div>
                                      <label htmlFor="ai_auto_update_weekly" className="block text-xs font-bold text-white cursor-pointer select-none">
                                        Tự động cập nhật hàng tuần bằng AI
                                      </label>
                                      <span className="block text-[10px] text-[#a1a1aa]">
                                        Hệ thống sẽ chạy ngầm hàng tuần (7 ngày) để cập nhật một bộ đánh giá ngẫu nhiên mới hoàn toàn.
                                      </span>
                                    </div>
                                  </div>
                                  {aiAutoUpdateWeekly && (
                                    <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 animate-pulse font-mono">
                                      Đang hoạt động
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Form thêm mới Review */}
                              <div className="bg-[#18181b] rounded-2xl border border-[#27272a] p-5 space-y-4">
                                <h5 className="text-xs font-black text-indigo-400 uppercase tracking-wider font-mono">
                                  💬 Tạo đánh giá khách hàng mới
                                </h5>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                  <div>
                                    <label className="block text-[10px] font-bold text-[#a1a1aa] mb-1 font-mono">Tên khách hàng</label>
                                    <input
                                      type="text"
                                      placeholder="Ví dụ: Bà Hoàng Thùy Tiên"
                                      value={newRevName}
                                      onChange={(e) => setNewRevName(e.target.value)}
                                      className="w-full text-xs bg-[#09090b] border border-[#27272a] rounded-lg p-2.5 text-white font-semibold"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-bold text-[#a1a1aa] mb-1 font-mono">Chức danh / Công ty</label>
                                    <input
                                      type="text"
                                      placeholder="Giám đốc - Oriental Retreat"
                                      value={newRevRole}
                                      onChange={(e) => setNewRevRole(e.target.value)}
                                      className="w-full text-xs bg-[#09090b] border border-[#27272a] rounded-lg p-2.5 text-white font-medium"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-bold text-[#a1a1aa] mb-1 font-mono">Chữ viết Avatar (2 ký tự)</label>
                                    <input
                                      type="text"
                                      placeholder="Mặc định viết tắt của tên"
                                      maxLength={2}
                                      value={newRevAvatar}
                                      onChange={(e) => setNewRevAvatar(e.target.value)}
                                      className="w-full text-xs bg-[#09090b] border border-[#27272a] rounded-lg p-2.5 text-white font-bold font-mono text-center"
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                                  <div className="sm:col-span-3">
                                    <label className="block text-[10px] font-bold text-[#a1a1aa] mb-1 font-mono">Nội dung phản hồi</label>
                                    <textarea
                                      rows={2}
                                      placeholder="Lời phản hồi về âm thanh và dịch vụ của AudioBay..."
                                      value={newRevContent}
                                      onChange={(e) => setNewRevContent(e.target.value)}
                                      className="w-full text-xs bg-[#09090b] border border-[#27272a] rounded-lg p-2.5 text-white leading-relaxed"
                                    />
                                  </div>
                                  <div>
                                    <button
                                      type="button"
                                      onClick={handleAddReview}
                                      className="w-full py-3 bg-[#09090b] hover:bg-[#27272a] border border-[#27272a] text-[#fafafa] font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                                    >
                                      <Plus className="w-4 h-4 text-emerald-400" /> Thêm phản hồi
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Danh sách các review hiện có */}
                              <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-2">
                                <label className="block text-[10px] font-bold text-[#a1a1aa] uppercase tracking-wider font-mono">
                                  Danh sách phản hồi hiện hành:
                                </label>
                                {editedReviews.map((rev, index) => (
                                  <div key={index} className="flex items-start justify-between gap-4 p-4 bg-[#18181b] border border-[#27272a] rounded-2xl">
                                    <div className="flex gap-3">
                                      {/* Avatar icon */}
                                      <div className="w-9 h-9 bg-indigo-600/10 border border-indigo-500/30 rounded-full flex items-center justify-center text-emerald-400 font-extrabold text-xs font-mono shrink-0">
                                        {rev.avatar || 'AB'}
                                      </div>
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs font-bold text-white">{rev.name}</span>
                                          <span className="text-[10px] text-[#a1a1aa] font-medium">— {rev.role}</span>
                                        </div>
                                        <p className="text-xs text-[#d4d4d8] leading-relaxed italic">"{rev.content}"</p>
                                        <div className="flex text-amber-400 gap-0.5">
                                          {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                                            <Star key={i} className="w-3 h-3 fill-current" />
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                      <button
                                        type="button"
                                        disabled={index === 0}
                                        onClick={() => handleMoveReview(index, 'up')}
                                        className="text-[#a1a1aa] hover:text-white disabled:opacity-20 p-1 rounded-lg cursor-pointer hover:bg-zinc-800"
                                      >
                                        <ArrowUp className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        disabled={index === editedReviews.length - 1}
                                        onClick={() => handleMoveReview(index, 'down')}
                                        className="text-[#a1a1aa] hover:text-white disabled:opacity-20 p-1 rounded-lg cursor-pointer hover:bg-zinc-800"
                                      >
                                        <ArrowDown className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteReview(index)}
                                        className="text-rose-400 hover:text-rose-300 p-1.5 rounded-lg hover:bg-rose-500/10 cursor-pointer"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* SUB-MODE B: FAQS MANAGER */}
                          {tab5SubMode === 'faqs' && (
                            <div className="space-y-6">
                              {/* Thêm mới FAQ form */}
                              <div className="bg-[#18181b] rounded-2xl border border-[#27272a] p-5 space-y-4">
                                <h5 className="text-xs font-black text-indigo-400 uppercase tracking-wider font-mono">
                                  ❓ Tạo câu hỏi FAQ mới
                                </h5>
                                <div className="space-y-3">
                                  <div>
                                    <label className="block text-[10px] font-bold text-[#a1a1aa] mb-1 font-mono">Nội dung câu hỏi</label>
                                    <input
                                      type="text"
                                      placeholder="AudioBay có hỗ trợ xuất hoá đơn đỏ VAT không?"
                                      value={newFaqQ}
                                      onChange={(e) => setNewFaqQ(e.target.value)}
                                      className="w-full text-xs bg-[#09090b] border border-[#27272a] rounded-lg p-2.5 text-white font-semibold"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-bold text-[#a1a1aa] mb-1 font-mono">Câu trả lời công khai</label>
                                    <textarea
                                      rows={2}
                                      placeholder="Có, chúng tôi hỗ trợ xuất hoá đơn tài chính điện tử theo quy định cho doanh nghiệp..."
                                      value={newFaqA}
                                      onChange={(e) => setNewFaqA(e.target.value)}
                                      className="w-full text-xs bg-[#09090b] border border-[#27272a] rounded-lg p-2.5 text-white leading-relaxed"
                                    />
                                  </div>
                                  <div className="flex justify-end">
                                    <button
                                      type="button"
                                      onClick={handleAddFaq}
                                      className="px-4 py-2 bg-[#09090b] hover:bg-[#27272a] border border-[#27272a] text-[#fafafa] font-bold text-xs rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                                    >
                                      <Plus className="w-4 h-4 text-emerald-400" /> Thêm FAQ mới
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Danh sách các FAQ hiện có */}
                              <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-2">
                                <label className="block text-[10px] font-bold text-[#a1a1aa] uppercase tracking-wider font-mono">
                                  Bảng câu hỏi FAQs hiện tại:
                                </label>
                                {editedFaqs.map((faq, index) => (
                                  <div key={index} className="flex items-start justify-between gap-4 p-4 bg-[#18181b] border border-[#27272a] rounded-2xl">
                                    <div className="space-y-1.5">
                                      <p className="text-xs font-bold text-indigo-400 font-mono">Q: {faq.q}</p>
                                      <p className="text-xs text-[#d4d4d8] leading-relaxed">A: {faq.a}</p>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                      <button
                                        type="button"
                                        disabled={index === 0}
                                        onClick={() => handleMoveFaq(index, 'up')}
                                        className="text-[#a1a1aa] hover:text-white disabled:opacity-20 p-1 rounded-lg cursor-pointer hover:bg-zinc-800"
                                      >
                                        <ArrowUp className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        disabled={index === editedFaqs.length - 1}
                                        onClick={() => handleMoveFaq(index, 'down')}
                                        className="text-[#a1a1aa] hover:text-white disabled:opacity-20 p-1 rounded-lg cursor-pointer hover:bg-zinc-800"
                                      >
                                        <ArrowDown className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteFaq(index)}
                                        className="text-rose-400 hover:text-rose-300 p-1.5 rounded-lg hover:bg-rose-500/10 cursor-pointer"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Save Changes Button */}
                          <div className="flex justify-end pt-2 border-t border-[#27272a]">
                            <button
                              type="button"
                              onClick={handleSaveReviewsAndFaqs}
                              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-all"
                            >
                              <Save className="w-4 h-4" />
                              Lưu Đánh giá & FAQ
                            </button>
                          </div>

                        </div>
                      )}

                      {/* ==================== TAB 6: YÊU CẦU BÁO GIÁ ==================== */}
                      {activeTab === 'quote-requests' && (
                        <div className="space-y-6 animate-fadeIn">
                          
                          {/* Banner giới thiệu */}
                          <div className="p-4 bg-indigo-950/20 border border-indigo-500/20 text-indigo-200 rounded-xl flex items-start gap-3">
                            <ClipboardList className="w-5 h-5 text-indigo-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <h5 className="text-xs font-bold text-indigo-200 font-mono">QUẢN LÝ YÊU CẦU BÁO GIÁ ĐỒNG BỘ</h5>
                              <p className="text-[10px] text-indigo-300 mt-0.5 leading-relaxed">
                                Nơi tiếp nhận và theo dõi các yêu cầu gửi báo giá từ bộ máy tính chi phí của khách hàng ngoài website. Bạn có thể xem cấu hình khách hàng chọn, ghi chú thêm thông tin, cập nhật tiến độ xử lý và xuất bản PDF trực tiếp.
                              </p>
                            </div>
                          </div>

                          {/* Thống kê nhanh */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="p-4 bg-[#18181b] border border-[#27272a] rounded-2xl text-center">
                              <p className="text-[10px] text-[#a1a1aa] font-mono font-bold uppercase tracking-wider">Tổng yêu cầu</p>
                              <p className="text-xl font-black text-white mt-1 font-mono">{quoteRequests.length}</p>
                            </div>
                            <div className="p-4 bg-[#18181b] border border-[#27272a] rounded-2xl text-center">
                              <p className="text-[10px] text-[#a1a1aa] font-mono font-bold uppercase tracking-wider">Mới / Chờ duyệt</p>
                              <p className="text-xl font-black text-amber-400 mt-1 font-mono">
                                {quoteRequests.filter(r => r.status === 'new').length}
                              </p>
                            </div>
                            <div className="p-4 bg-[#18181b] border border-[#27272a] rounded-2xl text-center">
                              <p className="text-[10px] text-[#a1a1aa] font-mono font-bold uppercase tracking-wider">Đã báo giá</p>
                              <p className="text-xl font-black text-emerald-400 mt-1 font-mono">
                                {quoteRequests.filter(r => r.status === 'processed').length}
                              </p>
                            </div>
                            <div className="p-4 bg-[#18181b] border border-[#27272a] rounded-2xl text-center">
                              <p className="text-[10px] text-[#a1a1aa] font-mono font-bold uppercase tracking-wider">Hủy / Từ chối</p>
                              <p className="text-xl font-black text-zinc-500 mt-1 font-mono">
                                {quoteRequests.filter(r => r.status === 'declined').length}
                              </p>
                            </div>
                          </div>

                          {/* Bộ lọc & Tìm kiếm */}
                          <div className="flex flex-col sm:flex-row gap-3 bg-[#18181b] p-4 border border-[#27272a] rounded-2xl">
                            <div className="flex-1">
                              <input
                                type="text"
                                placeholder="Tìm theo Tên, Doanh nghiệp, Mã yêu cầu, SĐT..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full text-xs bg-[#09090b] border border-[#27272a] text-[#e4e4e7] rounded-xl px-3 py-2 focus:ring-1 focus:ring-emerald-400 focus:outline-none"
                              />
                            </div>
                            <div className="flex gap-1.5 overflow-x-auto shrink-0">
                              {(['all', 'new', 'processed', 'declined'] as const).map((status) => (
                                <button
                                  key={status}
                                  type="button"
                                  onClick={() => setFilterStatus(status)}
                                  className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all shrink-0 cursor-pointer ${
                                    filterStatus === status 
                                      ? 'bg-emerald-500 text-black' 
                                      : 'bg-[#09090b] text-[#a1a1aa] hover:text-white border border-[#27272a]'
                                  }`}
                                >
                                  {status === 'all' && 'Tất cả'}
                                  {status === 'new' && 'Chờ duyệt'}
                                  {status === 'processed' && 'Đã xử lý'}
                                  {status === 'declined' && 'Hủy bỏ'}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Danh sách yêu cầu */}
                          <div className="space-y-4">
                            {quoteRequests.filter(req => {
                              // Filter status
                              if (filterStatus !== 'all' && req.status !== filterStatus) return false;
                              // Search keyword
                              if (searchQuery.trim()) {
                                const q = searchQuery.toLowerCase();
                                const name = req.customerInfo.name.toLowerCase();
                                const comp = req.customerInfo.company.toLowerCase();
                                const phone = (req.customerInfo.phone || '').toLowerCase();
                                const email = (req.customerInfo.email || '').toLowerCase();
                                const id = req.id.toLowerCase();
                                return name.includes(q) || comp.includes(q) || phone.includes(q) || email.includes(q) || id.includes(q);
                              }
                              return true;
                            }).length === 0 ? (
                              <div className="p-8 text-center bg-[#18181b] border border-[#27272a] border-dashed rounded-2xl text-xs text-[#71717a]">
                                Không tìm thấy yêu cầu báo giá nào khớp với bộ lọc hiện tại.
                              </div>
                            ) : (
                              quoteRequests
                                .filter(req => {
                                  if (filterStatus !== 'all' && req.status !== filterStatus) return false;
                                  if (searchQuery.trim()) {
                                    const q = searchQuery.toLowerCase();
                                    const name = req.customerInfo.name.toLowerCase();
                                    const comp = req.customerInfo.company.toLowerCase();
                                    const phone = (req.customerInfo.phone || '').toLowerCase();
                                    const email = (req.customerInfo.email || '').toLowerCase();
                                    const id = req.id.toLowerCase();
                                    return name.includes(q) || comp.includes(q) || phone.includes(q) || email.includes(q) || id.includes(q);
                                  }
                                  return true;
                                })
                                .map((req) => {
                                  return (
                                    <div key={req.id} className="p-5 bg-[#18181b] border border-[#27272a] rounded-2xl space-y-4 hover:border-[#3f3f46] transition-all">
                                      
                                      {/* Header của thẻ */}
                                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#27272a]">
                                        <div className="flex items-center gap-2.5">
                                          <span className="text-xs font-black text-indigo-400 font-mono">{req.id}</span>
                                          <span className="text-[10px] text-[#52525b] font-mono">{req.createdAt}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          {req.status === 'new' && (
                                            <span className="bg-amber-500/10 text-amber-400 text-[9px] font-bold px-2 py-0.5 rounded-full border border-amber-500/20 uppercase">Chờ xử lý</span>
                                          )}
                                          {req.status === 'processed' && (
                                            <span className="bg-emerald-500/10 text-emerald-400 text-[9px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/20 uppercase">Đã báo giá</span>
                                          )}
                                          {req.status === 'declined' && (
                                            <span className="bg-zinc-800 text-[#71717a] text-[9px] font-bold px-2 py-0.5 rounded-full border border-zinc-700 uppercase">Hủy bỏ</span>
                                          )}
                                        </div>
                                      </div>

                                      {/* Body thẻ */}
                                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                        
                                        {/* Cột 1: Thông tin khách hàng */}
                                        <div className="md:col-span-4 space-y-2 text-xs">
                                          <p className="font-bold text-[#e4e4e7] uppercase font-mono tracking-wider text-[10px] text-zinc-500">Khách hàng</p>
                                          <div className="space-y-1">
                                            <p className="font-extrabold text-[#e4e4e7]">{req.customerInfo.name}</p>
                                            <p className="text-emerald-400 font-semibold">{req.customerInfo.company}</p>
                                            {req.customerInfo.phone && <p className="text-[#a1a1aa] font-mono">SĐT: {req.customerInfo.phone}</p>}
                                            {req.customerInfo.email && <p className="text-[#a1a1aa] font-mono">Email: {req.customerInfo.email}</p>}
                                            {req.customerInfo.notes && (
                                              <div className="mt-2 p-2 bg-[#09090b] rounded-lg border border-[#27272a] text-[11px] text-[#d4d4d8]">
                                                <strong>Ghi chú KH:</strong> {req.customerInfo.notes}
                                              </div>
                                            )}
                                          </div>
                                        </div>

                                        {/* Cột 2: Cấu hình gói lựa chọn */}
                                        <div className="md:col-span-4 space-y-2 text-xs border-t md:border-t-0 md:border-x border-[#27272a] pt-3 md:pt-0 md:px-4">
                                          <p className="font-bold text-[#e4e4e7] uppercase font-mono tracking-wider text-[10px] text-zinc-500">Cấu hình lựa chọn</p>
                                          <ul className="space-y-1 text-[#d4d4d8]">
                                            <li>• Lĩnh vực: <strong className="text-white">{req.categoryName}</strong></li>
                                            <li>• Quy mô: <strong className="text-white">{req.inputValue} {req.inputLabel}</strong></li>
                                            <li>• Chi nhánh: <strong className="text-white">{req.branches} cơ sở</strong></li>
                                            <li>• Số vùng âm thanh (Zones): <strong className="text-white">{req.zones} vùng</strong></li>
                                            <li>• Chu kỳ đóng phí: <strong className="text-indigo-400">{req.paymentCycle === 'yearly' ? 'Năm (Tiết kiệm)' : 'Tháng'}</strong></li>
                                          </ul>
                                        </div>

                                        {/* Cột 3: Tính toán báo giá sơ bộ */}
                                        <div className="md:col-span-4 space-y-2 text-xs pt-3 md:pt-0">
                                          <p className="font-bold text-[#e4e4e7] uppercase font-mono tracking-wider text-[10px] text-zinc-500">Ước tính giá sàn</p>
                                          <div className="space-y-1.5">
                                            <div>
                                              <p className="text-[10px] text-[#a1a1aa]">Giá tháng ước tính:</p>
                                              <p className="font-mono font-bold text-white text-sm">{formatVND(req.estimatedPriceMonthly)}/tháng</p>
                                            </div>
                                            <div>
                                              <p className="text-[10px] text-[#a1a1aa]">Tổng tiền tạm tính ({req.paymentCycle === 'yearly' ? '12 tháng' : '1 tháng'}):</p>
                                              <p className="font-mono font-black text-emerald-400 text-sm">{formatVND(req.paymentCycle === 'yearly' ? req.estimatedPriceYearly : req.estimatedPriceMonthly)}</p>
                                            </div>
                                          </div>
                                        </div>

                                      </div>

                                      {/* Cột 4: Ghi chú Admin & Actions */}
                                      <div className="pt-3 border-t border-[#27272a] flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                                        
                                        {/* Ghi chú Admin */}
                                        <div className="flex-1 w-full text-xs">
                                          {editingNotesRequestId === req.id ? (
                                            <div className="flex gap-2 w-full">
                                              <input
                                                type="text"
                                                value={editingNotesValue}
                                                onChange={(e) => setEditingNotesValue(e.target.value)}
                                                placeholder="Nhập ghi chú nội bộ cho yêu cầu này..."
                                                className="flex-1 text-xs bg-[#09090b] border border-[#27272a] text-white rounded-xl px-2.5 py-1.5 focus:outline-none"
                                              />
                                              <button
                                                type="button"
                                                onClick={() => handleSaveRequestNotes(req.id, editingNotesValue)}
                                                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold rounded-xl text-[10px] uppercase cursor-pointer transition-all shrink-0"
                                              >
                                                Lưu
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => setEditingNotesRequestId('')}
                                                className="px-2.5 py-1.5 bg-[#09090b] text-[#a1a1aa] rounded-xl text-[10px] hover:text-white shrink-0 cursor-pointer"
                                              >
                                                Hủy
                                              </button>
                                            </div>
                                          ) : (
                                            <div className="flex items-start gap-1">
                                              <p className="text-[#a1a1aa]">
                                                <strong>Ghi chú nội bộ:</strong> {req.adminNotes || <span className="text-[#52525b] italic">Chưa có ghi chú</span>}
                                              </p>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  setEditingNotesRequestId(req.id);
                                                  setEditingNotesValue(req.adminNotes || '');
                                                }}
                                                className="text-indigo-400 hover:text-indigo-300 font-bold ml-1 cursor-pointer bg-transparent border-none text-[10px]"
                                              >
                                                [Sửa]
                                              </button>
                                            </div>
                                          )}
                                        </div>

                                        {/* Action buttons */}
                                        <div className="flex flex-wrap items-center gap-2 shrink-0 w-full lg:w-auto justify-end">
                                          {/* Update Status Buttons */}
                                          {req.status === 'new' ? (
                                            <>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const updated = quoteRequests.map(r => r.id === req.id ? { ...r, status: 'processed' as const } : r);
                                                  if (onSaveQuoteRequests) onSaveQuoteRequests(updated);
                                                }}
                                                className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold text-[10px] rounded-xl border border-emerald-500/20 cursor-pointer transition-all"
                                              >
                                                Duyệt: Đã báo giá
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const updated = quoteRequests.map(r => r.id === req.id ? { ...r, status: 'declined' as const } : r);
                                                  if (onSaveQuoteRequests) onSaveQuoteRequests(updated);
                                                }}
                                                className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-[10px] rounded-xl border border-rose-500/20 cursor-pointer transition-all"
                                              >
                                                Từ chối
                                              </button>
                                            </>
                                          ) : (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const updated = quoteRequests.map(r => r.id === req.id ? { ...r, status: 'new' as const } : r);
                                                if (onSaveQuoteRequests) onSaveQuoteRequests(updated);
                                              }}
                                              className="px-3 py-1.5 bg-[#09090b] text-[#a1a1aa] hover:text-white font-bold text-[10px] rounded-xl border border-[#27272a] cursor-pointer transition-all"
                                            >
                                              Đặt lại Mới
                                            </button>
                                          )}

                                          {/* Export PDF Button */}
                                          <button
                                            type="button"
                                            onClick={() => handleExportPdfFromRequest(req)}
                                            className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-400 text-black font-extrabold text-[10px] rounded-xl flex items-center gap-1 cursor-pointer transition-all"
                                          >
                                            <Printer className="w-3.5 h-3.5" />
                                            Xuất PDF
                                          </button>

                                          {/* Delete Button */}
                                          <button
                                            type="button"
                                            onClick={() => {
                                              if (window.confirm(`Bạn có chắc muốn xóa vĩnh viễn mã yêu cầu ${req.id}?`)) {
                                                const updated = quoteRequests.filter(r => r.id !== req.id);
                                                if (onSaveQuoteRequests) onSaveQuoteRequests(updated);
                                              }
                                            }}
                                            className="p-1.5 bg-rose-500/5 hover:bg-rose-500/15 text-rose-400 hover:text-rose-300 rounded-xl cursor-pointer border border-rose-500/10 transition-colors"
                                            title="Xóa yêu cầu"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>

                                        </div>

                                      </div>

                                    </div>
                                  );
                                })
                            )}
                          </div>

                        </div>
                      )}

                      {/* ==================== TAB 7: HƯỚNG DẪN SALES ==================== */}
                      {activeTab === 'sales-guide' && (
                        <div className="space-y-6 animate-fadeIn">
                          
                          {/* Banner cảnh báo bảo mật */}
                          <div className="p-3.5 bg-rose-950/20 border border-rose-500/20 text-rose-200 rounded-xl flex items-start gap-3">
                            <Info className="w-5 h-5 text-rose-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <h5 className="text-xs font-bold text-rose-200 font-mono">TÀI LIỆU KHẨN - CHỈ DÀNH CHO NHÂN VIÊN SALES</h5>
                              <p className="text-[10px] text-rose-300 mt-0.5 leading-relaxed">
                                Dưới đây là giá sàn kỹ thuật, bảng thặng dư addons và kịch bản tư vấn. Không tiết lộ chụp ảnh màn hình cho khách hàng bên ngoài.
                              </p>
                            </div>
                          </div>

                          {/* HƯỚNG DẪN CHIẾN LƯỢC BÁN HÀNG PHI TUYẾN TÍNH */}
                          <div className="bg-[#18181b] rounded-2xl border border-indigo-500/30 overflow-hidden shadow-lg">
                            <div className="px-5 py-3.5 bg-[#09090b] text-white border-b border-[#27272a] flex items-center gap-2">
                              <Sparkles className="w-4.5 h-4.5 text-indigo-400" />
                              <span className="text-xs font-bold uppercase tracking-wider font-mono text-indigo-400">
                                HƯỚNG DẪN CHIẾN LƯỢC: CHIẾT KHẤU PHI TUYẾN TÍNH TỐI ƯU (NON-LINEAR CURVE)
                              </span>
                            </div>
                            <div className="p-5 space-y-4">
                              <p className="text-xs text-[#a1a1aa] leading-relaxed font-sans">
                                Hệ thống báo giá của AudioBay áp dụng <strong>mô hình chiết khấu phi tuyến tính tiệm cận (Non-linear Asymptotic Pricing)</strong>. Đây là chiến thuật thương mại cốt lõi bảo vệ biên lợi nhuận của hệ thống và gia tăng động lực up-sell của đội ngũ kinh doanh.
                              </p>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans">
                                <div className="p-4 bg-[#09090b] border border-[#27272a] rounded-xl space-y-2">
                                  <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                                    <Info className="w-4 h-4" />
                                    <span className="text-[11px] font-mono uppercase">1. Bảo vệ mốc 2–4 chi nhánh</span>
                                  </div>
                                  <p className="text-[10px] text-zinc-400 leading-relaxed">
                                    Hạ tỷ lệ chiết khấu năm từ <strong>25% xuống 18%</strong>. Điều này bảo vệ biên lợi nhuận của hệ thống tự động, tránh việc các chuỗi quá nhỏ hưởng ưu đãi sâu một cách dễ dàng mà không cam kết quy mô tương ứng.
                                  </p>
                                </div>

                                <div className="p-4 bg-[#09090b] border border-[#27272a] rounded-xl space-y-2">
                                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                                    <ArrowUp className="w-4 h-4" />
                                    <span className="text-[11px] font-mono uppercase">2. Tạo "Vùng ngọt" thúc đẩy mốc 5–9</span>
                                  </div>
                                  <p className="text-[10px] text-zinc-400 leading-relaxed">
                                    Chiết khấu chuỗi tăng vọt lên <strong>25%</strong> cho gói Năm tại mốc 5–9 chi nhánh. Đây là công cụ tâm lý mạnh mẽ giúp Sales dễ dàng thuyết phục khách hàng nâng quy mô hoặc gộp cơ sở để nhận ưu đãi đột phá.
                                  </p>
                                </div>

                                <div className="p-4 bg-[#09090b] border border-[#27272a] rounded-xl space-y-2">
                                  <div className="flex items-center gap-1.5 text-indigo-400 font-bold">
                                    <BarChart3 className="w-4 h-4" />
                                    <span className="text-[11px] font-mono uppercase">3. Biên an toàn ở mốc lớn</span>
                                  </div>
                                  <p className="text-[10px] text-zinc-400 leading-relaxed">
                                    Mức chiết khấu cho mốc siêu lớn (&gt;50 cơ sở) được giữ ở <strong>38% (thay vì 40%)</strong> để duy trì doanh thu an toàn. Đội ngũ có thể thương lượng thêm bằng các dịch vụ gia tăng (Dedicated AM, SLA kỹ thuật riêng).
                                  </p>
                                </div>
                              </div>

                              <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl space-y-2.5 font-sans">
                                <h5 className="text-[11px] font-bold text-indigo-300 font-mono uppercase flex items-center gap-1.5">
                                  <BookOpen className="w-3.5 h-3.5 text-indigo-400" /> CẨM NANG CHINH PHỤC KHÁCH HÀNG (SALES PLAYBOOK)
                                </h5>
                                <div className="space-y-2 text-[11px] text-[#a1a1aa] leading-relaxed">
                                  <p>
                                    🎯 <strong>Kịch bản Upsell Quy mô:</strong> Khi chuỗi có 3 chi nhánh hỏi gói Năm, Sales tư vấn: <em>"Dạ thưa anh/chị, ở mốc 3 chi nhánh thì chiết khấu tự động là 18%. Nhưng nếu mình đăng ký gộp thêm 2 cơ sở nữa để đạt mốc 5 chi nhánh, ưu đãi chuỗi sẽ <strong>tự động tăng vọt lên 25% cho toàn bộ 5 cơ sở</strong>. Đồng thời anh/chị được bàn giao hệ thống Admin phân quyền quản trị chuỗi tập trung chuyên sâu hoàn toàn miễn phí!"</em>
                                  </p>
                                  <p>
                                    🎯 <strong>Chiến thuật Chuyển đổi chu kỳ Năm (Đóng phí năm):</strong> Nhấn mạnh ưu đãi kép tối đa: vừa được giảm 17% trực tiếp của chu kỳ thanh toán Năm, vừa nâng mức chiết khấu chuỗi tích lũy cao hơn so với thanh toán Tháng đến 8% - 10%.
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Khối 1: Bảng giá sàn Enterprise */}
                          <div className="bg-[#18181b] rounded-2xl border border-[#27272a] overflow-hidden shadow-lg">
                            <div className="px-5 py-3.5 bg-[#09090b] text-white flex justify-between items-center border-b border-[#27272a]">
                              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 font-mono text-indigo-400">
                                <Building className="w-4 h-4" />
                                Bảng giá sàn Enterprise & Đặc thù
                              </span>
                              <button
                                type="button"
                                onClick={handlePrintSalesGuide}
                                className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-[10px] rounded flex items-center gap-1 transition-all cursor-pointer"
                              >
                                <Printer className="w-3.5 h-3.5" /> In tài liệu này
                              </button>
                            </div>
                            <div className="p-5">
                              <div className="overflow-x-auto">
                                <table className="w-full text-xs text-left border-collapse">
                                  <thead>
                                    <tr className="border-b border-[#27272a]">
                                      <th className="py-2.5 font-bold text-[#a1a1aa] uppercase tracking-wider font-mono">Hạng mục công trình</th>
                                      <th className="py-2.5 font-bold text-[#a1a1aa] uppercase tracking-wider text-right font-mono">Giá sàn tối thiểu (tháng)</th>
                                      <th className="py-2.5 font-bold text-[#a1a1aa] uppercase tracking-wider text-right font-mono">Mục tiêu đàm phán</th>
                                      <th className="py-2.5 font-bold text-[#a1a1aa] uppercase tracking-wider pl-4 font-mono">Ghi chú chiến lược</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-[#27272a]">
                                    {INTERNAL_GUIDE.enterprisePricing.map((ep, idx) => (
                                      <tr key={idx} className="hover:bg-[#27272a]/20 transition-colors">
                                        <td className="py-3 font-bold text-white">{ep.type}</td>
                                        <td className="py-3 text-right font-semibold text-rose-400 font-mono">{formatVND(ep.floor)}</td>
                                        <td className="py-3 text-right font-bold text-indigo-400 font-mono">{ep.target} VNĐ</td>
                                        <td className="py-3 text-[#a1a1aa] pl-4 text-[11px]">{ep.note || 'Không có'}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>

                              <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 leading-relaxed font-mono">
                                💡 <strong>Công thức tính nhẩm nhanh:</strong> {INTERNAL_GUIDE.formula}
                              </div>
                            </div>
                          </div>

                          {/* Khối 2: Chiết khấu chuỗi nội bộ */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            
                            {/* Chiết khấu chuỗi */}
                            <div className="bg-[#18181b] rounded-2xl border border-[#27272a] p-5 space-y-3.5 col-span-1 md:col-span-2">
                              <h4 className="text-xs font-extrabold text-white uppercase tracking-wider border-b border-[#27272a] pb-2 flex items-center justify-between font-mono text-indigo-400">
                                <span className="flex items-center gap-1.5"><Layers className="w-4 h-4 text-emerald-400" /> Chiết khấu chuỗi nội bộ</span>
                                <span className="text-[10px] text-zinc-400 lowercase font-normal italic">*Tổng giảm kép tích hợp sẵn 17% ưu đãi năm</span>
                              </h4>
                              <div className="overflow-x-auto">
                                <table className="w-full text-xs border-collapse">
                                  <thead>
                                    <tr className="border-b border-[#27272a]">
                                      <th className="py-2 text-[#a1a1aa] text-left font-mono">Số chi nhánh</th>
                                      <th className="py-2 text-[#a1a1aa] text-center font-mono">Chiết khấu chuỗi (Tháng)</th>
                                      <th className="py-2 text-[#a1a1aa] text-center font-mono">Chiết khấu chuỗi (Năm)</th>
                                      <th className="py-2 text-[#a1a1aa] text-center font-mono text-emerald-400">Tổng giảm thực tế (Kép tích lũy)</th>
                                      <th className="py-2 text-[#a1a1aa] text-right font-mono">Phê duyệt</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-[#27272a] font-medium">
                                    {INTERNAL_GUIDE.chainDiscounts.map((cd, idx) => (
                                      <tr key={idx} className="hover:bg-zinc-800/20">
                                        <td className="py-2.5 font-bold text-white">{cd.range}</td>
                                        <td className="py-2.5 text-center text-[#d4d4d8] font-mono">{cd.monthly}</td>
                                        <td className="py-2.5 text-center font-bold text-sky-400 font-mono">{cd.yearly}</td>
                                        <td className="py-2.5 text-center font-extrabold text-emerald-400 font-mono bg-emerald-500/5 rounded">{cd.compound || cd.yearly}</td>
                                        <td className="py-2.5 text-right text-[11px] text-[#a1a1aa] font-semibold">{cd.note}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            {/* Cam kết dài hạn */}
                            <div className="bg-[#18181b] rounded-2xl border border-[#27272a] p-5 space-y-4 col-span-1">
                              <h4 className="text-xs font-extrabold text-white uppercase tracking-wider border-b border-[#27272a] pb-2 flex items-center gap-1.5 font-mono text-indigo-400">
                                <Briefcase className="w-4 h-4 text-indigo-400" /> Cam kết dài hạn
                              </h4>
                              <ul className="mt-2.5 space-y-2 text-xs">
                                {INTERNAL_GUIDE.contractBonus.map((cb, idx) => (
                                  <li key={idx} className="flex justify-between">
                                    <span className="text-[#a1a1aa]">Hợp đồng {cb.duration}:</span>
                                    <span className="font-bold text-white">{cb.bonus}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Hạng mục Bán thêm (Upsell Addons) */}
                            <div className="bg-[#18181b] rounded-2xl border border-[#27272a] p-5 space-y-4 col-span-1">
                              <h4 className="text-xs font-extrabold text-white uppercase tracking-wider border-b border-[#27272a] pb-2 flex items-center gap-1.5 font-mono text-indigo-400">
                                <Sparkles className="w-4 h-4 text-purple-400" /> Hạng mục Bán thêm (Upsell Addons)
                              </h4>
                              <ul className="mt-2.5 space-y-2 text-xs">
                                {INTERNAL_GUIDE.addons.map((add, idx) => (
                                  <li key={idx} className="flex justify-between items-start gap-4">
                                    <span className="text-[#a1a1aa] leading-tight">{add.service}:</span>
                                    <span className="font-bold text-white text-right shrink-0 font-mono">{add.price}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                          </div>

                          {/* Khối Cơ chế tính chiết khấu */}
                          <div className="bg-[#18181b] rounded-2xl border border-[#27272a] p-5 space-y-4">
                            <h4 className="text-xs font-extrabold text-white uppercase tracking-wider border-b border-[#27272a] pb-2 flex items-center gap-1.5 font-mono text-emerald-400">
                              <Sparkles className="w-4 h-4 text-emerald-400" /> Cơ chế tính chiết khấu chuỗi đa tầng
                            </h4>
                            
                            <div className="space-y-4 text-xs text-[#a1a1aa] leading-relaxed font-sans">
                              <p>
                                Hệ thống báo giá AudioBay áp dụng <strong>cơ chế chiết khấu đa tầng tuần tự kết hợp cộng gộp nội tầng (Sequential Multi-tier Inner-additive Discount)</strong>. Đây là cơ chế chuẩn hóa được đồng bộ toàn diện trên cả hệ thống tự động bên ngoài lẫn công cụ Enterprise nội bộ:
                              </p>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-3 bg-[#09090b] border border-[#27272a] rounded-xl space-y-1">
                                  <span className="text-white font-bold block text-[11px] font-mono text-indigo-400">TẦNG 1: QUY ĐỔI CHU KỲ (BILLING CYCLE)</span>
                                  <p className="text-[10px] text-zinc-400">
                                    Khi chọn <strong>Chu kỳ đóng phí 12 tháng (-17%)</strong>, hệ thống giảm trực tiếp 17% trên đơn giá cơ bản tháng và quy đổi zone phụ trội về giá năm chia 12 (giảm ~16.67%). Việc này tạo ra <strong>Đơn giá quy đổi cơ sở</strong> trước khi áp dụng chiết khấu chuỗi.
                                  </p>
                                </div>

                                <div className="p-3 bg-[#09090b] border border-[#27272a] rounded-xl space-y-1">
                                  <span className="text-white font-bold block text-[11px] font-mono text-amber-400">TẦNG 2: CỘNG GỘP CHÍNH SÁCH (POLICY CODES)</span>
                                  <p className="text-[10px] text-zinc-400">
                                    Cộng gộp trực tiếp <strong>Chiết khấu chuỗi (lũy tiến theo quy mô)</strong> và <strong>Chiết khấu cam kết hợp đồng</strong>:
                                    <span className="text-white block font-mono font-bold mt-1">Tổng chiết khấu gộp = % Chiết khấu chuỗi + % Chiết khấu cam kết</span>
                                    <em>Ví dụ: Chuỗi 6 cơ sở đóng phí NĂM (Chiết khấu chuỗi 25%) cam kết hợp đồng 2 năm (thêm 5%) &rarr; Tổng chiết khấu gộp áp dụng là 30%.</em>
                                  </p>
                                </div>

                                <div className="p-3 bg-[#09090b] border border-[#27272a] rounded-xl space-y-1">
                                  <span className="text-white font-bold block text-[11px] font-mono text-emerald-400">TẦNG 3: ÁP DỤNG ĐƠN GIÁ CUỐI CÙNG</span>
                                  <p className="text-[10px] text-zinc-400">
                                    Tỉ lệ tổng chiết khấu gộp được áp dụng trực tiếp lên Đơn giá quy đổi cơ sở để tính ra đơn giá thực tế của mỗi cơ sở:
                                    <span className="text-white block font-mono font-bold mt-1">Đơn giá cuối/cơ sở = Đơn giá quy đổi cơ sở × (1 - Tổng chiết khấu gộp)</span>
                                    Giúp nhân viên linh hoạt đàm phán hợp đồng dài hạn để có giá trị thặng dư tốt nhất.
                                  </p>
                                </div>
                              </div>

                              <div className="p-3 bg-rose-500/5 border border-rose-500/10 rounded-xl space-y-1">
                                <span className="text-rose-400 font-bold block font-mono text-[11px]">🛡️ NGUYÊN TẮC AN TOÀN - GIÁ SÀN KỸ THUẬT (FLOOR PRICE CONTROL):</span>
                                <p className="text-[10px] text-rose-300">
                                  Để đảm bảo an toàn tài chính (chi phí duy trì, kỹ thuật vận hành và bản quyền âm nhạc), hệ thống tự động kiểm soát <strong>Giá sàn kỹ thuật tối thiểu là 200,000 VNĐ / zone / tháng</strong> trên toàn chuỗi. Nếu Sales áp dụng chiết khấu quá sâu dẫn tới đơn giá chia đều trung bình dưới sàn này, hệ thống sẽ cảnh báo đỏ và khóa chức năng in/xuất báo giá ngay lập tức.
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Khối 3: Sales Script */}
                          <div className="bg-[#18181b] rounded-2xl border border-[#27272a] p-5 space-y-3">
                            <h4 className="text-xs font-extrabold text-white uppercase tracking-wider border-b border-[#27272a] pb-2 flex items-center gap-1.5 font-mono text-indigo-400">
                              <HelpCircle className="w-4 h-4 text-teal-400" /> Kịch bản / Câu hỏi gợi mở nhu cầu (Sales Script)
                            </h4>
                            <div className="bg-[#09090b] border border-[#27272a] rounded-xl p-4 font-serif italic text-sm text-[#d4d4d8] leading-relaxed">
                              "{INTERNAL_GUIDE.salesScript}"
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ==================== TAB 9: BÁO GIÁ CHUỖI & ENTERPRISE ==================== */}
                      {activeTab === 'sales-calculator' && (() => {
                        const calcCategory = editedPricingData.find(c => c.id === calcCatId) || editedPricingData[0];
                        const calcAutoSelectedTier = autoSelectTier(calcCategory, calcInputValue);
                        
                        // Đảm bảo số zone thực tế tối thiểu luôn là 1
                        const safeExtraZones = Math.max(-(calcAutoSelectedTier.zones - 1), calcExtraZones);
                        
                        // Lấy các tính năng đi kèm gói dịch vụ
                        const basePrice = typeof calcCustomBasePrice === 'number' ? calcCustomBasePrice : (calcAutoSelectedTier.price_month || 0);
                        
                        const calcResult = calculatePrice({
                          category: calcCategory,
                          tier: calcAutoSelectedTier,
                          inputValue: calcInputValue,
                          extraZones: safeExtraZones,
                          branches: calcBranches,
                          paymentCycle: calcPaymentCycle,
                          isInternal: true,
                          customBasePrice: calcCustomBasePrice === '' ? undefined : Number(calcCustomBasePrice),
                        });

                        const contractBonusPercent = calcContractDuration === '1year' ? 0 : (calcContractDuration === '2year' ? 0.05 : 0.08);
                        
                        const adjustedBasePrice = calcPaymentCycle === 'yearly' ? Math.round(basePrice * (1 - 0.17)) : basePrice;
                        const unitPriceBeforeDiscount = adjustedBasePrice + calcResult.zoneAddon;

                        // Tính chiết khấu tuần tự bảo vệ biên lợi nhuận (Sequential Discounting)
                        const priceAfterChainDiscount = Math.round(unitPriceBeforeDiscount * (1 - calcResult.chainDiscountPercent));
                        const chainDiscountAmount = unitPriceBeforeDiscount - priceAfterChainDiscount;

                        const adjustedBranchPrice = Math.round(priceAfterChainDiscount * (1 - contractBonusPercent));
                        const contractDiscountAmount = priceAfterChainDiscount - adjustedBranchPrice;

                        const totalDiscountAmount = chainDiscountAmount + contractDiscountAmount;
                        const effectiveDiscountRate = unitPriceBeforeDiscount > 0 ? (totalDiscountAmount / unitPriceBeforeDiscount) : 0;
                        
                        const totalSubscription = adjustedBranchPrice * calcBranches * (calcPaymentCycle === 'yearly' ? 12 : 1);
                        
                        const recurringAddonsMonthly = (hasDedicatedAM ? dedicatedAMPrice : 0) + (hasPrioritySLA ? prioritySLAPrice : 0);
                        const recurringAddonsByCycle = recurringAddonsMonthly * (calcPaymentCycle === 'yearly' ? 12 : 1);
                        const oneTimeAddons = (hasCuration ? curationPrice : 0) + (hasOnboarding ? onboardingPrice : 0);
                        
                        const totalAddons = recurringAddonsByCycle + oneTimeAddons;
                        const grandTotal = totalSubscription + totalAddons;
                        
                        const totalZonesAcrossChain = (calcAutoSelectedTier.zones + safeExtraZones) * calcBranches;
                        const floorPriceMonthlyTotal = totalZonesAcrossChain * 200000;
                        const proposedSubscriptionMonthlyTotal = totalSubscription / (calcPaymentCycle === 'yearly' ? 12 : 1);
                        const isBelowFloor = proposedSubscriptionMonthlyTotal < floorPriceMonthlyTotal;
                        
                        const handlePrintInternalQuote = () => {
                          const selectedAddonsArray: Array<{ service: string; price: number; isMonthly: boolean }> = [];
                          if (hasCuration) selectedAddonsArray.push({ service: 'Curation Playlist thương hiệu', price: curationPrice, isMonthly: false });
                          if (hasDedicatedAM) selectedAddonsArray.push({ service: 'Dedicated Account Manager', price: dedicatedAMPrice, isMonthly: true });
                          if (hasPrioritySLA) selectedAddonsArray.push({ service: 'SLA ưu tiên phản hồi < 4h', price: prioritySLAPrice, isMonthly: true });
                          if (hasOnboarding) selectedAddonsArray.push({ service: 'Onboarding & training trực tiếp', price: onboardingPrice, isMonthly: false });

                          const contractLabel = calcContractDuration === '1year' ? '1 Năm (Không chiết khấu thêm)' : (calcContractDuration === '2year' ? '2 Năm (Ưu đãi thêm -5%)' : '3 Năm (Ưu đãi thêm -8%)');

                          const params: QuoteParams = {
                            category: calcCategory,
                            tier: calcAutoSelectedTier,
                            inputValue: calcInputValue,
                            extraZones: safeExtraZones,
                            branches: calcBranches,
                            paymentCycle: calcPaymentCycle,
                            chainDiscount: calcResult.chainDiscountPercent,
                            basePrice: adjustedBasePrice,
                            zoneAddon: calcResult.zoneAddon,
                            totalAmount: grandTotal,
                            saving: calcResult.saving,
                            originalTotalAmount: calcResult.originalTotalAmount,
                            customerInfo: {
                              name: custName || 'Đại diện chuỗi doanh nghiệp',
                              company: custCompany || 'Doanh nghiệp Chuỗi & Enterprise',
                              phone: custPhone || '—',
                              email: custEmail || '—',
                              notes: custNotes || 'Báo giá nhanh nội bộ dành cho chuỗi chi nhánh và đối tác Enterprise.',
                            },
                            quoteDate: new Date().toLocaleDateString('vi-VN'),
                            validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('vi-VN'),
                            company: company || COMPANY,
                            contractDuration: contractLabel,
                            contractBonusPercent: contractBonusPercent * 100,
                            selectedAddons: selectedAddonsArray,
                            isInternalSales: true,
                            technicalFloorPrice: floorPriceMonthlyTotal,
                          };

                          exportQuoteToPDF(params);
                        };

                        return (
                          <div className="space-y-6 animate-fadeIn pb-12 overflow-y-auto max-h-[75vh] px-2">
                            {/* Header & Warning Banner */}
                            <div className="p-4 bg-amber-950/20 border border-amber-500/20 text-amber-200 rounded-xl flex items-start gap-3">
                              <Info className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <h5 className="text-xs font-bold text-amber-200 font-mono">CÔNG CỤ BÁO GIÁ CHUỖI & ENTERPRISE (NỘI BỘ)</h5>
                                <p className="text-[10px] text-amber-300 mt-0.5 leading-relaxed">
                                  Hệ thống tự động áp dụng biểu chiết khấu lũy tiến từ 5 chi nhánh trở lên và đối chiếu giá sàn kỹ thuật <strong>({formatVND(200000)}/zone/tháng)</strong>. Salesperson không được chào giá thấp hơn giá sàn kỹ thuật khi chưa được Ban Giám Đốc phê duyệt bằng văn bản.
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                              {/* CỘT TRÁI - NHẬP LIỆU */}
                              <div className="lg:col-span-7 space-y-6">
                                {/* Khối 1: Lựa chọn Mô hình & Quy mô */}
                                <div className="bg-[#18181b] rounded-2xl border border-[#27272a] p-5 space-y-4">
                                  <h4 className="text-xs font-extrabold text-white uppercase tracking-wider border-b border-[#27272a] pb-2 flex items-center gap-1.5 font-mono text-indigo-400">
                                    <Layers className="w-4 h-4 text-emerald-400" /> 1. Mô hình & Quy mô cơ sở
                                  </h4>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-[10px] font-bold text-[#a1a1aa] mb-1 font-mono uppercase">Lĩnh vực hoạt động</label>
                                      <select
                                        value={calcCatId}
                                        onChange={(e) => {
                                          setCalcCatId(e.target.value);
                                          const cat = editedPricingData.find(c => c.id === e.target.value) || editedPricingData[0];
                                          setCalcInputValue(cat.inputType === 'area' ? 60 : 20);
                                          setCalcCustomBasePrice('');
                                        }}
                                        className="w-full text-xs bg-[#09090b] border border-[#27272a] rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-white font-mono"
                                      >
                                        {editedPricingData.filter(c => !c.isChain).map(c => (
                                          <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                      </select>
                                    </div>

                                    <div>
                                      <label className="block text-[10px] font-bold text-[#a1a1aa] mb-1 font-mono uppercase">
                                        Quy mô ({calcCategory.inputType === 'area' ? 'Diện tích m²' : 'Số phòng'})
                                      </label>
                                      <div className="flex gap-2">
                                        <input
                                          type="number"
                                          value={calcInputValue}
                                          onChange={(e) => setCalcInputValue(Math.max(1, Number(e.target.value)))}
                                          className="w-full text-xs bg-[#09090b] border border-[#27272a] rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-white font-mono"
                                        />
                                        <span className="p-2.5 text-xs text-[#a1a1aa] bg-[#09090b] border border-[#27272a] rounded-xl font-mono shrink-0">
                                          {calcCategory.inputType === 'area' ? 'm²' : 'phòng'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="p-3 bg-[#09090b] border border-[#27272a] rounded-xl text-xs flex justify-between items-center font-mono">
                                    <span className="text-[#a1a1aa]">Gói tự động nhận diện:</span>
                                    <span className="text-emerald-400 font-extrabold">{calcAutoSelectedTier.name} ({calcAutoSelectedTier.area})</span>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-[10px] font-bold text-[#a1a1aa] mb-1 font-mono uppercase">Đơn giá gốc hệ thống</label>
                                      <div className="p-2.5 text-xs bg-[#09090b]/50 border border-[#27272a]/80 rounded-xl text-[#a1a1aa] font-mono">
                                        {formatVND(calcAutoSelectedTier.price_month || 0)}/tháng
                                      </div>
                                    </div>

                                    <div>
                                      <label className="block text-[10px] font-bold text-[#a1a1aa] mb-1 font-mono uppercase">Tự cấu hình đơn giá gốc (Tùy chọn)</label>
                                      <input
                                        type="number"
                                        placeholder="Để trống để dùng đơn giá mặc định..."
                                        value={calcCustomBasePrice}
                                        onChange={(e) => setCalcCustomBasePrice(e.target.value === '' ? '' : Number(e.target.value))}
                                        className="w-full text-xs bg-[#09090b] border border-[#27272a] rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-white font-mono"
                                      />
                                    </div>
                                  </div>
                                </div>

                                {/* Khối 2: Cấu hình Hệ thống & Cam kết */}
                                <div className="bg-[#18181b] rounded-2xl border border-[#27272a] p-5 space-y-4">
                                  <h4 className="text-xs font-extrabold text-white uppercase tracking-wider border-b border-[#27272a] pb-2 flex items-center gap-1.5 font-mono text-indigo-400">
                                    <Sliders className="w-4 h-4 text-emerald-400" /> 2. Số địa điểm, vùng âm thanh & Thanh toán
                                  </h4>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-[10px] font-bold text-[#a1a1aa] mb-1.5 font-mono uppercase">
                                        Số địa điểm (Cơ sở): <span className="text-white font-extrabold">{calcBranches}</span>
                                      </label>
                                      <input
                                        type="range"
                                        min="1"
                                        max="200"
                                        value={calcBranches}
                                        onChange={(e) => setCalcBranches(Number(e.target.value))}
                                        className="w-full accent-emerald-400 cursor-pointer h-1 bg-[#09090b] rounded-lg appearance-none"
                                      />
                                      <div className="flex justify-between text-[9px] text-[#52525b] font-mono mt-1">
                                        <span>1 địa điểm</span>
                                        <span className="text-emerald-400 font-bold">5+ (Bắt đầu Chuỗi)</span>
                                        <span>200 địa điểm</span>
                                      </div>
                                    </div>

                                    <div>
                                      <label className="block text-[10px] font-bold text-[#a1a1aa] mb-1.5 font-mono uppercase">
                                        Số vùng âm thanh (Zones) thực tế/cơ sở: <span className="text-white font-extrabold">{calcAutoSelectedTier.zones + safeExtraZones} Zone</span>
                                        {safeExtraZones < 0 && (
                                          <span className="text-emerald-400 font-bold ml-1">
                                            (Khấu trừ -{Math.abs(safeExtraZones)} Zone)
                                          </span>
                                        )}
                                      </label>
                                      <input
                                        type="range"
                                        min={-(calcAutoSelectedTier.zones - 1)}
                                        max="15"
                                        value={calcExtraZones}
                                        onChange={(e) => setCalcExtraZones(Number(e.target.value))}
                                        className="w-full accent-emerald-400 cursor-pointer h-1 bg-[#09090b] rounded-lg appearance-none"
                                      />
                                      <div className="flex justify-between text-[9px] text-[#52525b] font-mono mt-1">
                                        <span>Tối thiểu (1 zone)</span>
                                        <span className="text-[#a1a1aa] font-medium">Mặc định ({calcAutoSelectedTier.zones} zone)</span>
                                        <span>Tối đa +15 zones</span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                    <div>
                                      <label className="block text-[10px] font-bold text-[#a1a1aa] mb-1.5 font-mono uppercase">Chu kỳ đóng phí</label>
                                      <div className="grid grid-cols-2 gap-2 bg-[#09090b] p-1 border border-[#27272a] rounded-xl">
                                        <button
                                          type="button"
                                          onClick={() => setCalcPaymentCycle('monthly')}
                                          className={`py-1.5 text-[10px] font-bold rounded-lg font-mono transition-all cursor-pointer ${
                                            calcPaymentCycle === 'monthly' ? 'bg-[#18181b] text-emerald-400 border border-[#27272a]' : 'text-[#71717a]'
                                          }`}
                                        >
                                          Từng Tháng
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setCalcPaymentCycle('yearly')}
                                          className={`py-1.5 text-[10px] font-bold rounded-lg font-mono transition-all cursor-pointer ${
                                            calcPaymentCycle === 'yearly' ? 'bg-[#18181b] text-emerald-400 border border-[#27272a]' : 'text-[#71717a]'
                                          }`}
                                        >
                                          12 Tháng (-17%)
                                        </button>
                                      </div>
                                    </div>

                                    <div>
                                      <label className="block text-[10px] font-bold text-[#a1a1aa] mb-1.5 font-mono uppercase">Thời hạn hợp đồng cam kết</label>
                                      <div className="grid grid-cols-3 gap-2 bg-[#09090b] p-1 border border-[#27272a] rounded-xl">
                                        <button
                                          type="button"
                                          onClick={() => setCalcContractDuration('1year')}
                                          className={`py-1.5 text-[10px] font-bold rounded-lg font-mono transition-all cursor-pointer ${
                                            calcContractDuration === '1year' ? 'bg-[#18181b] text-emerald-400 border border-[#27272a]' : 'text-[#71717a]'
                                          }`}
                                        >
                                          1 Năm (0%)
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setCalcContractDuration('2year')}
                                          className={`py-1.5 text-[10px] font-bold rounded-lg font-mono transition-all cursor-pointer ${
                                            calcContractDuration === '2year' ? 'bg-[#18181b] text-emerald-400 border border-[#27272a]' : 'text-[#71717a]'
                                          }`}
                                        >
                                          2 Năm (-5%)
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setCalcContractDuration('3year')}
                                          className={`py-1.5 text-[10px] font-bold rounded-lg font-mono transition-all cursor-pointer ${
                                            calcContractDuration === '3year' ? 'bg-[#18181b] text-emerald-400 border border-[#27272a]' : 'text-[#71717a]'
                                          }`}
                                        >
                                          3 Năm (-8%)
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Khối 3: Hạng mục bán thêm (Upsell Addons) */}
                                <div className="bg-[#18181b] rounded-2xl border border-[#27272a] p-5 space-y-4">
                                  <h4 className="text-xs font-extrabold text-white uppercase tracking-wider border-b border-[#27272a] pb-2 flex items-center gap-1.5 font-mono text-indigo-400">
                                    <Sparkles className="w-4 h-4 text-emerald-400" /> 3. Các hạng mục Bán thêm (Upsell Addons)
                                  </h4>

                                  <div className="space-y-3">
                                    {/* Addon 1 */}
                                    <div className="p-3 bg-[#09090b] border border-[#27272a] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                      <label className="flex items-start gap-2.5 cursor-pointer select-none">
                                        <input
                                          type="checkbox"
                                          checked={hasCuration}
                                          onChange={(e) => setHasCuration(e.target.checked)}
                                          className="w-4 h-4 rounded border-[#27272a] text-indigo-600 focus:ring-indigo-500 bg-zinc-950 mt-0.5 cursor-pointer"
                                        />
                                        <div>
                                          <span className="text-xs font-bold text-white block">Curation Playlist thương hiệu</span>
                                          <span className="text-[10px] text-[#a1a1aa]">Thiết kế nhạc mục độc quyền (Thu phí 1 lần)</span>
                                        </div>
                                      </label>
                                      <div className="flex items-center gap-1">
                                        <input
                                          type="number"
                                          value={curationPrice}
                                          onChange={(e) => setCurationPrice(Number(e.target.value))}
                                          disabled={!hasCuration}
                                          className="w-28 text-xs bg-[#18181b] border border-[#27272a] rounded-xl p-1.5 text-white text-right font-mono disabled:opacity-40 focus:outline-none"
                                        />
                                        <span className="text-[10px] text-[#71717a] font-mono font-bold">đ</span>
                                      </div>
                                    </div>

                                    {/* Addon 2 */}
                                    <div className="p-3 bg-[#09090b] border border-[#27272a] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                      <label className="flex items-start gap-2.5 cursor-pointer select-none">
                                        <input
                                          type="checkbox"
                                          checked={hasDedicatedAM}
                                          onChange={(e) => setHasDedicatedAM(e.target.checked)}
                                          className="w-4 h-4 rounded border-[#27272a] text-indigo-600 focus:ring-indigo-500 bg-zinc-950 mt-0.5 cursor-pointer"
                                        />
                                        <div>
                                          <span className="text-xs font-bold text-white block">Dedicated Account Manager</span>
                                          <span className="text-[10px] text-[#a1a1aa]">Chăm sóc riêng 24/7 (Phí duy trì/tháng)</span>
                                        </div>
                                      </label>
                                      <div className="flex items-center gap-1">
                                        <input
                                          type="number"
                                          value={dedicatedAMPrice}
                                          onChange={(e) => setDedicatedAMPrice(Number(e.target.value))}
                                          disabled={!hasDedicatedAM}
                                          className="w-28 text-xs bg-[#18181b] border border-[#27272a] rounded-xl p-1.5 text-white text-right font-mono disabled:opacity-40 focus:outline-none"
                                        />
                                        <span className="text-[10px] text-[#71717a] font-mono font-bold">đ/tháng</span>
                                      </div>
                                    </div>

                                    {/* Addon 3 */}
                                    <div className="p-3 bg-[#09090b] border border-[#27272a] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                      <label className="flex items-start gap-2.5 cursor-pointer select-none">
                                        <input
                                          type="checkbox"
                                          checked={hasPrioritySLA}
                                          onChange={(e) => setHasPrioritySLA(e.target.checked)}
                                          className="w-4 h-4 rounded border-[#27272a] text-indigo-600 focus:ring-indigo-500 bg-zinc-950 mt-0.5 cursor-pointer"
                                        />
                                        <div>
                                          <span className="text-xs font-bold text-white block">SLA cam kết xử lý sự cố &lt; 4 giờ</span>
                                          <span className="text-[10px] text-[#a1a1aa]">Ưu tiên kỹ thuật hiện trường (Phí duy trì/tháng)</span>
                                        </div>
                                      </label>
                                      <div className="flex items-center gap-1">
                                        <input
                                          type="number"
                                          value={prioritySLAPrice}
                                          onChange={(e) => setPrioritySLAPrice(Number(e.target.value))}
                                          disabled={!hasPrioritySLA}
                                          className="w-28 text-xs bg-[#18181b] border border-[#27272a] rounded-xl p-1.5 text-white text-right font-mono disabled:opacity-40 focus:outline-none"
                                        />
                                        <span className="text-[10px] text-[#71717a] font-mono font-bold">đ/tháng</span>
                                      </div>
                                    </div>

                                    {/* Addon 4 */}
                                    <div className="p-3 bg-[#09090b] border border-[#27272a] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                      <label className="flex items-start gap-2.5 cursor-pointer select-none">
                                        <input
                                          type="checkbox"
                                          checked={hasOnboarding}
                                          onChange={(e) => setHasOnboarding(e.target.checked)}
                                          className="w-4 h-4 rounded border-[#27272a] text-indigo-600 focus:ring-indigo-500 bg-zinc-950 mt-0.5 cursor-pointer"
                                        />
                                        <div>
                                          <span className="text-xs font-bold text-white block">Onboarding & Training tận nơi</span>
                                          <span className="text-[10px] text-[#a1a1aa]">Hỗ trợ cài đặt & đào tạo quản lý vận hành (1 lần)</span>
                                        </div>
                                      </label>
                                      <div className="flex items-center gap-1">
                                        <input
                                          type="number"
                                          value={onboardingPrice}
                                          onChange={(e) => setOnboardingPrice(Number(e.target.value))}
                                          disabled={!hasOnboarding}
                                          className="w-28 text-xs bg-[#18181b] border border-[#27272a] rounded-xl p-1.5 text-white text-right font-mono disabled:opacity-40 focus:outline-none"
                                        />
                                        <span className="text-[10px] text-[#71717a] font-mono font-bold">đ</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Khối 4: Thông tin khách hàng */}
                                <div className="bg-[#18181b] rounded-2xl border border-[#27272a] p-5 space-y-4">
                                  <h4 className="text-xs font-extrabold text-white uppercase tracking-wider border-b border-[#27272a] pb-2 flex items-center gap-1.5 font-mono text-indigo-400">
                                    <Building className="w-4 h-4 text-emerald-400" /> 4. Thông tin Doanh nghiệp nhận báo giá
                                  </h4>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-[10px] font-bold text-[#a1a1aa] mb-1 font-mono uppercase">Tên khách hàng/Đại diện</label>
                                      <input
                                        type="text"
                                        placeholder="Ví dụ: Ông Nguyễn Văn A..."
                                        value={custName}
                                        onChange={(e) => setCustName(e.target.value)}
                                        className="w-full text-xs bg-[#09090b] border border-[#27272a] rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-white font-mono"
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-[10px] font-bold text-[#a1a1aa] mb-1 font-mono uppercase">Tên Doanh nghiệp/Chuỗi</label>
                                      <input
                                        type="text"
                                        placeholder="Ví dụ: Highlands Coffee Group..."
                                        value={custCompany}
                                        onChange={(e) => setCustCompany(e.target.value)}
                                        className="w-full text-xs bg-[#09090b] border border-[#27272a] rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-white font-mono"
                                      />
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-[10px] font-bold text-[#a1a1aa] mb-1 font-mono uppercase">Số điện thoại</label>
                                      <input
                                        type="text"
                                        placeholder="Ví dụ: 0901234567..."
                                        value={custPhone}
                                        onChange={(e) => setCustPhone(e.target.value)}
                                        className="w-full text-xs bg-[#09090b] border border-[#27272a] rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-white font-mono"
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-[10px] font-bold text-[#a1a1aa] mb-1 font-mono uppercase">Địa chỉ Email</label>
                                      <input
                                        type="email"
                                        placeholder="Ví dụ: partner@company.com..."
                                        value={custEmail}
                                        onChange={(e) => setCustEmail(e.target.value)}
                                        className="w-full text-xs bg-[#09090b] border border-[#27272a] rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-white font-mono"
                                      />
                                    </div>
                                  </div>

                                  <div>
                                    <label className="block text-[10px] font-bold text-[#a1a1aa] mb-1 font-mono uppercase">Ghi chú bổ sung (In trên báo giá)</label>
                                    <textarea
                                      rows={2}
                                      placeholder="Mô tả đặc thù, tặng thêm thời hạn thử nghiệm..."
                                      value={custNotes}
                                      onChange={(e) => setCustNotes(e.target.value)}
                                      className="w-full text-xs bg-[#09090b] border border-[#27272a] rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-white font-mono"
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* CỘT PHẢI - REAL-TIME INVOICE & FLOORS */}
                              <div className="lg:col-span-5 space-y-6">
                                {/* Khối Chiến lược Báo giá */}
                                <div className="bg-[#18181b] rounded-2xl border border-[#27272a] p-5 space-y-4">
                                  <h4 className="text-xs font-extrabold text-white uppercase tracking-wider border-b border-[#27272a] pb-2 flex items-center gap-1.5 font-mono text-[#f59e0b]">
                                    <Briefcase className="w-4 h-4 text-amber-400" /> Phân cấp Phê duyệt Chiến lược
                                  </h4>

                                  <div className="p-4 bg-[#09090b] border border-[#27272a] rounded-xl space-y-2">
                                    <div className="flex justify-between items-center text-xs">
                                      <span className="text-[#a1a1aa]">Số lượng chi nhánh:</span>
                                      <span className="text-white font-bold font-mono">{calcBranches} cơ sở</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                      <span className="text-[#a1a1aa]">Chu kỳ đóng phí:</span>
                                      <button
                                        type="button"
                                        onClick={() => setCalcPaymentCycle(calcPaymentCycle === 'yearly' ? 'monthly' : 'yearly')}
                                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-extrabold transition-all cursor-pointer ${
                                          calcPaymentCycle === 'yearly' 
                                            ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' 
                                            : 'bg-zinc-800 hover:bg-zinc-700 text-[#a1a1aa] border border-[#27272a]'
                                        }`}
                                        title="Nhấp để chuyển đổi chu kỳ đóng phí"
                                      >
                                        {calcPaymentCycle === 'yearly' ? '12 Tháng (-17%)' : 'Từng Tháng (0%)'}
                                      </button>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                      <span className="text-[#a1a1aa]">Ưu đãi chiết khấu chuỗi:</span>
                                      <span className="text-emerald-400 font-extrabold font-mono">-{calcResult.chainDiscountPercent * 100}%</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                      <span className="text-[#a1a1aa]">Ưu đãi cam kết ({calcContractDuration === '1year' ? '1 Năm' : calcContractDuration === '2year' ? '2 Năm' : '3 Năm'}):</span>
                                      <span className="text-emerald-400 font-extrabold font-mono">-{contractBonusPercent * 100}%</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs border-t border-[#27272a] pt-2">
                                      <span className="text-[#a1a1aa] font-bold">Hiệu suất chiết khấu (Tuần tự):</span>
                                      <span className="text-amber-400 font-extrabold font-mono">-{Math.round(effectiveDiscountRate * 1000) / 10}%</span>
                                    </div>
                                  </div>

                                  {/* Cấp duyệt */}
                                  <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-xl text-xs flex items-center gap-2.5 font-mono">
                                    <span className="text-base">🎯</span>
                                    <div>
                                      <span className="text-[#71717a] text-[10px] block">CẤP PHÊ DUYỆT ĐỀ XUẤT</span>
                                      <span className="font-bold text-white uppercase">
                                        {calcBranches < 5 ? 'Nhân viên Sales tự duyệt' : 
                                         calcBranches <= 9 ? 'Salesperson xác nhận' : 
                                         calcBranches <= 19 ? 'Trưởng phòng Sales duyệt' : 
                                         calcBranches <= 49 ? 'Giám đốc Kinh doanh ký hợp đồng' : 
                                         'Phê duyệt cấp CEO / Director level'}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Khối Báo giá Chi tiết */}
                                <div className="bg-zinc-950 rounded-2xl border border-zinc-800 p-5 space-y-4">
                                  <h4 className="text-xs font-extrabold text-white uppercase tracking-wider border-b border-zinc-800 pb-2 flex items-center gap-1.5 font-mono text-emerald-400">
                                    <DollarSign className="w-4 h-4 text-emerald-400 animate-pulse" /> Bảng phân rã báo giá
                                  </h4>

                                  <div className="space-y-3.5 text-xs">
                                    <div className="flex justify-between text-[#a1a1aa]">
                                      <span>Đơn giá cơ bản/cơ sở/tháng:</span>
                                      <span className="font-mono text-white font-bold">{formatVND(basePrice)}</span>
                                    </div>

                                    {calcPaymentCycle === 'yearly' && (
                                      <div className="flex justify-between text-[#a1a1aa]">
                                        <span className="text-emerald-400 font-medium">Giảm chu kỳ đóng phí (Trả năm -17%):</span>
                                        <span className="font-mono text-emerald-400 font-bold">-{formatVND(Math.round(basePrice * 0.17))}</span>
                                      </div>
                                    )}

                                    <div className="flex justify-between text-[#a1a1aa]">
                                      <span>Zone phụ trội/cơ sở/tháng:</span>
                                      <span className="font-mono text-white font-bold">+{formatVND(calcResult.zoneAddon)}</span>
                                    </div>

                                    <div className="flex justify-between text-[#a1a1aa] border-t border-zinc-900 pt-2">
                                      <span>Giá trị trước chiết khấu/cơ sở:</span>
                                      <span className="font-mono text-white font-bold">{formatVND(unitPriceBeforeDiscount)}</span>
                                    </div>

                                    <div className="flex justify-between text-[#a1a1aa]">
                                      <span>Ưu đãi chuỗi chi nhánh (-{calcResult.chainDiscountPercent * 100}%):</span>
                                      <span className="font-mono text-emerald-400 font-bold">-{formatVND(chainDiscountAmount)}</span>
                                    </div>

                                    {contractBonusPercent > 0 && (
                                      <div className="flex justify-between text-[#a1a1aa]">
                                        <span>Ưu đãi cam kết hợp đồng (-{contractBonusPercent * 100}% tuần tự):</span>
                                        <span className="font-mono text-emerald-400 font-bold">-{formatVND(contractDiscountAmount)}</span>
                                      </div>
                                    )}

                                    <div className="flex justify-between text-zinc-300 font-bold">
                                      <span>Đơn giá sau chiết khấu/cơ sở:</span>
                                      <span className="font-mono text-emerald-400 font-extrabold">{formatVND(adjustedBranchPrice)}</span>
                                    </div>

                                    <div className="flex justify-between text-[#a1a1aa] border-t border-zinc-900 pt-2">
                                      <span>Số tiền thuê bao chuỗi ({calcBranches} cơ sở):</span>
                                      <span className="font-mono text-white font-bold">{formatVND(adjustedBranchPrice * calcBranches)}/tháng</span>
                                    </div>

                                    <div className="flex justify-between text-zinc-300 font-extrabold bg-[#09090b] p-2.5 rounded-xl border border-zinc-800">
                                      <span>Tiền thuê bao ({calcPaymentCycle === 'yearly' ? '12 tháng' : 'Hàng tháng'}):</span>
                                      <span className="font-mono text-emerald-400 font-black">{formatVND(totalSubscription)}</span>
                                    </div>

                                    {totalAddons > 0 && (
                                      <div className="space-y-2 bg-[#09090b]/40 p-2.5 rounded-xl border border-zinc-900">
                                        <span className="text-[10px] font-bold text-zinc-400 font-mono block uppercase">Chi tiết Addons bán thêm:</span>
                                        {hasCuration && (
                                          <div className="flex justify-between text-[11px] text-zinc-500">
                                            <span>• Curation Playlist (1 lần):</span>
                                            <span className="font-mono text-zinc-300">{formatVND(curationPrice)}</span>
                                          </div>
                                        )}
                                        {hasDedicatedAM && (
                                          <div className="flex justify-between text-[11px] text-zinc-500">
                                            <span>• Dedicated AM ({calcPaymentCycle === 'yearly' ? '12 tháng' : 'Hàng tháng'}):</span>
                                            <span className="font-mono text-[#d4d4d8] font-bold">{formatVND(dedicatedAMPrice * (calcPaymentCycle === 'yearly' ? 12 : 1))}</span>
                                          </div>
                                        )}
                                        {hasPrioritySLA && (
                                          <div className="flex justify-between text-[11px] text-zinc-500">
                                            <span>• SLA ưu tiên kỹ thuật ({calcPaymentCycle === 'yearly' ? '12 tháng' : 'Hàng tháng'}):</span>
                                            <span className="font-mono text-[#d4d4d8] font-bold">{formatVND(prioritySLAPrice * (calcPaymentCycle === 'yearly' ? 12 : 1))}</span>
                                          </div>
                                        )}
                                        {hasOnboarding && (
                                          <div className="flex justify-between text-[11px] text-zinc-500">
                                            <span>• Onboarding tận nơi (1 lần):</span>
                                            <span className="font-mono text-zinc-300">{formatVND(onboardingPrice)}</span>
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    <div className="flex flex-col gap-1 text-center bg-emerald-950/20 border border-emerald-500/20 p-4 rounded-2xl">
                                      <span className="text-[10px] font-bold text-emerald-300 tracking-wider uppercase font-mono">TỔNG GIÁ TRỊ BÁO GIÁ ĐỀ XUẤT</span>
                                      <span className="text-2xl font-black text-emerald-400 font-mono">
                                        {formatVND(grandTotal)}
                                        <span className="text-xs font-semibold text-zinc-400 ml-1">/{calcPaymentCycle === 'yearly' ? 'năm' : 'tháng'}</span>
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Khối Kiểm định Thặng dư Kỹ thuật */}
                                <div className="bg-[#18181b] rounded-2xl border border-[#27272a] p-5 space-y-4">
                                  <h4 className="text-xs font-extrabold text-white uppercase tracking-wider border-b border-[#27272a] pb-2 flex items-center gap-1.5 font-mono text-indigo-400">
                                    <Info className="w-4 h-4 text-amber-400" /> Đối chiếu Tiêu chuẩn Thặng dư
                                  </h4>

                                  <div className="space-y-3 text-xs">
                                    <div className="flex justify-between text-[#a1a1aa]">
                                      <span>Tổng zones thực tế toàn chuỗi:</span>
                                      <span className="font-mono text-white font-bold">{totalZonesAcrossChain} Zones</span>
                                    </div>

                                    <div className="flex justify-between text-[#a1a1aa]">
                                      <span>Đơn giá sàn yêu cầu/zone:</span>
                                      <span className="font-mono text-white font-bold">{formatVND(200000)}/tháng</span>
                                    </div>

                                    <div className="flex justify-between text-[#a1a1aa] border-t border-[#27272a] pt-2">
                                      <span>Giá sàn thuê bao/tháng toàn chuỗi:</span>
                                      <span className="font-mono text-rose-400 font-bold">{formatVND(floorPriceMonthlyTotal)}/tháng</span>
                                    </div>

                                    <div className="flex justify-between text-[#a1a1aa]">
                                      <span>Giá đề xuất quy đổi/tháng:</span>
                                      <span className="font-mono text-indigo-400 font-bold">{formatVND(Math.round(proposedSubscriptionMonthlyTotal))}/tháng</span>
                                    </div>

                                    {/* Compliance Status */}
                                    {isBelowFloor ? (
                                      <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl font-mono text-xs space-y-1 animate-pulse">
                                        <div className="font-bold flex items-center gap-1.5">
                                          <span>🚨 CẢNH BÁO: VI PHẠM GIÁ SÀN!</span>
                                        </div>
                                        <p className="text-[10px] leading-relaxed text-rose-300">
                                          Hệ thống thuê bao quy đổi thấp hơn giá sàn kỹ thuật tối thiểu <strong>{formatVND(floorPriceMonthlyTotal)}/tháng</strong>. Salesperson vui lòng tăng đơn giá tự chỉnh hoặc giảm bớt chiết khấu chuỗi/cam kết!
                                        </p>
                                      </div>
                                    ) : (
                                      <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl font-mono text-xs space-y-1">
                                        <div className="font-bold flex items-center gap-1.5">
                                          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                                          <span>✅ ĐỦ TIÊU CHUẨN THẶNG DƯ</span>
                                        </div>
                                        <p className="text-[10px] leading-relaxed text-emerald-300">
                                          Mức thặng dư tài chính hợp lệ và đủ điều kiện triển khai hạ tầng mà không cần duyệt ngoại lệ.
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Nút hành động */}
                                <button
                                  type="button"
                                  onClick={handlePrintInternalQuote}
                                  className="w-full py-4.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs uppercase tracking-wider rounded-2xl transition-all cursor-pointer shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2"
                                >
                                  <Printer className="w-5 h-5" />
                                  XUẤT BÁO GIÁ CHUỖI & ENTERPRISE (PDF)
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* ==================== TAB 8: TRỢ LÝ BÁO GIÁ AI (INTERNAL SALES WORKSPACE) ==================== */}
                      {activeTab === 'sales-ai' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
                          
                          {/* Left 2 Columns: The AI Pricing Assistant Workspace */}
                          <div className="lg:col-span-2 space-y-4">
                            <div className="bg-[#18181b] rounded-2xl border border-[#27272a] p-4 flex justify-between items-center">
                              <div>
                                <h4 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5 font-mono text-indigo-400">
                                  <Sparkles className="w-4 h-4 text-emerald-400" /> Trợ lý AI Báo giá Độc quyền cho Sales
                                </h4>
                                <p className="text-[10px] text-[#a1a1aa] mt-0.5">
                                  AI tự động trích xuất giá từ bảng cấu hình, cộng dồn Zone đặc thù và tính thặng dư cho khách hàng.
                                </p>
                              </div>
                              <div className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-bold px-2.5 py-1 rounded-lg font-mono">
                                Đang liên kết: Bảng giá hệ thống
                              </div>
                            </div>
                            
                            {/* Embedded AIConsultant component */}
                            <AIConsultant 
                              pricingData={editedPricingData}
                              company={editedCompany}
                            />
                          </div>

                          {/* Right Column: Internal Guidelines & Prompt Helper */}
                          <div className="space-y-6">
                            {/* Hướng dẫn Đàm phán */}
                            <div className="bg-[#18181b] rounded-2xl border border-[#27272a] p-5 space-y-4">
                              <h4 className="text-xs font-extrabold text-white uppercase tracking-wider border-b border-[#27272a] pb-2 flex items-center gap-1.5 font-mono text-emerald-400">
                                <Info className="w-4 h-4 text-amber-400" /> Cẩm nang Sales & Báo giá
                              </h4>
                              
                              <div className="space-y-3.5 text-xs">
                                <div className="space-y-1">
                                  <span className="block font-bold text-zinc-300">1. Quy tắc tính Zone đặc thù:</span>
                                  <p className="text-[#a1a1aa] leading-relaxed text-[11px]">
                                    Khách hàng thường có các khu vực phát nhạc độc lập (VD: Phòng Vip, Sân vườn, Tầng hầm). Mỗi khu phát nội dung riêng biệt = 1 Zone. AI sẽ tự tính phí Zone thêm.
                                  </p>
                                </div>

                                <div className="space-y-1">
                                  <span className="block font-bold text-zinc-300">2. Quy định Chiết khấu cho phép:</span>
                                  <ul className="text-[#a1a1aa] list-disc list-inside space-y-1 text-[11px]">
                                    <li>Chuỗi dưới 3 cửa hàng: Tối đa <strong className="text-emerald-400">10%</strong></li>
                                    <li>Chuỗi 3 - 10 cửa hàng: Tối đa <strong className="text-emerald-400">20%</strong></li>
                                    <li>Chuỗi trên 10 cửa hàng: Tối đa <strong className="text-emerald-400">30%</strong></li>
                                  </ul>
                                </div>

                                <div className="space-y-1">
                                  <span className="block font-bold text-zinc-300">3. Giới hạn Giá sàn (Floor Price):</span>
                                  <p className="text-[#a1a1aa] leading-relaxed text-[11px]">
                                    Không được báo giá trung bình quy đổi dưới <strong className="text-rose-400 font-mono">200.000 VND/zone/tháng</strong> trừ trường hợp có cam kết đặc biệt hoặc thanh toán dài hạn.
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Mẹo gõ Prompt & Test Cases */}
                            <div className="bg-[#18181b] rounded-2xl border border-[#27272a] p-5 space-y-4">
                              <h4 className="text-xs font-extrabold text-white uppercase tracking-wider border-b border-[#27272a] pb-2 flex items-center gap-1.5 font-mono text-indigo-400">
                                <Sparkles className="w-4 h-4 text-amber-400" /> Gợi ý Mẫu thử nhanh (Sales Prompt)
                              </h4>
                              <p className="text-[11px] text-[#a1a1aa]">
                                Click vào các kịch bản thực tế bên dưới để tham khảo cách tư vấn báo giá phức tạp bằng AI:
                              </p>
                              
                              <div className="space-y-2.5">
                                {[
                                  {
                                    label: "Quán cà phê vườn & phòng kính",
                                    desc: "Diện tích 150m2, chia làm 2 khu phát nhạc khác nhau.",
                                    prompt: "Tôi có quán cà phê rộng 150m² chia làm 2 khu vực: phòng máy lạnh và sân vườn ngoài trời phát nhạc khác nhau. Tư vấn giải pháp và báo giá."
                                  },
                                  {
                                    label: "Chuỗi trung tâm Ngoại ngữ",
                                    desc: "Gồm 3 cơ sở học tập, mỗi cơ sở 8 phòng học + sảnh.",
                                    prompt: "Trung tâm Tiếng Anh của tôi có 3 chi nhánh, mỗi chi nhánh diện tích khoảng 200m² gồm sảnh tiếp tân và các phòng học. Chúng tôi cần phát nhạc nhẹ sảnh và bài nghe riêng lẻ trong lớp. Hãy tư vấn báo giá."
                                  },
                                  {
                                    label: "Tổ hợp Gym & Spa cao cấp",
                                    desc: "Mô hình kết hợp 400m2 có 3 khu biệt lập phát nhạc.",
                                    prompt: "Tôi sắp mở tổ hợp thể thao & thư giãn rộng 400m² gồm: Phòng Gym (nhạc mạnh), Phòng Spa (nhạc thiền nhẹ) và Quầy Bar nước ép. 3 khu phát nhạc hoàn toàn khác nhau. Tư vấn giúp tôi."
                                  }
                                ].map((item, idx) => (
                                  <div 
                                    key={idx}
                                    className="p-3 bg-[#09090b] hover:bg-zinc-900 border border-[#27272a] hover:border-[#3f3f46] rounded-xl transition-all group cursor-pointer text-left"
                                    onClick={() => {
                                      navigator.clipboard.writeText(item.prompt);
                                      showCustomAlert("Đã copy mẫu prompt!", "Hệ thống đã sao chép mẫu yêu cầu vào bộ nhớ đệm. Bạn có thể dán (Ctrl+V) vào ô chat của Trợ lý AI bên cạnh để tiến hành phân tích.");
                                    }}
                                  >
                                    <div className="flex justify-between items-center">
                                      <span className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors">{item.label}</span>
                                      <span className="text-[9px] text-[#52525b] font-mono group-hover:text-indigo-300">Copy 📋</span>
                                    </div>
                                    <p className="text-[10px] text-[#a1a1aa] mt-1 line-clamp-1">{item.desc}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                        </div>
                      )}

                      {/* ==================== TAB 7: HỆ THỐNG & SAO LƯU ==================== */}
                      {activeTab === 'system' && (
                        <div className="space-y-6 animate-fadeIn">
                          
                          {/* Khối 1: Đổi mật khẩu hệ thống */}
                          <div className="bg-[#18181b] rounded-2xl border border-[#27272a] p-5 space-y-4">
                            <h5 className="text-xs font-black uppercase tracking-wider text-emerald-400 font-mono border-b border-[#27272a] pb-2">
                              🔒 Đổi mật khẩu truy cập Admin Panel
                            </h5>
                            
                            <form onSubmit={handleChangePassword} className="space-y-3.5 max-w-md">
                              <div>
                                <label className="block text-[10px] font-bold text-[#a1a1aa] mb-1 font-mono">Mật khẩu cũ hiện tại</label>
                                <input
                                  type="password"
                                  placeholder="Mật khẩu hiện tại..."
                                  value={oldPassword}
                                  onChange={(e) => setOldPassword(e.target.value)}
                                  className="w-full text-xs bg-[#09090b] border border-[#27272a] rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-white font-mono"
                                />
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div>
                                  <label className="block text-[10px] font-bold text-[#a1a1aa] mb-1 font-mono">Mật khẩu mới</label>
                                  <input
                                    type="password"
                                    placeholder="Tối thiểu 6 ký tự..."
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full text-xs bg-[#09090b] border border-[#27272a] rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-white font-mono"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-[#a1a1aa] mb-1 font-mono">Nhập lại mật khẩu mới</label>
                                  <input
                                    type="password"
                                    placeholder="Xác nhận trùng khớp..."
                                    value={confirmNewPassword}
                                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                                    className="w-full text-xs bg-[#09090b] border border-[#27272a] rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-white font-mono"
                                  />
                                </div>
                              </div>

                              {passwordChangeMsg && (
                                <p className={`text-xs font-bold ${passwordChangeMsg.error ? 'text-red-400' : 'text-emerald-400'}`}>
                                  {passwordChangeMsg.error ? '✕' : '✓'} {passwordChangeMsg.text}
                                </p>
                              )}

                              <button
                                type="submit"
                                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md"
                              >
                                Đổi mật khẩu Admin
                              </button>
                            </form>
                          </div>

                          {/* Khối 2: Backup và Restore */}
                          <div className="bg-[#18181b] rounded-2xl border border-[#27272a] p-5 space-y-4">
                            <h5 className="text-xs font-black uppercase tracking-wider text-emerald-400 font-mono border-b border-[#27272a] pb-2">
                              💾 SAO LƯU & PHỤC HỒI CƠ SỞ DỮ LIỆU
                            </h5>
                            <p className="text-xs text-[#a1a1aa] leading-relaxed">
                              Xuất toàn bộ trạng thái của AudioBay (biểu giá 12 lĩnh vực, 4 cấu hình thẻ gói, FAQs công cộng, Reviews khách hàng, cài đặt hotline & email, mật khẩu đăng nhập) thành một tệp tin sao lưu định dạng JSON để lưu trữ hoặc di chuyển sang trình duyệt khác.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 pt-2">
                              <button
                                type="button"
                                onClick={handleBackupData}
                                className="px-5 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                              >
                                <Download className="w-4 h-4" /> Tải bản sao lưu (.json)
                              </button>

                              <label className="px-5 py-3.5 bg-[#09090b] hover:bg-[#27272a] border border-[#27272a] text-[#fafafa] font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm">
                                <Upload className="w-4 h-4 text-emerald-400" />
                                <span>Phục hồi từ file backup</span>
                                <input
                                  type="file"
                                  accept=".json"
                                  onChange={handleRestoreData}
                                  className="hidden"
                                />
                              </label>
                            </div>
                          </div>

                          {/* Khối 2.5: Cấu hình Airtable */}
                          <div className="bg-[#18181b] rounded-2xl border border-[#27272a] p-5 space-y-4 text-left">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#27272a] pb-2 gap-2">
                              <h5 className="text-xs font-black uppercase tracking-wider text-indigo-400 font-mono flex items-center gap-2">
                                <Database className="w-4 h-4 text-indigo-400" /> 🔌 CẤU HÌNH TÍCH HỢP AIRTABLE
                              </h5>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-[#a1a1aa] font-mono uppercase">Trạng thái:</span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${editedAirtableConfig.active ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-zinc-800 text-[#a1a1aa] border border-[#27272a]'}`}>
                                  {editedAirtableConfig.active ? 'Đang kích hoạt' : 'Đang tắt'}
                                </span>
                              </div>
                            </div>
                            
                            <p className="text-xs text-[#a1a1aa] leading-relaxed">
                              Đồng bộ tự động thông tin khách hàng từ yêu cầu báo giá mô hình riêng biệt sang bảng dữ liệu Airtable của bạn. Hỗ trợ cả 2 phương thức: Nhúng Form Airtable trực tiếp thay thế Native Form hoặc Đồng bộ qua API thời gian thực.
                            </p>

                            <form onSubmit={handleSaveAirtableConfig} className="space-y-4">
                              {/* Switch Bật/Tắt */}
                              <div className="flex items-center justify-between p-3 bg-[#09090b] rounded-xl border border-[#27272a]">
                                <div className="space-y-0.5">
                                  <label htmlFor="airtable-active" className="text-xs font-bold text-white cursor-pointer">
                                    Kích hoạt tích hợp Airtable
                                  </label>
                                  <p className="text-[10px] text-[#a1a1aa]">
                                    Bật tính năng kết nối và đồng bộ dữ liệu với Airtable
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  id="airtable-active"
                                  onClick={() => setEditedAirtableConfig({ ...editedAirtableConfig, active: !editedAirtableConfig.active })}
                                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${editedAirtableConfig.active ? 'bg-indigo-600' : 'bg-zinc-800'}`}
                                >
                                  <span
                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${editedAirtableConfig.active ? 'translate-x-5' : 'translate-x-0'}`}
                                  />
                                </button>
                              </div>

                              {editedAirtableConfig.active && (
                                <div className="space-y-4 animate-fadeIn">
                                  {/* Loại tích hợp */}
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <button
                                      type="button"
                                      onClick={() => setEditedAirtableConfig({ ...editedAirtableConfig, integrationType: 'api' })}
                                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${editedAirtableConfig.integrationType === 'api' ? 'bg-indigo-950/20 border-indigo-500/50 text-white' : 'bg-[#09090b] border-[#27272a] text-[#a1a1aa] hover:border-[#3f3f46]'}`}
                                    >
                                      <div className="text-xs font-bold flex items-center gap-1.5 text-white mb-1">
                                        <Wifi className="w-3.5 h-3.5 text-indigo-400" /> API Realtime Sync
                                      </div>
                                      <span className="text-[10px] text-[#a1a1aa] leading-normal">
                                        Đồng bộ thời gian thực từ Native Form của Web lên Airtable qua API
                                      </span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => setEditedAirtableConfig({ ...editedAirtableConfig, integrationType: 'embed' })}
                                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${editedAirtableConfig.integrationType === 'embed' ? 'bg-indigo-950/20 border-indigo-500/50 text-white' : 'bg-[#09090b] border-[#27272a] text-[#a1a1aa] hover:border-[#3f3f46]'}`}
                                    >
                                      <div className="text-xs font-bold flex items-center gap-1.5 text-white mb-1">
                                        <Database className="w-3.5 h-3.5 text-indigo-400" /> Embed Airtable Form
                                      </div>
                                      <span className="text-[10px] text-[#a1a1aa] leading-normal">
                                        Nhúng trực tiếp iframe Form từ Airtable thay thế biểu mẫu liên hệ
                                      </span>
                                    </button>
                                  </div>

                                  {/* Trường cho API */}
                                  {editedAirtableConfig.integrationType === 'api' && (
                                    <div className="space-y-3 bg-[#09090b] p-4 rounded-xl border border-[#27272a] animate-fadeIn">
                                      <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-wider text-indigo-400 font-mono">
                                          Personal Access Token (PAT)
                                        </label>
                                        <div className="relative">
                                          <input
                                            type={showAirtableToken ? 'text' : 'password'}
                                            value={editedAirtableConfig.token || ''}
                                            onChange={(e) => setEditedAirtableConfig({ ...editedAirtableConfig, token: e.target.value })}
                                            placeholder="pat... hoặc key... từ tài khoản Airtable của bạn"
                                            className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 pr-10"
                                          />
                                          <button
                                            type="button"
                                            onClick={() => setShowAirtableToken(!showAirtableToken)}
                                            className="absolute right-2 top-1.5 text-zinc-500 hover:text-white transition-colors"
                                          >
                                            {showAirtableToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                          </button>
                                        </div>
                                      </div>

                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                          <label className="text-[10px] font-black uppercase tracking-wider text-indigo-400 font-mono">
                                            Base ID
                                          </label>
                                          <input
                                            type="text"
                                            value={editedAirtableConfig.baseId || ''}
                                            onChange={(e) => setEditedAirtableConfig({ ...editedAirtableConfig, baseId: e.target.value })}
                                            placeholder="appXyz123..."
                                            className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
                                          />
                                        </div>
                                        <div className="space-y-1">
                                          <label className="text-[10px] font-black uppercase tracking-wider text-indigo-400 font-mono">
                                            Table Name
                                          </label>
                                          <input
                                            type="text"
                                            value={editedAirtableConfig.tableName || ''}
                                            onChange={(e) => setEditedAirtableConfig({ ...editedAirtableConfig, tableName: e.target.value })}
                                            placeholder="Yêu cầu báo giá"
                                            className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
                                          />
                                        </div>
                                      </div>

                                      {/* Gợi ý tên cột */}
                                      <div className="p-3 bg-zinc-900/50 rounded-lg border border-zinc-800 space-y-1">
                                        <span className="text-[10px] font-bold text-indigo-300 block">💡 Gợi ý cấu trúc cột trong Airtable để khớp tự động:</span>
                                        <p className="text-[9px] text-[#a1a1aa] leading-relaxed">
                                          Để đồng bộ chính xác, bạn hãy tạo các cột (Fields) trong bảng Airtable với tên chính xác như sau: <code className="text-white font-mono bg-zinc-800 px-1 py-0.5 rounded">Mã Yêu Cầu</code>, <code className="text-white font-mono bg-zinc-800 px-1 py-0.5 rounded">Họ Tên</code>, <code className="text-white font-mono bg-zinc-800 px-1 py-0.5 rounded">Số Điện Thoại</code>, <code className="text-white font-mono bg-zinc-800 px-1 py-0.5 rounded">Email</code>, <code className="text-white font-mono bg-zinc-800 px-1 py-0.5 rounded">Tên Doanh Nghiệp</code>, <code className="text-white font-mono bg-zinc-800 px-1 py-0.5 rounded">Mô Hình</code>, <code className="text-white font-mono bg-zinc-800 px-1 py-0.5 rounded">Quy Mô</code>, <code className="text-white font-mono bg-zinc-800 px-1 py-0.5 rounded">Đơn Vị</code>, <code className="text-white font-mono bg-zinc-800 px-1 py-0.5 rounded">Số Zones</code>, <code className="text-white font-mono bg-zinc-800 px-1 py-0.5 rounded">Số Chi Nhánh</code>, <code className="text-white font-mono bg-zinc-800 px-1 py-0.5 rounded">Chu Kỳ Thanh Toán</code>, <code className="text-white font-mono bg-zinc-800 px-1 py-0.5 rounded">Chi Phí Tháng</code>, <code className="text-white font-mono bg-zinc-800 px-1 py-0.5 rounded">Chi Phí Năm</code>, <code className="text-white font-mono bg-zinc-800 px-1 py-0.5 rounded">Ghi Chú Khách Hàng</code>, <code className="text-white font-mono bg-zinc-800 px-1 py-0.5 rounded">Trạng Thái</code>, <code className="text-white font-mono bg-zinc-800 px-1 py-0.5 rounded">Ngày Tạo</code>.
                                        </p>
                                      </div>

                                      {/* Nút Test Connection */}
                                      <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60">
                                        <span className="text-[10px] text-[#a1a1aa]">Gửi yêu cầu thử nghiệm tới Airtable</span>
                                        <button
                                          type="button"
                                          disabled={isTestingAirtable}
                                          onClick={handleTestAirtableConnection}
                                          className="px-3.5 py-1.5 bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-zinc-300 hover:text-white rounded-lg transition-all text-[10px] font-bold flex items-center gap-1.5"
                                        >
                                          {isTestingAirtable ? (
                                            <>
                                              <RefreshCw className="w-3 h-3 animate-spin text-indigo-400" />
                                              Đang kết nối...
                                            </>
                                          ) : (
                                            <>
                                              <Wifi className="w-3 h-3 text-indigo-400" />
                                              Thử kết nối (Test connection)
                                            </>
                                          )}
                                        </button>
                                      </div>
                                    </div>
                                  )}

                                  {/* Trường cho Embed */}
                                  {editedAirtableConfig.integrationType === 'embed' && (
                                    <div className="space-y-3 bg-[#09090b] p-4 rounded-xl border border-[#27272a] animate-fadeIn">
                                      <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-wider text-indigo-400 font-mono">
                                          Đường dẫn nhúng Form Airtable (Embed URL)
                                        </label>
                                        <input
                                          type="text"
                                          value={editedAirtableConfig.embedUrl || ''}
                                          onChange={(e) => setEditedAirtableConfig({ ...editedAirtableConfig, embedUrl: e.target.value })}
                                          placeholder="https://airtable.com/embed/shr..."
                                          className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
                                        />
                                        <p className="text-[9px] text-[#a1a1aa] leading-normal">
                                          Tạo biểu mẫu Form trên Airtable, lấy đường dẫn mã nhúng (Embed link) có dạng <code className="text-zinc-300 font-mono">https://airtable.com/embed/shr...</code> dán vào đây. Form này sẽ tự động thay thế biểu mẫu gốc cho mô hình riêng biệt.
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              <div className="pt-2">
                                <button
                                  type="submit"
                                  className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                                >
                                  <Save className="w-4 h-4" /> Lưu cấu hình Airtable
                                </button>
                              </div>
                            </form>
                          </div>

                          {/* Khối 3: Reset Factory */}
                          <div className="bg-[#18181b] rounded-2xl border border-rose-500/20 p-5 space-y-4">
                            <h5 className="text-xs font-black uppercase tracking-wider text-rose-400 font-mono border-b border-rose-500/20 pb-2">
                              🚨 VÙNG NGUY HIỂM - RESET FACTORY
                            </h5>
                            <p className="text-xs text-rose-200/80 leading-relaxed">
                              Xóa sạch toàn bộ cấu hình đã tùy chỉnh trong localStorage. Hệ thống sẽ được nạp lại mặc định gốc ban đầu của AudioBay. Thao tác này KHÔNG THỂ đảo ngược!
                            </p>
                            <div className="pt-1">
                              <button
                                type="button"
                                onClick={handleFactoryReset}
                                className="px-5 py-3 bg-rose-950/40 hover:bg-rose-900 border border-rose-500/30 hover:border-rose-500 text-rose-200 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                              >
                                Khôi phục dữ liệu mặc định gốc
                              </button>
                            </div>
                          </div>

                        </div>
                      )}

                      {/* ==================== TAB 11: PHÂN QUYỀN KỸ THUẬT ==================== */}
                      {activeTab === 'permissions' && (
                        <div className="space-y-6 animate-fadeIn text-left">
                          {/* Tiêu đề & Thông tin */}
                          <div className="p-5 bg-[#18181b] rounded-2xl border border-[#27272a] space-y-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                                <Shield className="w-5 h-5 text-indigo-400" />
                              </div>
                              <div>
                                <h4 className="text-base font-black text-white">Quản lý & Phân quyền Kỹ thuật viên</h4>
                                <p className="text-[11px] text-[#a1a1aa] mt-0.5">Cấp quyền truy cập hệ thống quản trị bảng giá AudioBay cho kỹ thuật viên hỗ trợ và cộng tác viên.</p>
                              </div>
                            </div>
                          </div>

                          {!isMasterAdminOnly && (
                            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3">
                              <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                              <div>
                                <h6 className="text-xs font-bold text-amber-300">Chế độ xem hạn chế (Read-Only Mode)</h6>
                                <p className="text-[11px] text-[#a1a1aa] leading-relaxed mt-0.5">
                                  Bạn đang truy cập với quyền kỹ thuật viên. Chỉ có <strong>Quản trị viên chính (Master Admin)</strong> mới có thể thêm mới, đổi trạng thái, hoặc xóa tài khoản của kỹ thuật viên khác.
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Bố cục Grid: 1 bên Danh sách, 1 bên Thêm mới */}
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            
                            {/* Cột trái (Chiếm 2/3): Danh sách kỹ thuật viên */}
                            <div className="lg:col-span-2 bg-[#18181b] rounded-2xl border border-[#27272a] p-5 space-y-4">
                              <div className="flex justify-between items-center border-b border-[#27272a] pb-3">
                                <h5 className="text-xs font-black uppercase tracking-wider text-emerald-400 font-mono flex items-center gap-1.5">
                                  📋 Danh sách kỹ thuật viên hỗ trợ ({technicians.length})
                                </h5>
                                <span className="text-[10px] text-[#71717a] font-mono">Dữ liệu đồng bộ Realtime</span>
                              </div>

                              {technicians.length === 0 ? (
                                <div className="text-center py-10 space-y-3 bg-[#09090b] rounded-xl border border-dashed border-[#27272a]">
                                  <Lock className="w-8 h-8 text-zinc-600 mx-auto" />
                                  <p className="text-xs text-[#a1a1aa]">Chưa có kỹ thuật viên nào được phân quyền.</p>
                                  {isMasterAdminOnly && (
                                    <p className="text-[10px] text-[#71717a]">Sử dụng biểu mẫu bên phải để cấp quyền đầu tiên.</p>
                                  )}
                                </div>
                              ) : (
                                <div className="space-y-3.5">
                                  {technicians.map((tech) => {
                                    const roleLabel = 
                                      tech.role === 'tech_admin' ? 'Tech Admin (Toàn quyền)' :
                                      tech.role === 'tech_operator' ? 'Operator (Chỉ Xem)' :
                                      'Support Tech (Giới hạn)';
                                    
                                    const roleColor = 
                                      tech.role === 'tech_admin' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                                      tech.role === 'tech_operator' ? 'text-sky-400 bg-sky-500/10 border-sky-500/20' :
                                      'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';

                                    const isSuspended = tech.status === 'suspended';

                                    return (
                                      <div 
                                        key={tech.id} 
                                        className={`p-4 rounded-xl border transition-all space-y-3 bg-[#09090b] ${
                                          isSuspended ? 'border-red-500/20 opacity-60' : 'border-[#27272a] hover:border-[#3f3f46]'
                                        }`}
                                      >
                                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                                          <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                              <span className="text-xs font-bold text-white">{tech.fullName || tech.name}</span>
                                              <span className={`inline-block text-[9px] font-mono px-2 py-0.5 rounded-full border ${roleColor}`}>
                                                {roleLabel}
                                              </span>
                                              {isSuspended && (
                                                <span className="inline-block text-[9px] font-mono px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400">
                                                  TẠM KHÓA
                                                </span>
                                              )}
                                            </div>
                                            <p className="text-[11px] text-[#71717a] font-mono">{tech.email}</p>
                                          </div>

                                          {/* Nút hành động */}
                                          {isMasterAdminOnly && (
                                            <div className="flex items-center gap-1.5 self-end sm:self-auto">
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const nextStatus = isSuspended ? 'active' : 'suspended';
                                                  const promptMsg = isSuspended 
                                                    ? `Bạn có chắc chắn muốn KÍCH HOẠT lại kỹ thuật viên "${tech.fullName || tech.name}"?` 
                                                    : `Bạn có chắc chắn muốn TẠM KHÓA tài khoản kỹ thuật viên "${tech.fullName || tech.name}"?`;
                                                  showCustomConfirm('Thay đổi trạng thái', promptMsg, () => {
                                                    const updated = technicians.map(t => t.id === tech.id ? { ...t, status: nextStatus as any } : t);
                                                    if (onSaveTechnicians) onSaveTechnicians(updated);
                                                    showCustomAlert('Thành công', `Đã cập nhật trạng thái hoạt động thành ${nextStatus === 'active' ? 'Hoạt động' : 'Tạm khóa'}!`);
                                                  });
                                                }}
                                                className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all border-none cursor-pointer ${
                                                  isSuspended 
                                                    ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400' 
                                                    : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400'
                                                }`}
                                              >
                                                {isSuspended ? 'Mở khóa ✓' : 'Tạm khóa 🔒'}
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  showCustomConfirm(
                                                    '🚨 XÁC NHẬN XÓA QUYỀN',
                                                    `Bạn có chắc chắn muốn XÓA HẲN quyền kỹ thuật của "${tech.fullName || tech.name}" (${tech.email})? Thao tác này không thể phục hồi!`,
                                                    () => {
                                                      const updated = technicians.filter(t => t.id !== tech.id);
                                                      if (onSaveTechnicians) onSaveTechnicians(updated);
                                                      showCustomAlert('Thành công', 'Đã xóa tài khoản kỹ thuật viên khỏi hệ thống!');
                                                    }
                                                  );
                                                }}
                                                className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[10px] font-bold rounded-lg transition-all border-none cursor-pointer"
                                              >
                                                Xóa hẳn ✕
                                              </button>
                                            </div>
                                          )}
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2.5 border-t border-[#18181b] text-[10px] text-[#71717a] font-mono">
                                          <div className="flex items-center gap-2 bg-[#18181b] p-2 rounded-lg border border-[#27272a]/40">
                                            <span>Mã Passkey:</span>
                                            <strong className="text-[#a1a1aa] font-bold tracking-wider select-all">{tech.passkey}</strong>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                navigator.clipboard.writeText(tech.passkey);
                                                showCustomAlert('Đã copy Passkey', `Đã sao chép mã Passkey "${tech.passkey}" vào clipboard.`);
                                              }}
                                              className="ml-auto text-indigo-400 hover:text-indigo-300 font-bold bg-transparent border-none cursor-pointer"
                                            >
                                              Copy 📋
                                            </button>
                                          </div>

                                          <div className="space-y-1 py-1 px-2">
                                            <div>Cấp ngày: <span className="text-[#fafafa]">{tech.createdAt ? new Date(tech.createdAt).toLocaleDateString('vi-VN') : 'Mặc định'}</span></div>
                                            <div>Dùng cuối: <span className="text-[#fafafa]">{tech.lastUsedAt ? new Date(tech.lastUsedAt).toLocaleString('vi-VN') : 'Chưa sử dụng'}</span></div>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>

                            {/* Cột phải (Chiếm 1/3): Biểu mẫu thêm mới */}
                            <div className="bg-[#18181b] rounded-2xl border border-[#27272a] p-5 space-y-4">
                              <h5 className="text-xs font-black uppercase tracking-wider text-indigo-400 font-mono border-b border-[#27272a] pb-3">
                                ➕ Cấp quyền kỹ thuật mới
                              </h5>

                              {!isMasterAdminOnly ? (
                                <div className="text-center py-8 text-xs text-[#71717a]">
                                  Bạn cần đăng nhập bằng tài khoản Master Admin chính để sử dụng chức năng này.
                                </div>
                              ) : (
                                <form 
                                  onSubmit={(e) => {
                                    e.preventDefault();
                                    const emailLower = newTechEmail.trim().toLowerCase();
                                    const nameTrimmed = newTechName.trim();
                                    
                                    if (!emailLower || !nameTrimmed) {
                                      showCustomAlert('Thiếu thông tin', 'Vui lòng điền đầy đủ Email và Họ tên của kỹ thuật viên.');
                                      return;
                                    }

                                    // Check duplicate email
                                    const exists = technicians.some(t => t.email.toLowerCase() === emailLower);
                                    if (exists) {
                                      showCustomAlert('Trùng email', `Kỹ thuật viên với email "${emailLower}" đã được cấp quyền từ trước.`);
                                      return;
                                    }

                                    // Sinh passkey ngẫu nhiên
                                    const randomPass = 'TECH-' + Math.floor(100000 + Math.random() * 900000);
                                    const newTechObj: Technician = {
                                      id: 'tech_' + Date.now(),
                                      email: emailLower,
                                      fullName: nameTrimmed,
                                      role: newTechRole,
                                      passkey: randomPass,
                                      status: 'active',
                                      createdAt: new Date().toISOString()
                                    };

                                    const updated = [newTechObj, ...technicians];
                                    if (onSaveTechnicians) onSaveTechnicians(updated);

                                    // Tạo mẫu thư mời phân quyền
                                    const invitationText = `Xin chào ${nameTrimmed},\n\nBạn đã được phân quyền quản lý kỹ thuật trên Web Báo giá AudioBay.\n\nThông tin đăng nhập của bạn:\n- Email: ${emailLower}\n- Mã Passkey: ${randomPass}\n- Vai trò: ${
                                      newTechRole === 'tech_admin' ? 'Tech Admin (Toàn quyền)' :
                                      newTechRole === 'tech_operator' ? 'Tech Operator (Xem)' :
                                      'Support Tech (Giới hạn)'
                                    }\n\nVui lòng giữ bảo mật thông tin này!\nAudioBay Team.`;

                                    // Reset form và hiển thị cảnh báo thành công với nút sao chép lời mời
                                    setNewTechEmail('');
                                    setNewTechName('');
                                    setNewTechRole('support_tech');

                                    showCustomConfirm(
                                      '🎉 Đã cấp quyền thành công!',
                                      `Đã tạo tài khoản cho kỹ thuật viên "${nameTrimmed}" thành công.\n\nMã Passkey của họ là: ${randomPass}\n\nBạn có muốn Sao chép tin nhắn thông báo tài khoản để gửi ngay cho họ không?`,
                                      () => {
                                        navigator.clipboard.writeText(invitationText);
                                        showCustomAlert('Đã copy lời mời!', 'Hệ thống đã sao chép văn bản lời mời kèm mã truy cập vào bộ nhớ đệm.');
                                      },
                                      'Sao chép thư mời 📋',
                                      'Đóng'
                                    );
                                  }}
                                  className="space-y-4"
                                >
                                  <div>
                                    <label className="block text-[10px] font-bold text-[#a1a1aa] uppercase tracking-wider mb-1.5 font-mono">
                                      Họ và tên Kỹ thuật viên
                                    </label>
                                    <input
                                      type="text"
                                      value={newTechName}
                                      onChange={(e) => setNewTechName(e.target.value)}
                                      placeholder="VD: Nguyễn Văn Hùng..."
                                      className="w-full text-xs bg-[#09090b] border border-[#27272a] rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-white font-sans"
                                      required
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-[10px] font-bold text-[#a1a1aa] uppercase tracking-wider mb-1.5 font-mono">
                                      Địa chỉ Email liên hệ
                                    </label>
                                    <input
                                      type="email"
                                      value={newTechEmail}
                                      onChange={(e) => setNewTechEmail(e.target.value)}
                                      placeholder="VD: hungnv@audiobay.vn..."
                                      className="w-full text-xs bg-[#09090b] border border-[#27272a] rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-white font-sans"
                                      required
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-[10px] font-bold text-[#a1a1aa] uppercase tracking-wider mb-1.5 font-mono">
                                      Phân vai trò & Thẩm quyền
                                    </label>
                                    <select
                                      value={newTechRole}
                                      onChange={(e) => setNewTechRole(e.target.value as any)}
                                      className="w-full text-xs bg-[#09090b] border border-[#27272a] rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-white font-sans"
                                    >
                                      <option value="support_tech">Support Tech (Chỉ quản lý FAQ & Đánh giá)</option>
                                      <option value="tech_operator">Tech Operator (Chỉ Xem, không lưu thay đổi)</option>
                                      <option value="tech_admin">Tech Admin (Toàn quyền cấu hình bảng giá)</option>
                                    </select>
                                    <p className="text-[10px] text-[#71717a] leading-relaxed mt-2.5 font-mono">
                                      💡 Tech Admin có thể cập nhật cấu hình bảng giá tương tự Admin chính. Operator chỉ được duyệt dữ liệu nhưng không được bấm lưu. Support Tech có giao diện rút gọn.
                                    </p>
                                  </div>

                                  <button
                                    type="submit"
                                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-500/10 border-none"
                                  >
                                    Cấp tài khoản & Sinh Passkey
                                  </button>
                                </form>
                              )}
                            </div>

                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                )}

              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* CUSTOM CONFIRM/ALERT DIALOG */}
      {createPortal(
        <AnimatePresence>
          {customDialog.isOpen && (
            <div className="fixed inset-0 z-[100] overflow-hidden flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  if (customDialog.type === 'confirm') {
                    if (customDialog.onCancel) customDialog.onCancel();
                    setCustomDialog(prev => ({ ...prev, isOpen: false }));
                  }
                }}
                className="fixed inset-0 bg-black/85 backdrop-blur-xs cursor-default"
              />

              {/* Main Dialog Window */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="relative transform overflow-hidden rounded-2xl bg-[#1e1e24] border border-[#2e2e38] text-left shadow-2xl transition-all sm:my-8 w-full sm:max-w-md p-6 z-10"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <h3 className="text-sm font-extrabold text-white font-mono mb-2 uppercase tracking-wide flex items-center gap-2">
                      {customDialog.type === 'confirm' ? '❓ ' : 'ℹ️ '}
                      {customDialog.title}
                    </h3>
                    <p className="text-xs text-[#d1d1d6] leading-relaxed mb-6 whitespace-pre-line">
                      {customDialog.message}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 justify-end">
                  {customDialog.type === 'confirm' && (
                    <button
                      type="button"
                      onClick={() => {
                        if (customDialog.onCancel) customDialog.onCancel();
                        setCustomDialog(prev => ({ ...prev, isOpen: false }));
                      }}
                      className="px-4 py-2 text-xs font-bold text-[#a1a1aa] hover:text-white bg-transparent hover:bg-zinc-800 rounded-lg cursor-pointer transition-colors"
                    >
                      {customDialog.cancelText || 'Hủy bỏ'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={customDialog.onConfirm}
                    className={`px-4 py-2 text-xs font-bold rounded-lg cursor-pointer transition-colors ${
                      customDialog.type === 'confirm'
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-black'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    }`}
                  >
                    {customDialog.confirmText || 'Đồng ý'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
