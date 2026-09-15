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
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>Tax Invoice - ${order.orderId}</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    html, body {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      overflow-x: hidden;
      -webkit-text-size-adjust: none;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      padding: 12px;
      background: #ffffff;
      font-size: 13px;
      line-height: 1.5;
    }
    .invoice {
      width: 100%;
      background: white;
      overflow-x: hidden;
    }
    @media print {
      body {
        padding: 10px;
      }
    }
    .header {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 14px;
      padding-bottom: 10px;
      border-bottom: 2px solid #3b82f6;
    }
    .company-info h1 {
      font-size: 20px;
      color: #1f2937;
      margin-bottom: 4px;
      font-weight: 700;
    }
    .company-info p {
      font-size: 12px;
      color: #6b7280;
      margin: 2px 0;
    }
    .invoice-meta {
      text-align: left;
      margin-top: 8px;
    }
    .invoice-meta h2 {
      font-size: 18px;
      color: #3b82f6;
      margin-bottom: 6px;
      font-weight: 700;
    }
    .invoice-meta p {
      font-size: 12px;
      color: #6b7280;
      margin: 2px 0;
    }
    .parties {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 14px;
    }
    .party-box {
      padding: 10px;
      background: #f9fafb;
      border-radius: 6px;
      border: 1px solid #e5e7eb;
    }
    .party-box h3 {
      font-size: 11px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
      font-weight: 600;
    }
    .party-box p {
      font-size: 12px;
      color: #1f2937;
      margin: 3px 0;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    .party-box .gstin {
      font-family: 'Courier New', monospace;
      font-weight: bold;
      color: #3b82f6;
      font-size: 11px;
      word-break: break-all;
      display: block;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
      font-size: 12px;
    }
    th {
      background: #f3f4f6;
      padding: 8px 6px;
      text-align: left;
      font-size: 11px;
      color: #374151;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      border-bottom: 2px solid #e5e7eb;
      font-weight: 600;
    }
    th:last-child, td:last-child {
      text-align: right;
    }
    td {
      padding: 8px 6px;
      font-size: 12px;
      color: #1f2937;
      border-bottom: 1px solid #e5e7eb;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    td strong {
      display: block;
      margin-bottom: 2px;
    }
    td small {
      font-size: 11px;
      color: #6b7280;
      display: block;
      line-height: 1.3;
      margin-top: 2px;
    }
    .totals {
      width: 100%;
      margin-top: 10px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 13px;
    }
    .totals-row.subtotal,
    .totals-row.gst {
      color: #6b7280;
    }
    .totals-row.gst {
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 8px;
      margin-bottom: 8px;
    }
    .totals-row.grand-total {
      font-size: 15px;
      font-weight: bold;
      color: #1f2937;
      padding-top: 8px;
    }
    .grand-total .amount {
      color: #3b82f6;
      font-size: 18px;
      font-weight: bold;
    }
    .footer {
      margin-top: 16px;
      padding-top: 10px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 11px;
    }
    .notes {
      margin-top: 14px;
      padding: 10px;
      background: #fef3c7;
      border-left: 3px solid #f59e0b;
      border-radius: 4px;
    }
    .notes p {
      margin: 0;
      color: #92400e;
      font-size: 11px;
      line-height: 1.5;
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
          <th style="width: 35px;">#</th>
          <th>Item</th>
          <th style="width: 65px; text-align: center;">Qty</th>
          <th style="width: 90px;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHTML}
      </tbody>
    </table>

    <div class="totals">
      <div class="totals-row subtotal">
        <span>Subtotal</span>
        <span>₹${order.subtotal.toLocaleString('en-IN')}</span>
      </div>
      <div class="totals-row gst">
        <span>GST (${order.gstPercentage}%)</span>
        <span>₹${order.gstAmount.toLocaleString('en-IN')}</span>
      </div>
      <div class="totals-row grand-total">
        <span>Grand Total</span>
        <span class="amount">₹${order.totalAmount.toLocaleString('en-IN')}</span>
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
