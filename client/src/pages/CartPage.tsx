import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Plus, Minus, ArrowRight, ArrowLeft, Percent, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useMode } from '../context/ModeContext';
import { useToast } from '../context/ToastContext';

export default function CartPage() {
  const navigate = useNavigate();
  const { cartItems, updateCartItem, removeFromCart, totals } = useCart();
  const { mode } = useMode();
  const { showToast } = useToast();

  // Promo Code States
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [discountValue, setDiscountValue] = useState(0);
  const [promoError, setPromoError] = useState<string | null>(null);

  // Suggested Add-ons (Mock frequently bought together items)
  const addOns = [
    { id: 991, name: 'Premium Velvet Cushion (Set of 2)', price: 1200, rent: 150, img: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=150', variant_id: 1 },
    { id: 992, name: 'Minimalist Wooden Desk Lamp', price: 1800, rent: 200, img: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=150', variant_id: 1 },
    { id: 993, name: 'DecorHome Scented Candles Pack', price: 600, rent: 80, img: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=150', variant_id: 1 }
  ];

  const handleApplyPromo = () => {
    setPromoError(null);
    const code = promoInput.trim().toUpperCase();

    if (!code) return;

    if (code === 'WELCOME200') {
      if (totals.subtotal < 1000) {
        setPromoError('Code WELCOME200 is only valid for orders above ₹1,000.');
        return;
      }
      setDiscountValue(200);
      setAppliedPromo(code);
    } else if (code === 'FESTIVE15') {
      const discount = Math.round(totals.subtotal * 0.15);
      setDiscountValue(discount);
      setAppliedPromo(code);
    } else if (code === 'EASEBUY500') {
      if (totals.subtotal < 5000) {
        setPromoError('Code EASEBUY500 is only valid for orders above ₹5,000.');
        return;
      }
      setDiscountValue(500);
      setAppliedPromo(code);
    } else {
      setPromoError('Invalid promo code. Try WELCOME200, FESTIVE15, or EASEBUY500.');
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setDiscountValue(0);
    setPromoInput('');
  };

  const formatCurrency = (val: number) => `₹${val.toLocaleString('en-IN')}`;

  if (cartItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="glass-card rounded-3xl p-12 border border-borderCard shadow-2xl">
          <ShoppingBag className="w-16 h-16 text-goldAccent/30 mx-auto mb-4" />
          <h2 className="font-serif text-2xl text-white font-bold uppercase tracking-wide">Your Shopping Cart is Empty</h2>
          <p className="text-xs text-gray-400 mt-2 mb-8 max-w-xs mx-auto leading-relaxed">
            You have not added any premium furniture or appliances to your cart yet. Toggles between Buy & Rent mode to start!
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-goldAccent hover:bg-goldAccent/95 text-black font-extrabold text-xs uppercase tracking-widest transition-all shadow-[0_8px_24px_rgba(212,168,83,0.2)]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Explore Catalog</span>
          </Link>
        </div>
      </div>
    );
  }

  // Adjust final total with discount
  const finalGrandTotal = Math.max(0, totals.total - discountValue);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 flex flex-col gap-8">
      
      <div className="text-center md:text-left">
        <span className="text-xs font-bold text-tealAccent uppercase tracking-widest bg-tealAccent/10 border border-tealAccent/20 px-3 py-1 rounded-full">Your Cart</span>
        <h1 className="text-3xl font-serif text-white mt-4 font-semibold uppercase tracking-wide">Shopping Cart</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Cart Items & Add-ons */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          <div className="flex flex-col gap-4">
            <AnimatePresence initial={false}>
              {cartItems.map((item) => {
                const price = item.mode === 'rent' ? parseFloat(item.rent_price_month) : parseFloat(item.buy_price);
                
                // Extract variant thumbnail
                let thumbnail = 'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=150';
                if (item.images) {
                  try {
                    const parsed = typeof item.images === 'string' ? JSON.parse(item.images) : item.images;
                    if (Array.isArray(parsed) && parsed.length > 0) thumbnail = parsed[0];
                  } catch (e) {
                    if (Array.isArray(item.images) && item.images.length > 0) thumbnail = item.images[0];
                  }
                }

                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -60, transition: { duration: 0.2 } }}
                    className="glass-card rounded-2xl p-4 border border-borderCard flex flex-col sm:flex-row items-center gap-4 justify-between hover:border-goldAccent/25 hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-all duration-300 group"
                  >
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <div className="w-16 h-16 rounded-xl overflow-hidden border border-borderCard flex-shrink-0">
                        <img src={thumbnail} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">{item.brand}</span>
                        <h3 className="text-sm font-semibold text-white truncate hover:underline cursor-pointer" onClick={() => navigate(`/products/${item.product_id}`)}>
                          {item.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className="text-[9px] uppercase tracking-wide bg-white/5 text-tealAccent border border-borderCard px-2 py-0.5 rounded">
                            {item.colour_name}
                          </span>
                          <span className="text-[9px] uppercase tracking-wide bg-goldAccent/10 text-goldAccent border border-borderGold px-2 py-0.5 rounded">
                            {item.mode === 'rent' ? 'Rental' : 'Purchase'}
                          </span>
                          {item.mode === 'rent' && item.rental_duration && (
                            <span className="text-[9px] uppercase tracking-wide bg-tealAccent/10 text-tealAccent border border-tealAccent/20 px-2 py-0.5 rounded">
                              {item.rental_duration.replace('_', ' ')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quantity Stepper */}
                    <div className="flex items-center gap-3 bg-black/40 border border-borderCard rounded-xl p-1.5 w-fit">
                      <button
                        onClick={() => item.quantity > 1 && updateCartItem(item.id, item.quantity - 1)}
                        className="w-6 h-6 rounded-lg hover:bg-white/5 flex items-center justify-center text-gray-400 hover:text-white"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs text-white font-bold w-6 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateCartItem(item.id, item.quantity + 1)}
                        className="w-6 h-6 rounded-lg hover:bg-white/5 flex items-center justify-center text-gray-400 hover:text-white"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Price */}
                    <div className="text-center sm:text-right">
                      <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Item Total</p>
                      <p className="text-sm font-extrabold text-white mt-1">
                        {formatCurrency(price * item.quantity)}
                      </p>
                      <p className="text-[9px] text-gray-500 font-medium mt-0.5">({formatCurrency(price)} each)</p>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="p-2 text-gray-500 hover:text-[#ff5b5b] hover:bg-white/5 rounded-xl transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* SUGGESTED ADD-ONS */}
          <div className="mt-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-borderCard/30 pb-3 mb-4">
              Frequently Bought Together
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {addOns.map((addon) => {
                const addOnPrice = mode === 'rent' ? addon.rent : addon.price;
                return (
                  <div
                    key={addon.id}
                    className="glass-card rounded-2xl p-4 border border-borderCard flex items-center gap-3 hover:border-goldAccent/15 transition-all"
                  >
                    <img src={addon.img} alt={addon.name} className="w-12 h-12 object-cover rounded-xl border border-borderCard flex-shrink-0" />
                    <div className="min-w-0 flex-1 flex flex-col gap-1">
                      <h4 className="text-[11px] font-bold text-white truncate leading-tight">{addon.name}</h4>
                      <p className="text-[10px] text-goldAccent font-mono leading-none">
                        {formatCurrency(addOnPrice)}{mode === 'rent' && '/mo'}
                      </p>
                      <button
                        onClick={() => {
                          // Standard mock add add-on
                          updateCartItem(addon.id, 1);
                          showToast(`${addon.name} added to cart!`, 'success');
                        }}
                        className="text-[9px] text-tealAccent hover:underline font-bold text-left uppercase tracking-wider mt-1 block"
                      >
                        + Add Item
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Summary Sidebar */}
        <div className="lg:col-span-4 glass-card rounded-3xl p-6 border border-borderCard sticky top-[85px] flex flex-col gap-6">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-borderCard/30 pb-3">
            Order Summary
          </h3>

          <div className="flex flex-col gap-3.5 text-xs">
            <div className="flex justify-between items-center text-gray-400">
              <span>Subtotal:</span>
              <span className="text-white font-bold">{formatCurrency(totals.subtotal)}</span>
            </div>
            
            <div className="flex justify-between items-center text-gray-400">
              <span>GST (18%):</span>
              <span className="text-white font-bold">{formatCurrency(totals.gst)}</span>
            </div>
            
            <div className="flex justify-between items-center text-gray-400">
              <span>Delivery Charges:</span>
              <span className="text-white font-bold">
                {totals.deliveryCharge === 0 ? <span className="text-tealAccent">FREE</span> : formatCurrency(totals.deliveryCharge)}
              </span>
            </div>

            {totals.deposit > 0 && (
              <div className="flex justify-between items-center text-gray-400">
                <span className="flex items-center gap-1.5">
                  Refundable Deposit:
                  <span className="text-[9px] lowercase bg-tealAccent/10 text-tealAccent border border-tealAccent/20 px-1.5 py-0.5 rounded">Refundable</span>
                </span>
                <span className="text-white font-bold">{formatCurrency(totals.deposit)}</span>
              </div>
            )}

            {/* Promo code applied visual */}
            {appliedPromo && (
              <div className="flex justify-between items-center text-tealAccent bg-tealAccent/5 border border-tealAccent/20 p-2.5 rounded-xl">
                <span className="flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5" />
                  Code Applied: <span className="font-bold font-mono">{appliedPromo}</span>
                </span>
                <button onClick={handleRemovePromo} className="text-xs font-bold hover:underline">Remove</button>
              </div>
            )}

            {/* Promo code discount value */}
            {discountValue > 0 && (
              <div className="flex justify-between items-center text-[#ff5b5b] font-medium">
                <span>Discount Applied:</span>
                <span>−{formatCurrency(discountValue)}</span>
              </div>
            )}

            {/* Savings Badge */}
            {discountValue > 0 && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-center mt-1 flex items-center justify-center gap-1.5 animate-pulse">
                <span>🎉 You are saving {formatCurrency(discountValue)} on this order!</span>
              </div>
            )}
          </div>

          {/* Promo code entry */}
          {!appliedPromo && (
            <div className="flex flex-col gap-1.5 border-t border-borderCard/30 pt-4">
              <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Apply Promo Code</label>
              <div className="flex bg-black/40 border border-borderCard rounded-xl p-1.5">
                <input
                  type="text"
                  placeholder="WELCOME200, FESTIVE15..."
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none pl-3 text-xs text-white placeholder-gray-600 font-mono tracking-wider uppercase"
                />
                <button
                  onClick={handleApplyPromo}
                  className="bg-goldAccent hover:bg-goldAccent/95 text-black px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all"
                >
                  Apply
                </button>
              </div>
              {promoError && <span className="text-[9px] text-[#ff5b5b] font-medium mt-1">{promoError}</span>}
              <span className="text-[8px] text-gray-500 mt-1 block">Valid codes: WELCOME200 | FESTIVE15 | EASEBUY500</span>
            </div>
          )}

          {/* Grand total */}
          <div className="flex justify-between items-end border-t border-borderCard/30 pt-4">
            <div>
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block">Grand Total</span>
              <span className="text-2xl font-serif font-extrabold text-goldAccent">
                {formatCurrency(finalGrandTotal)}
              </span>
            </div>
            <span className="text-[9px] text-gray-500 font-semibold">Inclusive of GST</span>
          </div>

          {/* Checkout button */}
          <button
            onClick={() => {
              // Store discount state in sessionStorage to carry to CheckoutPage
              sessionStorage.setItem('rentease_applied_promo', appliedPromo || '');
              sessionStorage.setItem('rentease_applied_discount', discountValue.toString());
              navigate('/checkout');
            }}
            className="w-full py-4 bg-goldAccent hover:bg-goldAccent/95 text-black font-extrabold text-xs uppercase tracking-widest transition-all rounded-xl shadow-[0_8px_24px_rgba(212,168,83,0.25)] flex items-center justify-center gap-1.5"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="w-4.5 h-4.5 stroke-[2.5px]" />
          </button>

          <Link
            to="/products"
            className="text-center text-xs text-gray-400 hover:text-white transition-all flex items-center justify-center gap-1.5 font-bold uppercase tracking-wider mt-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Continue Shopping</span>
          </Link>

        </div>

      </div>

    </div>
  );
}
