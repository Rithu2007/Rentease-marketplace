const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const sendInvoiceEmail = async (email, order, items, address) => {
  const invoiceHtml = generateInvoiceHtml(order, items, address);

  // Check if SMTP is not configured or left default
  if (!process.env.SMTP_USER || process.env.SMTP_USER === 'youremail@gmail.com' || !process.env.SMTP_PASS) {
    console.log('--- EMAIL SERVICE INVOICE LOG (SMTP UNCONFIGURED) ---');
    console.log(`To: ${email}`);
    console.log(`Order ID: ${order.id}`);

    // Create scratch directory to output the testing files
    const scratchDir = path.join(__dirname, '../../scratch');
    if (!fs.existsSync(scratchDir)) {
      fs.mkdirSync(scratchDir, { recursive: true });
    }

    const filePath = path.join(scratchDir, `invoice_${order.id}.html`);
    fs.writeFileSync(filePath, invoiceHtml);
    console.log(`Invoice HTML saved locally: file:///${filePath.replace(/\\/g, '/')}`);
    console.log('----------------------------------------------------');
    return { success: true, isLocalFallback: true, filePath };
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: process.env.SMTP_FROM || `"RentEase Support" <${process.env.SMTP_USER}>`,
    to: email,
    subject: `RentEase Order Confirmation & Invoice - #${order.id}`,
    html: invoiceHtml,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Invoice email sent successfully to ${email}. ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('SMTP Mail Dispatch Failure:', error);
    // Silent fall back to saving locally so order flow is not broken
    const scratchDir = path.join(__dirname, '../../scratch');
    if (!fs.existsSync(scratchDir)) {
      fs.mkdirSync(scratchDir, { recursive: true });
    }
    const filePath = path.join(scratchDir, `invoice_${order.id}_error_fallback.html`);
    fs.writeFileSync(filePath, invoiceHtml);
    return { success: true, isLocalFallback: true, error: error.message, filePath };
  }
};

const generateInvoiceHtml = (order, items, address) => {
  const formatCurrency = (val) => `₹${parseFloat(val).toLocaleString('en-IN')}`;

  const itemRows = items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #222; color: #FFFFFF; font-size: 14px;">
        <strong>${item.name}</strong><br/>
        <span style="font-size: 11px; color: #88888F;">Colour: ${item.colour_name} | Mode: ${item.rental_duration ? 'Rental' : 'Purchase'}</span>
        ${item.rental_duration ? `<br/><span style="font-size: 11px; color: #00D4AA;">Duration: ${item.rental_duration.replace('_', ' ')}</span>` : ''}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #222; text-align: center; color: #FFFFFF; font-size: 14px;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #222; text-align: right; color: #FFFFFF; font-size: 14px;">${formatCurrency(item.unit_price)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #222; text-align: right; color: #FFFFFF; font-size: 14px;">${formatCurrency(parseFloat(item.unit_price) * item.quantity)}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>RentEase Invoice</title>
        <style>
          body { font-family: 'DM Sans', Arial, sans-serif; background-color: #0A0A0F; color: #E5E5E5; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background-color: #111118; border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 30px; box-shadow: 0 4px 30px rgba(0,0,0,0.5); }
          .header { text-align: center; border-bottom: 2px solid #D4A853; padding-bottom: 20px; margin-bottom: 25px; }
          .logo { font-size: 28px; font-weight: bold; color: #D4A853; text-transform: uppercase; letter-spacing: 2px; }
          .invoice-info { margin: 20px 0; display: table; width: 100%; }
          .invoice-info-col { display: table-cell; width: 50%; vertical-align: top; font-size: 13px; line-height: 1.6; }
          .address-section { margin: 20px 0; padding: 15px; background-color: #181824; border-radius: 6px; border: 1px solid rgba(255,255,255,0.04); font-size: 13px; line-height: 1.5; }
          table.items-table { width: 100%; border-collapse: collapse; margin-top: 25px; }
          th { background-color: #181824; color: #D4A853; text-align: left; padding: 12px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid rgba(255,255,255,0.06); }
          .totals-table { width: auto; margin-left: auto; margin-top: 20px; border-collapse: collapse; }
          .totals-table td { padding: 6px 12px; font-size: 14px; text-align: right; }
          .grand-total { font-size: 18px; font-weight: bold; color: #00D4AA; border-top: 1px solid rgba(255,255,255,0.1); }
          .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #222; font-size: 11px; color: #55555C; line-height: 1.5; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">RentEase</div>
            <div style="color: #88888F; font-size: 12px; margin-top: 5px;">Luxurious Furniture & Appliance Rentals</div>
          </div>
          
          <div class="invoice-info">
            <div class="invoice-info-col">
              <strong style="color: #FFFFFF; font-size: 14px;">Billed To:</strong><br/>
              ${address.full_name}<br/>
              Phone: ${address.phone}
            </div>
            <div class="invoice-info-col" style="text-align: right;">
              <strong style="color: #FFFFFF; font-size: 14px;">Invoice Info:</strong><br/>
              Invoice No: RE-${order.id}<br/>
              Date: ${new Date(order.created_at || Date.now()).toLocaleDateString('en-IN')}<br/>
              Payment Status: <span style="color: #00D4AA; font-weight: bold;">${order.payment_status.toUpperCase()}</span>
            </div>
          </div>
          
          <div class="address-section">
            <strong style="color: #D4A853; font-size: 13px;">Delivery Address:</strong><br/>
            ${address.flat}, ${address.street}, ${address.area}<br/>
            ${address.city}, ${address.state} - ${address.pincode}<br/>
            ${address.landmark ? `Landmark: ${address.landmark}` : ''}
          </div>
          
          <table class="items-table">
            <thead>
              <tr>
                <th>Description</th>
                <th style="text-align: center; width: 60px;">Qty</th>
                <th style="text-align: right; width: 100px;">Unit Price</th>
                <th style="text-align: right; width: 120px;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemRows}
            </tbody>
          </table>
          
          <table class="totals-table">
            <tr>
              <td style="color: #88888F;">Subtotal:</td>
              <td style="color: #FFFFFF; font-weight: bold; width: 120px;">${formatCurrency(order.subtotal)}</td>
            </tr>
            <tr>
              <td style="color: #88888F;">GST (18%):</td>
              <td style="color: #FFFFFF; font-weight: bold;">${formatCurrency(order.gst)}</td>
            </tr>
            <tr>
              <td style="color: #88888F;">Delivery Charge:</td>
              <td style="color: #FFFFFF; font-weight: bold;">${formatCurrency(order.delivery_charge)}</td>
            </tr>
            <tr class="grand-total">
              <td style="color: #00D4AA; padding-top: 12px;">Grand Total:</td>
              <td style="color: #00D4AA; font-weight: bold; padding-top: 12px;">${formatCurrency(order.total)}</td>
            </tr>
          </table>
          
          <div class="footer">
            <p style="margin: 0; color: #88888F;">Thank you for your order! Enjoy your premium furniture/appliances.</p>
            <p style="margin: 5px 0 0 0;">For assistance, email support@rentease.in or call 1800-RENT-EASE.</p>
          </div>
        </div>
      </body>
    </html>
  `;
};

module.exports = { sendInvoiceEmail };
