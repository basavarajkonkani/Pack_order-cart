import { Order } from '@/context/CartContext';
import { fetchBusinessSettings, BusinessSettings } from './businessSettings';

export interface InvoiceData {
  order: Order;
  businessSettings: BusinessSettings;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
}

/**
 * Generates a simple HTML invoice for GST compliance
 */
export async function generateInvoiceHTML(invoiceData: InvoiceData): Promise<string> {
  const { order, businessSettings, customerName, customerEmail, customerPhone } = invoiceData;
  
  const invoiceDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const itemsHTML = order.items.map((item, index) => {
    const itemName = item.kind === 'stock' 
      ? item.productName || 'Stock Pouch'
      : `${item.pouchType ? item.pouchType.charAt(0).toUpperCase() + item.pouchType.slice(1) : ''} Pouch`;
    
    const itemSpec = item.kind === 'stock'
      ? [item.sizeLabel, item.sizeWeight].filter(Boolean).join(' · ')
      : [
          item.windowOption === 'with' ? 'With Window' : 'No Window',
          item.materialType === 'metalised' ? 'Metalised' : item.materialType === 'non-metalised' ? 'Non-Metalised' : null,
          item.capacity
        ].filter(Boolean).join(' · ');

    return `
      <tr>
        <td style="padding: 10px 6px; border-bottom: 1px solid #e5e7eb;">${index + 1}</td>
        <td style="padding: 10px 6px; border-bottom: 1px solid #e5e7eb;">
          <strong>${itemName}</strong>
          ${itemSpec ? `<br><small style="color: #6b7280;">${itemSpec}</small>` : ''}
        </td>
        <td style="padding: 10px 6px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px 6px; border-bottom: 1px solid #e5e7eb; text-align: right; white-space: nowrap;">₹${item.price.toLocaleString('en-IN')}</td>
      </tr>
    `;
  }).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=2.0, user-scalable=yes">
  <title>Tax Invoice - ${order.orderId}</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    html {
      -webkit-text-size-adjust: 100%;
      width: 100%;
      height: 100%;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      margin: 0;
      padding: 8px;
      background: #f9fafb;
      width: 100%;
      min-height: 100vh;
      overflow-x: hidden;
      -webkit-font-smoothing: antialiased;
    }
    .invoice {
      width: 100%;
      max-width: 900px;
      margin: 0 auto;
      background: white;
      padding: 16px;
      border: 1px solid #e5e7eb;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      overflow-x: hidden;
      word-wrap: break-word;
    }
    @media (min-width: 769px) {
      body {
        padding: 20px;
      }
      .invoice {
        padding: 40px;
      }
    }
    @media (max-width: 768px) {
      body {
        padding: 6px;
      }
      .invoice {
        padding: 12px;
      }
      .totals {
        max-width: 100%;
        padding: 0;
      }
      .totals-row {
        font-size: 13px;
      }
      .grand-total .amount {
        font-size: 16px !important;
      }
    }
    @media (max-width: 480px) {
      body {
        padding: 4px;
      }
      .invoice {
        padding: 10px;
      }
    }
    .header {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 2px solid #3b82f6;
    }
    @media (min-width: 600px) {
      .header {
        flex-direction: row;
        justify-content: space-between;
        align-items: start;
        margin-bottom: 30px;
        padding-bottom: 20px;
        gap: 15px;
      }
    }
    .company-info h1 {
      margin: 0 0 4px 0;
      font-size: 18px;
      color: #1f2937;
      line-height: 1.3;
    }
    @media (min-width: 600px) {
      .company-info h1 {
        font-size: 28px;
        margin-bottom: 5px;
      }
    }
    .company-info p {
      margin: 2px 0;
      color: #6b7280;
      font-size: 12px;
      line-height: 1.4;
    }
    @media (min-width: 600px) {
      .company-info p {
        font-size: 14px;
      }
    }
    .invoice-meta {
      text-align: left;
    }
    @media (min-width: 600px) {
      .invoice-meta {
        text-align: right;
      }
    }
    .invoice-meta h2 {
      margin: 0 0 8px 0;
      font-size: 18px;
      color: #3b82f6;
      line-height: 1.3;
    }
    @media (min-width: 600px) {
      .invoice-meta h2 {
        font-size: 24px;
        margin-bottom: 10px;
      }
    }
    .invoice-meta p {
      margin: 2px 0;
      color: #6b7280;
      font-size: 12px;
      line-height: 1.4;
    }
    @media (min-width: 600px) {
      .invoice-meta p {
        font-size: 14px;
        margin: 3px 0;
      }
    }
    .parties {
      display: flex;
      flex-direction: column;
      margin-bottom: 16px;
      gap: 12px;
    }
    @media (min-width: 600px) {
      .parties {
        flex-direction: row;
        justify-content: space-between;
        margin-bottom: 30px;
        gap: 20px;
      }
    }
    .party-box {
      flex: 1;
      padding: 12px;
      background: #f9fafb;
      border-radius: 6px;
      border: 1px solid #e5e7eb;
    }
    @media (min-width: 600px) {
      .party-box {
        padding: 20px;
        border-radius: 8px;
      }
    }
    .party-box h3 {
      margin: 0 0 10px 0;
      font-size: 11px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 600;
    }
    @media (min-width: 600px) {
      .party-box h3 {
        font-size: 14px;
        margin-bottom: 12px;
      }
    }
    .party-box p {
      margin: 3px 0;
      color: #1f2937;
      font-size: 12px;
      word-wrap: break-word;
      line-height: 1.5;
    }
    @media (min-width: 600px) {
      .party-box p {
        font-size: 14px;
        margin: 4px 0;
      }
    }
    .party-box .gstin {
      font-family: 'Courier New', Courier, monospace;
      font-weight: bold;
      color: #3b82f6;
      font-size: 11px;
      word-break: break-all;
      display: inline-block;
      max-width: 100%;
    }
    @media (min-width: 600px) {
      .party-box .gstin {
        font-size: 13px;
      }
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
      font-size: 11px;
      table-layout: fixed;
    }
    @media (min-width: 600px) {
      table {
        margin-bottom: 30px;
        font-size: 14px;
        table-layout: auto;
      }
    }
    th {
      background: #f3f4f6;
      padding: 8px 4px;
      text-align: left;
      font-size: 10px;
      color: #374151;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      border-bottom: 2px solid #e5e7eb;
      font-weight: 600;
    }
    @media (min-width: 600px) {
      th {
        padding: 12px 8px;
        font-size: 13px;
        letter-spacing: 0.5px;
      }
    }
    th:last-child, td:last-child {
      text-align: right;
    }
    td {
      padding: 8px 4px;
      font-size: 11px;
      color: #1f2937;
      word-wrap: break-word;
    }
    @media (min-width: 600px) {
      td {
        padding: 12px 8px;
        font-size: 14px;
      }
    }
    td small {
      font-size: 10px;
      line-height: 1.3;
      display: block;
      margin-top: 2px;
    }
    @media (min-width: 600px) {
      td small {
        font-size: 12px;
      }
    }
    .totals {
      margin-left: auto;
      width: 100%;
      max-width: 100%;
      padding: 0;
    }
    @media (min-width: 600px) {
      .totals {
        max-width: 350px;
        padding: 0 10px;
      }
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 7px 0;
      font-size: 12px;
      gap: 12px;
    }
    @media (min-width: 600px) {
      .totals-row {
        padding: 10px 0;
        font-size: 14px;
        gap: 20px;
      }
    }
    .totals-row.subtotal {
      color: #6b7280;
    }
    .totals-row.gst {
      color: #6b7280;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 10px;
    }
    .totals-row.grand-total {
      font-size: 14px;
      font-weight: bold;
      color: #1f2937;
      padding-top: 10px;
    }
    @media (min-width: 600px) {
      .totals-row.grand-total {
        font-size: 18px;
        padding-top: 12px;
      }
    }
    .grand-total .amount {
      color: #3b82f6;
      font-size: 16px;
    }
    @media (min-width: 600px) {
      .grand-total .amount {
        font-size: 22px;
      }
    }
    .footer {
      margin-top: 20px;
      padding-top: 12px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 10px;
      line-height: 1.5;
    }
    @media (min-width: 600px) {
      .footer {
        margin-top: 40px;
        padding-top: 20px;
        font-size: 12px;
      }
    }
    .notes {
      margin-top: 16px;
      padding: 10px;
      background: #fef3c7;
      border-left: 3px solid #f59e0b;
      border-radius: 4px;
    }
    @media (min-width: 600px) {
      .notes {
        margin-top: 30px;
        padding: 15px;
        border-left-width: 4px;
      }
    }
    .notes p {
      margin: 0;
      color: #92400e;
      font-size: 11px;
      line-height: 1.5;
    }
    @media (min-width: 600px) {
      .notes p {
        font-size: 13px;
      }
    }
    @media print {
      body {
        background: white;
        padding: 0;
      }
      .invoice {
        box-shadow: none;
        border: none;
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="header">
      <div class="company-info">
        <h1>${businessSettings.businessName}</h1>
        <p><strong>${businessSettings.legalName}</strong></p>
        <p>${businessSettings.address}</p>
        <p>${businessSettings.city}, ${businessSettings.state} - ${businessSettings.pincode}</p>
        <p style="margin-top: 10px;">GSTIN: <span class="gstin">${businessSettings.gstin}</span></p>
      </div>
      <div class="invoice-meta">
        <h2>TAX INVOICE</h2>
        <p><strong>Invoice No:</strong> ${order.orderId}</p>
        <p><strong>Date:</strong> ${invoiceDate}</p>
        <p><strong>Status:</strong> ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</p>
      </div>
    </div>

    <div class="parties">
      <div class="party-box">
        <h3>Bill To</h3>
        ${customerName ? `<p><strong>${customerName}</strong></p>` : ''}
        ${customerEmail ? `<p>${customerEmail}</p>` : ''}
        ${customerPhone ? `<p>Phone: ${customerPhone}</p>` : ''}
        <p style="margin-top: 8px;">${order.address.replace(/\n/g, '<br>')}</p>
        ${order.gstNumber ? `<p style="margin-top: 8px;">GSTIN: <span class="gstin">${order.gstNumber}</span></p>` : ''}
      </div>
      <div class="party-box">
        <h3>Ship To</h3>
        <p>${order.address.replace(/\n/g, '<br>')}</p>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 30px;">#</th>
          <th>Item Description</th>
          <th style="width: 60px; text-align: center;">Qty</th>
          <th style="width: 80px;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHTML}
      </tbody>
    </table>

    <div class="totals">
      <div class="totals-row subtotal">
        <span style="flex: 1;">Subtotal</span>
        <span style="text-align: right; min-width: 80px;">₹${order.subtotal.toLocaleString('en-IN')}</span>
      </div>
      <div class="totals-row gst">
        <span style="flex: 1;">GST (${order.gstPercentage}%)</span>
        <span style="text-align: right; min-width: 80px;">₹${order.gstAmount.toLocaleString('en-IN')}</span>
      </div>
      <div class="totals-row grand-total">
        <span style="flex: 1;">Grand Total</span>
        <span class="amount" style="text-align: right; min-width: 100px;">₹${order.totalAmount.toLocaleString('en-IN')}</span>
      </div>
    </div>

    <div class="notes">
      <p><strong>Note:</strong> This is a computer-generated invoice and requires no signature. 
      Payment method: ${order.paymentMethod === 'upi' ? 'UPI / QR' : order.paymentMethod === 'bank' ? 'Bank Transfer' : 'Credit Terms'}</p>
    </div>

    <div class="footer">
      <p>Thank you for your business!</p>
      <p>${businessSettings.businessName} • ${businessSettings.city}, ${businessSettings.state}</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate invoice text for sharing via WhatsApp or text
 */
export function generateInvoiceText(invoiceData: InvoiceData): string {
  const { order, businessSettings, customerName } = invoiceData;
  
  const invoiceDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const itemsList = order.items.map((item, index) => {
    const itemName = item.kind === 'stock' 
      ? item.productName || 'Stock Pouch'
      : `${item.pouchType ? item.pouchType.charAt(0).toUpperCase() + item.pouchType.slice(1) : ''} Pouch`;
    
    return `${index + 1}. ${itemName} × ${item.quantity} = ₹${item.price.toLocaleString('en-IN')}`;
  }).join('\n');

  return `
🧾 *TAX INVOICE*

*${businessSettings.businessName}*
${businessSettings.legalName}
GSTIN: ${businessSettings.gstin}

Invoice: *${order.orderId}*
Date: ${invoiceDate}

---

*Bill To:*
${customerName || 'Customer'}
${order.address}
${order.gstNumber ? `GSTIN: ${order.gstNumber}` : ''}

---

*Items:*
${itemsList}

---

Subtotal: ₹${order.subtotal.toLocaleString('en-IN')}
GST (${order.gstPercentage}%): ₹${order.gstAmount.toLocaleString('en-IN')}
*Grand Total: ₹${order.totalAmount.toLocaleString('en-IN')}*

Payment: ${order.paymentMethod === 'upi' ? 'UPI' : order.paymentMethod === 'bank' ? 'Bank Transfer' : 'Credit Terms'}

Thank you for your business!
  `.trim();
}
