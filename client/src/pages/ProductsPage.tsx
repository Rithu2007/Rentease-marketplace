import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, SlidersHorizontal, Heart, ShoppingCart, RefreshCw, Layers, Bell, Check, X } from 'lucide-react';
import { products } from '../data/products';
import { Product, ProductVariant } from '../types';
import { useMode } from '../context/ModeContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import { ProductGridSkeleton } from '../components/Skeletons';

// Fly to Cart Animation Helper
const performFlyToCartAnimation = (startElement: HTMLImageElement) => {
  const cartIcon = document.getElementById('nav-cart-icon');
  if (!cartIcon || !startElement) return;

  const startRect = startElement.getBoundingClientRect();
  const endRect = cartIcon.getBoundingClientRect();

  // Create flyer clone
  const flyer = document.createElement('div');
  flyer.style.position = 'fixed';
  flyer.style.top = `${startRect.top}px`;
  flyer.style.left = `${startRect.left}px`;
  flyer.style.width = `${startRect.width}px`;
  flyer.style.height = `${startRect.height}px`;
  flyer.style.backgroundImage = `url(${startElement.src || ''})`;
  flyer.style.backgroundSize = 'cover';
  flyer.style.backgroundPosition = 'center';
  flyer.style.borderRadius = '12px';
  flyer.style.pointerEvents = 'none';
  flyer.style.zIndex = '99999';
  flyer.style.opacity = '0.9';
  
  // Apply initial transition styling
  flyer.style.transition = 'all 0.8s cubic-bezier(0.19, 1, 0.22, 1)';
  document.body.appendChild(flyer);

  // Trigger animation after layout render
  requestAnimationFrame(() => {
    flyer.style.top = `${endRect.top + endRect.height / 2 - 15}px`;
    flyer.style.left = `${endRect.left + endRect.width / 2 - 15}px`;
    flyer.style.width = '30px';
    flyer.style.height = '30px';
    flyer.style.opacity = '0.2';
    flyer.style.transform = 'scale(0.2) rotate(360deg)';
  });

  // Remove element and add target class pop
  setTimeout(() => {
    flyer.remove();
    cartIcon.classList.add('scale-125', 'text-tealAccent');
    setTimeout(() => {
      cartIcon.classList.remove('scale-125', 'text-tealAccent');
    }, 300);
  }, 850);
};

