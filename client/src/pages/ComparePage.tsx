import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Trash2, ShoppingCart, ArrowLeft, Layers, Heart } from 'lucide-react';
import api from '../api/axios';
import { Product } from '../types';
import { useMode } from '../context/ModeContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';

// Radar Chart Helper - Normalizes specifications to scores out of 100
const getProductRadarMetrics = (p: any, mode: 'rent' | 'buy') => {
  // 1. Affordability: lower is better (max 200k buy, 15k rent)
  const price = mode === 'rent' ? parseFloat(p.rent_price_month) : parseFloat(p.buy_price);
  const maxPrice = mode === 'rent' ? 15000 : 200000;
  const affordabilityScore = Math.max(10, Math.min(100, 100 - (price / maxPrice) * 90));

  // 2. Rating: scale from 0-5 to 10-100
  const ratingVal = parseFloat(p.rating) || 0;
  const ratingScore = Math.max(10, Math.min(100, ratingVal * 20));

  // 3. Popularity: review count (scale up to 40 reviews)
  const reviews = parseInt(p.review_count) || 0;
  const popularityScore = Math.max(10, Math.min(100, 20 + Math.min(reviews, 40) * 2));

  // 4. Warranty: parse warranty (e.g. 5 Years -> 100, 3 Years -> 80)
  const warrantyStr = (p.warranty || '').toLowerCase();
  let warrantyScore = 30;
  if (warrantyStr.includes('5') || warrantyStr.includes('five')) warrantyScore = 100;
  else if (warrantyStr.includes('3') || warrantyStr.includes('three')) warrantyScore = 80;
  else if (warrantyStr.includes('2') || warrantyStr.includes('two')) warrantyScore = 60;
  else if (warrantyStr.includes('1') || warrantyStr.includes('one') || warrantyStr.includes('year')) warrantyScore = 50;

  // 5. Availability: stock quantity (scale up to 10 in stock)
  const stock = parseInt(p.stock_quantity) || 0;
  const availabilityScore = Math.max(10, Math.min(100, Math.min(stock, 10) * 10));

  return [
    { label: 'Affordability', score: affordabilityScore },
    { label: 'Rating', score: ratingScore },
    { label: 'Popularity', score: popularityScore },
    { label: 'Warranty', score: warrantyScore },
    { label: 'Availability', score: availabilityScore }
  ];
};

