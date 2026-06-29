import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, ShoppingCart, Calendar, Truck, Clock, RefreshCw, Send, Star, Shield, ArrowLeft, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { products } from '../data/products';
import { Product, ProductVariant, Review } from '../types';
import { useMode } from '../context/ModeContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ThreeDViewer } from '../three/ThreeDViewer';
import { DetailSkeleton } from '../components/Skeletons';

const getMockReviews = (productId: number): Review[] => {
  const localReviews = JSON.parse(localStorage.getItem(`rentease_reviews_${productId}`) || '[]');
  const defaultReviews: Review[] = [
    {
      id: 1000 + productId * 10 + 1,
      rating: 5,
      review_text: "Absolutely stunning product! The quality of the materials is premium and it fits perfectly in my space. The delivery team was extremely professional.",
      created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
      user_name: "Sarah Jenkins",
      user_avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Sarah"
    },
    {
      id: 1000 + productId * 10 + 2,
      rating: 4,
      review_text: "Very comfortable and durable. The visual appeal matches the pictures perfectly. Had a slight delay in delivery, but the support team kept me updated.",
      created_at: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString(),
      user_name: "Michael Chen",
      user_avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Michael"
    }
  ];
  return [...localReviews, ...defaultReviews];
};

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { mode } = useMode();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const { showToast } = useToast();

  // --- COMPONENT STATES ---
  const [activeTab, setActiveTab] = useState<'gallery' | '360'>('gallery');
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  
  // Accordions Toggles
  const [showSpecs, setShowSpecs] = useState(true);
  const [showTerms, setShowTerms] = useState(false);
  const [showDelivery, setShowDelivery] = useState(false);

  // Rental Calendar picker (Start date)
  const [rentalStartDate, setRentalStartDate] = useState(
    new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Defaults to Today + 3 days
  );
  const [rentalDuration, setRentalDuration] = useState('3_months');

  // Review Form States
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewError, setReviewError] = useState<string | null>(null);

  // Fetch product data
  const { data, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const productId = parseInt(id || '');
      const prod = products.find(p => p.id === productId);
      if (!prod) {
        throw new Error('Product not found.');
      }

      const productReviews = getMockReviews(productId);
      const categoryRecommendations = products
        .filter(p => p.id !== productId && p.category === prod.category)
        .slice(0, 6)
        .map(p => ({
          ...p,
          thumbnail: p.variants?.[0]?.images?.[0] || p.thumbnail
        }));

      return {
        product: prod,
        variants: prod.variants || [],
        reviews: productReviews,
        recommendations: categoryRecommendations.length > 0 
          ? categoryRecommendations 
          : products.filter(p => p.id !== productId).slice(0, 6)
      };
    }
  });

  const product = data?.product as Product;
  const variants: ProductVariant[] = data?.variants || [];
  const reviews: Review[] = data?.reviews || [];
  const recommendations: Product[] = data?.recommendations || [];

  // Reset indices on product swap
  useEffect(() => {
    setSelectedVariantIndex(0);
    setSelectedImageIndex(0);
    setActiveTab('gallery');
  }, [id]);

  // Submit Review Mutation
  const reviewMutation = useMutation({
    mutationFn: async (payload: { rating: number; reviewText: string }) => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      
      const newReview: Review = {
        id: Date.now(),
        rating: payload.rating,
        review_text: payload.reviewText,
        created_at: new Date().toISOString(),
        user_name: user?.name || 'Anonymous User',
        user_avatar: user?.profile_picture || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user?.name || 'Anonymous'}`
      };

      const existingReviews = JSON.parse(localStorage.getItem(`rentease_reviews_${id}`) || '[]');
      existingReviews.unshift(newReview);
      localStorage.setItem(`rentease_reviews_${id}`, JSON.stringify(existingReviews));

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', id] });
      setReviewText('');
      setReviewRating(5);
      setReviewError(null);
      showToast('Thank you! Your review has been added.', 'success');
    },
    onError: () => {
      setReviewError('Failed to submit review.');
    }
  });

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast('You must be logged in to submit a review.', 'error');
      return;
    }
    if (reviewText.trim() === '') {
      setReviewError('Review description cannot be empty.');
      return;
    }
    reviewMutation.mutate({ rating: reviewRating, reviewText });
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-10">
        <DetailSkeleton />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-20 text-center">
        <h3 className="font-serif text-lg text-white font-bold uppercase">Product not found</h3>
        <button onClick={() => navigate('/products')} className="mt-4 px-6 py-2 rounded-full bg-goldAccent text-black font-bold text-xs uppercase">
          Back to Browse
        </button>
      </div>
    );
  }

  // Extract active images
  const activeVariant = variants[selectedVariantIndex];
  let imagesList: string[] = [];
  if (activeVariant) {
    try {
      imagesList = typeof activeVariant.images === 'string'
        ? JSON.parse(activeVariant.images)
        : activeVariant.images;
    } catch (e) {
      if (Array.isArray(activeVariant.images)) {
        imagesList = activeVariant.images;
      }
    }
  }

  // Delivery Date Estimator (Today + 3 business days)
  const getEstimatedDelivery = () => {
    const date = new Date();
    date.setDate(date.getDate() + 3);
    return date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  // Category specific features
  const getCategoryFeatures = (cat: string) => {
    const list: Record<string, string[]> = {
      'Sofa': [
        'High-density pocket spring foam cushions for optimal posture support',
        'Stain-resistant and easy-clean premium luxury upholstery fabric',
        'Solid kiln-dried pine wood inner frame structure preventing wraps',
        'Rust-proof powder-coated metallic support legs in gold accent finish',
        'Plush velvet feel that is soft, breathable, and highly durable'
      ],
      'Bed': [
        'Integrated heavy-duty hydraulic gas lift under-bed storage frame',
        'Robust solid teak and sheesham wood outer board structure',
        'Tufted velvet upholstered headboard for comfortable back resting',
        'Zero-creak joinery with reinforced steel angle brackets',
        'Smooth polished wood edges to prevent scrapes and splintering'
      ],
      'Table': [
        'Solid engineered wood core top with thick scratch-resistant veneer finish',
        'High structural load capacity supporting up to 120 kg of weight',
        'Polished chamfered edges for a sleek, contemporary silhouette',
        'Solid oak wood support legs featuring self-leveling base pads',
        'Stain-proof surface coating safe for hot beverages and meals'
      ],
      'TV': [
        'Gorgeous 4K Ultra HD panel screen with high-dynamic color range (HDR10+)',
        'Built-in smart voice control Google TV OS with preloaded stream portals',
        'Bezel-less design displaying 97% active screen-to-body viewing ratio',
        'Deep Dolby Atmos stereo speakers offering surround cinema sounds',
        'Dual HDMI 2.1 and high-speed USB ports supporting gaming consoles'
      ]
    };

    const key = Object.keys(list).find(k => cat.toLowerCase().includes(k.toLowerCase()));
    return list[key || 'Sofa'] || [
      'Ergonomic structure crafted for maximum bodily comfort',
      'Ultra-durable materials certified for long-term usage standards',
      'Minimalist dark luxury aesthetic blending with modern homes',
      'Corrosion and rust resistant fittings and assembly hardware',
      'Eco-friendly low emission polishes and safe non-toxic fabrics'
    ];
  };

  const productFeatures = getCategoryFeatures(product.category);
  const formatCurrency = (val: string | number) => `₹${parseFloat(val as string).toLocaleString('en-IN')}`;

  const wishlisted = isWishlisted(product.id);
  const isOutOfStock = product.stock_quantity < 1;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 flex flex-col gap-10">
      
      {/* Back button */}
      <button
        onClick={() => navigate('/products')}
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white font-bold uppercase tracking-widest transition-all w-fit"
      >
        <ArrowLeft className="w-4 h-4 text-goldAccent" />
        <span>Back to Browse</span>
      </button>

      {/* Main product display card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* LEFT COLUMN - Image gallery / 360 viewer */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          
          {/* Gallery / 360 Tabs */}
          <div className="flex bg-black/40 border border-borderCard rounded-xl p-1 w-fit">
            <button
              onClick={() => setActiveTab('gallery')}
              className={`text-xs px-4 py-2 rounded-lg font-bold tracking-wider uppercase transition-all ${
                activeTab === 'gallery' ? 'bg-goldAccent text-black' : 'text-gray-400 hover:text-white'
              }`}
            >
              Gallery
            </button>
            <button
              onClick={() => setActiveTab('360')}
              className={`text-xs px-4 py-2 rounded-lg font-bold tracking-wider uppercase transition-all ${
                activeTab === '360' ? 'bg-goldAccent text-black' : 'text-gray-400 hover:text-white'
              }`}
            >
              360° View
            </button>
          </div>

          {/* Active View Display */}
          <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden border border-borderCard bg-black relative">
            {activeTab === 'gallery' ? (
              <AnimatePresence mode="wait">
                <motion.img
                  key={selectedImageIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  src={imagesList[selectedImageIndex] || 'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=800'}
                  alt={product.name}
                  className="w-full h-full object-cover absolute inset-0"
                />
              </AnimatePresence>
            ) : (
              <ThreeDViewer
                category={product.category}
                currentColorHex={activeVariant?.colour_hex || '#FFFFFF'}
              />
            )}
            
            {/* Heart wish toggle inside gallery */}
            <button
              onClick={() => toggleWishlist(product.id)}
              className={`absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border flex items-center justify-center transition-all ${
                wishlisted ? 'border-goldAccent text-goldAccent' : 'border-white/10 text-gray-400 hover:text-white'
              }`}
            >
              <Heart className={`w-5 h-5 ${wishlisted ? 'fill-goldAccent' : ''}`} />
            </button>
          </div>

          {/* Thumbnail Strip (Gallery Mode Only) */}
          {activeTab === 'gallery' && imagesList.length > 0 && (
            <div className="grid grid-cols-4 gap-4">
              {imagesList.map((url, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`aspect-[4/3] rounded-xl overflow-hidden border transition-all ${
                    selectedImageIndex === idx ? 'border-goldAccent scale-102 ring-1 ring-goldAccent' : 'border-borderCard hover:border-white/20'
                  }`}
                >
                  <img src={url} alt={`Angle ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN - Spec and Buying Actions */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-goldAccent font-bold uppercase tracking-widest bg-goldAccent/5 border border-borderGold px-3 py-1 rounded-full">
                {product.brand}
              </span>
              <span className="text-[10px] text-tealAccent font-bold uppercase tracking-widest bg-tealAccent/10 border border-tealAccent/20 px-3 py-1 rounded-full">
                {product.condition_type.replace('_', ' ')}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mt-4 tracking-wide uppercase">
              {product.name}
            </h1>
            
            {/* Rating */}
            <div className="flex items-center gap-2 mt-3 text-sm">
              <div className="flex text-goldAccent">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-lg">
                    {i < Math.round(parseFloat(product.rating)) ? '★' : '☆'}
                  </span>
                ))}
              </div>
              <span className="text-xs text-gray-400 font-semibold">{product.rating} / 5.0</span>
              <span className="text-xs text-gray-500 font-medium">({product.review_count} customer reviews)</span>
            </div>
          </div>

          {/* Prices block */}
          <div className="glass-card rounded-2xl p-5 border border-borderCard flex items-center justify-between">
            {mode === 'rent' ? (
              <div>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block">Monthly Subscription</span>
                <span className="text-3xl font-serif font-extrabold text-white">
                  {formatCurrency(product.rent_price_month)}
                </span>
                <span className="text-xs text-gray-400 font-medium"> / month</span>
                <span className="text-[10px] text-gray-500 block mt-1">Weekly equivalent: {formatCurrency(product.rent_price_week)}/week</span>
              </div>
            ) : (
              <div>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block">Outright Purchase</span>
                <span className="text-3xl font-serif font-extrabold text-white">
                  {formatCurrency(product.buy_price)}
                </span>
                <span className="text-[10px] text-gray-500 block mt-1">Free Delivery & Assembly included</span>
              </div>
            )}

            {/* Availability */}
            <div className="text-right">
              <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${
                product.stock_quantity > 0
                  ? 'bg-tealAccent/10 border-tealAccent/20 text-tealAccent'
                  : 'bg-[#ff5b5b]/10 border-[#ff5b5b]/20 text-[#ff5b5b]'
              }`}>
                {product.stock_quantity > 0 ? 'In Stock' : 'Out of Stock'}
              </span>
              <span className="text-[10px] text-gray-500 block mt-2">Ships in 3 days</span>
            </div>
          </div>

          {/* Color Swatch Selectors */}
          <div>
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Select Colour</h4>
            <div className="flex gap-3">
              {variants.map((v, vIdx) => (
                <button
                  key={v.id}
                  onClick={() => {
                    setSelectedVariantIndex(vIdx);
                    setSelectedImageIndex(0);
                  }}
                  className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
                    selectedVariantIndex === vIdx ? 'ring-2 ring-goldAccent scale-110 border-black' : 'border-borderCard hover:scale-105'
                  }`}
                  style={{ backgroundColor: v.colour_hex }}
                  title={v.colour_name}
                >
                  {selectedVariantIndex === vIdx && (
                    <Check className={`w-4 h-4 ${v.colour_name === 'White' || v.colour_name === 'Beige' ? 'text-black' : 'text-white'}`} />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* RENTAL OPTIONS (StartDate & Duration) */}
          {mode === 'rent' && (
            <div className="glass-card rounded-2xl p-5 border border-borderCard/50 flex flex-col gap-4">
              <h4 className="text-[10px] font-bold text-goldAccent uppercase tracking-widest flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Subscription Settings
              </h4>
              <div className="grid grid-cols-2 gap-4">
                {/* Delivery/Rental Start date */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Delivery Date</label>
                  <input
                    type="date"
                    min={new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]} // Min today + 3 days
                    value={rentalStartDate}
                    onChange={(e) => setRentalStartDate(e.target.value)}
                    className="bg-black/40 border border-borderCard rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-goldAccent"
                  />
                </div>
                
                {/* Duration */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Rental Tenure</label>
                  <select
                    value={rentalDuration}
                    onChange={(e) => setRentalDuration(e.target.value)}
                    className="bg-black/40 border border-borderCard rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-goldAccent"
                  >
                    <option value="3_months" className="bg-[#111118]">3 Months Plan</option>
                    <option value="6_months" className="bg-[#111118]">6 Months Plan</option>
                    <option value="9_months" className="bg-[#111118]">9 Months Plan</option>
                    <option value="12_months" className="bg-[#111118]">12 Months Plan</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ADD TO CART ACTION */}
          <div>
            {isOutOfStock ? (
              <button className="w-full py-4 rounded-xl bg-transparent border border-borderCard text-sm text-gray-500 font-bold uppercase tracking-widest transition-all">
                Item Out Of Stock
              </button>
            ) : (
              <motion.button
                onClick={() => {
                  if (activeVariant) {
                    addToCart(product.id, activeVariant.id, 1, mode, rentalDuration);
                    showToast('Added to cart successfully!', 'success');
                  }
                }}
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                className="w-full py-4 rounded-xl bg-goldAccent hover:bg-goldAccent/95 text-black font-extrabold text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-[0_8px_24px_rgba(212,168,83,0.2)] cursor-pointer"
              >
                <ShoppingCart className="w-4.5 h-4.5 stroke-[2.5px]" />
                <span>Add to Shopping Cart</span>
              </motion.button>
            )}
            
            {/* Delivery Date Estimator */}
            <div className="flex items-center gap-2 text-[10px] text-gray-400 justify-center mt-3 font-semibold uppercase tracking-wider">
              <Truck className="w-3.5 h-3.5 text-goldAccent" />
              <span>Estimated Delivery: {getEstimatedDelivery()}</span>
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-borderCard/30 pb-2">Description</h4>
            <p className="text-xs text-gray-300 leading-relaxed font-light">{product.description}</p>
          </div>

          {/* Features */}
          <div className="flex flex-col gap-2">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-borderCard/30 pb-2">Key Features</h4>
            <ul className="list-disc pl-4 text-xs text-gray-400 flex flex-col gap-1.5 font-light leading-relaxed">
              {productFeatures.map((feat, idx) => (
                <li key={idx}>{feat}</li>
              ))}
            </ul>
          </div>

        </div>

      </div>

      {/* --- COLLAPSIBLE DETAILS ACCORDIONS --- */}
      <div className="flex flex-col gap-3 mt-8">
        
        {/* Specifications Table */}
        <div className="glass-card rounded-2xl border border-borderCard overflow-hidden">
          <button
            onClick={() => setShowSpecs(!showSpecs)}
            className="w-full px-6 py-4 flex justify-between items-center text-xs font-bold text-goldAccent uppercase tracking-widest bg-white/2 focus:outline-none"
          >
            <span>Product Specifications</span>
            <span>{showSpecs ? '−' : '+'}</span>
          </button>
          {showSpecs && (
            <div className="p-6 border-t border-borderCard/30 overflow-x-auto">
              <table className="min-w-full text-xs text-left text-gray-300">
                <tbody>
                  <tr className="border-b border-borderCard/10">
                    <td className="py-2.5 font-bold uppercase text-gray-500 w-1/3">Brand</td>
                    <td className="py-2.5 text-white">{product.brand}</td>
                  </tr>
                  <tr className="border-b border-borderCard/10">
                    <td className="py-2.5 font-bold uppercase text-gray-500">Material</td>
                    <td className="py-2.5 text-white">{product.material}</td>
                  </tr>
                  <tr className="border-b border-borderCard/10">
                    <td className="py-2.5 font-bold uppercase text-gray-500">Dimensions (L x W x H)</td>
                    <td className="py-2.5 text-white">{product.dimensions}</td>
                  </tr>
                  <tr className="border-b border-borderCard/10">
                    <td className="py-2.5 font-bold uppercase text-gray-500">Weight</td>
                    <td className="py-2.5 text-white">{product.weight}</td>
                  </tr>
                  <tr className="border-b border-borderCard/10">
                    <td className="py-2.5 font-bold uppercase text-gray-500">Warranty</td>
                    <td className="py-2.5 text-white">{product.warranty}</td>
                  </tr>
                  <tr className="border-b border-borderCard/10">
                    <td className="py-2.5 font-bold uppercase text-gray-500">Assembly Required</td>
                    <td className="py-2.5 text-white">Yes (Free white-glove setup included)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Rental terms (Only visible in Rent mode) */}
        {mode === 'rent' && (
          <div className="glass-card rounded-2xl border border-borderCard overflow-hidden">
            <button
              onClick={() => setShowTerms(!showTerms)}
              className="w-full px-6 py-4 flex justify-between items-center text-xs font-bold text-goldAccent uppercase tracking-widest bg-white/2 focus:outline-none"
            >
              <span>Rental Terms & Conditions</span>
              <span>{showTerms ? '−' : '+'}</span>
            </button>
            {showTerms && (
              <div className="p-6 border-t border-borderCard/30 text-xs text-gray-400 flex flex-col gap-3 font-light leading-relaxed">
                <p>
                  <strong>Security Deposit:</strong> A fully refundable security deposit equivalent to 1 month of subscription price is collected at checkout. This will be refunded to your source payment account within 7 days of successful return check.
                </p>
                <p>
                  <strong>Damage Policy:</strong> Minor wear and tear (under 2cm scratches, faint stains) is completely covered. Structural breaks, deep burns, or water damages will be evaluated, and repair costs will be deducted from the security deposit.
                </p>
                <p>
                  <strong>Early Return:</strong> You can terminate your rental tenure early. However, pricing will be recalculated retrospectively based on the actual months kept, and the difference will be adjusted against the refund.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Delivery & Returns */}
        <div className="glass-card rounded-2xl border border-borderCard overflow-hidden">
          <button
            onClick={() => setShowDelivery(!showDelivery)}
            className="w-full px-6 py-4 flex justify-between items-center text-xs font-bold text-goldAccent uppercase tracking-widest bg-white/2 focus:outline-none"
          >
            <span>Delivery & Returns Policies</span>
            <span>{showDelivery ? '−' : '+'}</span>
          </button>
          {showDelivery && (
            <div className="p-6 border-t border-borderCard/30 text-xs text-gray-400 flex flex-col gap-3 font-light leading-relaxed">
              <p>
                <strong>Delivery Timeline:</strong> We deliver and assemble within 3 business days. Deliveries are scheduled between 9:00 AM and 7:00 PM. Our team will call you 2 hours prior to arrival.
              </p>
              <p>
                <strong>Free Delivery:</strong> All orders above ₹5,000 (total purchase value or monthly rental subtotal) qualify for Free Delivery and White-Glove assembly. Orders below ₹5,000 carry a flat delivery charge of ₹350.
              </p>
              <p>
                <strong>Return Window:</strong> For Buy mode, we offer a 30-day return window if the item is in unused condition. For Rent mode, returns are scheduled at the end of the subscription tenure with free pick-up.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* --- CUSTOMER REVIEWS SYSTEM --- */}
      <section className="mt-8 border-t border-borderCard/30 pt-10">
        <h2 className="text-xl font-serif text-white uppercase tracking-wide mb-6">Customer Reviews</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Reviews List */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {reviews.length === 0 ? (
              <div className="glass-card rounded-2xl p-6 border border-borderCard text-center text-xs text-gray-400">
                No reviews yet for this product. Be the first to share your experience!
              </div>
            ) : (
              reviews.map((rev) => (
                <div key={rev.id} className="glass-card rounded-2xl p-5 border border-borderCard flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <img
                        src={rev.user_avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${rev.user_name}`}
                        alt={rev.user_name}
                        className="w-7 h-7 rounded-full object-cover border border-borderGold"
                      />
                      <div>
                        <h4 className="text-xs text-white font-bold">{rev.user_name}</h4>
                        <span className="text-[9px] text-gray-500">{new Date(rev.created_at).toLocaleDateString('en-IN')}</span>
                      </div>
                    </div>
                    
                    <div className="flex text-goldAccent gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-goldAccent' : ''}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed">{rev.review_text}</p>
                </div>
              ))
            )}
          </div>

          {/* Add Review Form */}
          <div className="lg:col-span-5">
            {user ? (
              <form onSubmit={handleReviewSubmit} className="glass-card rounded-2xl p-6 border border-borderCard flex flex-col gap-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Write a Review</h3>
                
                {reviewError && (
                  <div className="bg-[#ff5b5b]/10 border border-[#ff5b5b]/30 text-[#ff5b5b] p-3 rounded-xl text-[10px] text-center">
                    {reviewError}
                  </div>
                )}

                {/* Rating selection */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Your Rating:</span>
                  <div className="flex text-goldAccent gap-1 cursor-pointer">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setReviewRating(star)}
                        className="text-lg focus:outline-none"
                      >
                        {star <= reviewRating ? '★' : '☆'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Text input */}
                <div className="flex flex-col gap-1.5">
                  <textarea
                    rows={4}
                    required
                    placeholder="Share your experience with RentEase furniture quality, delivery, or comfort level..."
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    className="bg-black/40 border border-borderCard rounded-xl p-3 text-xs text-white outline-none focus:border-goldAccent placeholder-gray-600 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={reviewMutation.isPending}
                  className="py-2.5 rounded-xl bg-goldAccent hover:bg-goldAccent/95 text-black font-extrabold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{reviewMutation.isPending ? 'Submitting...' : 'Post Review'}</span>
                </button>
              </form>
            ) : (
              <div className="glass-card rounded-2xl p-6 border border-borderCard text-center">
                <p className="text-xs text-gray-400 mb-4">Please log in to share your rating and review for this product.</p>
                <button
                  onClick={() => navigate('/login')}
                  className="px-6 py-2.5 rounded-xl bg-transparent border border-borderGold text-goldAccent hover:bg-goldAccent hover:text-black font-extrabold text-xs uppercase tracking-widest transition-all"
                >
                  Log In to Review
                </button>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* --- RECOMMENDATIONS ("You may also like") --- */}
      {recommendations.length > 0 && (
        <section className="mt-8 border-t border-borderCard/30 pt-10">
          <h2 className="text-xl font-serif text-white uppercase tracking-wide mb-6">You May Also Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                onClick={() => navigate(`/products/${rec.id}`)}
                className="glass-card rounded-xl p-3 border border-borderCard hover:border-goldAccent/20 cursor-pointer transition-all flex flex-col gap-2"
              >
                <img
                  src={rec.thumbnail || 'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=200'}
                  alt={rec.name}
                  className="w-full aspect-square object-cover rounded-lg border border-borderCard"
                />
                <h4 className="text-xs font-bold text-white truncate">{rec.name}</h4>
                <p className="text-[10px] text-gray-500 font-mono">
                  {mode === 'rent' ? `${formatCurrency(rec.rent_price_month)}/mo` : formatCurrency(rec.buy_price)}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
