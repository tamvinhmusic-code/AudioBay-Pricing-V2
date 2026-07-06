import { Check, Sparkles, Zap, ShieldCheck, HelpCircle } from 'lucide-react';
import { PackagesAdminData, PackageCardConfig } from '../types';
import { getFeaturesForPackage } from '../utils/priceCalculator';

interface PackagesSectionProps {
  packagesAdmin: PackagesAdminData;
  onSelectPackage?: (packageId: string) => void;
}

export default function PackagesSection({ packagesAdmin, onSelectPackage }: PackagesSectionProps) {
  // mapping id to icon and background/border style
  const getPackageIcon = (id: string, color: string) => {
    switch (id) {
      case 'starter':
        return <Zap className="w-5 h-5" style={{ color }} />;
      case 'business':
        return <Sparkles className="w-5 h-5 animate-pulse" style={{ color }} />;
      case 'professional':
        return <ShieldCheck className="w-5 h-5" style={{ color }} />;
      case 'enterprise':
      default:
        return <HelpCircle className="w-5 h-5" style={{ color }} />;
    }
  };

  const getPackageStyles = (pkg: PackageCardConfig) => {
    const isHighlighted = pkg.highlighted;
    
    // styles for outer wrapper
    let accent = 'border-[#27272a] bg-[#18181b] hover:border-zinc-700 text-white';
    if (isHighlighted) {
      accent = 'border-emerald-500/50 ring-2 ring-emerald-500/10 bg-[#18181b] text-white';
    } else if (pkg.id === 'enterprise') {
      accent = 'border-[#27272a] bg-gradient-to-br from-[#18181b] to-indigo-950/30 text-white';
    }

    // styles for CTA button
    let buttonBg = 'bg-indigo-600 text-white hover:bg-indigo-500 font-bold';
    if (isHighlighted) {
      buttonBg = 'bg-emerald-500 text-white hover:bg-emerald-600 font-bold';
    } else if (pkg.id === 'enterprise') {
      buttonBg = 'bg-white text-black hover:bg-zinc-200 font-bold';
    }

    return { accent, buttonBg };
  };

  const handleScrollToCalc = (pkg: PackageCardConfig) => {
    // 1. Cập nhật state đồng bộ gói ngay lập tức để React thay đổi giao diện trước
    if (onSelectPackage) {
      onSelectPackage(pkg.id);
    }

    // 2. Chờ 100ms để React cập nhật DOM và ổn định chiều cao mới, sau đó mới cuộn
    // Việc này đảm bảo trình duyệt nhắm chuẩn xác tọa độ của layout mới, không bị khựng giữa chừng
    setTimeout(() => {
      const calcElement = document.getElementById('calculator');
      if (calcElement) {
        calcElement.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <section id="packages" className="py-20 bg-[#09090b] border-b border-[#27272a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl tracking-tight">
            Các gói giải pháp bản quyền cốt lõi
          </h2>
          <p className="mt-4 text-base text-[#a1a1aa]">
            AudioBay phân cấp tính năng rõ ràng để mọi doanh nghiệp từ startup nhỏ đến tập đoàn lớn đều tìm được gói giải pháp tối ưu chi phí.
          </p>
        </div>

        {/* Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {packagesAdmin.cards.map((pkg) => {
            const { accent, buttonBg } = getPackageStyles(pkg);
            const isContact = pkg.priceDisplay.toUpperCase() === 'LIÊN HỆ';
            const priceText = isContact ? 'LIÊN HỆ' : `${pkg.priceDisplay} đ`;
            const periodText = isContact ? 'Tùy chỉnh theo nhu cầu' : '/ tháng / cơ sở';
            const features = getFeaturesForPackage(packagesAdmin.features, pkg.id);
            
            return (
              <div
                key={pkg.id}
                className={`flex flex-col rounded-3xl border p-6.5 shadow-lg transition-all duration-300 transform hover:-translate-y-1 relative ${accent}`}
              >
                {/* Badge nổi bật */}
                {pkg.badge && (
                  <span className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    pkg.highlighted ? 'bg-emerald-500 text-white' : 'bg-zinc-800 text-[#fafafa] border border-zinc-700'
                  }`}>
                    {pkg.badge}
                  </span>
                )}

                {/* Header Gói */}
                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-2">
                    {getPackageIcon(pkg.id, pkg.color)}
                    <h3 className="text-lg font-black tracking-wider uppercase font-mono" style={{ color: pkg.color }}>
                      {pkg.name}
                    </h3>
                  </div>
                  <p className="text-xs text-[#a1a1aa] leading-relaxed min-h-[36px]">
                    {pkg.subtitle}
                  </p>
                </div>

                {/* Giá Cả */}
                <div className="mb-6 pb-6 border-b border-[#27272a] flex flex-col justify-end min-h-[72px]">
                  {!isContact ? (
                    <>
                      <span className="text-[10px] font-black tracking-widest text-emerald-400 uppercase mb-1">
                        Chỉ từ
                      </span>
                      <div className="flex items-baseline">
                        <span className="text-3xl font-black tracking-tight text-white font-mono">
                          {pkg.priceDisplay}
                        </span>
                        <span className="text-sm font-semibold text-white ml-0.5 mr-1.5">đ</span>
                        <span className="text-xs font-semibold text-[#a1a1aa]">
                          {periodText}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="text-[10px] font-black tracking-widest text-amber-500 uppercase mb-1">
                        Doanh nghiệp
                      </span>
                      <div className="flex flex-col">
                        <span className="text-3xl font-black tracking-tight text-white font-mono uppercase">
                          {pkg.priceDisplay}
                        </span>
                        <span className="text-xs font-semibold text-[#a1a1aa] mt-1">
                          {periodText}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Tính Năng */}
                <ul className="space-y-3.5 mb-8 flex-1">
                  {features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-2.5 text-xs">
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="text-[#d4d4d8]">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Nút Call To Action */}
                <button
                  type="button"
                  onClick={() => handleScrollToCalc(pkg)}
                  className={`w-full py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${buttonBg}`}
                >
                  {pkg.ctaText}
                </button>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}