// Standalone Interactive Product Card Component
const ProductCard: React.FC<{
  product: Product;
  wishlisted: boolean;
  isOutOfStock: boolean;
  activeVariantIndex: number;
  onVariantChange: (vIdx: number) => void;
  isCompared: boolean;
  mode: 'rent' | 'buy';
  onToggleWishlist: () => void;
  onCompareToggle: () => void;
  onAddToCart: (variant: ProductVariant, e: React.MouseEvent) => void;
  onNavigate: () => void;
  onQuickView: () => void;
  searchQuery: string;
}> = ({
  product,
  wishlisted,
  isOutOfStock,
  activeVariantIndex,
  onVariantChange,
  isCompared,
  mode,
  onToggleWishlist,
  onCompareToggle,
  onAddToCart,
  onNavigate,
  onQuickView,
  searchQuery,
}) => {
  const [tiltStyle, setTiltStyle] = useState<React.CSSProperties>({});
  const [hearts, setHearts] = useState<{ id: number; angle: number; delay: number }[]>([]);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    // Calculate tilt angles (Max 6 degrees rotation)
    const rotateX = -((y - centerY) / centerY) * 6;
    const rotateY = ((x - centerX) / centerX) * 6;
    
    setTiltStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`,
      transition: 'transform 0.05s ease-out, border-color 0.3s ease',
      zIndex: 10,
    });
  };

  const handleMouseLeave = () => {
    setTiltStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
      transition: 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1), border-color 0.3s ease',
    });
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleWishlist();
    if (!wishlisted) {
      // Spawn 6 heart explosion particles
      const newHearts = Array.from({ length: 6 }).map((_, i) => ({
        id: Date.now() + i,
        angle: (i * 60) + Math.random() * 20,
        delay: Math.random() * 0.1,
      }));
      setHearts(newHearts);
      setTimeout(() => setHearts([]), 1000);
    }
  };

  // Extract active variant details
  const productVariants = product.variants || [];
  const activeVariant = productVariants[activeVariantIndex];
  let imageSrc = 'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=400';
  if (activeVariant) {
    try {
      const parsedImgs = typeof activeVariant.images === 'string'
        ? JSON.parse(activeVariant.images)
        : activeVariant.images;
      if (Array.isArray(parsedImgs) && parsedImgs.length > 0) {
        imageSrc = parsedImgs[0];
      }
    } catch (e) {
      if (Array.isArray(activeVariant.images) && activeVariant.images.length > 0) {
        imageSrc = activeVariant.images[0];
      }
    }
  }

  // Highlight helper
  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi'));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase()
            ? <span key={i} className="text-goldAccent font-semibold px-0.5 rounded bg-goldAccent/10">{part}</span>
            : part
        )}
      </>
    );
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={tiltStyle}
      className="glass-card group rounded-2xl overflow-hidden p-3 border border-borderCard flex flex-col justify-between relative hover:border-goldAccent/25 transition-all duration-300 transform-style-3d"
    >
      {/* Wishlist toggle */}
      <button
        onClick={handleWishlistClick}
        className={`absolute top-5 right-5 z-20 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border flex items-center justify-center transition-all ${
          wishlisted
            ? 'border-goldAccent text-goldAccent'
            : 'border-white/10 text-gray-400 hover:text-white hover:border-white/30'
        }`}
      >
        <Heart className={`w-4 h-4 transition-transform ${wishlisted ? 'fill-goldAccent scale-110' : 'group-hover:scale-110'}`} />
        
        {/* Heart Burst Particle Effect */}
        {hearts.map((h) => {
          const distance = 40 + Math.random() * 20;
          const rad = (h.angle * Math.PI) / 180;
          const tx = Math.cos(rad) * distance;
          const ty = Math.sin(rad) * distance;
          return (
            <motion.span
              key={h.id}
              initial={{ opacity: 1, scale: 0.5, x: 0, y: 0 }}
              animate={{ opacity: 0, scale: 1.5, x: tx, y: ty }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: h.delay }}
              className="absolute text-goldAccent pointer-events-none text-xs"
            >
              ♥
            </motion.span>
          );
        })}
      </button>

      {/* Image zoom & overlay */}
      <div
        className="relative aspect-[4/3] rounded-xl overflow-hidden cursor-pointer bg-black/20"
        onClick={onNavigate}
      >
        <img
          src={imageSrc}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-108 product-thumbnail-img"
        />
        <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4 gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickView();
            }}
            className="bg-goldAccent text-black text-[10px] font-extrabold uppercase tracking-widest px-4 py-2 rounded-full shadow-lg hover:scale-105 transition-all"
          >
            Quick View
          </button>
        </div>
        
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/75 flex items-center justify-center">
            <span className="text-[10px] font-extrabold text-[#ff5b5b] tracking-widest uppercase border border-[#ff5b5b]/30 px-3 py-1.5 rounded bg-[#ff5b5b]/10 backdrop-blur-sm">
              Out Of Stock
            </span>
          </div>
        )}
      </div>

      {/* Info Body */}
      <div className="mt-4 flex-1 flex flex-col justify-between">
        <div className="flex flex-col gap-1.5">
          
          {/* Brand & Category */}
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{product.brand}</span>
            <span className="text-[9px] uppercase tracking-wide bg-white/5 text-tealAccent border border-borderCard px-2 py-0.5 rounded">
              {product.category}
            </span>
          </div>

          {/* Name */}
          <h3 className="text-sm font-semibold text-white truncate hover:text-goldAccent cursor-pointer" onClick={onNavigate}>
            {highlightMatch(product.name, searchQuery)}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1.5 text-xs">
            <div className="flex text-goldAccent">
              {[...Array(5)].map((_, i) => {
                const ratingVal = parseFloat(product.rating);
                return (
                  <span key={i} className="text-sm">
                    {i < Math.floor(ratingVal) ? '★' : '☆'}
                  </span>
                );
              })}
            </div>
            <span className="text-[10px] text-gray-500 font-medium">({product.review_count})</span>
          </div>

          {/* Color swatches */}
          {productVariants.length > 0 && (
            <div className="flex gap-1.5 py-1.5">
              {productVariants.map((variant, vIdx) => (
                <button
                  key={variant.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onVariantChange(vIdx);
                  }}
                  className={`w-3.5 h-3.5 rounded-full border transition-all ${
                    activeVariantIndex === vIdx ? 'ring-1 ring-goldAccent scale-110 border-black' : 'border-borderCard'
                  }`}
                  style={{ backgroundColor: variant.colour_hex }}
                  title={variant.colour_name}
                />
              ))}
            </div>
          )}
        </div>

        {/* Pricing, Compare, Add to Cart */}
        <div className="mt-4 pt-3 border-t border-borderCard/30 flex flex-col gap-3">
          <div className="flex justify-between items-end">
            <div>
              {mode === 'rent' ? (
                <>
                  <p className="text-sm font-bold text-white leading-tight">
                    {`₹${parseFloat(product.rent_price_month).toLocaleString('en-IN')}`}<span className="text-[10px] text-gray-500 font-normal">/mo</span>
                  </p>
                  <p className="text-[10px] text-gray-500 mt-0.5 font-mono">
                    {`₹${parseFloat(product.rent_price_week).toLocaleString('en-IN')}`}/week
                  </p>
                </>
              ) : (
                <p className="text-sm font-bold text-white leading-tight">
                  {`₹${parseFloat(product.buy_price).toLocaleString('en-IN')}`}
                </p>
              )}
            </div>

            <label className="flex items-center gap-1.5 text-[10px] text-gray-500 font-bold uppercase tracking-wider hover:text-white cursor-pointer select-none pb-0.5">
              <input
                type="checkbox"
                checked={isCompared}
                onChange={onCompareToggle}
                className="rounded border-borderCard text-goldAccent focus:ring-0 bg-black/40 w-3 h-3"
              />
              <span>Compare</span>
            </label>
          </div>

          {isOutOfStock ? (
            <button className="w-full py-2.5 rounded-xl bg-transparent border border-borderCard hover:border-[#ff5b5b]/30 text-xs text-gray-500 hover:text-[#ff5b5b] hover:bg-[#ff5b5b]/5 font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-1.5">
              <Bell className="w-3.5 h-3.5" />
              <span>Notify Me</span>
            </button>
          ) : (
            <button
              onClick={(e) => {
                if (activeVariant) {
                  onAddToCart(activeVariant, e);
                }
              }}
              className="w-full py-2.5 rounded-xl bg-goldAccent hover:bg-goldAccent/95 text-black font-extrabold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(212,168,83,0.1)] relative ripple-button"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Add to Cart</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default function ProductsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { mode } = useMode();
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const { showToast } = useToast();

  // --- FILTER STATES ---
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    searchParams.get('category') ? searchParams.get('category')!.split(',') : []
  );
  
  const [priceRange, setPriceRange] = useState<[number, number]>(
    mode === 'rent' ? [0, 15000] : [0, 200000]
  );
  
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [isAvailableOnly, setIsAvailableOnly] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  
  // Pagination State
  const [limit] = useState(20);
  const [loadedProducts, setLoadedProducts] = useState<Product[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Mobile filters sidebar toggle
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Compare List State (Up to 3 product IDs)
  const [compareIds, setCompareIds] = useState<number[]>([]);

  // Track the active variant ID for each product card (mapping: productId -> variantIndex)
  const [activeVariantIndices, setActiveVariantIndices] = useState<Record<number, number>>({});

  // Quick view modal states
  const [selectedQuickViewProduct, setSelectedQuickViewProduct] = useState<Product | null>(null);
  const [quickViewActiveVariantIndex, setQuickViewActiveVariantIndex] = useState(0);

  // Reset filters/pricing range when mode (Buy vs Rent) changes
  useEffect(() => {
    setPriceRange(mode === 'rent' ? [0, 15000] : [0, 200000]);
    // Clear list and offset
    setLoadedProducts([]);
    setOffset(0);
    setHasMore(true);
  }, [mode]);

  // Sync Search Query from Navbar
  const searchQuery = searchParams.get('search') || '';

  // Trigger query refetch whenever filters update
  const { data, isLoading, isFetching } = useQuery({
    queryKey: [
      'products',
      mode,
      selectedCategories.join(','),
      priceRange.join(','),
      selectedColors.join(','),
      selectedConditions.join(','),
      isAvailableOnly,
      sortBy,
      searchQuery,
      offset
    ],
    queryFn: async () => {
      // Introduce a simulated delay for loading skeleton feel
      await new Promise(resolve => setTimeout(resolve, 300));

      let result = [...products];

      // 1. Filter by category
      if (selectedCategories.length > 0) {
        result = result.filter(p => selectedCategories.includes(p.category));
      }

      // 2. Filter by price range
      const minPriceVal = priceRange[0];
      const maxPriceVal = priceRange[1];
      result = result.filter(p => {
        const price = mode === 'rent' ? parseFloat(p.rent_price_month) : parseFloat(p.buy_price);
        return price >= minPriceVal && price <= maxPriceVal;
      });

      // 3. Filter by condition (Rent mode only)
      if (selectedConditions.length > 0 && mode === 'rent') {
        result = result.filter(p => selectedConditions.includes(p.condition_type));
      }

      // 4. Filter by color (Join variants table)
      if (selectedColors.length > 0) {
        result = result.filter(p => {
          const productColors = p.variants?.map(v => v.colour_name) || [];
          return productColors.some(c => selectedColors.includes(c));
        });
      }

      // 5. Filter by availability
      if (isAvailableOnly) {
        result = result.filter(p => p.is_available && p.stock_quantity > 0);
      }

      // 6. Filter by search query (FTS simulation)
      if (searchQuery) {
        const term = searchQuery.toLowerCase().trim();
        result = result.filter(p => 
          p.name.toLowerCase().includes(term) ||
          p.brand.toLowerCase().includes(term) ||
          p.category.toLowerCase().includes(term) ||
          p.description.toLowerCase().includes(term)
        );
      }

      // 7. Sorting
      if (sortBy) {
        result.sort((a, b) => {
          const priceA = mode === 'rent' ? parseFloat(a.rent_price_month) : parseFloat(a.buy_price);
          const priceB = mode === 'rent' ? parseFloat(b.rent_price_month) : parseFloat(b.buy_price);

          switch (sortBy) {
            case 'price_low_high':
              return priceA - priceB;
            case 'price_high_low':
              return priceB - priceA;
            case 'newest':
              return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            case 'popular':
              return b.review_count - a.review_count;
            case 'rating':
              return parseFloat(b.rating) - parseFloat(a.rating);
            default:
              return 0;
          }
        });
      }

      // 8. Pagination (Limit and Offset)
      const paginated = result.slice(offset, offset + limit);

      return {
        success: true,
        products: paginated,
        total: result.length
      };
    }
  });

  // Append loaded products on fetch success
  useEffect(() => {
    if (data?.success) {
      if (offset === 0) {
        setLoadedProducts(data.products);
      } else {
        setLoadedProducts(prev => {
          // Filter out duplicates
          const existingIds = new Set(prev.map(p => p.id));
          const uniqueNew = data.products.filter((p: Product) => !existingIds.has(p.id));
          return [...prev, ...uniqueNew];
        });
      }
      setHasMore(data.products.length === limit);
    }
  }, [data, offset, limit]);

  // Handle filter changes (Reset pagination offset to 0)
  const handleCategoryChange = (category: string) => {
    setSelectedCategories(prev => {
      const updated = prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category];
      // Update URL parameters
      if (updated.length > 0) {
        searchParams.set('category', updated.join(','));
      } else {
        searchParams.delete('category');
      }
      setSearchParams(searchParams);
      return updated;
    });
    setOffset(0);
  };

  const handleColorChange = (color: string) => {
    setSelectedColors(prev =>
      prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]
    );
    setOffset(0);
  };

  const handleConditionChange = (condition: string) => {
    setSelectedConditions(prev =>
      prev.includes(condition) ? prev.filter(c => c !== condition) : [...prev, condition]
    );
    setOffset(0);
  };

  const handleLoadMore = () => {
    setOffset(prev => prev + limit);
  };

  // Compare check helper
  const handleCompareToggle = (productId: number) => {
    setCompareIds(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        if (prev.length >= 3) {
          showToast('You can compare up to 3 products at a time.', 'info');
          return prev;
        }
        return [...prev, productId];
      }
    });
  };

  // Clear compare items
  const clearCompare = () => setCompareIds([]);

  // Swatch color lists
  const colorSwatches = [
    { name: 'White', hex: '#FFFFFF' },
    { name: 'Black', hex: '#000000' },
    { name: 'Brown', hex: '#8B4513' },
    { name: 'Beige', hex: '#F5F5DC' },
    { name: 'Grey', hex: '#808080' },
    { name: 'Walnut', hex: '#5C4033' },
    { name: 'Oak', hex: '#B8860B' },
    { name: 'Navy', hex: '#000080' },
    { name: 'Forest Green', hex: '#228B22' }
  ];

  const categoriesList = [
    'Sofa', 'Bed', 'Dining Table', 'Chair', 'Wardrobe',
    'Washing Machine', 'Refrigerator', 'AC', 'TV', 'Office Desk',
    'Mattress', 'Coffee Table'
  ];

  const formatCurrency = (val: string | number) => {
    return `₹${parseFloat(val as string).toLocaleString('en-IN')}`;
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 min-h-screen relative pb-20">
      
      {/* --- FILTER SIDEBAR (DESKTOP) --- */}
      <aside className="hidden lg:block w-72 glass-card rounded-2xl p-6 border border-borderCard h-fit sticky top-[85px]">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-borderCard/30">
          <span className="font-serif font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-goldAccent" /> Filters
          </span>
          <button
            onClick={() => {
              setSelectedCategories([]);
              setSelectedColors([]);
              setSelectedConditions([]);
              setIsAvailableOnly(false);
              setSortBy('newest');
              setPriceRange(mode === 'rent' ? [0, 15000] : [0, 200000]);
              setOffset(0);
              searchParams.delete('category');
              setSearchParams(searchParams);
            }}
            className="text-[10px] text-gray-500 hover:text-goldAccent font-bold uppercase tracking-widest"
          >
            Clear All
          </button>
        </div>

        <div className="flex flex-col gap-6">
          
          {/* Categories */}
          <div>
            <h4 className="text-[10px] font-bold text-goldAccent uppercase tracking-widest mb-3">Category</h4>
            <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-1">
              {categoriesList.map(cat => (
                <label key={cat} className="flex items-center gap-2 text-xs text-gray-400 hover:text-white cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(cat)}
                    onChange={() => handleCategoryChange(cat)}
                    className="rounded border-borderCard text-goldAccent focus:ring-0 bg-black/40"
                  />
                  <span>{cat}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Price Range Slider */}
          <div>
            <h4 className="text-[10px] font-bold text-goldAccent uppercase tracking-widest mb-3">
              Price Range ({mode === 'rent' ? '/month' : 'buy'})
            </h4>
            <input
              type="range"
              min={0}
              max={mode === 'rent' ? 15000 : 200000}
              step={mode === 'rent' ? 200 : 2000}
              value={priceRange[1]}
              onChange={(e) => {
                setPriceRange([priceRange[0], parseInt(e.target.value)]);
                setOffset(0);
              }}
              className="w-full accent-goldAccent cursor-pointer h-1.5 bg-white/10 rounded-full outline-none"
            />
            <div className="flex justify-between items-center text-[10px] text-gray-400 mt-2 font-mono">
              <span>{formatCurrency(priceRange[0])}</span>
              <span>{formatCurrency(priceRange[1])}</span>
            </div>
          </div>

          {/* Color Swatches */}
          <div>
            <h4 className="text-[10px] font-bold text-goldAccent uppercase tracking-widest mb-3">Colour</h4>
            <div className="flex flex-wrap gap-2">
              {colorSwatches.map(color => {
                const isSelected = selectedColors.includes(color.name);
                return (
                  <button
                    key={color.name}
                    title={color.name}
                    onClick={() => handleColorChange(color.name)}
                    className={`w-6 h-6 rounded-full border relative flex items-center justify-center transition-all ${
                      isSelected ? 'border-goldAccent scale-110' : 'border-borderCard hover:scale-105'
                    }`}
                    style={{ backgroundColor: color.hex }}
                  >
                    {isSelected && (
                      <Check
                        className={`w-3.5 h-3.5 ${
                          color.name === 'White' || color.name === 'Beige' ? 'text-black' : 'text-white'
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Condition (Rent mode only) */}
          {mode === 'rent' && (
            <div>
              <h4 className="text-[10px] font-bold text-goldAccent uppercase tracking-widest mb-3">Condition</h4>
              <div className="flex flex-col gap-2">
                {['new', 'like_new', 'refurbished'].map(cond => (
                  <label key={cond} className="flex items-center gap-2 text-xs text-gray-400 hover:text-white cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={selectedConditions.includes(cond)}
                      onChange={() => handleConditionChange(cond)}
                      className="rounded border-borderCard text-goldAccent focus:ring-0 bg-black/40"
                    />
                    <span className="capitalize">{cond.replace('_', ' ')}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Availability */}
          <div>
            <h4 className="text-[10px] font-bold text-goldAccent uppercase tracking-widest mb-3">Availability</h4>
            <label className="flex items-center gap-2 text-xs text-gray-400 hover:text-white cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isAvailableOnly}
                onChange={() => {
                  setIsAvailableOnly(!isAvailableOnly);
                  setOffset(0);
                }}
                className="rounded border-borderCard text-goldAccent focus:ring-0 bg-black/40"
              />
              <span>In Stock Only</span>
            </label>
          </div>

        </div>
      </aside>

      {/* --- PRODUCTS SECTION --- */}
      <div className="flex-1">
        
        {/* Toolbar Header (Sort, Mobile Filter Toggle) */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 glass-card border border-borderCard rounded-2xl p-4">
          <div className="text-xs text-gray-400 font-medium">
            Showing <span className="text-white font-bold">{loadedProducts.length}</span> premium products
            {searchQuery && <span> matching &quot;<span className="text-goldAccent">{searchQuery}</span>&quot;</span>}
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between">
            {/* Mobile Filters Toggle Button */}
            <button
              onClick={() => setShowMobileFilters(true)}
              className="lg:hidden flex items-center gap-2 border border-borderCard hover:border-goldAccent/30 bg-black/30 px-4 py-2 rounded-xl text-xs text-white transition-all font-semibold uppercase tracking-wider"
            >
              <Filter className="w-4 h-4 text-goldAccent" /> Filter
            </button>

            {/* Sorting */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest whitespace-nowrap">Sort By:</span>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setOffset(0);
                }}
                className="bg-black/40 border border-borderCard rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-goldAccent cursor-pointer"
              >
                <option value="newest" className="bg-[#111118]">Newest Arrivals</option>
                <option value="price_low_high" className="bg-[#111118]">Price: Low → High</option>
                <option value="price_high_low" className="bg-[#111118]">Price: High → Low</option>
                <option value="popular" className="bg-[#111118]">Most Popular</option>
                <option value="rating" className="bg-[#111118]">Top Rated</option>
              </select>
            </div>
          </div>
        </div>

        {/* --- PRODUCTS GRID --- */}
        {isLoading && offset === 0 ? (
          <ProductGridSkeleton count={8} />
        ) : loadedProducts.length === 0 ? (
          // Illustrated empty state
          <div className="glass-card border border-borderCard rounded-3xl p-16 text-center max-w-lg mx-auto mt-12">
            <Layers className="w-16 h-16 text-goldAccent/30 mx-auto mb-4" />
            <h3 className="font-serif text-lg text-white font-bold uppercase tracking-wide">No products found</h3>
            <p className="text-xs text-gray-400 mt-2 max-w-xs mx-auto leading-relaxed">
              No premium products match your current filters. Try relaxing your parameters or clearing search tags.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <AnimatePresence>
              {loadedProducts.map((product) => {
                const wishlisted = isWishlisted(product.id);
                const isOutOfStock = product.stock_quantity < 1;
                const activeVarIndex = activeVariantIndices[product.id] ?? 0;
                const isCompared = compareIds.includes(product.id);

                return (
                  <ProductCard
                    key={product.id}
                    product={product}
                    wishlisted={wishlisted}
                    isOutOfStock={isOutOfStock}
                    activeVariantIndex={activeVarIndex}
                    onVariantChange={(vIdx) => {
                      setActiveVariantIndices(prev => ({ ...prev, [product.id]: vIdx }));
                    }}
                    isCompared={isCompared}
                    mode={mode}
                    onToggleWishlist={() => toggleWishlist(product.id)}
                    onCompareToggle={() => handleCompareToggle(product.id)}
                    onAddToCart={(variant, e) => {
                      addToCart(product.id, variant.id, 1, mode);
                      showToast('Added to cart successfully!', 'success');
                      
                      // Trigger fly to cart animation
                      const target = e.currentTarget as HTMLElement;
                      const card = target.closest('.glass-card');
                      const thumb = card?.querySelector('.product-thumbnail-img') as HTMLImageElement;
                      if (thumb) {
                        performFlyToCartAnimation(thumb);
                      }
                    }}
                    onNavigate={() => navigate(`/products/${product.id}`)}
                    onQuickView={() => {
                      setSelectedQuickViewProduct(product);
                      setQuickViewActiveVariantIndex(activeVarIndex);
                    }}
                    searchQuery={searchQuery}
                  />
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* --- LOAD MORE BUTTON --- */}
        {hasMore && loadedProducts.length > 0 && (
          <div className="text-center mt-12">
            <button
              onClick={handleLoadMore}
              disabled={isFetching}
              className="px-8 py-3 rounded-full bg-transparent border border-borderCard hover:border-goldAccent text-white hover:text-goldAccent font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2 mx-auto disabled:opacity-50"
            >
              {isFetching ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
              <span>{isFetching ? 'Loading Products...' : 'Load More'}</span>
            </button>
          </div>
        )}

      </div>

      {/* --- FLOATING COMPARE BOTTOM TOOLBAR --- */}
      {compareIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 bg-[#111118]/90 backdrop-blur-md border border-borderGold px-6 py-4 rounded-2xl shadow-2xl flex items-center justify-between gap-6 max-w-md w-full animate-bounce">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Product Compare</span>
            <span className="text-xs text-white font-semibold">{compareIds.length} of 3 items selected</span>
          </div>
          <div className="flex gap-3">
            <button onClick={clearCompare} className="p-2 text-gray-500 hover:text-white rounded-lg hover:bg-white/5">
              <X className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate(`/compare?ids=${compareIds.join(',')}`)}
              className="bg-goldAccent hover:bg-goldAccent/95 text-black px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-[0_4px_12px_rgba(212,168,83,0.2)]"
            >
              Compare
            </button>
          </div>
        </div>
      )}

      {/* --- MOBILE FILTERS DRAWERS (OVERLAY) --- */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end">
          <div className="w-80 h-full bg-darkBg border-l border-borderCard p-6 overflow-y-auto flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-borderCard/30">
                <span className="font-serif font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-goldAccent" /> Filters
                </span>
                <button onClick={() => setShowMobileFilters(false)}>
                  <X className="w-5 h-5 text-gray-400 hover:text-white" />
                </button>
              </div>

              {/* Categories */}
              <div className="mb-6">
                <h4 className="text-[10px] font-bold text-goldAccent uppercase tracking-widest mb-3">Category</h4>
                <div className="flex flex-col gap-2 max-h-[140px] overflow-y-auto pr-1">
                  {categoriesList.map(cat => (
                    <label key={cat} className="flex items-center gap-2 text-xs text-gray-400 hover:text-white cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(cat)}
                        onChange={() => handleCategoryChange(cat)}
                        className="rounded border-borderCard text-goldAccent focus:ring-0 bg-black/40"
                      />
                      <span>{cat}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price range */}
              <div className="mb-6">
                <h4 className="text-[10px] font-bold text-goldAccent uppercase tracking-widest mb-3">
                  Price Range ({mode === 'rent' ? '/month' : 'buy'})
                </h4>
                <input
                  type="range"
                  min={0}
                  max={mode === 'rent' ? 15000 : 200000}
                  step={mode === 'rent' ? 200 : 2000}
                  value={priceRange[1]}
                  onChange={(e) => {
                    setPriceRange([priceRange[0], parseInt(e.target.value)]);
                    setOffset(0);
                  }}
                  className="w-full accent-goldAccent cursor-pointer h-1.5 bg-white/10 rounded-full outline-none"
                />
                <div className="flex justify-between items-center text-[10px] text-gray-400 mt-2 font-mono">
                  <span>{formatCurrency(priceRange[0])}</span>
                  <span>{formatCurrency(priceRange[1])}</span>
                </div>
              </div>

              {/* Colors */}
              <div className="mb-6">
                <h4 className="text-[10px] font-bold text-goldAccent uppercase tracking-widest mb-3">Colour</h4>
                <div className="flex flex-wrap gap-2">
                  {colorSwatches.map(color => {
                    const isSelected = selectedColors.includes(color.name);
                    return (
                      <button
                        key={color.name}
                        onClick={() => handleColorChange(color.name)}
                        className={`w-6 h-6 rounded-full border relative flex items-center justify-center transition-all ${
                          isSelected ? 'border-goldAccent scale-110' : 'border-borderCard'
                        }`}
                        style={{ backgroundColor: color.hex }}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 text-black" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowMobileFilters(false)}
              className="w-full py-3 bg-goldAccent hover:bg-goldAccent/95 text-black font-extrabold text-xs uppercase tracking-widest transition-all rounded-xl shadow-lg mt-6"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* --- QUICK VIEW MODAL --- */}
      <AnimatePresence>
        {selectedQuickViewProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card max-w-3xl w-full rounded-3xl overflow-hidden border border-borderGold shadow-2xl flex flex-col md:flex-row relative"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedQuickViewProduct(null)}
                className="absolute top-4 right-4 z-10 p-2 text-gray-400 hover:text-white rounded-full bg-black/60 hover:bg-black/80 transition-all border border-borderCard"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Gallery section */}
              <div className="w-full md:w-1/2 p-6 flex flex-col justify-center bg-black/30 border-r border-borderCard/30">
                <div className="aspect-square rounded-2xl overflow-hidden bg-black/10">
                  <img
                    src={
                      (() => {
                        const activeV = selectedQuickViewProduct.variants?.[quickViewActiveVariantIndex];
                        if (!activeV) return 'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=600';
                        try {
                          const parsedImgs = typeof activeV.images === 'string'
                            ? JSON.parse(activeV.images)
                            : activeV.images;
                          return parsedImgs[0] || 'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=600';
                        } catch(e) {
                          return activeV.images?.[0] || 'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=600';
                        }
                      })()
                    }
                    alt={selectedQuickViewProduct.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Thumbnails of variants */}
                <div className="flex gap-2.5 mt-4 justify-center">
                  {selectedQuickViewProduct.variants?.map((v, idx) => {
                    let thumbSrc = 'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=100';
                    try {
                      const parsed = typeof v.images === 'string' ? JSON.parse(v.images) : v.images;
                      thumbSrc = parsed[0] || thumbSrc;
                    } catch(e) {
                      thumbSrc = v.images?.[0] || thumbSrc;
                    }
                    return (
                      <button
                        key={v.id}
                        onClick={() => setQuickViewActiveVariantIndex(idx)}
                        className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition-all ${
                          quickViewActiveVariantIndex === idx ? 'border-goldAccent scale-105' : 'border-borderCard opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={thumbSrc}
                          alt={v.colour_name}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Product Info Section */}
              <div className="w-full md:w-1/2 p-8 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{selectedQuickViewProduct.brand}</span>
                  <h2 className="font-serif text-2xl text-white font-bold mt-1 mb-2">{selectedQuickViewProduct.name}</h2>
                  
                  {/* Rating */}
                  <div className="flex items-center gap-1.5 text-xs mb-4">
                    <div className="flex text-goldAccent">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className="text-sm">
                          {i < Math.floor(parseFloat(selectedQuickViewProduct.rating)) ? '★' : '☆'}
                        </span>
                      ))}
                    </div>
                    <span className="text-[10px] text-gray-500 font-medium">({selectedQuickViewProduct.review_count} verified reviews)</span>
                  </div>

                  <p className="text-xs text-gray-400 leading-relaxed mb-6">
                    This premium {selectedQuickViewProduct.name.toLowerCase()} features a masterfully-crafted design, engineered with first-class durability and high-end materials.
                  </p>

                  {/* Swatches selector */}
                  <div className="mb-6">
                    <span className="text-[10px] text-goldAccent font-bold uppercase tracking-widest block mb-2">Select Color Variant:</span>
                    <div className="flex gap-2 flex-wrap">
                      {selectedQuickViewProduct.variants?.map((v, idx) => (
                        <button
                          key={v.id}
                          onClick={() => setQuickViewActiveVariantIndex(idx)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                            quickViewActiveVariantIndex === idx ? 'border-goldAccent bg-goldAccent/10 text-white' : 'border-borderCard text-gray-400 hover:text-white'
                          }`}
                        >
                          <span className="w-3.5 h-3.5 rounded-full border border-black/30 animate-pulse" style={{ backgroundColor: v.colour_hex }} />
                          <span>{v.colour_name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Specifications */}
                  <div className="mb-6">
                    <span className="text-[10px] text-goldAccent font-bold uppercase tracking-widest block mb-2">Specifications:</span>
                    <div className="grid grid-cols-2 gap-3 bg-white/5 border border-borderCard p-3 rounded-2xl text-[11px] text-gray-400">
                      <div><span className="font-semibold text-white">Category:</span> {selectedQuickViewProduct.category}</div>
                      <div><span className="font-semibold text-white">Condition:</span> <span className="capitalize">{selectedQuickViewProduct.condition?.replace('_', ' ') || 'New'}</span></div>
                      <div><span className="font-semibold text-white">Height:</span> {selectedQuickViewProduct.height_cm} cm</div>
                      <div><span className="font-semibold text-white">Width:</span> {selectedQuickViewProduct.width_cm} cm</div>
                    </div>
                  </div>
                </div>

                {/* Bottom Row Pricing & Action */}
                <div className="pt-4 border-t border-borderCard/30 flex items-center justify-between gap-4">
                  <div>
                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Price ({mode})</span>
                    <span className="text-xl font-bold text-goldAccent">
                      {mode === 'rent'
                        ? `₹${parseFloat(selectedQuickViewProduct.rent_price_month).toLocaleString('en-IN')}/mo`
                        : `₹${parseFloat(selectedQuickViewProduct.buy_price).toLocaleString('en-IN')}`
                      }
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      const activeV = selectedQuickViewProduct.variants?.[quickViewActiveVariantIndex];
                      if (activeV) {
                        addToCart(selectedQuickViewProduct.id, activeV.id, 1, mode);
                        showToast('Added to cart successfully!', 'success');
                        setSelectedQuickViewProduct(null);
                      }
                    }}
                    className="flex-1 py-3 bg-goldAccent hover:bg-goldAccent/95 text-black font-extrabold text-xs uppercase tracking-widest transition-all rounded-xl shadow-lg flex items-center justify-center gap-2"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>Add to Cart</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
