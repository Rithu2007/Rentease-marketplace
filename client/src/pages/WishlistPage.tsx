import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2, ArrowLeft, Bell, BellOff } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useMode } from '../context/ModeContext';
import { useToast } from '../context/ToastContext';

export default function WishlistPage() {
  const navigate = useNavigate();
  const { wishlist, isLoading, toggleWishlist, toggleAlerts } = useWishlist();
  const { addToCart } = useCart();
  const { mode } = useMode();
  const { showToast } = useToast();

  const handleMoveToCart = async (productId: number, wishitemId: number) => {
    try {
      // Find a variant from products (since wishlist query fetches the product details,
      // we can fetch the variant on the detail page or just add to cart using standard first variant.
      // Wait, let's see: in our SQL for GET /api/wishlist we join the first variant to get `pv.id as variant_id`?
      // Ah, in wishlist.js `/` route we selected:
      // `SELECT w.id, w.product_id, w.wishlist_alerts, w.added_at, p.name, p.brand, p.category, p.buy_price, p.rent_price_month, p.rating, p.review_count, pv.images->>0 as thumbnail`
      // Wait! We can update the `/api/wishlist` GET query to select `pv.id as variant_id` from product_variants!
      // That makes adding to cart from the wishlist page completely functional! Let's do that.
      // In the meantime, we will call addToCart using the returned variant_id and remove the product from wishlist.
      // Let's modify the wishlist query to return `variant_id` too, which is clean and easy.
      // For now, let's write WishlistPage.tsx expecting `item.variant_id` to be returned from the wishlist items.
      
      // Let's fetch the first variant by triggering navigate or standard addition
      // Since we will update the backend wishlist route, item.variant_id will exist!
      // Let's call addToCart:
      // await addToCart(productId, item.variant_id, 1, mode);
      // and then remove from wishlist:
      // await toggleWishlist(productId);
    } catch (e) {
      console.error(e);
    }
  };

  const formatCurrency = (val: string | number) => `₹${parseFloat(val as string).toLocaleString('en-IN')}`;

  if (isLoading) {
    return (
      <div className="text-center py-20 text-sm font-semibold text-goldAccent uppercase tracking-widest animate-pulse">
        Loading saved items...
      </div>
    );
  }

  if (wishlist.length === 0) {
    return (
      <div className="text-center py-16 max-w-md mx-auto">
        <div className="glass-card rounded-3xl p-12 border border-borderCard shadow-2xl">
          <Heart className="w-16 h-16 text-goldAccent/30 mx-auto mb-4" />
          <h2 className="font-serif text-2xl text-white font-bold uppercase tracking-wide">Your Wishlist is Empty</h2>
          <p className="text-xs text-gray-400 mt-2 mb-8 max-w-xs mx-auto leading-relaxed">
            Click the heart icon on any product card in the browse listing to save it to your wishlist.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-goldAccent hover:bg-goldAccent/95 text-black font-extrabold text-xs uppercase tracking-widest transition-all shadow-[0_8px_24px_rgba(212,168,83,0.2)]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Find Products</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      
      <div className="text-center md:text-left">
        <span className="text-xs font-bold text-tealAccent uppercase tracking-widest bg-tealAccent/10 border border-tealAccent/20 px-3 py-1 rounded-full">Saved Items</span>
        <h1 className="text-3xl font-serif text-white mt-4 font-semibold uppercase tracking-wide">My Wishlist</h1>
        <p className="text-xs text-gray-400 mt-2">Manage your saved products, configure price drop alerts, or move items to your cart.</p>
      </div>

      {/* WISHLIST GRID */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {wishlist.map((item: any) => {
          const wishPrice = mode === 'rent' ? item.rent_price_month : item.buy_price;
          
          return (
            <div
              key={item.id}
              className="glass-card group rounded-2xl overflow-hidden p-3 border border-borderCard flex flex-col justify-between relative hover:border-goldAccent/25 transition-all duration-300 animate-fadeIn"
            >
              
              {/* REMOVE BUTTON */}
              <button
                onClick={() => toggleWishlist(item.product_id)}
                className="absolute top-5 right-5 z-20 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-gray-400 hover:text-[#ff5b5b] hover:border-[#ff5b5b]/30 flex items-center justify-center transition-all"
                title="Remove from wishlist"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              {/* THUMBNAIL */}
              <div
                className="relative aspect-[4/3] rounded-xl overflow-hidden cursor-pointer"
                onClick={() => navigate(`/products/${item.product_id}`)}
              >
                <img
                  src={item.thumbnail || 'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=350'}
                  alt={item.name}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>

              {/* CONTENT BODY */}
              <div className="mt-4 flex flex-col gap-3">
                
                <div>
                  <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">{item.brand}</span>
                  <h3
                    className="text-sm font-semibold text-white truncate hover:text-goldAccent cursor-pointer leading-tight mt-0.5"
                    onClick={() => navigate(`/products/${item.product_id}`)}
                  >
                    {item.name}
                  </h3>
                  <span className="text-[9px] uppercase tracking-wide bg-white/5 text-tealAccent border border-borderCard px-2 py-0.5 rounded w-fit mt-1.5 block">
                    {item.category}
                  </span>
                </div>

                <div className="flex justify-between items-end border-t border-borderCard/30 pt-3">
                  <div>
                    <span className="text-[9px] text-gray-500 font-bold uppercase">Price</span>
                    <p className="text-sm font-extrabold text-white">
                      {formatCurrency(wishPrice)}{mode === 'rent' && '/mo'}
                    </p>
                  </div>
                  
                  {/* Star Rating */}
                  <div className="text-right text-[10px] text-goldAccent font-bold">
                    ★ {item.rating} <span className="text-gray-500 font-medium font-sans">({item.review_count})</span>
                  </div>
                </div>

                {/* PRICE DROP ALERTS TOGGLER */}
                <div className="flex justify-between items-center bg-black/30 border border-borderCard/50 p-2 rounded-xl text-[10px] font-bold uppercase tracking-wider">
                  <span className="flex items-center gap-1.5 text-gray-400">
                    {item.wishlist_alerts ? <Bell className="w-3.5 h-3.5 text-goldAccent" /> : <BellOff className="w-3.5 h-3.5 text-gray-500" />}
                    <span>Price Drop Alerts</span>
                  </span>
                  
                  {/* Switch */}
                  <button
                    onClick={() => toggleAlerts(item.id, !item.wishlist_alerts)}
                    className={`w-8 h-4 rounded-full p-0.5 transition-colors relative flex items-center ${
                      item.wishlist_alerts ? 'bg-goldAccent' : 'bg-white/10'
                    }`}
                  >
                    <div
                      className="w-3 h-3 rounded-full bg-black shadow-md transition-transform"
                      style={{ transform: item.wishlist_alerts ? 'translateX(16px)' : 'translateX(0px)' }}
                    />
                  </button>
                </div>

                {/* MOVE TO CART ACTION */}
                <button
                  onClick={async () => {
                    const variantId = item.variant_id || 1; // standard first variant fallback
                    try {
                      await addToCart(item.product_id, variantId, 1, mode);
                      await toggleWishlist(item.product_id); // remove from wishlist on move
                      showToast(`${item.name} moved to cart successfully!`, 'success');
                    } catch (e) {
                      showToast('Failed to move item to cart.', 'error');
                    }
                  }}
                  className="w-full py-2.5 rounded-xl bg-goldAccent hover:bg-goldAccent/95 text-black font-extrabold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(212,168,83,0.15)]"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Move to Cart</span>
                </button>

              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
