/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Phone, 
  Mail, 
  Globe, 
  Sparkles, 
  CheckCircle, 
  MapPin, 
  ChevronRight,
  ShieldCheck,
  Music4,
  MessageSquare,
  Bot,
  X
} from 'lucide-react';

// Data và Types
import { COMPANY, INITIAL_FAQS, defaultPackagesAdmin, CATEGORIES, INITIAL_TESTIMONIALS } from './initialData';
import { PackagesAdminData, Category, QuoteRequest } from './types';

// Các Component con
import PriceCalculator from './components/PriceCalculator';
import AdminPanel from './components/AdminPanel';
import PackagesSection from './components/PackagesSection';
import ComparisonTable from './components/ComparisonTable';
import Testimonials from './components/Testimonials';
import FAQ from './components/FAQ';
import AIConsultant from './components/AIConsultant';

export default function App() {
  // Trạng thái thông tin công ty (Được cập nhật động từ AdminPanel)
  const [company, setCompany] = useState(() => {
    try {
      const saved = localStorage.getItem('audiobay_company_v2');
      return saved ? JSON.parse(saved) : COMPANY;
    } catch {
      return COMPANY;
    }
  });

  // Trạng thái FAQ (Được cập nhật động từ AdminPanel)
  const [faqs, setFaqs] = useState(() => {
    try {
      const saved = localStorage.getItem('audiobay_faq_v2');
      return saved ? JSON.parse(saved) : INITIAL_FAQS;
    } catch {
      return INITIAL_FAQS;
    }
  });

  // Trạng thái Gói dịch vụ và Tính năng (Chỉnh sửa từ AdminPanel)
  const [packagesAdmin, setPackagesAdmin] = useState<PackagesAdminData>(() => {
    try {
      const saved = localStorage.getItem('audiobay_packages_v2');
      if (saved) {
        const parsed = JSON.parse(saved) as PackagesAdminData;
        let modified = false;
        parsed.cards = parsed.cards.map(card => {
          // So sánh tương đối hoặc tuyệt đối để di chuyển sang phụ đề mới
          if (card.id === 'starter' && (card.subtitle.includes('hộ kinh doanh cá thể') || card.subtitle.includes('hộ kinh doanh'))) {
            card.subtitle = 'Hộ cá thể, cửa hàng nhỏ ≤ 50m² (1 zone phát nhạc cơ bản mặc định)';
            modified = true;
          } else if (card.id === 'business' && (card.subtitle.includes('Tối ưu cho quán vừa') || card.subtitle.includes('chuỗi cửa hàng'))) {
            card.subtitle = 'Quán vừa, chuỗi cửa hàng, spa (diện tích 80-300m² hoặc ≤10 phòng, hỗ trợ 2-3 zones)';
            modified = true;
          } else if (card.id === 'professional' && (card.subtitle.includes('Dành cho không gian cao cấp') || card.subtitle.includes('trung tâm thể thao'))) {
            card.subtitle = 'Không gian cao cấp, trung tâm thể thao, showroom (>300m² hoặc >10 phòng, đa vùng âm thanh)';
            modified = true;
          } else if (card.id === 'enterprise' && (card.subtitle.includes('Hệ thống khách sạn') || card.subtitle.includes('resort, bệnh viện'))) {
            card.subtitle = 'Resort, khách sạn, đại siêu thị (quy mô lớn đặc thù, hỗ trợ AM riêng và cam kết SLA)';
            modified = true;
          }
          return card;
        });
        if (modified) {
          localStorage.setItem('audiobay_packages_v2', JSON.stringify(parsed));
        }
        return parsed;
      }
      return defaultPackagesAdmin;
    } catch {
      return defaultPackagesAdmin;
    }
  });

  // Trạng thái bảng giá (Được cập nhật động từ AdminPanel)
  const [pricingData, setPricingData] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem('audiobay_pricing_v2');
      return saved ? JSON.parse(saved) : CATEGORIES;
    } catch {
      return CATEGORIES;
    }
  });

  // Trạng thái đánh giá khách hàng (Được cập nhật động từ AdminPanel)
  const [reviews, setReviews] = useState(() => {
    try {
      const saved = localStorage.getItem('audiobay_reviews_v2');
      return saved ? JSON.parse(saved) : INITIAL_TESTIMONIALS;
    } catch {
      return INITIAL_TESTIMONIALS;
    }
  });

  // Trạng thái banner thông báo khẩn cấp
  const [banner, setBanner] = useState(() => {
    try {
      const saved = localStorage.getItem('audiobay_banner_v2');
      return saved ? JSON.parse(saved) : {
        enabled: true,
        text: '🔥 CHÀO HÈ RỰC RỠ: Nhận ngay ưu đãi 14 ngày dùng thử miễn phí và hỗ trợ thiết kế playlist độc quyền cho cơ sở mới!',
      };
    } catch {
      return {
        enabled: true,
        text: '🔥 CHÀO HÈ RỰC RỠ: Nhận ngay ưu đãi 14 ngày dùng thử miễn phí và hỗ trợ thiết kế playlist độc quyền cho cơ sở mới!',
      };
    }
  });

  // Trạng thái danh sách yêu cầu báo giá của khách hàng (Được đồng bộ giữa khách hàng và Admin)
  const [quoteRequests, setQuoteRequests] = useState<QuoteRequest[]>(() => {
    try {
      const saved = localStorage.getItem('audiobay_quote_requests');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Trạng thái danh sách Kỹ thuật viên (Được đồng bộ giữa Admin và Server)
  const [technicians, setTechnicians] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('audiobay_technicians');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Trạng thái cấu hình tích hợp Airtable
  const [airtableConfig, setAirtableConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('audiobay_airtable_config');
      return saved ? JSON.parse(saved) : {
        active: false,
        integrationType: 'api',
        embedUrl: '',
        token: '',
        baseId: '',
        tableName: ''
      };
    } catch {
      return {
        active: false,
        integrationType: 'api',
        embedUrl: '',
        token: '',
        baseId: '',
        tableName: ''
      };
    }
  });

  const [calculatorSyncTrigger, setCalculatorSyncTrigger] = useState<{ packageId: string; timestamp: number } | null>(null);

  // Hàm đồng bộ hóa dữ liệu lên máy chủ
  const syncWithServer = async (key: string, data: any) => {
    try {
      await fetch(`/api/store/${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data })
      });
    } catch (err) {
      console.error(`AudioBay: Sync failed for key '${key}':`, err);
    }
  };

  const saveAirtableConfig = (updated: any) => {
    setAirtableConfig(updated);
    localStorage.setItem('audiobay_airtable_config', JSON.stringify(updated));
    syncWithServer('airtable_config', updated);
  };

  const saveCompany = (updated: any) => {
    setCompany(updated);
    localStorage.setItem('audiobay_company_v2', JSON.stringify(updated));
    syncWithServer('company', updated);
  };

  const saveFaqs = (updated: any) => {
    setFaqs(updated);
    localStorage.setItem('audiobay_faq_v2', JSON.stringify(updated));
    syncWithServer('faqs', updated);
  };

  const savePackagesAdmin = (updated: PackagesAdminData) => {
    setPackagesAdmin(updated);
    localStorage.setItem('audiobay_packages_v2', JSON.stringify(updated));
    syncWithServer('packages', updated);
  };

  const savePricingData = (updated: Category[]) => {
    setPricingData(updated);
    localStorage.setItem('audiobay_pricing_v2', JSON.stringify(updated));
    syncWithServer('pricing', updated);
  };

  const saveReviews = (updated: any) => {
    setReviews(updated);
    localStorage.setItem('audiobay_reviews_v2', JSON.stringify(updated));
    syncWithServer('reviews', updated);
  };

  const saveBanner = (updated: any) => {
    setBanner(updated);
    localStorage.setItem('audiobay_banner_v2', JSON.stringify(updated));
    syncWithServer('banner', updated);
  };

  const saveQuoteRequests = (updated: QuoteRequest[]) => {
    setQuoteRequests(updated);
    localStorage.setItem('audiobay_quote_requests', JSON.stringify(updated));
    syncWithServer('quote_requests', updated);
  };

  const saveTechnicians = (updated: any[]) => {
    setTechnicians(updated);
    localStorage.setItem('audiobay_technicians', JSON.stringify(updated));
    syncWithServer('technicians', updated);
  };

  // 1. Tải toàn bộ cấu hình từ Store trên máy chủ khi khởi chạy ứng dụng để đồng bộ hóa hoàn toàn cho mọi nhân viên / thiết bị
  useEffect(() => {
    const loadStoreFromServer = async () => {
      try {
        const res = await fetch('/api/store');
        if (res.ok) {
          const store = await res.json();
          if (store.company) {
            setCompany(store.company);
            localStorage.setItem('audiobay_company_v2', JSON.stringify(store.company));
          }
          if (store.faqs) {
            setFaqs(store.faqs);
            localStorage.setItem('audiobay_faq_v2', JSON.stringify(store.faqs));
          }
          if (store.packages) {
            const parsed = store.packages as PackagesAdminData;
            parsed.cards = parsed.cards.map(card => {
              if (card.id === 'starter' && (card.subtitle.includes('hộ kinh doanh cá thể') || card.subtitle.includes('hộ kinh doanh') || !card.subtitle.includes('≤ 50m²'))) {
                card.subtitle = 'Hộ cá thể, cửa hàng nhỏ ≤ 50m² (1 zone phát nhạc cơ bản mặc định)';
              } else if (card.id === 'business' && (card.subtitle.includes('Tối ưu cho quán vừa') || card.subtitle.includes('chuỗi cửa hàng') || !card.subtitle.includes('zones'))) {
                card.subtitle = 'Quán vừa, chuỗi cửa hàng, spa (diện tích 80-300m² hoặc ≤10 phòng, hỗ trợ 2-3 zones)';
              } else if (card.id === 'professional' && (card.subtitle.includes('Dành cho không gian cao cấp') || card.subtitle.includes('trung tâm thể thao') || !card.subtitle.includes('đa vùng âm thanh'))) {
                card.subtitle = 'Không gian cao cấp, trung tâm thể thao, showroom (>300m² hoặc >10 phòng, đa vùng âm thanh)';
              } else if (card.id === 'enterprise' && (card.subtitle.includes('Hệ thống khách sạn') || card.subtitle.includes('resort, bệnh viện') || !card.subtitle.includes('SLA'))) {
                card.subtitle = 'Resort, khách sạn, đại siêu thị (quy mô lớn đặc thù, hỗ trợ AM riêng và cam kết SLA)';
              }
              return card;
            });
            setPackagesAdmin(parsed);
            localStorage.setItem('audiobay_packages_v2', JSON.stringify(parsed));
          }
          if (store.pricing) {
            setPricingData(store.pricing);
            localStorage.setItem('audiobay_pricing_v2', JSON.stringify(store.pricing));
          }
          if (store.reviews) {
            setReviews(store.reviews);
            localStorage.setItem('audiobay_reviews_v2', JSON.stringify(store.reviews));
          }
          if (store.banner) {
            setBanner(store.banner);
            localStorage.setItem('audiobay_banner_v2', JSON.stringify(store.banner));
          }
          if (store.quote_requests) {
            setQuoteRequests(store.quote_requests);
            localStorage.setItem('audiobay_quote_requests', JSON.stringify(store.quote_requests));
          }
          if (store.technicians) {
            setTechnicians(store.technicians);
            localStorage.setItem('audiobay_technicians', JSON.stringify(store.technicians));
          }
          if (store.airtable_config) {
            setAirtableConfig(store.airtable_config);
            localStorage.setItem('audiobay_airtable_config', JSON.stringify(store.airtable_config));
          }
          console.log('AudioBay: Successfully synchronized latest store data from central server.');
        }
      } catch (err) {
        console.error('AudioBay: Error loadStoreFromServer:', err);
      }
    };
    loadStoreFromServer();
  }, []);

  // Tự động cập nhật đánh giá bằng AI hàng tuần nếu được kích hoạt
  useEffect(() => {
    const checkWeeklyAutoUpdate = async () => {
      try {
        const autoUpdateEnabled = localStorage.getItem('audiobay_ai_auto_update_reviews') === 'true';
        if (!autoUpdateEnabled) return;

        const lastUpdateStr = localStorage.getItem('audiobay_last_ai_review_update');
        const now = Date.now();
        const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

        if (!lastUpdateStr || (now - parseInt(lastUpdateStr, 10)) > sevenDaysMs) {
          console.log('AudioBay: Triggering weekly AI auto-update for reviews...');
          const response = await fetch('/api/ai/generate-reviews', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          });

          if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data) && data.length > 0) {
              saveReviews(data);
              localStorage.setItem('audiobay_last_ai_review_update', now.toString());
              console.log('AudioBay: Successfully auto-updated reviews via AI.');
            }
          }
        }
      } catch (err) {
        console.error('AudioBay auto-update review error:', err);
      }
    };

    // Delay checking slightly to prioritize initial UI load
    const timer = setTimeout(checkWeeklyAutoUpdate, 3500);
    return () => clearTimeout(timer);
  }, []);

  const [bannerDismissed, setBannerDismissed] = useState(false);

  // Trạng thái cửa sổ tư vấn AI Specialist
  const [showAIConsultant, setShowAIConsultant] = useState(false);
  const [showAIPrompt, setShowAIPrompt] = useState(false);

  // Gợi ý nhỏ xuất hiện sau 4 giây để thu hút sự chú ý một cách tinh tế
  useEffect(() => {
    const isDismissed = sessionStorage.getItem('audiobay_ai_prompt_dismissed') === 'true';
    if (isDismissed) return;

    const timer = setTimeout(() => {
      if (!showAIConsultant) {
        setShowAIPrompt(true);
      }
    }, 4000);

    return () => clearTimeout(timer);
  }, [showAIConsultant]);

  // Smooth scroll
  const handleScrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7ff] font-sans text-[#0d1b3e] antialiased flex flex-col selection:bg-indigo-500/30 selection:text-white">
      
      {/* 1. TOP ANNOUNCEMENT BANNER */}
      <AnimatePresence>
        {banner.enabled && !bannerDismissed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-[#e8f9ee] text-[#0a5c30] text-[11px] sm:text-xs font-bold py-2.5 px-4 text-center relative z-40 border-b border-[#e2e8f5] flex items-center justify-between sm:justify-center gap-2"
          >
            <div className="flex items-center justify-center gap-1.5 w-full">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-pulse shrink-0" />
              <span className="line-clamp-1 sm:line-clamp-none pr-6 sm:pr-0 text-[#0a5c30] font-bold">{banner.text}</span>
            </div>
            <button
              onClick={() => setBannerDismissed(true)}
              className="text-[#0a5c30] hover:text-[#0d1b3e] font-extrabold text-xs cursor-pointer p-1 shrink-0 absolute right-3 transition-colors"
              title="Đóng thông báo"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. STICKY NAVBAR */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[#e2e8f5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16.5">
            
            {/* Logo */}
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <div>
                <span className="text-xl font-black text-[#263b96] tracking-tight leading-none block">AudioBay</span>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-7 text-xs font-bold text-[#5a6d9a]">
              <button onClick={() => handleScrollToSection('calculator')} className="hover:text-[#263b96] transition-colors cursor-pointer bg-transparent border-none">Tính giá tự động</button>
              <button onClick={() => handleScrollToSection('packages')} className="hover:text-[#263b96] transition-colors cursor-pointer bg-transparent border-none">Gói cốt lõi</button>
              <button onClick={() => handleScrollToSection('comparison')} className="hover:text-[#263b96] transition-colors cursor-pointer bg-transparent border-none">So sánh tính năng</button>
              <button onClick={() => handleScrollToSection('testimonials')} className="hover:text-[#263b96] transition-colors cursor-pointer bg-transparent border-none">Đánh giá khách hàng</button>
              <button onClick={() => handleScrollToSection('faq')} className="hover:text-[#263b96] transition-colors cursor-pointer bg-transparent border-none">Câu hỏi thường gặp</button>
            </nav>

            {/* Admin Action Button & Hotline Contact */}
            <div className="flex items-center gap-3">
              <a 
                href={`tel:${company.phone.replace(/\s+/g, '')}`}
                className="hidden lg:inline-flex items-center gap-1.5 text-xs font-bold text-[#263b96] bg-transparent border border-[#263b96] hover:bg-[#263b96]/5 px-3.5 py-2 rounded-xl transition-all font-mono"
              >
                <Phone className="w-3.5 h-3.5 text-[#263b96]" />
                <span>{company.phone}</span>
              </a>
              
              <AdminPanel
                company={company}
                onCompanyUpdate={saveCompany}
                faqs={faqs}
                onFaqsUpdate={saveFaqs}
                banner={banner}
                onBannerUpdate={saveBanner}
                packagesAdmin={packagesAdmin}
                onSavePackages={savePackagesAdmin}
                pricingData={pricingData}
                onPricingDataUpdate={savePricingData}
                reviews={reviews}
                onReviewsUpdate={saveReviews}
                quoteRequests={quoteRequests}
                onSaveQuoteRequests={saveQuoteRequests}
                technicians={technicians}
                onSaveTechnicians={saveTechnicians}
                airtableConfig={airtableConfig}
                onAirtableConfigUpdate={saveAirtableConfig}
              />
            </div>

          </div>
        </div>
      </header>

      {/* 3. HERO DISPLAY SECTION */}
      <section className="bg-gradient-to-br from-[#0d1b3e] to-[#1a3a7a] py-16 sm:py-24 border-b border-[#e2e8f5] overflow-hidden relative text-white">
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#e8f9ee] text-[#0a5c30] text-xs font-bold rounded-full border border-[#bbf7d0] mb-6 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-600 animate-pulse" /> Bản quyền nhạc hợp pháp 100% tại Việt Nam
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight max-w-4xl mx-auto">
            Nhạc nền bản quyền chuyên nghiệp cho doanh nghiệp Việt
          </h1>
          
          {/* Subheading */}
          <p className="mt-6 text-base sm:text-lg text-[#e2e8f5] max-w-2xl mx-auto leading-relaxed">
            Phát nhạc hợp pháp không lo vi phạm bản quyền. Playlist thông minh tối ưu riêng cho quán cà phê, nhà hàng, spa, chuỗi chi nhánh và doanh nghiệp lớn.
          </p>

          {/* Bullet badging */}
          <div className="mt-8 flex flex-wrap justify-center gap-y-2 gap-x-6 text-xs sm:text-sm font-bold text-white">
            <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm border border-white/20 px-3 py-1.5 rounded-full">
              <CheckCircle className="w-4 h-4 text-[#59ca6d]" />
              <span>20.000+ bài hát độc quyền</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm border border-white/20 px-3 py-1.5 rounded-full">
              <CheckCircle className="w-4 h-4 text-[#59ca6d]" />
              <span>Cấp giấy phép sử dụng đầy đủ</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm border border-white/20 px-3 py-1.5 rounded-full">
              <CheckCircle className="w-4 h-4 text-[#59ca6d]" />
              <span>Dùng thử miễn phí 14 ngày</span>
            </div>
          </div>

          {/* Call to Actions */}
          <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
            <button
              onClick={() => handleScrollToSection('calculator')}
              className="w-full sm:w-auto px-8 py-4 bg-[#59ca6d] hover:bg-[#3da854] text-[#0a3a12] font-black text-sm rounded-xl transition-all shadow-lg hover:shadow-[#59ca6d]/20 flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
            >
              Bắt đầu tính giá ngay <ChevronRight className="w-4 h-4 text-[#0a3a12]" />
            </button>
            <button
              onClick={() => handleScrollToSection('packages')}
              className="w-full sm:w-auto px-8 py-4 bg-transparent border border-white/30 hover:bg-white/10 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              Xem các gói dịch vụ
            </button>
          </div>

        </div>
      </section>

      {/* 4. MAIN CORE MODULES */}
      <main className="flex-grow">
        {/* Interactive Price Calculator */}
        <PriceCalculator 
          pricingData={pricingData} 
          company={company} 
          packagesAdmin={packagesAdmin} 
          quoteRequests={quoteRequests}
          onSaveQuoteRequests={saveQuoteRequests}
          syncTrigger={calculatorSyncTrigger}
          airtableConfig={airtableConfig}
          onOpenAIConsultant={() => {
            setShowAIConsultant(true);
            setShowAIPrompt(false);
          }}
        />

        {/* Packages Grid */}
        <PackagesSection 
          packagesAdmin={packagesAdmin} 
          onSelectPackage={(pkgId) => setCalculatorSyncTrigger({ packageId: pkgId, timestamp: Date.now() })}
        />

        {/* Features Comparison */}
        <ComparisonTable packagesAdmin={packagesAdmin} />

        {/* Clients Testimonials */}
        <Testimonials reviews={reviews} />

        {/* Dynamic FAQ Accordion */}
        <FAQ faqs={faqs} />
      </main>

      {/* 5. MASTER BRAND FOOTER */}
      <footer className="bg-[#111111] text-[#aaaaaa] border-t border-zinc-800 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-12">
            
            {/* Cột 1: Thông tin thương hiệu */}
            <div className="md:col-span-5 space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-white tracking-tight">AudioBay</span>
              </div>
              <p className="text-xs text-[#aaaaaa] leading-relaxed max-w-sm">
                AudioBay là giải pháp phát nhạc nền bản quyền hàng đầu tại Việt Nam. Chúng tôi đồng hành cùng các chủ quán, nhà quản lý chuỗi nhằm chuẩn hóa pháp lý và tạo dựng không gian âm thanh đồng điệu với tâm lý người mua hàng.
              </p>
              <div className="flex flex-col gap-2.5 text-xs text-[#aaaaaa] pt-2 font-medium">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#59ca6d]" />
                  <span>Tổng đài hỗ trợ: <strong className="font-bold text-white">{company.phone}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#59ca6d]" />
                  <span>Email phòng dịch vụ: <strong className="font-bold text-white">{company.email}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#59ca6d]" />
                  <span>Website chính thức: <a href={`https://${company.website}`} target="_blank" rel="noreferrer" className="underline hover:text-[#59ca6d]">{company.website}</a></span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#59ca6d]" />
                  <span>Trụ sở chính: {company.address || COMPANY.address}</span>
                </div>
              </div>
            </div>

            {/* Cột 2: Các liên kết danh mục tính giá nhanh */}
            <div className="md:col-span-3 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">Liên kết nhanh</h4>
              <ul className="space-y-2 text-xs">
                <li><button onClick={() => handleScrollToSection('calculator')} className="hover:text-white transition-colors cursor-pointer text-left bg-transparent border-none p-0">Bảng tính phí dịch vụ</button></li>
                <li><button onClick={() => handleScrollToSection('packages')} className="hover:text-white transition-colors cursor-pointer text-left bg-transparent border-none p-0">Bốn gói cốt lõi</button></li>
                <li><button onClick={() => handleScrollToSection('comparison')} className="hover:text-white transition-colors cursor-pointer text-left bg-transparent border-none p-0">Bảng so sánh chi tiết</button></li>
                <li><button onClick={() => handleScrollToSection('faq')} className="hover:text-white transition-colors cursor-pointer text-left bg-transparent border-none p-0">Các thắc mắc thường gặp</button></li>
              </ul>
            </div>

            {/* Cột 3: Tuyên bố bản quyền & Pháp lý */}
            <div className="md:col-span-4 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">Hợp pháp tác quyền</h4>
              <div className="p-5 bg-[#1a1a1a] rounded-2xl border border-zinc-800 space-y-2.5 text-xs">
                <div className="flex items-center gap-1.5 text-[#59ca6d] font-bold">
                  <ShieldCheck className="w-4.5 h-4.5" /> Bản quyền được bảo hộ
                </div>
                <p className="text-[11px] text-[#aaaaaa] leading-relaxed">
                  Toàn bộ âm nhạc cung cấp bởi AudioBay đều được cấp quyền sử dụng thương mại chính thức kèm giấy chứng nhận pháp lý đầy đủ. Hỗ trợ thay mặt khách hàng giải quyết mọi vấn đề thanh tra liên quan đến quyền tác giả.
                </p>
              </div>
            </div>

          </div>

          {/* Dòng Bản quyền dưới cùng */}
          <div className="pt-8 border-t border-zinc-800 text-center text-xs text-[#71717a] font-medium font-mono">
            <p>© {new Date().getFullYear()} AudioBay.vn. Tất cả quyền được bảo lưu.</p>
            <p className="mt-1 text-[10px] text-[#52525b]">Trang web được thiết kế tuân thủ các quy định bản quyền âm nhạc thương mại của nước Cộng hòa Xã hội Chủ nghĩa Việt Nam.</p>
          </div>

        </div>
      </footer>

      {/* 6. FLOATING CHAT WIDGET - AI PRICING SPECIALIST */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
        
        {/* Bong bóng gợi ý tinh tế (Tooltip) */}
        <AnimatePresence>
          {showAIPrompt && !showAIConsultant && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="pointer-events-auto mb-3 mr-1 bg-slate-900 border border-slate-800 text-white rounded-2xl p-4 shadow-2xl max-w-xs relative flex flex-col gap-1.5"
            >
              {/* Nút đóng tooltip riêng biệt */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAIPrompt(false);
                  sessionStorage.setItem('audiobay_ai_prompt_dismissed', 'true');
                }}
                className="absolute top-2 right-2 text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 cursor-pointer border-none bg-transparent"
                aria-label="Đóng gợi ý"
              >
                <X className="w-3 h-3" />
              </button>

              <div className="flex items-center gap-1.5 text-indigo-400 font-bold text-xs uppercase tracking-wider font-mono">
                <Bot className="w-4 h-4 shrink-0" />
                <span>Trợ lý Báo giá AI 24/7</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                Chào Anh/Chị Sales! Bạn cần phác thảo phương án tính giá nhanh hoặc tìm giải pháp cho chuỗi chi nhánh đặc thù? Trò chuyện cùng AI ngay!
              </p>
              <button
                onClick={() => {
                  setShowAIConsultant(true);
                  setShowAIPrompt(false);
                }}
                className="mt-1 self-start px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-[10px] rounded-lg uppercase tracking-wider transition-all cursor-pointer border-none"
              >
                Kích hoạt AI
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cửa sổ chat chính (Slide-out Drawer) */}
        <AnimatePresence>
          {showAIConsultant && (
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="pointer-events-auto mb-3 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl w-[400px] max-w-[calc(100vw-2rem)] h-[620px] overflow-hidden flex flex-col"
            >
              <AIConsultant
                pricingData={pricingData}
                company={company}
                onClose={() => setShowAIConsultant(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Nút bấm tròn kích hoạt (Floating Action Button) */}
        <button
          onClick={() => {
            setShowAIConsultant(!showAIConsultant);
            if (showAIPrompt) {
              setShowAIPrompt(false);
              sessionStorage.setItem('audiobay_ai_prompt_dismissed', 'true');
            }
          }}
          className="pointer-events-auto flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-indigo-600 via-indigo-700 to-indigo-800 hover:from-indigo-500 hover:to-indigo-700 text-white rounded-full shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 border-none cursor-pointer relative"
          title="Tư vấn báo giá AI"
        >
          {showAIConsultant ? (
            <X className="w-6 h-6" />
          ) : (
            <>
              <MessageSquare className="w-6 h-6" />
              {/* Chấm tròn báo hiệu nhỏ */}
              <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full animate-ping" />
              <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full" />
            </>
          )}
        </button>

      </div>

    </div>
  );
}
