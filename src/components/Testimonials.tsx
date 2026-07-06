import { Star, MessageSquareQuote } from 'lucide-react';
import { INITIAL_TESTIMONIALS } from '../initialData';

interface TestimonialsProps {
  reviews?: typeof INITIAL_TESTIMONIALS;
}

export default function Testimonials({ reviews = INITIAL_TESTIMONIALS }: TestimonialsProps) {
  return (
    <section id="testimonials" className="py-20 bg-[#09090b] border-b border-[#27272a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl tracking-tight">
            Tin tưởng bởi thương hiệu hàng đầu
          </h2>
          <p className="mt-4 text-base text-[#a1a1aa]">
            Hàng ngàn địa điểm kinh doanh tại Việt Nam đang phát nhạc bản quyền thông qua AudioBay mỗi ngày để nâng tầm trải nghiệm khách hàng.
          </p>
        </div>

        {/* Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {reviews.map((t, idx) => (
            <div
              key={idx}
              className="bg-[#18181b] border border-[#27272a] rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 transform hover:-translate-y-1 shadow-lg"
            >
              <div className="space-y-4">
                {/* Stars */}
                <div className="flex items-center gap-1 text-amber-400">
                  {Array.from({ length: t.rating }).map((_, sIdx) => (
                    <Star key={sIdx} className="w-4.5 h-4.5 fill-current" />
                  ))}
                </div>

                {/* Content */}
                <p className="text-xs text-[#d4d4d8] leading-relaxed italic relative">
                  <MessageSquareQuote className="absolute -top-3.5 -left-1 w-8 h-8 text-zinc-800 -z-0 opacity-40 pointer-events-none" />
                  <span className="relative z-10">"{t.content}"</span>
                </p>
              </div>

              {/* Author Info */}
              <div className="mt-6 pt-4 border-t border-[#27272a] flex items-center gap-3">
                <div className="w-9 h-9 bg-indigo-600 text-white rounded-full flex items-center justify-center font-black text-xs shrink-0 font-mono">
                  {t.name.split(' ').slice(-1)[0][0]}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white leading-tight">{t.name}</h4>
                  <p className="text-[10px] text-[#a1a1aa] font-semibold mt-0.5">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