// Custom React SVG Radar Comparison Chart
const CompareRadarChart: React.FC<{ products: any[]; mode: 'rent' | 'buy' }> = ({ products, mode }) => {
  const cx = 150;
  const cy = 150;
  const maxRadius = 100;
  const labels = ['Affordability', 'Rating', 'Popularity', 'Warranty', 'Availability'];
  
  // Concentric levels (concentric pentagons)
  const levels = [0.2, 0.4, 0.6, 0.8, 1.0];
  const gridLines = levels.map((level) => {
    const r = maxRadius * level;
    return labels.map((_, i) => {
      const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      return `${x},${y}`;
    }).join(' ');
  });

  // Distinct colors for the contrasted paths
  const strokeColors = ['#D4A853', '#00D4AA', '#E0A391']; // Gold, Teal, Rose Gold
  const fillColors = ['rgba(212, 168, 83, 0.15)', 'rgba(0, 212, 170, 0.15)', 'rgba(224, 163, 145, 0.15)'];

  // Calculate polygon vertices
  const productPolygons = products.map((p, pIdx) => {
    const metrics = getProductRadarMetrics(p, mode);
    const points = metrics.map((m, i) => {
      const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
      const r = (m.score / 100) * maxRadius;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      return `${x},${y}`;
    }).join(' ');
    
    return {
      points,
      stroke: strokeColors[pIdx % strokeColors.length],
      fill: fillColors[pIdx % fillColors.length],
      name: p.name
    };
  });

  return (
    <div className="glass-card rounded-3xl border border-borderCard p-6 flex flex-col md:flex-row items-center gap-10 justify-center shadow-xl">
      <div className="relative">
        <svg width="300" height="300" className="overflow-visible">
          {/* Pentagon concentric rings */}
          {gridLines.map((points, idx) => (
            <polygon 
              key={idx} 
              points={points} 
              fill="none" 
              stroke="rgba(255,255,255,0.06)" 
              strokeWidth="1"
            />
          ))}

          {/* Axes spokes */}
          {labels.map((_, i) => {
            const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
            const x = cx + maxRadius * Math.cos(angle);
            const y = cy + maxRadius * Math.sin(angle);
            return (
              <line 
                key={i} 
                x1={cx} 
                y1={cy} 
                x2={x} 
                y2={y} 
                stroke="rgba(255,255,255,0.08)" 
                strokeWidth="1.2"
              />
            );
          })}

          {/* Metric labels */}
          {labels.map((label, i) => {
            const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
            const labelDist = maxRadius + 18;
            const x = cx + labelDist * Math.cos(angle);
            const y = cy + labelDist * Math.sin(angle);
            
            let textAnchor: 'inherit' | 'middle' | 'end' | 'start' = 'middle';
            if (Math.cos(angle) > 0.1) textAnchor = 'start';
            else if (Math.cos(angle) < -0.1) textAnchor = 'end';

            return (
              <text 
                key={i} 
                x={x} 
                y={y + 3} 
                fill="rgba(255,255,255,0.4)" 
                fontSize="9"
                fontWeight="bold"
                textAnchor={textAnchor}
                className="uppercase tracking-widest font-sans"
              >
                {label}
              </text>
            );
          })}

          {/* Product metric paths */}
          {productPolygons.map((poly, idx) => (
            <polygon 
              key={idx} 
              points={poly.points} 
              fill={poly.fill} 
              stroke={poly.stroke} 
              strokeWidth="2"
              className="transition-all duration-300 hover:fill-opacity-35"
            />
          ))}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-col gap-4 max-w-xs w-full">
        <h4 className="text-xs font-bold text-goldAccent uppercase tracking-widest border-b border-borderCard/30 pb-2 mb-1">
          Radar Comparison Index
        </h4>
        <div className="flex flex-col gap-3">
          {productPolygons.map((poly, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full border border-black/45 flex-shrink-0" style={{ backgroundColor: poly.stroke }} />
              <div className="min-w-0">
                <p className="text-xs text-white font-bold truncate">{poly.name}</p>
                <span className="text-[9px] text-gray-500 font-medium">Radar Plot Matching</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function ComparePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { mode } = useMode();
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const { showToast } = useToast();

  const ids = searchParams.get('ids') || '';

  // Fetch products for comparison
  const { data: comparedProducts = [], isLoading, error } = useQuery<any[]>({
    queryKey: ['compare', ids],
    queryFn: async () => {
      if (!ids) return [];
      const response = await api.get(`/products/compare?ids=${ids}`);
      return response.data;
    },
    enabled: !!ids
  });

  const handleRemove = (productId: number) => {
    const idList = ids.split(',').filter(id => id !== productId.toString());
    if (idList.length > 0) {
      searchParams.set('ids', idList.join(','));
      setSearchParams(searchParams);
    } else {
      navigate('/products');
    }
  };

  const formatCurrency = (val: string | number) => `₹${parseFloat(val as string).toLocaleString('en-IN')}`;

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-sm font-semibold tracking-widest text-goldAccent uppercase animate-pulse">
        Fetching products to compare...
      </div>
    );
  }

  if (error || comparedProducts.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <Layers className="w-16 h-16 text-goldAccent/30 mx-auto mb-4" />
        <h3 className="font-serif text-lg text-white font-bold uppercase tracking-wide">No products to compare</h3>
        <p className="text-xs text-gray-400 mt-2 mb-6">Select up to 3 products from our browse listing to compare side by side.</p>
        <button onClick={() => navigate('/products')} className="px-6 py-2.5 rounded-xl bg-goldAccent text-black font-extrabold text-xs uppercase tracking-widest transition-all shadow-md">
          Go Browse Products
        </button>
      </div>
    );
  }

  // Row definition for comparisons
  const compareRows = [
    { label: 'Rating', key: 'rating', render: (p: any) => `★ ${p.rating} (${p.review_count} reviews)` },
    { label: 'Buy Price', key: 'buy_price', render: (p: any) => formatCurrency(p.buy_price) },
    { label: 'Rent Price', key: 'rent_price_month', render: (p: any) => `${formatCurrency(p.rent_price_month)}/month` },
    { label: 'Material', key: 'material', render: (p: any) => p.material },
    { label: 'Dimensions', key: 'dimensions', render: (p: any) => p.dimensions },
    { label: 'Weight', key: 'weight', render: (p: any) => p.weight },
    { label: 'Warranty', key: 'warranty', render: (p: any) => p.warranty },
    { label: 'Description', key: 'description', render: (p: any) => p.description }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 flex flex-col gap-8">
      
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white font-bold uppercase tracking-widest transition-all w-fit"
      >
        <ArrowLeft className="w-4 h-4 text-goldAccent" />
        <span>Back</span>
      </button>

      <div className="text-center md:text-left mb-4">
        <span className="text-xs font-bold text-tealAccent uppercase tracking-widest bg-tealAccent/10 border border-tealAccent/20 px-3 py-1 rounded-full">Comparison</span>
        <h1 className="text-3xl font-serif text-white mt-4 font-semibold uppercase tracking-wide">Compare Products</h1>
        <p className="text-xs text-gray-500 mt-2">Side-by-side detailed breakdown of your selected products.</p>
      </div>

      <CompareRadarChart products={comparedProducts} mode={mode} />

      {/* COMPARISON TABLE GRID */}
      <div className="glass-card rounded-3xl border border-borderCard overflow-hidden shadow-2xl">
        <div className="grid" style={{ gridTemplateColumns: `180px repeat(${comparedProducts.length}, minmax(200px, 1fr))` }}>
          
          {/* Header Row (Product Cards) */}
          <div className="p-6 border-b border-r border-borderCard/30 bg-black/20 flex items-center">
            <span className="text-xs font-bold text-goldAccent uppercase tracking-widest">Specifications</span>
          </div>

          {comparedProducts.map((p) => {
            // Extract thumbnail
            let imageSrc = 'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=300';
            if (p.images) {
              try {
                const parsed = typeof p.images === 'string' ? JSON.parse(p.images) : p.images;
                if (Array.isArray(parsed) && parsed.length > 0) imageSrc = parsed[0];
              } catch (e) {
                if (Array.isArray(p.images) && p.images.length > 0) imageSrc = p.images[0];
              }
            }
            
            const wishlisted = isWishlisted(p.id);

            return (
              <div key={p.id} className="p-6 border-b border-r border-borderCard/30 relative flex flex-col justify-between gap-4">
                
                {/* Trash delete button */}
                <button
                  onClick={() => handleRemove(p.id)}
                  className="absolute top-4 right-4 text-gray-500 hover:text-[#ff5b5b] p-1.5 rounded-lg hover:bg-white/5 transition-all"
                  title="Remove from comparison"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="flex flex-col gap-3">
                  <img src={imageSrc} alt={p.name} className="w-full h-32 object-cover rounded-xl border border-borderCard" />
                  <div>
                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">{p.brand}</span>
                    <h3 className="text-sm font-semibold text-white truncate hover:underline cursor-pointer" onClick={() => navigate(`/products/${p.id}`)}>
                      {p.name}
                    </h3>
                  </div>
                </div>

                <div className="flex gap-2.5">
                  <button
                    onClick={async () => {
                      if (p.variant_id) {
                        try {
                          await addToCart(p.id, p.variant_id, 1, mode);
                          showToast(`${p.name} added to cart!`, 'success');
                        } catch (e) {
                          showToast('Failed to add to cart.', 'error');
                        }
                      } else {
                        navigate(`/products/${p.id}`);
                      }
                    }}
                    className="flex-1 py-2 rounded-xl bg-goldAccent hover:bg-goldAccent/95 text-black font-extrabold text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-1.5"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>Add to Cart</span>
                  </button>

                  <button
                    onClick={() => toggleWishlist(p.id)}
                    className={`p-2 rounded-xl border flex items-center justify-center transition-all ${
                      wishlisted ? 'border-goldAccent text-goldAccent' : 'border-borderCard text-gray-400 hover:text-white'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${wishlisted ? 'fill-goldAccent' : ''}`} />
                  </button>
                </div>

              </div>
            );
          })}

          {/* Specifications Rows */}
          {compareRows.map((row) => (
            <React.Fragment key={row.key}>
              {/* Row Label */}
              <div className="p-4 border-b border-r border-borderCard/30 bg-black/10 flex items-center text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                {row.label}
              </div>

              {/* Compared values */}
              {comparedProducts.map((p) => (
                <div key={p.id} className="p-4 border-b border-r border-borderCard/30 text-xs text-gray-300 flex items-center leading-relaxed">
                  {row.render(p)}
                </div>
              ))}
            </React.Fragment>
          ))}

        </div>
      </div>

    </div>
  );
}
