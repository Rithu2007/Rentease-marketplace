import React, { useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import confetti from 'canvas-confetti';
import { CheckCircle2, Download, ArrowRight, Truck, Mail, FileText } from 'lucide-react';
import { OrderDetail } from '../types';
import html2pdf from 'html2pdf.js';
import { useAuth } from '../context/AuthContext';

export default function OrderSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get('orderId') || '';
  const { user } = useAuth();

  const invoiceRef = useRef<HTMLDivElement>(null);

  // Fetch Order Details
  const { data: orderDetailsData, isLoading, error } = useQuery<{ success: boolean; order: any; items: any[] }>({
    queryKey: ['order-success', orderId],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const detailsStr = localStorage.getItem(`rentease_order_details_${orderId}`);
      if (!detailsStr) {
        throw new Error('Order not found.');
      }
      const details = JSON.parse(detailsStr);
      return {
        success: true,
        order: details,
        items: details.items || []
      };
    },
    enabled: !!orderId
  });

  const order = orderDetailsData?.order;
  const items = orderDetailsData?.items || [];

  // Trigger Confetti on arrival
  useEffect(() => {
    let interval: number;
    if (orderId) {
      // Fire confetti bursts
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min;
      };

      interval = window.setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          clearInterval(interval);
          return;
        }

        const particleCount = 50 * (timeLeft / duration);
        // Confetti bursts from left and right edges
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [orderId]);

  // Download PDF Invoice via html2pdf.js
  const handleDownloadInvoice = () => {
    const element = invoiceRef.current;
    if (element) {
      const opt = {
        margin:       0.5,
        filename:     `RentEase_Invoice_RE_${orderId}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, backgroundColor: '#111118' },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
      };
      
      // Temporary unhide/force background during print
      element.style.display = 'block';
      html2pdf()
        .from(element)
        .set(opt)
        .save()
        .then(() => {
          element.style.display = 'none'; // Re-hide after print
        });
    }
  };

  const formatCurrency = (val: string | number) => `₹${parseFloat(val as string).toLocaleString('en-IN')}`;

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center text-sm font-semibold text-goldAccent animate-pulse uppercase tracking-widest">
        Verifying Order Details...
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <h3 className="font-serif text-lg text-white font-bold uppercase">Order not found</h3>
        <button onClick={() => navigate('/')} className="mt-4 px-6 py-2 rounded-full bg-goldAccent text-black font-bold text-xs uppercase">
          Back Home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 flex flex-col gap-8 items-center text-center">
      
      {/* SUCCESS BANNER */}
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 bg-tealAccent/10 border border-tealAccent/20 text-tealAccent rounded-full flex items-center justify-center animate-scaleIn">
          <CheckCircle2 className="w-8 h-8 stroke-[2px]" />
        </div>
        <div>
          <span className="text-xs font-bold text-tealAccent uppercase tracking-widest bg-tealAccent/10 border border-tealAccent/20 px-3 py-1 rounded-full">
            Payment Verified
          </span>
          <h1 className="text-3xl font-serif text-white mt-4 font-semibold uppercase tracking-wide">
            Order Placed Successfully!
          </h1>
          <p className="text-xs text-gray-500 mt-2">Order ID: <span className="font-mono text-white font-bold">RE-{order.id}</span></p>
        </div>
      </div>

      {/* CONFIRMED DETAILS CARD */}
      <div className="glass-card rounded-3xl p-6 border border-borderCard w-full text-left flex flex-col gap-5">
        
        {/* Delivery Details */}
        <div className="flex gap-4 items-start border-b border-borderCard/30 pb-4">
          <Truck className="w-5 h-5 text-goldAccent flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Estimated Delivery Scheduled</h4>
            <p className="text-xs text-gray-300 mt-1">
              Your items are scheduled to arrive within 3 days. Our crew will call you before arrival.
            </p>
          </div>
        </div>

        {/* Email Invoice Confirm */}
        <div className="flex gap-4 items-start border-b border-borderCard/30 pb-4">
          <Mail className="w-5 h-5 text-tealAccent flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Email Invoice Dispatched</h4>
            <p className="text-xs text-gray-300 mt-1">
              A copy of your detailed HTML invoice has been sent to your registered email address.
            </p>
          </div>
        </div>

        {/* Totals Paid */}
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-400 font-bold uppercase tracking-wider">Total Amount Paid</span>
          <span className="text-sm font-extrabold text-goldAccent font-mono">{formatCurrency(order.total)}</span>
        </div>

      </div>

      {/* BUTTON TOOLBAR */}
      <div className="flex flex-col sm:flex-row gap-4 w-full justify-center mt-4">
        
        {/* Download invoice button */}
        <button
          onClick={handleDownloadInvoice}
          className="flex-1 max-w-[240px] py-3.5 rounded-xl bg-transparent border border-borderGold hover:border-goldAccent text-goldAccent hover:text-white hover:bg-goldAccent/5 font-extrabold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" />
          <span>Download Invoice</span>
        </button>

        {/* Track order */}
        <button
          onClick={() => navigate('/profile?tab=orders')}
          className="flex-1 max-w-[240px] py-3.5 rounded-xl bg-goldAccent hover:bg-goldAccent/95 text-black font-extrabold text-xs uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-1.5"
        >
          <span>Track Order</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* --- HIDDEN INVOICE TEMPLATE FOR PDF DOWNLOAD --- */}
      <div style={{ display: 'none' }}>
        <div
          ref={invoiceRef}
          style={{
            fontFamily: "'DM Sans', sans-serif",
            color: '#E5E5E5',
            backgroundColor: '#111118',
            padding: '40px',
            width: '7.5in', // PDF standard print width
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.06)'
          }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', borderBottom: '2px solid #D4A853', paddingBottom: '20px', marginBottom: '25px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#D4A853', textTransform: 'uppercase', letterSpacing: '2px', margin: '0' }}>
              RentEase
            </h1>
            <p style={{ color: '#88888F', fontSize: '11px', margin: '5px 0 0 0' }}>Luxurious Furniture & Appliance Rentals India</p>
          </div>

          {/* Details Column */}
          <div style={{ display: 'table', width: '100%', marginBottom: '20px' }}>
            <div style={{ display: 'table-cell', width: '50%', verticalAlign: 'top', fontSize: '12px', lineHeight: '1.6' }}>
              <strong style={{ color: '#FFFFFF', fontSize: '13px' }}>Billed To:</strong><br />
              {order.shipping_name || user?.name}<br />
              Phone: {order.shipping_phone || user?.phone}
            </div>
            <div style={{ display: 'table-cell', width: '50%', textAlign: 'right', verticalAlign: 'top', fontSize: '12px', lineHeight: '1.6' }}>
              <strong style={{ color: '#FFFFFF', fontSize: '13px' }}>Invoice Info:</strong><br />
              Invoice No: RE-{order.id}<br />
              Date: {new Date(order.created_at || Date.now()).toLocaleDateString('en-IN')}<br />
              Payment Status: <span style={{ color: '#00D4AA', fontWeight: 'bold' }}>{order.payment_status?.toUpperCase()}</span>
            </div>
          </div>

          {/* Address details */}
          <div style={{ margin: '20px 0', padding: '15px', backgroundColor: '#181824', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.04)', fontSize: '12px', lineHeight: '1.5' }}>
            <strong style={{ color: '#D4A853', fontSize: '12px' }}>Delivery Address:</strong><br />
            {order.flat}, {order.street}, {order.area}<br />
            {order.city}, {order.state} - {order.pincode}<br />
            {order.landmark ? `Landmark: ${order.landmark}` : ''}
          </div>

          {/* Items Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '25px', fontSize: '12px' }}>
            <thead>
              <tr style={{ backgroundColor: '#181824', color: '#D4A853', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '1px' }}>
                <th style={{ padding: '10px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>Description</th>
                <th style={{ padding: '10px', borderBottom: '1px solid rgba(255,255,255,0.06)', textAlign: 'center', width: '50px' }}>Qty</th>
                <th style={{ padding: '10px', borderBottom: '1px solid rgba(255,255,255,0.06)', textAlign: 'right', width: '90px' }}>Unit Price</th>
                <th style={{ padding: '10px', borderBottom: '1px solid rgba(255,255,255,0.06)', textAlign: 'right', width: '100px' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td style={{ padding: '10px', borderBottom: '1px solid rgba(255,255,255,0.04)', color: '#FFFFFF' }}>
                    <strong>{item.name}</strong><br />
                    <span style={{ fontSize: '10px', color: '#88888F' }}>Colour: {item.colour_name} | Mode: {item.rental_duration ? 'Rental' : 'Purchase'}</span>
                    {item.rental_duration ? `<br/><span style="font-size: 10px; color: #00D4AA;">Duration: ${item.rental_duration.replace('_', ' ')}</span>` : ''}
                  </td>
                  <td style={{ padding: '10px', borderBottom: '1px solid rgba(255,255,255,0.04)', textAlign: 'center', color: '#FFFFFF' }}>{item.quantity}</td>
                  <td style={{ padding: '10px', borderBottom: '1px solid rgba(255,255,255,0.04)', textAlign: 'right', color: '#FFFFFF' }}>{formatCurrency(item.unit_price)}</td>
                  <td style={{ padding: '10px', borderBottom: '1px solid rgba(255,255,255,0.04)', textAlign: 'right', color: '#FFFFFF' }}>{formatCurrency(parseFloat(item.unit_price) * item.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals Table */}
          <table style={{ width: 'auto', marginLeft: 'auto', marginTop: '20px', borderCollapse: 'collapse', fontSize: '12px' }}>
            <tbody>
              <tr>
                <td style={{ color: '#88888F', padding: '4px 10px', textAlign: 'right' }}>Subtotal:</td>
                <td style={{ color: '#FFFFFF', fontWeight: 'bold', padding: '4px 10px', textAlign: 'right', width: '100px' }}>{formatCurrency(order.subtotal)}</td>
              </tr>
              <tr>
                <td style={{ color: '#88888F', padding: '4px 10px', textAlign: 'right' }}>GST (18%):</td>
                <td style={{ color: '#FFFFFF', fontWeight: 'bold', padding: '4px 10px', textAlign: 'right' }}>{formatCurrency(order.gst)}</td>
              </tr>
              <tr>
                <td style={{ color: '#88888F', padding: '4px 10px', textAlign: 'right' }}>Delivery:</td>
                <td style={{ color: '#FFFFFF', fontWeight: 'bold', padding: '4px 10px', textAlign: 'right' }}>{formatCurrency(order.delivery_charge)}</td>
              </tr>
              {parseFloat(order.total) > parseFloat(order.subtotal) + parseFloat(order.gst) + parseFloat(order.delivery_charge) && (
                <tr>
                  <td style={{ color: '#88888F', padding: '4px 10px', textAlign: 'right' }}>Deposit:</td>
                  <td style={{ color: '#FFFFFF', fontWeight: 'bold', padding: '4px 10px', textAlign: 'right' }}>{formatCurrency(parseFloat(order.total) - (parseFloat(order.subtotal) + parseFloat(order.gst) + parseFloat(order.delivery_charge)))}</td>
                </tr>
              )}
              <tr style={{ fontSize: '14px', fontWeight: 'bold', color: '#00D4AA' }}>
                <td style={{ padding: '10px', borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'right' }}>Grand Total:</td>
                <td style={{ padding: '10px', borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'right' }}>{formatCurrency(order.total)}</td>
              </tr>
            </tbody>
          </table>

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: '35px', paddingTop: '15px', borderTop: '1px solid #222', fontSize: '10px', color: '#55555C' }}>
            <p style={{ margin: '0' }}>Thank you for choosing RentEase! Enjoy your premium furniture/appliances.</p>
            <p style={{ margin: '3px 0 0 0' }}>For any queries, please email support@rentease.in or call 1800-RENT-EASE.</p>
          </div>
        </div>
      </div>

    </div>
  );
}
