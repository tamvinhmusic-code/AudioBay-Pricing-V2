/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { QuoteParams, FeatureRow } from '../types';
import { COMPANY, defaultPackagesAdmin } from '../initialData';
import { getPackageIdForTier } from './priceCalculator';

const TIER_ORDER = ['starter', 'business', 'professional', 'enterprise'];

function tierHasFeature(packageId: string, tierFrom: string): boolean {
  return TIER_ORDER.indexOf(packageId) >= TIER_ORDER.indexOf(tierFrom);
}

function getFeaturesForPackage(features: FeatureRow[], packageId: string): string[] {
  return features
    .filter(f => !f.hidden && tierHasFeature(packageId, f.tierFrom))
    .sort((a, b) => a.order - b.order)
    .map(f => f.content);
}

function getDynamicFeaturesForPackage(packageId: string): string[] {
  try {
    const saved = localStorage.getItem('audiobay_packages_v2');
    const packagesAdmin = saved ? JSON.parse(saved) : defaultPackagesAdmin;
    if (packagesAdmin && Array.isArray(packagesAdmin.features)) {
      return getFeaturesForPackage(packagesAdmin.features, packageId);
    }
  } catch (error) {
    console.error('Lỗi khi lấy tính năng động cho PDF:', error);
  }
  
  // Fallback nếu có lỗi hoặc không có dữ liệu
  const defaultFeatures = defaultPackagesAdmin.features;
  return getFeaturesForPackage(defaultFeatures, packageId);
}

/**
 * Định dạng tiền tệ VND
 */
export const formatVND = (num: number): string => {
  return num.toLocaleString('vi-VN') + ' VNĐ';
};

/**
 * Tạo tên file chuẩn hóa không dấu, viết liền, in hoa
 */
export const getFormattedFilename = (companyName: string): string => {
  if (!companyName) return 'DOANHNGHIEP';
  let str = companyName;
  // Thay thế toàn bộ các ký tự tiếng Việt có dấu thành không dấu
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  str = str.replace(/đ/g, "d");
  str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
  str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
  str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
  str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
  str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
  str = str.replace(/Ỳ|Ý|Y|Ỷ|Ỹ/g, "Y");
  str = str.replace(/Đ/g, "D");

  // Chuẩn hóa Unicode Tổ hợp (NFD) về dạng Dựng sẵn (NFC) và loại bỏ các dấu kết hợp còn sót lại
  str = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Chuyển sang chữ IN HOA và chỉ giữ lại chữ cái từ A-Z và chữ số từ 0-9
  return str.toUpperCase().replace(/[^A-Z0-9]/g, "");
};

/**
 * Xuất báo giá dưới dạng trang HTML in ấn chuyên nghiệp (In sang PDF)
 */
