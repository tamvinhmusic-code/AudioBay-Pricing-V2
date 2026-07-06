import React from 'react';
import { Check, Minus } from 'lucide-react';
import { PackagesAdminData } from '../types';
import { tierHasFeature } from '../utils/priceCalculator';

interface ComparisonTableProps {
  packagesAdmin: PackagesAdminData;
}

export default function ComparisonTable({ packagesAdmin }: ComparisonTableProps) {
  // Lọc và Sắp xếp các tính năng theo thứ tự hiển thị (order) và loại bỏ tính năng ẩn
  const sortedFeatures = [...packagesAdmin.features]
    .filter(f => !f.hidden)
    .sort((a, b) => a.order - b.order);

  const renderValue = (hasFeature: boolean) => {
    return hasFeature ? (
      <div className="flex justify-center"><Check className="w-5 h-5 text-emerald-400" /></div>
    ) : (
      <div className="flex justify-center"><Minus className="w-4 h-4 text-[#3f3f46]" /></div>
    );
  };

  return (
    <section id="comparison" className="py-20 bg-[#09090b] border-b border-[#27272a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl tracking-tight">
            Bảng so sánh chi tiết tính năng
          </h2>
          <p className="mt-4 text-base text-[#a1a1aa]">
            Xem xét chi tiết từng đặc quyền để thấu hiểu rõ ràng giải pháp nào đáp ứng vừa vặn mục tiêu tăng trưởng của cơ sở.
          </p>
        </div>

        {/* Responsive Container */}
        <div className="bg-[#18181b] rounded-3xl border border-[#27272a] shadow-lg overflow-hidden">
          <div className="overflow-x-auto overflow-y-hidden">
            <table className="w-full min-w-[768px] border-collapse text-left">
              <thead>
                <tr className="bg-[#09090b] text-[#fafafa] border-b border-[#27272a] text-xs font-bold uppercase tracking-wider font-mono">
                  <th className="py-4.5 px-6 w-2/5">Danh mục tính năng & đặc quyền</th>
                  <th className="py-4.5 px-4 text-center">STARTER</th>
                  <th className="py-4.5 px-4 text-center">BUSINESS</th>
                  <th className="py-4.5 px-4 text-center">PROFESSIONAL</th>
                  <th className="py-4.5 px-4 text-center">ENTERPRISE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a]">
                {sortedFeatures.map((feat) => (
                  <tr key={feat.id} className="hover:bg-[#27272a]/30 transition-colors">
                    <td className="py-3.5 px-6 text-xs font-semibold text-white">
                      {feat.content}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {renderValue(tierHasFeature('starter', feat.tierFrom))}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {renderValue(tierHasFeature('business', feat.tierFrom))}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {renderValue(tierHasFeature('professional', feat.tierFrom))}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {renderValue(tierHasFeature('enterprise', feat.tierFrom))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </section>
  );
}
