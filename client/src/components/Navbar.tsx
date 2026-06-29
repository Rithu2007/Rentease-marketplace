import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Heart, Bell, User as UserIcon, Search, Clock, Trash2, X, Sun, Moon, Home, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useMode } from '../context/ModeContext';
import { useTheme, themes as colorThemes } from '../context/ThemeContext';
import { products } from '../data/products';

interface SearchSuggestion {
  id: number;
  name: string;
  brand: string;
  category: string;
  buy_price: string;
  rent_price_month: string;
  thumbnail: string;
}

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { cartItems } = useCart();
  const { wishlist } = useWishlist();
  const { mode, setMode } = useMode();
  const { currentTheme, setTheme, themeMode, setThemeMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);

  // Dropdown States
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Mock Notifications
  const notifications = [
    { id: 1, text: 'Welcome to RentEase! Finish onboarding to customize your feed.', date: 'Just now' },
    { id: 2, text: 'Festive Season Sale: Use code FESTIVE15 for 15% off.', date: '2 hours ago' },
    { id: 3, text: 'Order #1003 has been shipped successfully.', date: '1 day ago' },
  ];

  const searchRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const themeMenuRef = useRef<HTMLDivElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('rentease_recent_searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        setRecentSearches([]);
      }
    }
  }, []);

  // Debounced search trigger
  useEffect(() => {
    if (!searchQuery || searchQuery.trim() === '') {
      setSuggestions([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      try {
        const term = searchQuery.toLowerCase().trim();
        const matched = products.filter(p => 
          p.name.toLowerCase().includes(term) ||
          p.brand.toLowerCase().includes(term) ||
          p.category.toLowerCase().includes(term)
        ).slice(0, 5).map(p => ({
          id: p.id,
          name: p.name,
          brand: p.brand,
          category: p.category,
          buy_price: p.buy_price,
          rent_price_month: p.rent_price_month,
          thumbnail: p.variants?.[0]?.images?.[0] || p.thumbnail || ''
        }));
        setSuggestions(matched);
      } catch (err) {
        console.error('Search suggestion failure:', err);
      }
    }, 250);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
        setShowThemeMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Save search query to history helper
  const saveSearchToHistory = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    const updated = [trimmed, ...recentSearches.filter(s => s !== trimmed)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('rentease_recent_searches', JSON.stringify(updated));
  };

  const handleSearchSubmit = (query: string) => {
    saveSearchToHistory(query);
    setIsFocused(false);
    navigate(`/products?search=${encodeURIComponent(query)}`);
  };

  const handleClearHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches([]);
    localStorage.removeItem('rentease_recent_searches');
  };

  // Keyboard navigation for suggestions
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const suggestionsCount = suggestions.length + (searchQuery ? 1 : 0); // Include "See all" row
    if (suggestionsCount === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev + 1 >= suggestionsCount ? 0 : prev + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev - 1 < 0 ? suggestionsCount - 1 : prev - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex === -1) {
        handleSearchSubmit(searchQuery);
      } else if (activeIndex === suggestions.length) {
        handleSearchSubmit(searchQuery);
      } else {
        const selected = suggestions[activeIndex];
        saveSearchToHistory(selected.name);
        setIsFocused(false);
        navigate(`/products/${selected.id}`);
      }
    } else if (e.key === 'Escape') {
      setIsFocused(false);
    }
  };

  // Highlighter helper
  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi'));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase()
            ? <span key={i} className="text-goldAccent font-semibold">{part}</span>
            : part
        )}
      </>
    );
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
    setShowUserMenu(false);
  };

  const confirmLogout = async () => {
    try {
      await logout();
      setShowLogoutConfirm(false);
      navigate('/');
    } catch (e) {
      console.error(e);
    }
  };

  // Check if landing page for transparent nav
  const isLanding = location.pathname === '/';
  const [solidNav, setSolidNav] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setSolidNav(true);
      } else {
        setSolidNav(false);
      }
    };
    if (isLanding) {
      window.addEventListener('scroll', handleScroll);
      return () => {
        window.removeEventListener('scroll', handleScroll);
      };
    }
    return () => {};
  }, [isLanding]);

  const navClass = isLanding && !solidNav
    ? 'fixed top-0 left-0 w-full z-50 bg-transparent transition-all duration-300 border-b border-transparent py-4'
    : 'sticky top-0 left-0 w-full z-50 bg-darkBg/90 backdrop-blur-md transition-all duration-300 border-b border-borderCard py-3';

  return (
    <>
      <nav className={navClass}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between gap-4">
          
          {/* Logo & Home Link */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <Link to="/" className="flex items-center gap-2">
              <span className="font-serif text-2xl font-bold tracking-widest text-goldAccent">RentEase</span>
            </Link>
            <Link
              to="/"
              className="hidden md:flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-goldAccent transition-all border-l border-borderCard pl-4 py-1"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </Link>
          </div>

          {/* Buy/Rent Toggle Context Switch */}
          {user && (
            <div className="hidden md:flex bg-black/40 border border-borderCard rounded-full p-1 max-w-[180px] w-full">
              <button
                onClick={() => setMode('buy')}
                className={`flex-1 text-xs py-1.5 px-3 rounded-full font-medium transition-all duration-200 ${
                  mode === 'buy' ? 'bg-goldAccent text-black font-bold' : 'text-gray-400 hover:text-white'
                }`}
              >
                Buy
              </button>
              <button
                onClick={() => setMode('rent')}
                className={`flex-1 text-xs py-1.5 px-3 rounded-full font-medium transition-all duration-200 ${
                  mode === 'rent' ? 'bg-goldAccent text-black font-bold' : 'text-gray-400 hover:text-white'
                }`}
              >
                Rent
              </button>
            </div>
          )}

          {/* Autocomplete Search Bar */}
          <div ref={searchRef} className="relative flex-1 max-w-lg hidden sm:block">
            <div
              className={`flex items-center bg-black/40 border rounded-full px-4 py-1.5 transition-all duration-200 ${
                isFocused ? 'border-goldAccent shadow-[0_0_8px_rgba(var(--accent),0.3)]' : 'border-borderCard'
              }`}
            >
              <Search className="w-4 h-4 text-gray-400 mr-2" />
              <input
                type="text"
                placeholder="Search premium furniture, appliances..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setActiveIndex(-1);
                }}
                onFocus={() => setIsFocused(true)}
                onKeyDown={handleKeyDown}
                className="w-full bg-transparent border-none outline-none text-sm text-white placeholder-gray-500"
                role="combobox"
                aria-expanded={isFocused}
                aria-label="Product Search"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')}>
                  <X className="w-4 h-4 text-gray-400 hover:text-white" />
                </button>
              )}
            </div>

            {/* Suggestions Panel */}
            {isFocused && (
              <div className="absolute top-full left-0 right-0 mt-2 glass-card rounded-2xl shadow-2xl z-50 overflow-hidden border border-borderCard max-h-[420px] overflow-y-auto">
                {/* Empty Query: Show History */}
                {!searchQuery && (
                  <div className="p-4">
                    <div className="flex justify-between items-center text-xs text-gray-500 mb-2 font-medium">
                      <span>RECENT SEARCHES</span>
                      {recentSearches.length > 0 && (
                        <button
                          onClick={handleClearHistory}
                          className="hover:text-goldAccent flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> Clear
                        </button>
                      )}
                    </div>
                    {recentSearches.length === 0 ? (
                      <div className="text-sm text-gray-400 py-2">No recent searches.</div>
                    ) : (
                      <div className="flex flex-col">
                        {recentSearches.map((term, idx) => (
                          <div
                            key={idx}
                            onClick={() => handleSearchSubmit(term)}
                            className="flex items-center justify-between py-2 px-1 hover:bg-white/5 rounded-lg cursor-pointer text-sm"
                          >
                            <span className="flex items-center gap-2 text-gray-300">
                              <Clock className="w-3.5 h-3.5 text-gray-500" />
                              {term}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Suggestions List */}
                {searchQuery && suggestions.length > 0 && (
                  <div className="p-2 flex flex-col gap-1">
                    {suggestions.map((item, idx) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          saveSearchToHistory(item.name);
                          setIsFocused(false);
                          navigate(`/products/${item.id}`);
                        }}
                        onMouseEnter={() => setActiveIndex(idx)}
                        className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all ${
                          activeIndex === idx ? 'bg-white/5 border-l-2 border-goldAccent' : ''
                        }`}
                      >
                        <img
                          src={item.thumbnail || 'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=100'}
                          alt={item.name}
                          className="w-10 h-10 object-cover rounded-lg border border-borderCard"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">
                            {highlightMatch(item.name, searchQuery)}
                          </p>
                          <span className="text-[10px] uppercase tracking-wide bg-black/40 text-tealAccent px-2 py-0.5 rounded border border-borderCard">
                            {item.category}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-white">
                            {mode === 'rent' ? `₹${parseFloat(item.rent_price_month).toLocaleString('en-IN')}/mo` : `₹${parseFloat(item.buy_price).toLocaleString('en-IN')}`}
                          </p>
                        </div>
                      </div>
                    ))}
                    
                    {/* "See all results" option */}
                    <div
                      onClick={() => handleSearchSubmit(searchQuery)}
                      onMouseEnter={() => setActiveIndex(suggestions.length)}
                      className={`text-center py-2.5 mt-1 border-t border-borderCard/30 text-sm font-semibold text-goldAccent hover:underline cursor-pointer rounded-lg ${
                        activeIndex === suggestions.length ? 'bg-white/5' : ''
                      }`}
                    >
                      See all results for &quot;{searchQuery}&quot;
                    </div>
                  </div>
                )}

                {searchQuery && suggestions.length === 0 && (
                  <div className="p-4 text-center text-sm text-gray-400">
                    No results found for &quot;{searchQuery}&quot;
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Toolbar Items (Right) */}
          <div className="flex items-center gap-1 md:gap-3 flex-shrink-0">
            
            {/* Search for mobile screen */}
            <button
              onClick={() => navigate('/products')}
              className="sm:hidden p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/5"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Wishlist Link */}
            {user && (
              <Link
                to="/wishlist"
                className="relative p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/5 transition-all"
              >
                <Heart className="w-5 h-5" />
                {wishlist.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-goldAccent text-black font-extrabold text-[9px] w-5 h-5 rounded-full flex items-center justify-center animate-pulse shadow-[0_0_8px_rgba(var(--accent),0.5)]">
                    {wishlist.length}
                  </span>
                )}
              </Link>
            )}

            {/* Cart Link */}
            {user && (
              <Link
                to="/cart"
                id="nav-cart-icon"
                className="relative p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/5 transition-all"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartItems.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-tealAccent text-black font-extrabold text-[9px] w-5 h-5 rounded-full flex items-center justify-center animate-pulse shadow-[0_0_8px_rgba(var(--secondary),0.5)]">
                    {cartItems.reduce((acc, curr) => acc + curr.quantity, 0)}
                  </span>
                )}
              </Link>
            )}

            {/* Dark/Light Mode Toggle */}
            <button
              onClick={() => setThemeMode(themeMode === 'dark' ? 'light' : 'dark')}
              className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/5 transition-all"
              title={themeMode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {themeMode === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Notification Bell Dropdown */}
            {user && (
              <div ref={notificationsRef} className="relative">
                <button
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    setShowThemeMenu(false);
                    setShowUserMenu(false);
                  }}
                  className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/5 transition-all"
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-2 right-2 w-2 h-2 bg-tealAccent rounded-full" />
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 glass-card rounded-2xl shadow-2xl z-50 border border-borderCard overflow-hidden">
                    <div className="p-4 border-b border-borderCard/30 flex justify-between items-center">
                      <span className="font-semibold text-sm text-goldAccent">Notifications</span>
                    </div>
                    <div className="flex flex-col max-h-[300px] overflow-y-auto">
                      {notifications.map((n) => (
                        <div key={n.id} className="p-4 border-b border-borderCard/10 hover:bg-white/5 cursor-pointer">
                          <p className="text-xs text-white leading-relaxed">{n.text}</p>
                          <span className="text-[10px] text-gray-500 mt-1 block">{n.date}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}



            {/* User Profile Dropdown */}
            {user ? (
              <div ref={userMenuRef} className="relative">
                <button
                  onClick={() => {
                    setShowUserMenu(!showUserMenu);
                    setShowNotifications(false);
                    setShowThemeMenu(false);
                  }}
                  className="flex items-center gap-1.5 focus:outline-none p-1 rounded-full hover:bg-white/5 border border-transparent hover:border-borderCard transition-all"
                >
                  <img
                    src={user.profile_picture || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.name}`}
                    alt={user.name}
                    className="w-7 h-7 rounded-full object-cover border border-borderGold"
                  />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 glass-card rounded-2xl shadow-2xl z-50 border border-borderCard overflow-hidden py-1">
                    <div className="px-4 py-2.5 border-b border-borderCard/30">
                      <p className="text-xs text-gray-500 font-semibold uppercase truncate">Welcome</p>
                      <p className="text-sm text-white font-bold truncate">{user.name}</p>
                    </div>
                    <Link
                      to="/profile?tab=profile"
                      onClick={() => setShowUserMenu(false)}
                      className="block px-4 py-2.5 text-xs text-gray-300 hover:text-white hover:bg-white/5 transition-all"
                    >
                      Profile Settings
                    </Link>
                    <button
                      onClick={handleLogoutClick}
                      className="w-full text-left block px-4 py-2.5 text-xs text-[#ff5b5b] hover:bg-white/5 transition-all border-t border-borderCard/30 font-semibold"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-goldAccent hover:bg-goldAccent/95 text-black px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-[0_4px_12px_rgba(var(--accent),0.2)] flex items-center gap-1"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>
            )}

          </div>
        </div>
      </nav>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="glass-card rounded-2xl p-6 border border-borderCard max-w-sm w-full mx-4 shadow-2xl">
            <h3 className="font-serif text-lg text-white mb-2 font-bold">Are you sure you want to log out?</h3>
            <p className="text-xs text-gray-400 mb-6">You will need to sign back in to access your dashboard, cart, and place orders.</p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white py-2 rounded-xl text-xs font-semibold border border-borderCard transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 bg-[#ff5b5b] hover:bg-[#e04343] text-white py-2 rounded-xl text-xs font-semibold transition-all shadow-[0_4px_12px_rgba(255,91,91,0.2)]"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

