import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, Calendar, CreditCard, Plus, Check, ArrowLeft, ArrowRight, ShieldCheck, X } from 'lucide-react';
import { Address, CartItem } from '../types';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const DEFAULT_ADDRESSES = [
  {
    id: 1,
    user_id: 2,
    label: 'Home',
    full_name: 'John Doe',
    phone: '9999988888',
    flat: 'Flat 304, Block B',
    street: '12th Main Road',
    area: 'Indiranagar',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560038',
    landmark: 'Opposite Metro Station',
    is_default: true
  }
];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { cartItems, totals, clearCart } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();

  // Stepper state: 1 = Address, 2 = Rental Confirm, 3 = Payment
  const [step, setStep] = useState(1);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);

  // Address creation form toggle
  const [showAddressForm, setShowAddressForm] = useState(false);
  
  // New Address form inputs
  const [newLabel, setNewLabel] = useState('Home');
  const [newFullName, setNewFullName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newFlat, setNewFlat] = useState('');
  const [newStreet, setNewStreet] = useState('');
  const [newArea, setNewArea] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newState, setNewState] = useState('');
  const [newPincode, setNewPincode] = useState('');
  const [newLandmark, setNewLandmark] = useState('');
  const [newIsDefault, setNewIsDefault] = useState(false);

  // Rental settings (derived from first cart item start date or custom)
  const hasRentals = cartItems.some((item) => item.mode === 'rent');
  const [deliveryDate, setDeliveryDate] = useState(
    new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  // Applied Promo/Discount states (carried from CartPage)
  const appliedPromo = sessionStorage.getItem('rentease_applied_promo') || null;
  const discountValue = parseFloat(sessionStorage.getItem('rentease_applied_discount') || '0');
  const finalTotal = Math.max(0, totals.total - discountValue);

  // Razorpay Gateway Simulation State
  const [showMockPaymentGateway, setShowMockPaymentGateway] = useState(false);
  const [mockPaymentStatus, setMockPaymentStatus] = useState<'idle' | 'processing' | 'success'>('idle');
  const [mockRazorpayOrderId, setMockRazorpayOrderId] = useState('');

  // Fetch Saved Addresses
  const { data: addresses = [], isLoading: addressesLoading } = useQuery<Address[]>({
    queryKey: ['addresses', user?.id],
    queryFn: async () => {
      const key = `rentease_addresses_${user?.id || 'guest'}`;
      let list = localStorage.getItem(key);
      if (!list) {
        const seeded = DEFAULT_ADDRESSES.map(a => ({ ...a, user_id: user?.id || 2 }));
        localStorage.setItem(key, JSON.stringify(seeded));
        return seeded;
      }
      return JSON.parse(list);
    },
    enabled: !!user
  });

  // Set default address if it exists
  useEffect(() => {
    if (addresses.length > 0) {
      const def = addresses.find(a => a.is_default);
      setSelectedAddressId(def ? def.id : addresses[0].id);
    }
  }, [addresses]);

  // Address Insertion Mutation
  const addressMutation = useMutation({
    mutationFn: async (payload: any) => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const key = `rentease_addresses_${user?.id || 'guest'}`;
      const current = JSON.parse(localStorage.getItem(key) || '[]');
      
      const newAddr: Address = {
        id: Math.max(...current.map((a: any) => a.id), 0) + 1,
        user_id: user?.id || 1,
        label: payload.label || 'Home',
        full_name: payload.fullName,
        phone: payload.phone,
        flat: payload.flat,
        street: payload.street,
        area: payload.area,
        city: payload.city,
        state: payload.state,
        pincode: payload.pincode,
        landmark: payload.landmark || null,
        is_default: payload.isDefault || false
      };

      if (newAddr.is_default) {
        current.forEach((a: any) => a.is_default = false);
      }

      current.push(newAddr);
      localStorage.setItem(key, JSON.stringify(current));
      return { address: newAddr };
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['addresses', user?.id] });
      setShowAddressForm(false);
      setSelectedAddressId(res.address.id);
      // Clear address fields
      setNewFullName('');
      setNewPhone('');
      setNewFlat('');
      setNewStreet('');
      setNewArea('');
      setNewCity('');
      setNewState('');
      setNewPincode('');
      setNewLandmark('');
    }
  });

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    addressMutation.mutate({
      label: newLabel,
      fullName: newFullName,
      phone: newPhone,
      flat: newFlat,
      street: newStreet,
      area: newArea,
      city: newCity,
      state: newState,
      pincode: newPincode,
      landmark: newLandmark,
      isDefault: newIsDefault
    });
  };

  // Helper to load Razorpay SDK dynamically
  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Pay button action handler
  const handlePaymentInitiate = async () => {
    if (!selectedAddressId) {
      showToast('Please select or add a shipping address.', 'error');
      return;
    }

    const mockOrderId = `order_mock_${Math.random().toString(36).substring(2, 12)}`;
    setMockRazorpayOrderId(mockOrderId);
    setShowMockPaymentGateway(true);
  };

  // Mock Payment verification and order creation
  const handleMockPaymentComplete = async () => {
    setMockPaymentStatus('processing');
    
    // Simulate transaction delay
    setTimeout(async () => {
      try {
        const mockPaymentId = `pay_mock_${Math.random().toString(36).substring(2, 12)}`;
        const orderId = Math.floor(1000 + Math.random() * 9000);
        
        const key = `rentease_addresses_${user?.id || 'guest'}`;
        const addressList = JSON.parse(localStorage.getItem(key) || '[]');
        const addr = addressList.find((a: any) => a.id === selectedAddressId) || DEFAULT_ADDRESSES[0];

        const newOrder = {
          id: orderId,
          user_id: user?.id || 2,
          address_id: selectedAddressId,
          razorpay_order_id: mockRazorpayOrderId,
          razorpay_payment_id: mockPaymentId,
          payment_status: 'paid',
          order_status: 'ordered',
          subtotal: totals.subtotal.toFixed(2),
          gst: totals.gst.toFixed(2),
          delivery_charge: totals.deliveryCharge.toFixed(2),
          total: finalTotal.toFixed(2),
          mode: hasRentals ? 'rent' : 'buy',
          created_at: new Date().toISOString()
        };

        const orderItems = cartItems.map(item => {
          return {
            id: Math.floor(100000 + Math.random() * 900000),
            order_id: orderId,
            product_id: item.product_id,
            variant_id: item.variant_id,
            quantity: item.quantity,
            unit_price: item.mode === 'rent' ? item.rent_price_month : item.buy_price,
            rental_duration: item.rental_duration,
            rental_start_date: item.mode === 'rent' ? deliveryDate : null,
            rental_end_date: item.mode === 'rent' 
              ? new Date(new Date(deliveryDate).setMonth(new Date(deliveryDate).getMonth() + (item.rental_duration === '3_months' ? 3 : item.rental_duration === '6_months' ? 6 : 12))).toISOString().split('T')[0]
              : null,
            name: item.name,
            brand: item.brand,
            colour_name: item.colour_name,
            thumbnail: Array.isArray(item.images) ? item.images[0] : item.images
          };
        });

        const orderDetail = {
          ...newOrder,
          shipping_name: addr.full_name,
          shipping_phone: addr.phone,
          flat: addr.flat,
          street: addr.street,
          area: addr.area,
          city: addr.city,
          state: addr.state,
          pincode: addr.pincode,
          landmark: addr.landmark,
          items: orderItems
        };

        // Write detailed order info
        localStorage.setItem(`rentease_order_details_${orderId}`, JSON.stringify(orderDetail));

        // Append order to orders list
        const existingOrders = JSON.parse(localStorage.getItem(`rentease_orders_${user?.id || 'guest'}`) || '[]');
        existingOrders.unshift(newOrder);
        localStorage.setItem(`rentease_orders_${user?.id || 'guest'}`, JSON.stringify(existingOrders));

        // If there are rented items, append to active rentals list
        if (hasRentals) {
          const activeRentals = JSON.parse(localStorage.getItem(`rentease_active_rentals_${user?.id || 'guest'}`) || '[]');
          orderItems.forEach(item => {
            if (item.rental_duration) {
              const start = new Date(item.rental_start_date!);
              const end = new Date(item.rental_end_date!);
              const diffTime = Math.abs(end.getTime() - start.getTime());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              
              activeRentals.unshift({
                id: item.id,
                rental_duration: item.rental_duration,
                rental_start_date: item.rental_start_date!,
                rental_end_date: item.rental_end_date!,
                quantity: item.quantity,
                product_id: item.product_id,
                name: item.name,
                brand: item.brand,
                category: item.name.includes('Sofa') ? 'Sofa' : item.name.includes('Bed') ? 'Bed' : 'Appliance',
                colour_name: item.colour_name,
                thumbnail: item.thumbnail,
                days_remaining: diffDays
              });
            }
          });
          localStorage.setItem(`rentease_active_rentals_${user?.id || 'guest'}`, JSON.stringify(activeRentals));
        }

        setMockPaymentStatus('success');
        
        setTimeout(async () => {
          await clearCart();
          sessionStorage.removeItem('rentease_applied_promo');
          sessionStorage.removeItem('rentease_applied_discount');
          setShowMockPaymentGateway(false);
          navigate(`/success?orderId=${orderId}`);
        }, 1000);
      } catch (err) {
        showToast('Failed to place order in mock checkout mode.', 'error');
        setMockPaymentStatus('idle');
      }
    }, 2000);
  };

  const getReturnDate = (dateStr: string) => {
    const d = new Date(dateStr);
    d.setMonth(d.getMonth() + 3); // Default 3 months
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const formatCurrency = (val: number) => `₹${val.toLocaleString('en-IN')}`;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col gap-8">
      
      <div className="text-center md:text-left flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/5">
          <ArrowLeft className="w-5 h-5 text-goldAccent" />
        </button>
        <div>
          <span className="text-xs font-bold text-tealAccent uppercase tracking-widest bg-tealAccent/10 border border-tealAccent/20 px-3 py-1 rounded-full">Checkout</span>
          <h1 className="text-3xl font-serif text-white mt-4 font-semibold uppercase tracking-wide">Checkout Order</h1>
        </div>
      </div>

      {/* --- PROGRESS STEP INDICATORS --- */}
      <div className="relative flex justify-between items-center max-w-xl mx-auto w-full mb-10 pb-4">
        {/* Background Connecting Line */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/10 -translate-y-1/2 z-0" />
        
        {/* Active Connecting Fill Line */}
        <div 
          className="absolute top-1/2 left-0 h-0.5 bg-goldAccent -translate-y-1/2 z-0 transition-all duration-500" 
          style={{ 
            width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' 
          }} 
        />

        {[
          { num: 1, label: 'Address', icon: MapPin },
          { num: 2, label: 'Rentals', icon: Calendar },
          { num: 3, label: 'Payment', icon: CreditCard }
        ].map((s) => {
          const isCurrent = step === s.num;
          const isDone = step > s.num;
          const StepIcon = s.icon;
          return (
            <div key={s.num} className="flex flex-col items-center z-10 relative">
              {/* Stepper Circle */}
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  isCurrent 
                    ? 'bg-black border-goldAccent text-goldAccent shadow-[0_0_12px_rgba(212,168,83,0.4)] scale-110' 
                    : isDone 
                    ? 'bg-tealAccent border-tealAccent text-black' 
                    : 'bg-[#111118] border-borderCard text-gray-500'
                }`}
              >
                {isDone ? <Check className="w-5 h-5 stroke-[3px]" /> : <StepIcon className="w-4 h-4" />}
              </div>
              <span className={`text-[10px] uppercase font-bold tracking-widest mt-2 transition-colors duration-300 ${isCurrent ? 'text-goldAccent' : isDone ? 'text-tealAccent' : 'text-gray-500'}`}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Stepper views */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* STEP 1: Address selection */}
          {step === 1 && (
            <div className="flex flex-col gap-5">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-serif font-bold text-white uppercase tracking-wide">Select Shipping Address</h2>
                <button
                  onClick={() => setShowAddressForm(!showAddressForm)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-borderGold text-goldAccent text-[10px] font-bold uppercase tracking-widest hover:bg-goldAccent hover:text-black transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Address
                </button>
              </div>

              {/* Add New Address Form */}
              {showAddressForm && (
                <form onSubmit={handleSaveAddress} className="glass-card rounded-2xl p-6 border border-borderCard flex flex-col gap-4">
                  <h3 className="text-xs font-bold text-white uppercase tracking-widest border-b border-borderCard/30 pb-2">New Shipping Address</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Full Name</label>
                      <input
                        type="text"
                        required
                        value={newFullName}
                        onChange={(e) => setNewFullName(e.target.value)}
                        placeholder="John Doe"
                        className="bg-black/40 border border-borderCard rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-goldAccent"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Phone Number</label>
                      <input
                        type="tel"
                        required
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                        placeholder="9876543210"
                        className="bg-black/40 border border-borderCard rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-goldAccent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Flat/House No</label>
                      <input
                        type="text"
                        required
                        value={newFlat}
                        onChange={(e) => setNewFlat(e.target.value)}
                        placeholder="Flat 304, Block B"
                        className="bg-black/40 border border-borderCard rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-goldAccent"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <label className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Street / Road</label>
                      <input
                        type="text"
                        required
                        value={newStreet}
                        onChange={(e) => setNewStreet(e.target.value)}
                        placeholder="12th Main Road"
                        className="bg-black/40 border border-borderCard rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-goldAccent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Area / Locality</label>
                      <input
                        type="text"
                        required
                        value={newArea}
                        onChange={(e) => setNewArea(e.target.value)}
                        placeholder="Indiranagar"
                        className="bg-black/40 border border-borderCard rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-goldAccent"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">City</label>
                      <input
                        type="text"
                        required
                        value={newCity}
                        onChange={(e) => setNewCity(e.target.value)}
                        placeholder="Bangalore"
                        className="bg-black/40 border border-borderCard rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-goldAccent"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">State</label>
                      <input
                        type="text"
                        required
                        value={newState}
                        onChange={(e) => setNewState(e.target.value)}
                        placeholder="Karnataka"
                        className="bg-black/40 border border-borderCard rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-goldAccent"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">PIN Code</label>
                      <input
                        type="text"
                        required
                        value={newPincode}
                        onChange={(e) => setNewPincode(e.target.value)}
                        placeholder="560038"
                        className="bg-black/40 border border-borderCard rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-goldAccent"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Landmark (Optional)</label>
                    <input
                      type="text"
                      value={newLandmark}
                      onChange={(e) => setNewLandmark(e.target.value)}
                      placeholder="Opposite Metro Station"
                      className="bg-black/40 border border-borderCard rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-goldAccent"
                    />
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      checked={newIsDefault}
                      onChange={() => setNewIsDefault(!newIsDefault)}
                      className="rounded border-borderCard text-goldAccent focus:ring-0 bg-black/40 w-4 h-4"
                    />
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Set as Default Address</span>
                  </div>

                  <div className="flex gap-4 mt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddressForm(false)}
                      className="flex-1 py-2.5 rounded-xl bg-white/5 border border-borderCard text-xs font-semibold text-white transition-all hover:bg-white/10"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={addressMutation.isPending}
                      className="flex-1 py-2.5 rounded-xl bg-goldAccent hover:bg-goldAccent/95 text-black font-extrabold text-xs uppercase tracking-widest transition-all disabled:opacity-50"
                    >
                      {addressMutation.isPending ? 'Saving...' : 'Save Address'}
                    </button>
                  </div>

                </form>
              )}

              {/* Saved Addresses grid */}
              {addressesLoading ? (
                <div className="h-24 flex items-center justify-center text-xs text-goldAccent animate-pulse">Loading saved addresses...</div>
              ) : addresses.length === 0 ? (
                <div className="glass-card border border-borderCard rounded-2xl p-8 text-center text-xs text-gray-400">
                  No saved addresses found. Please click the &quot;+ Address&quot; button to add one.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <style>{`
                    @keyframes draw-border {
                      to {
                        stroke-dashoffset: 0;
                      }
                    }
                  `}</style>
                  {addresses.map((addr) => {
                    const selected = selectedAddressId === addr.id;
                    return (
                      <div
                        key={addr.id}
                        onClick={() => setSelectedAddressId(addr.id)}
                        className={`glass-card p-5 rounded-2xl border cursor-pointer relative transition-all flex flex-col justify-between gap-3 overflow-hidden ${
                          selected
                            ? 'border-transparent bg-goldAccent/5 shadow-[0_4px_20px_rgba(212,168,83,0.15)]'
                            : 'border-borderCard hover:border-white/10'
                        }`}
                      >
                        {/* SVG selection ring animation */}
                        {selected && (
                          <svg className="absolute inset-0 w-full h-full pointer-events-none rounded-2xl" fill="none">
                            <rect 
                              x="1" 
                              y="1" 
                              width="calc(100% - 2px)" 
                              height="calc(100% - 2px)" 
                              rx="16" 
                              stroke="hsl(var(--accent))" 
                              strokeWidth="2"
                              strokeDasharray="1000"
                              strokeDashoffset="1000"
                              className="animate-[draw-border_0.8s_ease-out_forwards]"
                            />
                          </svg>
                        )}
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-bold text-goldAccent uppercase tracking-widest bg-goldAccent/10 px-2.5 py-0.5 rounded border border-borderGold">
                              {addr.label}
                            </span>
                            <h4 className="text-xs text-white font-bold mt-2">{addr.full_name}</h4>
                            <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
                              {addr.flat}, {addr.street}, {addr.area}<br/>
                              {addr.city}, {addr.state} - {addr.pincode}
                            </p>
                          </div>
                          
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                            selected ? 'border-goldAccent bg-goldAccent text-black' : 'border-gray-600'
                          }`}>
                            {selected && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                          </div>
                        </div>
                        <span className="text-[10px] text-gray-500 font-mono">Phone: {addr.phone}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Stepper Next button */}
              <button
                onClick={() => setStep(hasRentals ? 2 : 3)}
                disabled={!selectedAddressId}
                className="w-full sm:w-auto self-end px-8 py-3 bg-goldAccent hover:bg-goldAccent/95 text-black font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md disabled:opacity-50 mt-4 flex items-center justify-center gap-1.5"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 2: Rental Duration picker (Only for rentals) */}
          {step === 2 && hasRentals && (
            <div className="flex flex-col gap-6">
              <h2 className="text-lg font-serif font-bold text-white uppercase tracking-wide">Subscription Delivery Scheduling</h2>
              
              <div className="glass-card rounded-2xl p-6 border border-borderCard flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">Set Rental Start (Delivery) Date</label>
                  <div className="flex items-center bg-black/40 border border-borderCard rounded-xl px-4 py-3 max-w-sm">
                    <Calendar className="w-4 h-4 text-goldAccent mr-3" />
                    <input
                      type="date"
                      min={new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]} // Min today + 3 days
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      className="bg-transparent border-none outline-none text-xs text-white w-full cursor-pointer"
                    />
                  </div>
                </div>

                {/* Subscriptions breakdown */}
                <div className="flex flex-col gap-3">
                  <h4 className="text-[10px] text-gray-500 font-bold uppercase tracking-widest border-b border-borderCard/30 pb-2">Active Rental Commitments</h4>
                  {cartItems.filter(i => i.mode === 'rent').map(item => (
                    <div key={item.id} className="flex justify-between items-center text-xs">
                      <div>
                        <span className="text-white font-semibold">{item.name}</span>
                        <span className="text-[10px] text-tealAccent block">Tenure: {item.rental_duration?.replace('_', ' ')}</span>
                      </div>
                      <div className="text-right text-[10px] text-gray-500">
                        <span>End Date: {getReturnDate(deliveryDate)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 self-end mt-4">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-2.5 rounded-xl border border-borderCard text-xs font-semibold text-white hover:bg-white/5"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="px-8 py-2.5 rounded-xl bg-goldAccent hover:bg-goldAccent/95 text-black font-extrabold text-xs uppercase tracking-widest transition-all shadow-md flex items-center gap-1.5"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Confirm Payment summary */}
          {step === 3 && (
            <div className="flex flex-col gap-6">
              <h2 className="text-lg font-serif font-bold text-white uppercase tracking-wide">Confirm Payment details</h2>

              <div className="glass-card rounded-2xl p-6 border border-borderCard flex flex-col gap-6">
                
                {/* Delivery details display */}
                <div>
                  <h4 className="text-[10px] text-gray-500 font-bold uppercase tracking-widest border-b border-borderCard/30 pb-2 mb-3">Shipping Details</h4>
                  {addresses.filter(a => a.id === selectedAddressId).map(addr => (
                    <div key={addr.id} className="text-xs text-gray-300 leading-relaxed">
                      <strong className="text-white">{addr.full_name}</strong> &nbsp;|&nbsp; {addr.phone}<br/>
                      {addr.flat}, {addr.street}, {addr.area}, {addr.city}, {addr.state} - {addr.pincode}
                    </div>
                  ))}
                </div>

                {/* Payments integration instructions */}
                <div className="flex items-start gap-3 bg-goldAccent/5 border border-borderGold/30 p-4 rounded-xl">
                  <ShieldCheck className="w-5 h-5 text-goldAccent flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-white tracking-wide">Secured Checkout Gateway</h4>
                    <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
                      Payments are verified securely via Razorpay. Your details are encrypted. Enjoy refund support and security guarantees.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 self-end mt-4">
                <button
                  onClick={() => setStep(hasRentals ? 2 : 1)}
                  className="px-6 py-2.5 rounded-xl border border-borderCard text-xs font-semibold text-white hover:bg-white/5"
                >
                  Back
                </button>
                
                <button
                  onClick={handlePaymentInitiate}
                  className="px-10 py-3 rounded-xl bg-goldAccent hover:bg-goldAccent/95 text-black font-extrabold text-xs uppercase tracking-widest transition-all shadow-[0_4px_16px_rgba(212,168,83,0.3)]"
                >
                  Pay Now {formatCurrency(finalTotal)}
                </button>
              </div>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: Sidebar Summary */}
        <div className="lg:col-span-4 glass-card rounded-3xl p-6 border border-borderCard sticky top-[85px] flex flex-col gap-5">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-borderCard/30 pb-3">
            In Your Cart
          </h3>

          {/* Cart items list preview */}
          <div className="flex flex-col gap-3.5 max-h-[220px] overflow-y-auto pr-1">
            {cartItems.map((item) => {
              const itemPrice = item.mode === 'rent' ? parseFloat(item.rent_price_month) : parseFloat(item.buy_price);
              return (
                <div key={item.id} className="flex justify-between items-center gap-3 text-xs">
                  <div className="min-w-0 flex-1">
                    <span className="text-white font-semibold block truncate leading-tight">{item.name}</span>
                    <span className="text-[10px] text-gray-500 block mt-0.5">Qty: {item.quantity} | {item.mode === 'rent' ? 'Rental' : 'Purchase'}</span>
                  </div>
                  <span className="text-white font-mono font-bold whitespace-nowrap">{formatCurrency(itemPrice * item.quantity)}</span>
                </div>
              );
            })}
          </div>

          {/* Totals Summary */}
          <div className="border-t border-borderCard/30 pt-4 flex flex-col gap-2.5 text-xs text-gray-400">
            <div className="flex justify-between items-center">
              <span>Subtotal:</span>
              <span className="text-white font-bold">{formatCurrency(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>GST (18%):</span>
              <span className="text-white font-bold">{formatCurrency(totals.gst)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Delivery:</span>
              <span className="text-white font-bold">
                {totals.deliveryCharge === 0 ? <span className="text-tealAccent">FREE</span> : formatCurrency(totals.deliveryCharge)}
              </span>
            </div>
            {totals.deposit > 0 && (
              <div className="flex justify-between items-center">
                <span>Security Deposit:</span>
                <span className="text-white font-bold">{formatCurrency(totals.deposit)}</span>
              </div>
            )}
            
            {appliedPromo && (
              <div className="flex justify-between items-center text-tealAccent font-bold pt-1.5 border-t border-borderCard/10">
                <span>Promo ({appliedPromo}):</span>
                <span>−{formatCurrency(discountValue)}</span>
              </div>
            )}
          </div>

          {/* Grand Total */}
          <div className="border-t border-borderCard/30 pt-4 flex justify-between items-center">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Grand Total:</span>
            <span className="text-xl font-serif font-extrabold text-goldAccent">{formatCurrency(finalTotal)}</span>
          </div>

        </div>

      </div>

      {/* --- MOCK RAZORPAY GATEWAY MODAL OVERLAY --- */}
      {showMockPaymentGateway && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md">
          <div className="bg-[#1a1a24] border border-borderGold rounded-2xl max-w-md w-full mx-4 overflow-hidden shadow-2xl relative">
            
            {/* Modal Header */}
            <div className="bg-[#111118] px-6 py-4 border-b border-borderCard flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Razorpay Test Mode</span>
                <span className="text-xs font-extrabold text-white mt-0.5">RentEase Payments Simulator</span>
              </div>
              <button
                onClick={() => {
                  setShowMockPaymentGateway(false);
                  setMockPaymentStatus('idle');
                }}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex flex-col gap-5">
              
              <div className="text-center bg-black/30 p-5 rounded-xl border border-borderCard">
                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest block mb-1">Paying To RentEase</span>
                <span className="text-2xl font-serif font-extrabold text-goldAccent">{formatCurrency(finalTotal)}</span>
              </div>

              {mockPaymentStatus === 'idle' ? (
                <div className="flex flex-col gap-4">
                  <div className="text-xs text-gray-400 leading-relaxed text-center">
                    Simulate a secure transaction. Click &quot;Authorize Test Payment&quot; below. The server will mock verify using HMACS.
                  </div>
                  
                  <div className="flex flex-col gap-3 mt-2">
                    <div className="flex justify-between items-center text-[10px] text-gray-500 font-bold uppercase tracking-wider border-b border-borderCard/20 pb-2">
                      <span>Method</span>
                      <span>Status</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-300">
                      <span>Google Pay / UPI</span>
                      <span className="text-tealAccent font-bold">Enabled</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-300">
                      <span>Debit & Credit Card</span>
                      <span className="text-tealAccent font-bold">Enabled</span>
                    </div>
                  </div>

                  <button
                    onClick={handleMockPaymentComplete}
                    className="w-full py-3.5 rounded-xl bg-goldAccent hover:bg-goldAccent/95 text-black font-extrabold text-xs uppercase tracking-widest transition-all mt-4 shadow-lg"
                  >
                    Authorize Test Payment
                  </button>
                </div>
              ) : mockPaymentStatus === 'processing' ? (
                <div className="py-8 flex flex-col items-center gap-4 text-center">
                  <div className="w-12 h-12 border-4 border-goldAccent/25 border-t-goldAccent rounded-full animate-spin" />
                  <div className="flex flex-col gap-1">
                    <h4 className="text-sm text-white font-bold uppercase tracking-wider">Processing Transaction</h4>
                    <p className="text-[10px] text-gray-500 font-medium">Validating signatures with Postgres orders...</p>
                  </div>
                </div>
              ) : (
                <div className="py-8 flex flex-col items-center gap-4 text-center">
                  <div className="w-12 h-12 bg-tealAccent/20 border border-tealAccent/30 rounded-full flex items-center justify-center text-tealAccent">
                    <Check className="w-6 h-6 stroke-[3px]" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <h4 className="text-sm text-tealAccent font-bold uppercase tracking-wider">Payment Authorized</h4>
                    <p className="text-[10px] text-gray-500 font-medium">Redirecting to invoices...</p>
                  </div>
                </div>
              )}

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
