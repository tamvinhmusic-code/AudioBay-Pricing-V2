import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { INITIAL_FAQS } from '../initialData';

interface FAQProps {
  faqs: typeof INITIAL_FAQS;
}

export default function FAQ({ faqs }: FAQProps) {
  // Trạng thái lưu trữ các index faq đang mở
  const [openIndex, setOpenIndex] = useState<number | null>(0); // mặc định mở cái đầu tiên

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-20 bg-[#09090b] border-b border-[#27272a]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Giải đáp thắc mắc thường gặp
          </h2>
          <p className="mt-4 text-base text-[#a1a1aa]">
            Mọi thắc mắc của bạn về tác quyền, hợp đồng, hạ tầng phần cứng và hình thức thanh toán đều được làm rõ tại đây.
          </p>
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="bg-[#18181b] border border-[#27272a] rounded-2xl overflow-hidden transition-all duration-200 shadow-lg"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(index)}
                  className="w-full px-6 py-4.5 flex justify-between items-center text-left hover:bg-[#27272a]/40 cursor-pointer focus:outline-none"
                >
                  <span className="text-xs sm:text-sm font-bold text-white flex items-center gap-2.5">
                    <HelpCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#a1a1aa] transition-transform duration-200 ${
                      isOpen ? 'transform rotate-180 text-indigo-400' : ''
                    }`}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-5 pt-2 text-xs text-[#a1a1aa] leading-relaxed border-t border-[#27272a] bg-[#18181b]">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