export function exportQuoteToPDF(params: QuoteParams) {
  const {
    category,
    tier,
    inputValue,
    extraZones,
    branches,
    paymentCycle,
    chainDiscount,
    basePrice,
    zoneAddon,
    totalAmount,
    saving,
    customerInfo,
    quoteDate,
    validUntil,
    company,
  } = params;

  const activeCompany = company || COMPANY;

  const quoteCode = `AB-${Math.floor(100000 + Math.random() * 900000)}`;
  const filename = `BaoGia_AudioBay_${getFormattedFilename(customerInfo.company)}_${quoteCode}`;

  const totalZones = tier.zones + extraZones;
  const cycleLabel = paymentCycle === 'monthly' ? 'Tháng' : 'Năm';
  const cycleUnit = paymentCycle === 'monthly' ? '/tháng' : '/năm';

  // Định dạng các giá trị chi tiết
  const displayBasePrice = formatVND(basePrice);
  const displayZoneAddon = extraZones > 0 ? formatVND(zoneAddon) : '0 VNĐ';
  const displayTotalAmount = formatVND(totalAmount);
  const displaySaving = saving > 0 ? formatVND(saving) : null;
  const displayChainDiscountPercent = chainDiscount > 0 ? `${chainDiscount * 100}%` : null;

  // Đồng bộ hóa đơn giá chuẩn xác 100% giữa Giao diện và PDF theo Phương án C (Gia tăng tính minh bạch)
  const unitPriceBeforeDiscount = basePrice + zoneAddon;
  const adjustedBranchPriceValue = Math.round(totalAmount / (paymentCycle === 'yearly' ? 12 : 1) / branches);
  
  const unitDiscountAmount = unitPriceBeforeDiscount - adjustedBranchPriceValue;
  const effectiveDiscountRate = unitPriceBeforeDiscount > 0 ? (unitDiscountAmount / unitPriceBeforeDiscount) : 0;

  // Xác định packageId dựa trên getPackageIdForTier để lấy các tính năng động đồng bộ
  const packageId = getPackageIdForTier(tier);
  const dynamicFeatures = getDynamicFeaturesForPackage(packageId);

  // Render danh sách tính năng dưới dạng dòng HTML
  const featuresHtml = dynamicFeatures
    .map(
      (f) => `
      <div class="feature-item">
        <span class="feature-check">✓</span>
        <span class="feature-text">${f}</span>
      </div>
    `
    )
    .join('');

  // HTML template
  const htmlContent = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${filename}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    /* Reset & Base Styles */
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: 'Inter', sans-serif;
    }
    body {
      color: #1e293b;
      background-color: #f8fafc;
      line-height: 1.5;
      padding: 40px 20px;
    }
    
    /* Container */
    .quote-container {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
      overflow: hidden;
      border: 1px solid #e2e8f0;
    }

    /* Print bar - No print */
    .action-bar {
      max-width: 800px;
      margin: 0 auto 20px auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #1e3a5f;
      padding: 12px 24px;
      border-radius: 8px;
      color: white;
    }
    .action-title {
      font-weight: 600;
      font-size: 15px;
    }
    .btn-print {
      background: #4ade80;
      color: #1e3a5f;
      border: none;
      padding: 8px 18px;
      border-radius: 6px;
      font-weight: 700;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s;
    }
    .btn-print:hover {
      background: #22c55e;
      color: white;
    }

    /* Header */
    .quote-header {
      background: #1e3a5f;
      color: white;
      padding: 40px;
      position: relative;
    }
    .header-logo {
      position: absolute;
      top: 40px;
      right: 40px;
      width: 90px;
      height: 90px;
    }
    .brand-title {
      font-size: 32px;
      font-weight: 800;
      letter-spacing: -0.025em;
      color: #ffffff;
      margin-bottom: 4px;
    }
    .brand-subtitle {
      font-size: 14px;
      color: #4ade80;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 24px;
    }
    .doc-title {
      font-size: 20px;
      font-weight: 700;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      padding-top: 20px;
    }

    /* Meta Grid */
    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      padding: 30px 40px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
    }
    .meta-section-title {
      font-size: 12px;
      text-transform: uppercase;
      font-weight: 700;
      color: #64748b;
      margin-bottom: 12px;
      letter-spacing: 0.05em;
    }
    .meta-item {
      margin-bottom: 6px;
      font-size: 14px;
    }
    .meta-label {
      color: #64748b;
      font-weight: 500;
    }
    .meta-value {
      font-weight: 600;
      color: #1e293b;
    }

    /* Body Details */
    .quote-body {
      padding: 40px;
    }
    .section-heading {
      font-size: 16px;
      font-weight: 700;
      color: #1e3a5f;
      margin-bottom: 16px;
      border-left: 4px solid #4ade80;
      padding-left: 12px;
    }

    /* Pricing Table */
    .price-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    .price-table th {
      background: #f1f5f9;
      color: #475569;
      font-weight: 600;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      text-align: left;
      padding: 12px 16px;
      border-bottom: 2px solid #e2e8f0;
    }
    .price-table td {
      padding: 16px;
      font-size: 14px;
      border-bottom: 1px solid #f1f5f9;
    }
    .price-table tr:last-child td {
      border-bottom: none;
    }
    
    /* Total Box */
    .total-box {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      padding: 24px;
      margin-bottom: 35px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .total-label-wrapper {
      display: flex;
      flex-direction: column;
    }
    .total-title {
      font-size: 14px;
      font-weight: 700;
      color: #166534;
      text-transform: uppercase;
      letter-spacing: 0.025em;
    }
    .total-desc {
      font-size: 12px;
      color: #15803d;
      margin-top: 2px;
    }
    .total-price-wrapper {
      text-align: right;
    }
    .total-price {
      font-size: 28px;
      font-weight: 800;
      color: #1e3a5f;
      line-height: 1;
    }
    .total-price-unit {
      font-size: 14px;
      font-weight: 600;
      color: #64748b;
    }
    .saving-badge {
      display: inline-block;
      background: #22c55e;
      color: white;
      font-size: 11px;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 9999px;
      margin-top: 6px;
    }

    /* Features Grid */
    .features-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 35px;
    }
    .feature-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      font-size: 13.5px;
    }
    .feature-check {
      color: #22c55e;
      font-weight: 800;
      font-size: 16px;
      line-height: 1;
    }
    .feature-text {
      color: #334155;
    }

    /* Terms Section */
    .terms-box {
      background: #f8fafc;
      border-radius: 8px;
      padding: 20px;
      border: 1px solid #e2e8f0;
      font-size: 12px;
      color: #64748b;
    }
    .terms-box ul {
      list-style-type: none;
      padding-left: 0;
    }
    .terms-box li {
      margin-bottom: 6px;
      position: relative;
      padding-left: 14px;
    }
    .terms-box li::before {
      content: "•";
      position: absolute;
      left: 0;
      color: #4ade80;
      font-weight: bold;
    }

    /* Footer */
    .quote-footer {
      background: #1e293b;
      color: #94a3b8;
      padding: 30px 40px;
      font-size: 12px;
      text-align: center;
      border-top: 1px solid #334155;
    }
    .footer-brand {
      font-weight: 700;
      color: white;
      font-size: 14px;
      margin-bottom: 4px;
    }
    .footer-links {
      margin-top: 12px;
      color: #64748b;
    }

    /* Print styling */
    @media print {
      @page {
        size: A4;
        margin: 5mm 8mm;
      }
      body {
        background: white;
        padding: 0 !important;
        margin: 0 !important;
        font-size: 11.5px !important;
        line-height: 1.35 !important;
      }
      .quote-container {
        border: none !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      .action-bar {
        display: none !important;
      }
      .quote-header {
        background: #1e3a5f !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        padding: 18px 25px !important;
      }
      .header-logo {
        top: 15px !important;
        right: 25px !important;
        width: 50px !important;
        height: 50px !important;
      }
      .brand-title {
        font-size: 22px !important;
      }
      .brand-subtitle {
        font-size: 10px !important;
        margin-bottom: 10px !important;
        color: #4ade80 !important;
      }
      .doc-title {
        font-size: 14px !important;
        padding-top: 10px !important;
      }
      .meta-grid {
        padding: 15px 25px !important;
        gap: 20px !important;
        background: #f8fafc !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .meta-section-title {
        font-size: 10px !important;
        margin-bottom: 6px !important;
      }
      .meta-item {
        font-size: 11px !important;
        margin-bottom: 3px !important;
      }
      .quote-body {
        padding: 15px 25px !important;
      }
      .section-heading {
        font-size: 12px !important;
        margin-bottom: 6px !important;
        margin-top: 10px !important;
        padding-left: 8px !important;
      }
      .price-table {
        margin-bottom: 12px !important;
      }
      .price-table th {
        padding: 6px 12px !important;
        font-size: 11px !important;
      }
      .price-table td {
        padding: 6px 12px !important;
        font-size: 11px !important;
      }
      .total-box {
        padding: 12px 20px !important;
        margin-bottom: 12px !important;
        border: 1px solid #166534 !important;
        background: #f0fdf4 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        display: flex !important;
        flex-direction: row !important;
        justify-content: space-between !important;
        align-items: center !important;
      }
      .total-title {
        font-size: 11px !important;
      }
      .total-desc {
        font-size: 9px !important;
      }
      .total-price {
        font-size: 18px !important;
      }
      .saving-badge {
        padding: 2px 8px !important;
        font-size: 9px !important;
        margin-top: 2px !important;
      }
      .features-grid {
        grid-template-columns: 1fr 1fr 1fr !important;
        gap: 6px !important;
        margin-bottom: 12px !important;
      }
      .feature-item {
        font-size: 10px !important;
      }
      .terms-box {
        padding: 10px 15px !important;
        margin-bottom: 0 !important;
      }
      .terms-box li {
        font-size: 9.5px !important;
        margin-bottom: 2px !important;
      }
      .quote-footer {
        background: #1e293b !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        padding: 12px 25px !important;
        margin-top: 10px !important;
      }
      .footer-brand {
        font-size: 11px !important;
      }
      .footer-links {
        margin-top: 4px !important;
        font-size: 9px !important;
      }
    }
  </style>
</head>
<body>

  <!-- Nút Hành động không in -->
  <div class="action-bar no-print">
    <div class="action-title">Hồ sơ Báo giá Bản quyền Nhạc nền AudioBay</div>
    <button class="btn-print" onclick="window.print()">In báo giá / Lưu PDF</button>
  </div>

  <div class="quote-container">
    <!-- Header -->
    <div class="quote-header">
      <div class="brand-title">${activeCompany.name}</div>
      <div class="brand-subtitle">Nhạc nền bản quyền cho doanh nghiệp Việt</div>
      <div class="doc-title">BÁO GIÁ GIẢI PHÁP ÂM THANH DÀNH RIÊNG CHO ${customerInfo.company.toUpperCase()}</div>
    </div>

    <!-- Metadata -->
    <div class="meta-grid">
      <div>
        <div class="meta-section-title">Khách hàng</div>
        <div class="meta-item">
          <span class="meta-label">Người đại diện:</span>
          <span class="meta-value">${customerInfo.name || 'Chưa cung cấp'}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Doanh nghiệp:</span>
          <span class="meta-value">${customerInfo.company}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Điện thoại:</span>
          <span class="meta-value">${customerInfo.phone || 'Chưa cung cấp'}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Email:</span>
          <span class="meta-value">${customerInfo.email || 'Chưa cung cấp'}</span>
        </div>
      </div>
      <div>
        <div class="meta-section-title">Thông tin báo giá</div>
        <div class="meta-item">
          <span class="meta-label">Mã báo giá:</span>
          <span class="meta-value">${quoteCode}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Ngày lập:</span>
          <span class="meta-value">${quoteDate}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Hiệu lực đến:</span>
          <span class="meta-value">${validUntil}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Đơn vị lập:</span>
          <span class="meta-value">Phòng Kinh Doanh AudioBay</span>
        </div>
      </div>
    </div>

    <!-- Body -->
    <div class="quote-body">
      <!-- Cấu hình chi tiết -->
      <div class="section-heading">Chi tiết gói giải pháp</div>
      <table class="price-table">
        <thead>
          <tr>
            <th>Hạng mục</th>
            <th>Cấu hình áp dụng</th>
            <th style="text-align: right;">Đơn giá gốc</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Loại hình kinh doanh</strong></td>
            <td>${category.name}</td>
            <td style="text-align: right;">—</td>
          </tr>
          <tr>
            <td><strong>Gói dịch vụ chính</strong></td>
            <td>Gói <strong>${tier.name}</strong> (${category.inputType === 'area' ? 'Diện tích' : 'Số phòng'}: ${tier.area})</td>
            <td style="text-align: right;">${displayBasePrice}/tháng</td>
          </tr>
          <tr>
            <td><strong>Khu vực phát nhạc (Zones)</strong></td>
            <td>${totalZones} Zones (Bao gồm ${tier.zones} zone tiêu chuẩn và ${extraZones} zone thêm)</td>
            <td style="text-align: right;">+ ${displayZoneAddon}/tháng</td>
          </tr>
          <tr>
            <td><strong>Số lượng địa điểm</strong></td>
            <td>${branches} địa điểm</td>
            <td style="text-align: right;">—</td>
          </tr>
          <tr>
            <td><strong>Hình thức thanh toán</strong></td>
            <td>Thanh toán <strong>Hàng ${cycleLabel}</strong></td>
            <td style="text-align: right;">—</td>
          </tr>
          ${
            unitDiscountAmount > 0
              ? `
          <tr>
            <td><strong>Tổng ưu đãi tích lũy</strong></td>
            <td>Áp dụng giảm kép đặc biệt (${paymentCycle === 'yearly' ? 'Gói Năm' : ''}${paymentCycle === 'yearly' && chainDiscount > 0 ? ' + ' : ''}${chainDiscount > 0 ? `Chuỗi ${branches} địa điểm` : ''}${params.contractBonusPercent ? ` + Cam kết ${params.contractBonusPercent}%` : ''}) - Tiết kiệm ~${Math.round(effectiveDiscountRate * 100)}%</td>
            <td style="text-align: right; color: #22c55e; font-weight: bold;">-${formatVND(unitDiscountAmount)}/tháng</td>
          </tr>
          `
              : ''
          }
          <tr>
            <td><strong>Đơn giá sau chiết khấu</strong></td>
            <td>Đơn giá thuê bao thực tế áp dụng cho từng địa điểm</td>
            <td style="text-align: right; font-weight: bold; color: #1e3a5f;">${formatVND(adjustedBranchPriceValue)}/tháng</td>
          </tr>
          ${
            params.selectedAddons && params.selectedAddons.length > 0
              ? params.selectedAddons.map(add => `
          <tr>
            <td><strong>Dịch vụ thêm: ${add.service}</strong></td>
            <td>Bổ sung vào giải pháp</td>
            <td style="text-align: right;">+ ${formatVND(add.price)}${add.isMonthly ? '/tháng' : ''}</td>
          </tr>
          `).join('')
              : ''
          }
        </tbody>
      </table>

      <!-- Tổng tiền -->
      <div class="total-box">
        <div class="total-label-wrapper">
          <div class="total-title">TỔNG GIÁ TRỊ THANH TOÁN</div>
          <div class="total-desc">Chi phí trọn gói bản quyền và hạ tầng vận hành</div>
        </div>
        <div class="total-price-wrapper">
          ${
            saving > 0
              ? `
            <div style="font-size: 13px; text-decoration: line-through; color: #94a3b8; font-weight: 500; margin-bottom: 2px; font-family: monospace;">
              ${formatVND(totalAmount + saving)}
            </div>
          `
              : ''
          }
          <div class="total-price">
            ${displayTotalAmount}
            <span class="total-price-unit">${cycleUnit}</span>
          </div>
          ${
            displaySaving
              ? `
            <div class="saving-badge">Ưu đãi kép tích lũy ${displaySaving} (${Math.round(saving / (totalAmount + saving) * 100)}%)</div>
          `
              : ''
          }
        </div>
      </div>

      <!-- Tính năng -->
      <div class="section-heading">Danh sách tính năng đi kèm</div>
      <div class="features-grid">
        ${featuresHtml}
      </div>

      <!-- Ghi chú của khách hàng nếu có -->
      ${
        customerInfo.notes
          ? `
        <div class="section-heading" style="margin-top: 30px;">Ghi chú bổ sung</div>
        <div style="font-size: 13.5px; color: #475569; background: #f1f5f9; padding: 16px; border-radius: 8px; margin-bottom: 35px; font-style: italic;">
          "${customerInfo.notes}"
        </div>
      `
          : ''
      }

      <!-- Điều khoản -->
      <div class="section-heading">Lưu ý & Điều khoản sử dụng</div>
      <div class="terms-box">
        <ul>
          <li>Đơn giá trên chưa bao gồm thuế giá trị gia tăng (VAT).</li>
          <li>Giá bản quyền đã bao gồm quyền truyền tải tác phẩm âm nhạc đến công chúng trong không gian kinh doanh được cấp phép.</li>
          <li>Báo giá có hiệu lực trong vòng 30 ngày kể từ ngày lập. Sau thời gian này, vui lòng liên hệ lại để cập nhật chính sách giá mới nhất.</li>
          <li>Ứng dụng hoạt động mượt mà trên các thiết bị chạy Android, iOS, Windows, macOS hoặc tích hợp trực tiếp qua trình duyệt web.</li>
          <li>Hỗ trợ kỹ thuật trực tuyến và cập nhật playlist miễn phí liên tục trong suốt thời gian hiệu lực của hợp đồng.</li>
        </ul>
      </div>
    </div>

    <!-- Footer -->
    <div class="quote-footer">
      <div class="footer-brand">${activeCompany.name} — Nhạc nền bản quyền cho doanh nghiệp Việt</div>
      <div>Hotline: ${activeCompany.phone} | Email: ${activeCompany.email} | Website: ${activeCompany.website}</div>
      <div class="footer-links">Bản quyền phần mềm và nội dung thuộc sở hữu của AudioBay.vn</div>
    </div>
  </div>

  <script>
    // Tự động mở cửa sổ in ấn khi load trang xong
    window.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        window.print();
      }, 500);
    });
  </script>
