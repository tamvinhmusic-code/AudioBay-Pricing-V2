/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Sparkles, 
  RotateCcw, 
  FileText, 
  Check, 
  ArrowRight, 
  Bot, 
  User, 
  AlertCircle,
  HelpCircle,
  Clock,
  X,
  Square,
  Store,
  Maximize2,
  Layers,
  MapPin,
  Plus,
  Minus,
  Paperclip,
  UploadCloud
} from 'lucide-react';
import { Category, CustomerInfo, AIMessage } from '../types';
import { COMPANY } from '../initialData';
import { exportAICustomQuoteToPDF, formatVND } from '../utils/exportPDF';

interface AIConsultantProps {
  pricingData: Category[];
  company?: any;
  onClose?: () => void;
}

const PRESET_PROMPTS = [
  "Tôi có phòng tập Yoga rộng 85m² chia làm 2 khu vực phát nhạc.",
  "Trung tâm ngoại ngữ của tôi có quy mô 8 phòng học và 1 sảnh chính.",
  "Tôi kinh doanh tiệm xăm nghệ thuật diện tích khoảng 50m².",
  "Mô hình phức hợp cafe kết hợp tiệm rửa xe rộng 250m² có 3 vùng phát nhạc."
];

export default function AIConsultant({
  pricingData,
  company = COMPANY,
  onClose
}: AIConsultantProps) {
  const [messages, setMessages] = useState<AIMessage[]>(() => {
    return [
      {
        role: 'assistant',
        content: `Hệ thống **AI Pricing Cockpit** đã sẵn sàng. Vui lòng chọn tham số nhanh phía dưới hoặc nhập trực tiếp yêu cầu đặc thù để tính phí dự án.`,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });
  
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // AbortController để dừng phân tích AI khi cần
  const abortControllerRef = useRef<AbortController | null>(null);

  // File upload and drag-and-drop states/handlers
  const [attachedFiles, setAttachedFiles] = useState<any[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(Array.from(e.target.files));
    }
  };

  const processFiles = (filesList: File[]) => {
    filesList.forEach((file) => {
      // Limit to 10MB
      if (file.size > 10 * 1024 * 1024) {
        alert(`Tệp "${file.name}" quá lớn (vượt quá 10MB).`);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = reader.result as string;
        setAttachedFiles(prev => {
          if (prev.some(f => f.name === file.name)) return prev;
          return [...prev, {
            name: file.name,
            mimeType: file.type || 'application/octet-stream',
            size: file.size,
            data: base64Data
          }];
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  // State cho Modal khách hàng của AI Quote
  const [activeQuoteParams, setActiveQuoteParams] = useState<any | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    company: '',
    phone: '',
    email: '',
    notes: '',
  });

  // State cho bộ công cụ Điền Thông Tin Nhanh
  const [quickBizType, setQuickBizType] = useState<string>('Cafe / Nhà hàng');
  const [customBizType, setCustomBizType] = useState<string>('');
  const [quickArea, setQuickArea] = useState<number>(80);
  const [quickZones, setQuickZones] = useState<number>(2);
  const [quickBranches, setQuickBranches] = useState<number>(1);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isLoading]);

  // Xử lý dừng phân tích AI
  const handleStopMessage = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
  };

  // Xử lý gửi tin nhắn
  const handleSendMessage = async (text: string, overrideFiles?: any[]) => {
    const filesToSend = overrideFiles !== undefined ? overrideFiles : attachedFiles;
    if (!text.trim() && filesToSend.length === 0) return;
    if (isLoading) return;

    const userMsg: AIMessage = {
      role: 'user',
      content: text.trim() || (filesToSend.length > 0 ? `Đính kèm ${filesToSend.length} tệp tài liệu để phân tích báo giá` : ''),
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      files: filesToSend.length > 0 ? [...filesToSend] : undefined
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setAttachedFiles([]);
    setIsLoading(true);
    setErrorMsg(null);

    // Khởi tạo AbortController mới
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const chatHistory = messages.map(m => ({ role: m.role, content: m.content }));
      
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: controller.signal,
        body: JSON.stringify({
          message: text.trim() || `Phân tích dữ liệu từ tài liệu/hình ảnh được cung cấp.`,
          history: chatHistory,
          pricingData: pricingData,
          files: filesToSend.map(f => ({
            name: f.name,
            mimeType: f.mimeType,
            data: f.data
          }))
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.details || 'Lỗi hệ thống khi gọi AI.');
      }

      const data = await response.json();

      const assistantMsg: AIMessage = {
        role: 'assistant',
        content: data.replyText,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        quoteResult: {
          modelName: data.modelName,
          matchedCategoryName: data.matchedCategoryName,
          locationsCount: data.locationsCount || 1,
          inputValue: data.inputValue,
          inputLabel: data.inputLabel || 'm2',
          zones: data.zones || 1,
          basePriceMonthly: data.basePriceMonthly,
          addonPriceMonthly: data.addonPriceMonthly,
          totalPriceMonthly: data.totalPriceMonthly,
          totalPriceYearly: data.totalPriceYearly,
          savingsYearly: data.savingsYearly,
          packageTier: data.packageTier,
          features: data.features || [],
          analysisText: data.analysisText || ''
        }
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        // Tạo tin nhắn thông báo đã dừng
        const stoppedMsg: AIMessage = {
          role: 'assistant',
          content: '⚠️ **Đã dừng quá trình phân tích và báo giá theo yêu cầu.** Anh/Chị có thể nhập lại tham số hoặc gửi yêu cầu mới bất cứ lúc nào.',
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, stoppedMsg]);
      } else {
        console.error(error);
        setErrorMsg(error.message || 'Không thể kết nối với máy chủ AI. Vui lòng thử lại sau.');
      }
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: `Hệ thống **AI Pricing Cockpit** đã sẵn sàng. Vui lòng chọn tham số nhanh phía dưới hoặc nhập trực tiếp yêu cầu đặc thù để tính phí dự án.`,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setErrorMsg(null);
  };

  // Trực tiếp mở Modal nhập thông tin để xuất PDF
  const triggerExportPDF = (quoteResult: any) => {
    setActiveQuoteParams(quoteResult);
    setShowExportModal(true);
  };

  const handleFinalPdfExport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerInfo.name || !customerInfo.company) {
      alert('Vui lòng nhập Tên liên hệ và Tên doanh nghiệp để tạo báo giá chính thức.');
      return;
    }

    const today = new Date();
    const expiry = new Date();
    expiry.setDate(today.getDate() + 30);

    const formattedToday = today.toLocaleDateString('vi-VN');
    const formattedExpiry = expiry.toLocaleDateString('vi-VN');

    const pdfParams = {
      ...activeQuoteParams,
      customerInfo,
      quoteDate: formattedToday,
      validUntil: formattedExpiry,
      company: company
    };

    exportAICustomQuoteToPDF(pdfParams);
    setShowExportModal(false);
  };

  return (
    <div 
      onDragOver={handleDragOver}
      className="flex flex-col h-[650px] bg-slate-900 text-slate-100 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden relative"
    >
      {/* Drag & Drop Overlay */}
      {isDragging && (
        <div 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className="absolute inset-0 bg-slate-950/95 z-50 flex flex-col items-center justify-center border-4 border-dashed border-indigo-500 rounded-3xl m-2 transition-all p-8 text-center"
        >
          <div className="w-16 h-16 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl flex items-center justify-center text-indigo-400 mb-4 animate-bounce">
            <UploadCloud className="w-10 h-10" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Thả tài liệu hoặc ảnh vào đây</h3>
          <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
            Hỗ trợ ảnh mặt bằng (PNG, JPG, WEBP) hoặc tệp văn bản (TXT, PDF, CSV, JSON, MD) dung lượng tối đa 10MB để AI phân tích.
          </p>
        </div>
      )}
      
      {/* Header Panel */}
      <div className="p-5 bg-[#18224b] border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/30 rounded-xl flex items-center justify-center text-indigo-400">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm text-white tracking-wide uppercase">AI Sales Pricing Specialist</span>
              <span className="bg-indigo-500/15 text-indigo-300 text-[9px] font-extrabold px-1.5 py-0.5 rounded border border-indigo-500/20 uppercase tracking-widest">Internal Cockpit</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Trợ lý tính phí & kết xuất bản thảo báo giá cho Sales</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleResetChat}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            title="Trò chuyện lại từ đầu"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          {onClose && (
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              title="Đóng bảng tư vấn"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Container: Chat History */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-slate-900 bg-slate-950"
      >
        {messages.map((msg, idx) => {
          const isAI = msg.role === 'assistant';
          return (
            <div key={idx} className={`flex gap-3.5 ${isAI ? 'justify-start' : 'justify-end'}`}>
              
              {/* Avatar */}
              {isAI && (
                <div className="w-8 h-8 rounded-full bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center shrink-0 self-start">
                  <Bot className="w-4 h-4 text-indigo-400" />
                </div>
              )}

              <div className="max-w-[85%] space-y-3.5">
                
                {/* Bubble Content */}
                <div className={`p-4 rounded-2xl border text-sm leading-relaxed ${
                  isAI 
                    ? 'bg-slate-900/60 text-slate-200 border-slate-800 rounded-tl-none' 
                    : 'bg-[#263b96] text-white border-[#263b96] rounded-tr-none shadow-md shadow-indigo-900/25'
                }`}>
                  {/* File attachments rendering */}
                  {msg.files && msg.files.length > 0 && (
                    <div className="grid grid-cols-1 gap-2 mb-3 max-w-md">
                      {msg.files.map((file, fIdx) => {
                        const isImage = file.mimeType.startsWith('image/');
                        return (
                          <div 
                            key={fIdx} 
                            className={`flex items-center gap-2.5 p-2 rounded-xl border text-xs ${
                              isAI 
                                ? 'bg-slate-950/50 border-slate-800 text-slate-200' 
                                : 'bg-slate-950/30 border-indigo-400/20 text-white'
                            }`}
                          >
                            {isImage ? (
                              <img 
                                src={file.data} 
                                alt={file.name} 
                                className="w-10 h-10 object-cover rounded-lg bg-slate-900 shrink-0"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-slate-900/80 border border-slate-850 rounded-lg flex items-center justify-center text-indigo-400 shrink-0">
                                <FileText className="w-5 h-5" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="font-bold truncate text-[11px] leading-tight">{file.name}</p>
                              <p className="text-[9px] text-slate-300 font-mono mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Parse basic bold/markdown formatting safely */}
                  <div className="whitespace-pre-wrap select-text">
                    {msg.content.split('\n').map((paragraph, pIdx) => {
                      // Simple markdown replacement for bold text (**text**)
                      const formattedText = paragraph.split('**').map((part, partIdx) => {
                        if (partIdx % 2 === 1) {
                          return <strong key={partIdx} className="font-extrabold text-white">{part}</strong>;
                        }
                        return part;
                      });

                      return (
                        <p key={pIdx} className={pIdx > 0 ? 'mt-2.5' : ''}>
                          {formattedText}
                        </p>
                      );
                    })}
                  </div>

                  <span className="block text-[9px] text-slate-500 mt-2 text-right font-mono select-none">
                    <Clock className="inline w-2.5 h-2.5 mr-1" />
                    {msg.timestamp}
                  </span>
                </div>

                {/* Structured Quotation Result (Rendered only on AI answers with data) */}
                {isAI && msg.quoteResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="bg-gradient-to-br from-[#121c3f] to-[#0a1129] border border-indigo-500/25 rounded-2xl overflow-hidden shadow-xl"
                  >
                    {/* Quotation Header */}
                    <div className="px-4 py-3.5 bg-indigo-500/10 border-b border-indigo-500/15 flex justify-between items-center">
                      <div>
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest font-mono">BÁO GIÁ ĐỀ XUẤT AI</span>
                        <h4 className="text-sm font-extrabold text-white mt-0.5">{msg.quoteResult.modelName}</h4>
                      </div>
                      <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-500/20">
                        {msg.quoteResult.matchedCategoryName}
                      </span>
                    </div>

                    {/* Scale and Zones specs */}
                    <div className="grid grid-cols-3 gap-px bg-slate-800/40 text-xs border-b border-slate-800/55">
                      <div className="p-3 bg-slate-900/40 text-center">
                        <span className="block text-slate-400 text-[10px] uppercase font-semibold">Số lượng địa điểm</span>
                        <strong className="block text-white text-sm font-extrabold font-mono mt-1">
                          {msg.quoteResult.locationsCount || 1} {msg.quoteResult.locationsCount && msg.quoteResult.locationsCount > 1 ? 'chi nhánh' : 'địa điểm'}
                        </strong>
                      </div>
                      <div className="p-3 bg-slate-900/40 text-center">
                        <span className="block text-slate-400 text-[10px] uppercase font-semibold">Quy mô đo đạc</span>
                        <strong className="block text-white text-sm font-extrabold font-mono mt-1">
                          {msg.quoteResult.inputValue} {msg.quoteResult.inputLabel}
                        </strong>
                      </div>
                      <div className="p-3 bg-slate-900/40 text-center">
                        <span className="block text-slate-400 text-[10px] uppercase font-semibold">Khu vực phát nhạc (Zones)</span>
                        <strong className="block text-white text-sm font-extrabold font-mono mt-1">
                          {msg.quoteResult.zones} Zones
                        </strong>
                      </div>
                    </div>

                    {/* Prices detailed */}
                    <div className="p-4 space-y-3.5">
                      <div className="space-y-2 text-xs border-b border-slate-800/55 pb-3">
                        <div className="flex justify-between text-slate-300">
                          <span>Gói cơ sở phù hợp ({msg.quoteResult.packageTier}):</span>
                          <span className="font-bold text-white font-mono">{formatVND(msg.quoteResult.basePriceMonthly)}/tháng</span>
                        </div>
                        {msg.quoteResult.addonPriceMonthly > 0 && (
                          <div className="flex justify-between text-slate-300">
                            <span>Phí vùng âm thanh thêm:</span>
                            <span className="font-bold text-white font-mono">+{formatVND(msg.quoteResult.addonPriceMonthly)}/tháng</span>
                          </div>
                        )}
                        <div className="flex justify-between text-slate-400 text-[11px] pt-1 border-t border-slate-800/30">
                          <span>Phí thanh toán tháng gốc:</span>
                          <span className="font-medium font-mono">{formatVND(msg.quoteResult.totalPriceMonthly)}/tháng</span>
                        </div>
                      </div>

                      {/* Annual Price (Save 17%) */}
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Tổng cộng thanh toán Năm</span>
                          <div className="text-lg font-black text-white font-mono leading-none mt-1">
                            {formatVND(msg.quoteResult.totalPriceYearly)}<span className="text-xs text-slate-400 font-normal">/năm</span>
                          </div>
                        </div>
                        {msg.quoteResult.savingsYearly > 0 && (
                          <div className="bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 text-[10px] font-extrabold px-2.5 py-1 rounded-lg font-mono text-center">
                            Tiết kiệm {formatVND(msg.quoteResult.savingsYearly)}/năm
                          </div>
                        )}
                      </div>

                      {/* Export official PDF button */}
                      <button
                        onClick={() => triggerExportPDF(msg.quoteResult)}
                        className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-emerald-500/10 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <FileText className="w-4 h-4" /> Xuất báo giá PDF chính thức
                      </button>
                    </div>
                  </motion.div>
                )}

              </div>

              {/* User Avatar */}
              {!isAI && (
                <div className="w-8 h-8 rounded-full bg-indigo-600 border border-indigo-500 flex items-center justify-center shrink-0 self-end">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}

            </div>
          );
        })}

        {/* AI Typing Indicator */}
        {isLoading && (
          <div className="flex gap-3.5 justify-start">
            <div className="w-8 h-8 rounded-full bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center shrink-0 self-start">
              <Bot className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl rounded-tl-none flex flex-col sm:flex-row sm:items-center gap-3.5 text-xs text-slate-400 font-medium">
              <div className="flex items-center gap-2">
                <span className="flex space-x-1.5 items-center">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
                <span>AI đang phân tích mô hình và trích xuất bảng giá...</span>
              </div>
              <button
                type="button"
                onClick={handleStopMessage}
                className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/25 rounded-lg font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all self-start sm:self-auto"
              >
                <Square className="w-2.5 h-2.5 text-rose-400 fill-rose-400/50" /> Dừng lại
              </button>
            </div>
          </div>
        )}

        {/* Custom error message */}
        {errorMsg && (
          <div className="p-4 bg-rose-950/45 border border-rose-900/50 rounded-2xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 mt-0.5 flex-shrink-0" />
            <div>
              <h5 className="text-xs font-bold text-rose-200">Không thể xử lý yêu cầu</h5>
              <p className="text-xs text-rose-400 mt-1 leading-relaxed">
                {errorMsg}
              </p>
              <button 
                onClick={() => handleSendMessage(messages[messages.length - 1].content)}
                className="mt-2 text-xs font-bold text-rose-300 hover:underline cursor-pointer bg-transparent border-none p-0"
              >
                Gửi lại yêu cầu ↺
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Suggestion presets panel replaced with Interactive Quick Form */}
      {messages.length === 1 && !isLoading && (
        <div className="px-5 py-4 bg-slate-900 border-t border-slate-800 shrink-0">
          <span className="block text-[11px] text-indigo-400 uppercase font-extrabold tracking-wider mb-3.5 font-mono flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> THIẾT LẬP THAM SỐ NHANH DỰ ÁN (QUICK CONFIG):
          </span>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {/* 1. Loại hình */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block flex items-center gap-1">
                <Store className="w-3 h-3 text-indigo-400" /> Loại hình kinh doanh
              </label>
              <select
                value={quickBizType}
                onChange={(e) => setQuickBizType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none cursor-pointer"
              >
                <option value="Cafe / Nhà hàng">☕ Cafe / Nhà hàng</option>
                <option value="Spa / Thẩm mỹ viện">🌸 Spa / Thẩm mỹ viện</option>
                <option value="Gym / Yoga / Fitness">💪 Gym / Yoga / Fitness</option>
                <option value="Cửa hàng bán lẻ / Siêu thị">🛒 Cửa hàng bán lẻ / Siêu thị</option>
                <option value="Văn phòng / Co-working">🏢 Văn phòng / Co-working</option>
                <option value="Khách sạn / Resort">🏨 Khách sạn / Resort</option>
                <option value="Trung tâm tiếng Anh / Trường học">🏫 Trung tâm Giáo dục / Trường học</option>
                <option value="Mô hình dịch vụ khác">✨ Mô hình dịch vụ khác</option>
              </select>
              {quickBizType === 'Mô hình dịch vụ khác' && (
                <div className="mt-2 animate-fadeIn">
                  <input
                    type="text"
                    required
                    placeholder="Nhập loại hình cụ thể (VD: Bệnh viện, Showroom...)"
                    value={customBizType}
                    onChange={(e) => setCustomBizType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-2.5 py-1.5 text-[11px] text-white focus:outline-none placeholder-slate-500 transition-all"
                  />
                </div>
              )}
            </div>

            {/* 2. Diện tích */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block flex items-center gap-1">
                <Maximize2 className="w-3 h-3 text-indigo-400" /> Diện tích sử dụng (m²)
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setQuickArea(prev => Math.max(10, prev - 20))}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 flex items-center justify-center transition-all cursor-pointer border border-slate-750"
                  title="Giảm 20m²"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="number"
                  min="5"
                  max="10000"
                  value={quickArea}
                  onChange={(e) => setQuickArea(Number(e.target.value) || 0)}
                  className="flex-1 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg py-1 text-center text-xs text-white focus:outline-none h-8 font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  type="button"
                  onClick={() => setQuickArea(prev => Math.min(10000, prev + 20))}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 flex items-center justify-center transition-all cursor-pointer border border-slate-750"
                  title="Tăng 20m²"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 3. Số khu vực phát nhạc */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block flex items-center gap-1">
                <Layers className="w-3 h-3 text-indigo-400" /> Số vùng phát nhạc (Zones)
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setQuickZones(prev => Math.max(1, prev - 1))}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 flex items-center justify-center transition-all cursor-pointer border border-slate-750"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <div className="flex-1 bg-slate-950 border border-slate-800 rounded-lg text-center text-xs text-white font-bold h-8 flex items-center justify-center">
                  {quickZones} zone{quickZones > 1 ? 's' : ''}
                </div>
                <button
                  type="button"
                  onClick={() => setQuickZones(prev => Math.min(10, prev + 1))}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 flex items-center justify-center transition-all cursor-pointer border border-slate-750"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 4. Số chi nhánh */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block flex items-center gap-1">
                <MapPin className="w-3 h-3 text-indigo-400" /> Số lượng chi nhánh
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setQuickBranches(prev => Math.max(1, prev - 1))}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 flex items-center justify-center transition-all cursor-pointer border border-slate-750"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <div className="flex-1 bg-slate-950 border border-slate-800 rounded-lg text-center text-xs text-white font-bold h-8 flex items-center justify-center">
                  {quickBranches} cửa hàng
                </div>
                <button
                  type="button"
                  onClick={() => setQuickBranches(prev => Math.min(100, prev + 1))}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 flex items-center justify-center transition-all cursor-pointer border border-slate-750"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Action CTA Button */}
          <button
            type="button"
            disabled={quickBizType === 'Mô hình dịch vụ khác' && !customBizType.trim()}
            onClick={() => {
              const finalBizType = quickBizType === 'Mô hình dịch vụ khác' 
                ? (customBizType.trim() ? `${customBizType.trim()}` : 'Mô hình dịch vụ khác') 
                : quickBizType;
              const promptText = `Tôi muốn tư vấn báo giá bản quyền nhạc cho mô hình: ${finalBizType}, với diện tích mặt bằng sử dụng khoảng ${quickArea} m², chia làm ${quickZones} khu vực phát nhạc (zones) riêng biệt, quy mô hoạt động hiện tại gồm ${quickBranches} cửa hàng/chi nhánh. Hãy phân tích giải pháp bản quyền tối ưu và xuất bảng giá ước tính chi tiết cho tôi.`;
              handleSendMessage(promptText);
            }}
            className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-555 hover:to-indigo-455 active:scale-[0.99] text-white text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-indigo-600/15 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-300 shrink-0" /> Xử lý Phương án & Tính giá AI ⚡
          </button>
        </div>
      )}

      {/* Selected Files Preview area */}
      {attachedFiles.length > 0 && (
        <div className="px-4 py-2 bg-slate-900 border-t border-slate-850 flex flex-wrap gap-2 animate-fadeIn max-h-24 overflow-y-auto">
          {attachedFiles.map((file, fIdx) => {
            const isImage = file.mimeType.startsWith('image/');
            return (
              <div 
                key={fIdx}
                className="flex items-center gap-2 pl-2 pr-1 py-1 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 group relative animate-scaleIn"
              >
                {isImage ? (
                  <img 
                    src={file.data} 
                    alt={file.name} 
                    className="w-6 h-6 object-cover rounded-md bg-slate-900 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                )}
                <span className="max-w-[120px] truncate font-medium text-[10px] text-slate-300">{file.name}</span>
                <button
                  type="button"
                  onClick={() => setAttachedFiles(prev => prev.filter((_, i) => i !== fIdx))}
                  className="p-1 hover:text-rose-400 text-slate-400 rounded-md transition-colors cursor-pointer"
                  title="Xóa tệp đính kèm"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Input Message Panel */}
      <div className="p-4 bg-slate-900 border-t border-slate-850 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputMessage);
          }}
          className="flex flex-col gap-2 bg-slate-950 border border-slate-800 focus-within:border-indigo-500 rounded-2xl p-3 transition-colors"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            accept="image/*,.txt,.pdf,.csv,.json,.md"
            className="hidden"
          />
          
          {/* Textarea for Multi-line typing */}
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (inputMessage.trim() || attachedFiles.length > 0) {
                  handleSendMessage(inputMessage);
                }
              }
            }}
            disabled={isLoading}
            rows={3}
            placeholder="Mô tả không gian hoặc dán yêu cầu đặc thù để AI phân tích và báo giá..."
            className="w-full bg-transparent resize-none text-xs text-white placeholder-slate-500 focus:outline-none min-h-[64px] max-h-[180px] leading-relaxed"
          />

          {/* Action Row inside the box */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-900/60 mt-1">
            {/* Attachment Button & File Status */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => fileInputRef.current?.click()}
                className="p-2 hover:bg-slate-800 disabled:bg-transparent disabled:opacity-30 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                title="Đính kèm tệp phân tích (Ảnh hoặc Tài liệu)"
              >
                <Paperclip className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold text-slate-400 hidden sm:inline">Đính kèm</span>
              </button>
              <span className="text-[9px] text-slate-500 font-medium hidden md:inline">
                (Shift + Enter để xuống dòng)
              </span>
            </div>

            {/* Action Buttons: Stop / Send */}
            <div className="flex items-center gap-2">
              {isLoading ? (
                <button
                  type="button"
                  onClick={handleStopMessage}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1"
                  title="Dừng phân tích"
                >
                  <Square className="w-2.5 h-2.5 fill-white shrink-0" /> Dừng
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!inputMessage.trim() && attachedFiles.length === 0}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-850 disabled:opacity-40 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all shadow-md shadow-indigo-600/10 cursor-pointer flex items-center gap-1.5 shrink-0"
                  title="Gửi tin nhắn"
                >
                  <span>Gửi tin</span>
                  <Send className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* MODAL NHẬP THÔNG TIN KHÁCH HÀNG ĐỂ XUẤT PDF AI */}
      <AnimatePresence>
        {showExportModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity" 
              onClick={() => setShowExportModal(false)}
            />

            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative transform overflow-hidden rounded-3xl bg-slate-900 text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-md border border-slate-800 text-slate-100"
              >
                {/* Header */}
                <div className="bg-slate-850 px-6 py-4 flex justify-between items-center border-b border-slate-800">
                  <div>
                    <h3 className="text-sm font-bold font-mono text-white flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-400" /> Xác nhận in báo giá AI
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Vui lòng cung cấp thông tin để điền vào phiếu báo giá</p>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setShowExportModal(false)}
                    className="text-slate-400 hover:text-white font-semibold text-base cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleFinalPdfExport} className="p-6 space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">
                      Họ và tên người nhận <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Nguyễn Văn A"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full text-xs bg-slate-950 border border-slate-800 text-white rounded-xl p-3 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">
                      Cơ sở kinh doanh / Doanh nghiệp <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Trung tâm Anh Ngữ ABC"
                      value={customerInfo.company}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, company: e.target.value }))}
                      className="w-full text-xs bg-slate-950 border border-slate-800 text-white rounded-xl p-3 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">
                        Số điện thoại liên hệ
                      </label>
                      <input
                        type="tel"
                        placeholder="Ví dụ: 0912xxxxxx"
                        value={customerInfo.phone}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full text-xs bg-slate-950 border border-slate-800 text-white rounded-xl p-3 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">
                        Địa chỉ Email
                      </label>
                      <input
                        type="email"
                        placeholder="Ví dụ: abc@company.com"
                        value={customerInfo.email}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full text-xs bg-slate-950 border border-slate-800 text-white rounded-xl p-3 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">
                      Ghi chú / Yêu cầu đặc biệt
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Ví dụ: Cần playlist nhạc cụ thể có bản quyền đầy đủ..."
                      value={customerInfo.notes}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full text-xs bg-slate-950 border border-slate-800 text-white rounded-xl p-3 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="pt-4 border-t border-slate-800 flex gap-3 justify-end text-xs">
                    <button
                      type="button"
                      onClick={() => setShowExportModal(false)}
                      className="px-4 py-2.5 font-semibold text-slate-400 hover:text-white bg-slate-800 rounded-xl cursor-pointer"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-500 rounded-xl shadow-xs cursor-pointer"
                    >
                      Xác nhận & Tải PDF
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