</body>
</html>
  `;

  // Tạo Blob và mở tab mới
  try {
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const newWindow = window.open(blobUrl, '_blank');
    if (!newWindow) {
      // Fallback: download file
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${filename}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Giải phóng URL sau 10s
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 10000);
    }
  } catch (error) {
    console.error('Lỗi khi xuất PDF:', error);
    alert('Không thể xuất báo giá PDF. Vui lòng kiểm tra quyền mở popup của trình duyệt.');
  }
}

/**
 * Xuất báo giá từ phân tích AI dưới dạng trang HTML in ấn chuyên nghiệp (In sang PDF)
 */
export function exportAICustomQuoteToPDF(params: any) {
  const {
    modelName,
    matchedCategoryName,
    locationsCount,
    inputValue,
    inputLabel,
    zones,
    basePriceMonthly,
    addonPriceMonthly,
    totalPriceMonthly,
    totalPriceYearly,
    savingsYearly,
    packageTier,
    features,
    analysisText,
    customerInfo,
    quoteDate,
    validUntil,
    company,
  } = params;

  const activeCompany = company || COMPANY;

  const quoteCode = `AB-AI-${Math.floor(100000 + Math.random() * 900000)}`;
  const filename = `BaoGia_AudioBay_${getFormattedFilename(customerInfo.company)}_${quoteCode}`;

  // Định dạng các giá trị tiền tệ
  const displayBasePrice = formatVND(basePriceMonthly);
  const displayZoneAddon = addonPriceMonthly > 0 ? formatVND(addonPriceMonthly) : '0 VNĐ';
  const displayTotalMonthly = formatVND(totalPriceMonthly);
  const displayTotalYearly = formatVND(totalPriceYearly);
  const displaySaving = savingsYearly > 0 ? formatVND(savingsYearly) : null;

  // Xác định packageId dựa trên packageTier (STARTER, BUSINESS, PROFESSIONAL, ENTERPRISE) để lấy các tính năng động đồng bộ
  let packageId: 'starter' | 'business' | 'professional' | 'enterprise' = 'starter';
  const packageTierLower = (packageTier || '').toLowerCase();
  const featuresList = features || [];

  const hasEnterpriseFeature = featuresList.some((f: string) => f.includes('SLA') || f.includes('Account Manager') || f.includes('24/7'));
  const hasProfessionalFeature = featuresList.some((f: string) => f.includes('multi-zone') || f.includes('ưu tiên'));
  const hasBusinessFeature = featuresList.some((f: string) => f.includes('App quản lý') || f.includes('Dashboard web') || f.includes('Lập lịch') || f.includes('Playlist'));

  if (packageTierLower.includes('enterprise') || hasEnterpriseFeature) {
    packageId = 'enterprise';
  } else if (packageTierLower.includes('professional') || packageTierLower.includes('premium') || hasProfessionalFeature) {
    packageId = 'professional';
  } else if (packageTierLower.includes('business') || hasBusinessFeature) {
    packageId = 'business';
  } else {
    packageId = 'starter';
  }
  const dynamicFeatures = getDynamicFeaturesForPackage(packageId);

  // Render danh sách tính năng
  const featuresHtml = dynamicFeatures
    .map(
      (f: string) => `
      <div class="feature-item">
        <span class="feature-check">✓</span>
        <span class="feature-text">${f}</span>
      </div>
    `
    )
    .join('');

  // HTML template
  const htmlContent = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${filename}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    /* Reset & Base Styles */
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: 'Inter', sans-serif;
    }
    body {
      color: #1e293b;
      background-color: #f8fafc;
      line-height: 1.5;
      padding: 40px 20px;
    }
    
    /* Container */
    .quote-container {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
      overflow: hidden;
      border: 1px solid #e2e8f0;
    }

    /* Print bar - No print */
    .action-bar {
      max-width: 800px;
      margin: 0 auto 20px auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #1e3a5f;
      padding: 12px 24px;
      border-radius: 8px;
      color: white;
    }
    .action-title {
      font-weight: 600;
      font-size: 15px;
    }
    .btn-print {
      background: #4ade80;
      color: #1e3a5f;
      border: none;
      padding: 8px 18px;
      border-radius: 6px;
      font-weight: 700;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s;
    }
    .btn-print:hover {
      background: #22c55e;
      color: white;
    }

    /* Header */
    .quote-header {
      background: #1e3a5f;
      color: white;
      padding: 40px;
      position: relative;
    }
    .header-logo {
      position: absolute;
      top: 40px;
      right: 40px;
      width: 90px;
      height: 90px;
    }
    .brand-title {
      font-size: 32px;
      font-weight: 800;
      letter-spacing: -0.025em;
      color: #ffffff;
      margin-bottom: 4px;
    }
    .brand-subtitle {
      font-size: 14px;
      color: #4ade80;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 24px;
    }
    .doc-title {
      font-size: 20px;
      font-weight: 700;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      padding-top: 20px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .badge-ai {
      background: #4ade80;
      color: #1e3a5f;
      font-size: 10px;
      padding: 3px 8px;
      border-radius: 9999px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    /* Meta Grid */
    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      padding: 30px 40px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
    }
    .meta-section-title {
      font-size: 12px;
      text-transform: uppercase;
      font-weight: 700;
      color: #64748b;
      margin-bottom: 12px;
      letter-spacing: 0.05em;
    }
    .meta-item {
      margin-bottom: 6px;
      font-size: 14px;
    }
    .meta-label {
      color: #64748b;
      font-weight: 500;
    }
    .meta-value {
      font-weight: 600;
      color: #1e293b;
    }

    /* Body Details */
    .quote-body {
      padding: 40px;
    }
    .section-heading {
      font-size: 16px;
      font-weight: 700;
      color: #1e3a5f;
      margin-bottom: 16px;
      border-left: 4px solid #4ade80;
      padding-left: 12px;
    }

    /* Info Card */
    .model-info-card {
      background: #f0f4ff;
      border: 1px solid #dbeafe;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 30px;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }
    .info-block-title {
      font-size: 11px;
      text-transform: uppercase;
      font-weight: 700;
      color: #2563eb;
      letter-spacing: 0.05em;
      margin-bottom: 4px;
    }
    .info-block-val {
      font-size: 15px;
      font-weight: 700;
      color: #1e293b;
    }

    /* AI Analysis Box */
    .ai-analysis-box {
      font-size: 13.5px;
      line-height: 1.6;
      color: #334155;
      background: #f8fafc;
      border: 1px dashed #cbd5e1;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
    }

    /* Pricing Table */
    .price-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    .price-table th {
      background: #f1f5f9;
      color: #475569;
      font-weight: 600;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      text-align: left;
      padding: 12px 16px;
      border-bottom: 2px solid #e2e8f0;
    }
    .price-table td {
      padding: 16px;
      font-size: 14px;
      border-bottom: 1px solid #f1f5f9;
    }
    .price-table tr:last-child td {
      border-bottom: none;
    }
    
    /* Total Box */
    .total-box {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      padding: 24px;
      margin-bottom: 35px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .total-label-wrapper {
      display: flex;
      flex-direction: column;
    }
    .total-title {
      font-size: 14px;
      font-weight: 700;
      color: #166534;
      text-transform: uppercase;
      letter-spacing: 0.025em;
    }
    .total-desc {
      font-size: 12px;
      color: #15803d;
      margin-top: 2px;
    }
    .total-price-wrapper {
      text-align: right;
    }
    .total-price {
      font-size: 28px;
      font-weight: 800;
      color: #1e3a5f;
      line-height: 1;
    }
    .total-price-unit {
      font-size: 14px;
      font-weight: 600;
      color: #64748b;
    }
    .saving-badge {
      display: inline-block;
      background: #22c55e;
      color: white;
      font-size: 11px;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 9999px;
      margin-top: 6px;
    }

    /* Features Grid */
    .features-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 35px;
    }
    .feature-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      font-size: 13.5px;
    }
    .feature-check {
      color: #22c55e;
      font-weight: 800;
      font-size: 16px;
      line-height: 1;
    }
    .feature-text {
      color: #334155;
    }

    /* Terms & Notes */
    .terms-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 40px;
    }
    .terms-box ul {
      list-style-type: none;
    }
    .terms-box li {
      position: relative;
      padding-left: 18px;
      font-size: 12px;
      color: #475569;
      margin-bottom: 8px;
    }
    .terms-box li:last-child {
      margin-bottom: 0;
    }
    .terms-box li::before {
      content: "•";
      color: #94a3b8;
      font-weight: bold;
      position: absolute;
      left: 0;
      top: 0;
    }

    /* Footer */
    .quote-footer {
      background: #0f172a;
      color: #94a3b8;
      padding: 40px;
      text-align: center;
      font-size: 12px;
    }
    .footer-brand {
      color: white;
      font-weight: 700;
      margin-bottom: 6px;
      font-size: 14px;
    }
    .footer-links {
      margin-top: 12px;
      color: #64748b;
      font-size: 11px;
    }

    /* Page break for printing */
    @media print {
      @page {
        size: A4;
        margin: 5mm 8mm;
      }
      body {
        background: white;
        padding: 0 !important;
        margin: 0 !important;
        font-size: 11px !important;
        line-height: 1.3 !important;
      }
      .quote-container {
        border: none !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      .action-bar {
        display: none !important;
      }
      .quote-header {
        background: #1e3a5f !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        padding: 15px 25px !important;
      }
      .header-logo {
        top: 15px !important;
        right: 25px !important;
        width: 50px !important;
        height: 50px !important;
      }
      .brand-title {
        font-size: 20px !important;
      }
      .brand-subtitle {
        font-size: 9px !important;
        margin-bottom: 8px !important;
      }
      .doc-title {
        font-size: 13px !important;
        padding-top: 8px !important;
      }
      .badge-ai {
        font-size: 9px !important;
        padding: 2px 6px !important;
      }
      .meta-grid {
        padding: 12px 25px !important;
        gap: 15px !important;
        background: #f8fafc !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .meta-section-title {
        font-size: 9px !important;
        margin-bottom: 4px !important;
      }
      .meta-item {
        font-size: 10.5px !important;
        margin-bottom: 2px !important;
      }
      .quote-body {
        padding: 12px 25px !important;
      }
      .section-heading {
        font-size: 11px !important;
        margin-bottom: 4px !important;
        margin-top: 8px !important;
        padding-left: 6px !important;
      }
      .model-info-card {
        padding: 10px 15px !important;
        margin-bottom: 10px !important;
        gap: 8px !important;
        background: #f0f4ff !important;
        border: 1px solid #dbeafe !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .info-block-title {
        font-size: 9px !important;
      }
      .info-block-val {
        font-size: 11.5px !important;
      }
      .ai-analysis-box {
        font-size: 10px !important;
        line-height: 1.35 !important;
        padding: 8px 12px !important;
        margin-bottom: 10px !important;
        background: #f8fafc !important;
        border: 1px dashed #cbd5e1 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .price-table {
        margin-bottom: 10px !important;
      }
      .price-table th {
        padding: 5px 10px !important;
        font-size: 10px !important;
      }
      .price-table td {
        padding: 5px 10px !important;
        font-size: 10.5px !important;
      }
      .total-box {
        padding: 10px 15px !important;
        margin-bottom: 10px !important;
        background: #f0fdf4 !important;
        border: 1px solid #bbf7d0 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        display: flex !important;
        flex-direction: row !important;
        justify-content: space-between !important;
        align-items: center !important;
      }
      .total-title {
        font-size: 10px !important;
      }
      .total-desc {
        font-size: 8.5px !important;
      }
      .total-price {
        font-size: 16px !important;
      }
      .saving-badge {
        padding: 2px 6px !important;
        font-size: 8.5px !important;
        margin-top: 2px !important;
      }
      .features-grid {
        grid-template-columns: 1fr 1fr 1fr !important;
        gap: 5px !important;
        margin-bottom: 10px !important;
      }
      .feature-item {
        font-size: 9.5px !important;
      }
      .terms-box {
        padding: 8px 12px !important;
        margin-bottom: 0 !important;
      }
      .terms-box li {
        font-size: 9px !important;
        margin-bottom: 2px !important;
      }
      .quote-footer {
        background: #0f172a !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        padding: 10px 25px !important;
        margin-top: 8px !important;
      }
      .footer-brand {
        font-size: 10.5px !important;
      }
      .footer-links {
        margin-top: 3px !important;
        font-size: 8.5px !important;
      }
    }
  </style>
</head>
<body>

  <!-- Nút Thao tác đầu trang -->
  <div class="action-bar">
    <div class="action-title">Hồ sơ báo giá này đã sẵn sàng để in hoặc lưu thành file PDF</div>
    <button class="btn-print" onclick="window.print()">In / Lưu PDF</button>
  </div>

  <div class="quote-container">
    <!-- Header -->
    <div class="quote-header">
      <div class="brand-title">${activeCompany.name}</div>
      <div class="brand-subtitle">Nhạc nền bản quyền cho doanh nghiệp Việt</div>
      <div class="doc-title">BÁO GIÁ GIẢI PHÁP ÂM THANH DÀNH RIÊNG CHO ${customerInfo.company.toUpperCase()}</div>
    </div>

    <!-- Meta Grid -->
    <div class="meta-grid">
      <div>
        <div class="meta-section-title">Khách hàng</div>
        <div class="meta-item">
          <span class="meta-label">Người đại diện:</span>
          <span class="meta-value">${customerInfo.name || 'Chưa cung cấp'}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Doanh nghiệp:</span>
          <span class="meta-value">${customerInfo.company}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Điện thoại:</span>
          <span class="meta-value">${customerInfo.phone || 'Chưa cung cấp'}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Email:</span>
          <span class="meta-value">${customerInfo.email || 'Chưa cung cấp'}</span>
        </div>
      </div>
      <div>
        <div class="meta-section-title">Thông tin báo giá</div>
        <div class="meta-item">
          <span class="meta-label">Mã báo giá:</span>
          <span class="meta-value">${quoteCode}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Ngày lập:</span>
          <span class="meta-value">${quoteDate}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Hiệu lực đến:</span>
          <span class="meta-value">${validUntil}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Phương thức tư vấn:</span>
          <span class="meta-value" style="color: #10b981;">Setup riêng theo mô hình</span>
        </div>
      </div>
    </div>

    <!-- Body -->
    <div class="quote-body">
      <!-- Thông tin mô hình đặc thù -->
      <div class="section-heading">Chi tiết gói giải pháp</div>
      <div class="model-info-card">
        <div style="grid-column: span 2">
          <div class="info-block-title">Mô hình kinh doanh</div>
          <div class="info-block-val">${modelName}</div>
        </div>
        <div>
          <div class="info-block-title">Loại hình kinh doanh</div>
          <div class="info-block-val">${matchedCategoryName}</div>
        </div>
        <div>
          <div class="info-block-title">Số lượng địa điểm</div>
          <div class="info-block-val">${locationsCount || 1} ${locationsCount && locationsCount > 1 ? 'chi nhánh' : 'địa điểm'}</div>
        </div>
        <div>
          <div class="info-block-title">Quy mô đo đạc</div>
          <div class="info-block-val">${inputValue} ${inputLabel}</div>
        </div>
        <div>
          <div class="info-block-title">Khu vực phát nhạc (Zones)</div>
          <div class="info-block-val">${zones} Zones độc lập</div>
        </div>
      </div>

      <!-- Phân tích AI -->
      <div class="section-heading">Nhận định & Đề xuất giải pháp</div>
      <div class="ai-analysis-box">
        ${analysisText}
      </div>

      <!-- Bảng phí -->
      <div class="section-heading">Bảng phân tích chi tiết chi phí bản quyền</div>
      <table class="price-table">
        <thead>
          <tr>
            <th style="width: 55%">Nội dung bản quyền</th>
            <th style="width: 25%; text-align: right">Đơn giá / tháng</th>
            <th style="width: 20%; text-align: right">Thành tiền / tháng</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>Phí bản quyền gói chuẩn (${packageTier})</strong><br>
              <span style="font-size: 12px; color: #64748b;">Áp dụng cho quy mô dưới ${inputValue} ${inputLabel}</span>
            </td>
            <td style="text-align: right; font-weight: 500;">${displayBasePrice}</td>
            <td style="text-align: right; font-weight: 600; color: #1e293b;">${displayBasePrice}</td>
          </tr>
          ${
            addonPriceMonthly > 0
              ? `
          <tr>
            <td>
              <strong>Phí bổ sung khu vực (Extra zones)</strong><br>
              <span style="font-size: 12px; color: #64748b;">Hỗ trợ phân chia thêm vùng âm thanh theo yêu cầu của mô hình</span>
            </td>
            <td style="text-align: right; font-weight: 500;">${formatVND(addonPriceMonthly)}</td>
            <td style="text-align: right; font-weight: 600; color: #1e293b;">${formatVND(addonPriceMonthly)}</td>
          </tr>
          `
              : ''
          }
        </tbody>
      </table>

      <!-- Hộp tổng kết thanh toán -->
      <div class="total-box">
        <div class="total-label-wrapper">
          <div class="total-title">Tổng chi phí thanh toán năm</div>
          <div class="total-desc">Thanh toán trọn gói 1 năm (Áp dụng chiết khấu 17% tối ưu)</div>
        </div>
        <div class="total-price-wrapper">
          ${
            savingsYearly > 0
              ? `
            <div style="font-size: 13px; text-decoration: line-through; color: #94a3b8; font-weight: 500; margin-bottom: 2px; font-family: monospace;">
              ${formatVND(totalPriceYearly + savingsYearly)}
            </div>
          `
              : ''
          }
          <div class="total-price">
            ${displayTotalYearly}
            <span class="total-price-unit">/năm</span>
          </div>
          ${
            displaySaving
              ? `
            <div class="saving-badge">Ưu đãi kép tích lũy ${displaySaving} (${Math.round(savingsYearly / (totalPriceYearly + savingsYearly) * 100)}%)</div>
          `
              : ''
          }
        </div>
      </div>

      <!-- Tính năng -->
      <div class="section-heading">Danh sách tính năng công nghệ & Pháp lý đi kèm</div>
      <div class="features-grid">
        ${featuresHtml}
      </div>

      <!-- Ghi chú của khách hàng nếu có -->
      ${
        customerInfo.notes
          ? `
        <div class="section-heading" style="margin-top: 30px;">Ghi chú & Yêu cầu của khách hàng</div>
        <div style="font-size: 13.5px; color: #475569; background: #f1f5f9; padding: 16px; border-radius: 8px; margin-bottom: 35px; font-style: italic;">
          "${customerInfo.notes}"
        </div>
      `
          : ''
      }

      <!-- Điều khoản -->
      <div class="section-heading">Lưu ý & Điều khoản sử dụng bản quyền</div>
      <div class="terms-box">
        <ul>
          <li>Đơn giá trên chưa bao gồm thuế giá trị gia tăng (VAT).</li>
          <li>Giá bản quyền đã bao gồm quyền truyền tải tác phẩm âm nhạc đến công chúng trong không gian kinh doanh được cấp phép bởi AudioBay.</li>
          <li>Báo giá có hiệu lực trong vòng 30 ngày kể từ ngày lập. Sau thời gian này, vui lòng liên hệ lại để cập nhật chính sách giá mới nhất.</li>
          <li>Ứng dụng hoạt động mượt mà trên các thiết bị chạy Android, iOS, Windows, macOS hoặc tích hợp trực tiếp qua trình duyệt web.</li>
          <li>Hỗ trợ kỹ thuật trực tuyến và cập nhật danh sách bài hát (playlist) thương mại liên tục trong suốt thời hạn hợp đồng.</li>
        </ul>
      </div>
    </div>

    <!-- Footer -->
    <div class="quote-footer">
      <div class="footer-brand">${activeCompany.name} — Nhạc nền bản quyền cho doanh nghiệp Việt</div>
      <div>Hotline: ${activeCompany.phone} | Email: ${activeCompany.email} | Website: ${activeCompany.website}</div>
      <div class="footer-links">Bản quyền phần mềm và nội dung thuộc sở hữu của AudioBay.vn</div>
    </div>
  </div>

  <script>
    // Tự động mở cửa sổ in ấn khi load trang xong
    window.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        window.print();
      }, 500);
    });
  </script>
</body>
</html>
  `;

  // Tạo Blob và mở tab mới
  try {
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const newWindow = window.open(blobUrl, '_blank');
    if (!newWindow) {
      // Fallback: download file
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${filename}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Giải phóng URL sau 10s
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 10000);
    }
  } catch (error) {
    console.error('Lỗi khi xuất PDF:', error);
    alert('Không thể xuất báo giá PDF. Vui lòng kiểm tra quyền mở popup của trình duyệt.');
  }
}

