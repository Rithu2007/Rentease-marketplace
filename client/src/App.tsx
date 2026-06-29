import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUp, MessageSquare, Send, X } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { ModeProvider } from './context/ModeContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';

// Lazy-loaded pages for code-splitting
const LandingPage = React.lazy(() => import('./pages/LandingPage'));
const AuthPage = React.lazy(() => import('./pages/AuthPage'));
const OnboardingPage = React.lazy(() => import('./pages/OnboardingPage'));
const ProductsPage = React.lazy(() => import('./pages/ProductsPage'));
const ProductDetailPage = React.lazy(() => import('./pages/ProductDetailPage'));
const ComparePage = React.lazy(() => import('./pages/ComparePage'));
const CartPage = React.lazy(() => import('./pages/CartPage'));
const CheckoutPage = React.lazy(() => import('./pages/CheckoutPage'));
const OrderSuccessPage = React.lazy(() => import('./pages/OrderSuccessPage'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));
const WishlistPage = React.lazy(() => import('./pages/WishlistPage'));

// Protected Route Wrapper
const ProtectedRoute: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center text-sm font-semibold tracking-widest text-[#D4A853] uppercase">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#D4A853]/25 border-t-[#D4A853] rounded-full animate-spin" />
          <span>Loading RentEase Session...</span>
        </div>
      </div>
    );
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

// Page Transition wrapper
const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return <>{children}</>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="w-full min-h-[calc(100vh-65px)]"
    >
      {children}
    </motion.div>
  );
};

const AppContent: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  // Show sidebar on all pages for logged-in users, except landing page (/), auth (/login, /register) and onboarding (/onboarding)
  const showSidebar = !!user && !['/', '/login', '/register', '/onboarding'].includes(location.pathname);



  // --- RIPPLE CLICK EFFECT ---
  useEffect(() => {
    const handleButtonClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const button = target.closest('button');
      if (!button) return;

      const circle = document.createElement('span');
      const diameter = Math.max(button.clientWidth, button.clientHeight);
      const radius = diameter / 2;

      const rect = button.getBoundingClientRect();
      circle.style.width = circle.style.height = `${diameter}px`;
      circle.style.left = `${e.clientX - rect.left - radius}px`;
      circle.style.top = `${e.clientY - rect.top - radius}px`;
      circle.classList.add('ripple');

      const ripple = button.querySelector('.ripple');
      if (ripple) {
        ripple.remove();
      }

      button.classList.add('ripple-button');
      button.appendChild(circle);

      setTimeout(() => {
        circle.remove();
      }, 600);
    };

    window.addEventListener('click', handleButtonClick);
    return () => window.removeEventListener('click', handleButtonClick);
  }, []);

  // --- BACK TO TOP & SCROLL PROGRESS ---
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY;
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        setScrollProgress((scrolled / totalHeight) * 100);
      }
      setShowBackToTop(scrolled > 200);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // --- WHATSAPP SUPPORT CHAT SIMULATOR ---
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'bot' | 'user'; text: string }>>([]);
  const [showChips, setShowChips] = useState(true);

  const openSupportChat = () => {
    setShowChat(true);
    if (chatMessages.length === 0) {
      setChatMessages([
        { sender: 'bot', text: `Hi ${user?.name || 'Guest'}! How can we help you today?` }
      ]);
      setShowChips(true);
    }
  };

  const handleChipClick = (chipText: string) => {
    setChatMessages(prev => [...prev, { sender: 'user', text: chipText }]);
    setShowChips(false);

    setTimeout(() => {
      let reply = "";
      if (chipText.includes("Track")) {
        reply = "To track your order, please navigate to the dashboard's My Orders section. Estimated delivery is within 72 hours from checkout.";
      } else if (chipText.includes("queries")) {
        reply = "Our rental agreements carry zero security deposits and offer tenure options between 3 to 12 months. Swapping is available after 3 months!";
      } else if (chipText.includes("Return")) {
        reply = "Returns can be scheduled directly from the dashboard under Active Rentals, or by calling our support line at 1800-RENT-EASE.";
      } else {
        reply = "A RentEase support specialist has been notified. We will call you shortly!";
      }
      setChatMessages(prev => [...prev, { sender: 'bot', text: reply }]);
    }, 1000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-darkBg text-gray-200">


      <Navbar />
      <div className="flex-1 flex overflow-hidden w-full relative">
        {/* Placeholder taking up the collapsed sidebar width (64px) */}
        {showSidebar && <div className="w-16 flex-shrink-0 transition-all duration-300" />}
        {showSidebar && <Sidebar />}

        <main className="flex-1 overflow-y-auto relative">
          <React.Suspense
            fallback={
              <div className="min-h-[calc(100vh-65px)] flex items-center justify-center text-sm font-semibold text-goldAccent uppercase tracking-widest">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-4 border-goldAccent/25 border-t-goldAccent rounded-full animate-spin" />
                  <span>Loading Component...</span>
                </div>
              </div>
            }
          >
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>
                {/* Public Pages */}
                <Route path="/" element={<PageTransition><LandingPage /></PageTransition>} />
                <Route path="/login" element={<PageTransition><AuthPage mode="login" /></PageTransition>} />
                <Route path="/register" element={<PageTransition><AuthPage mode="register" /></PageTransition>} />

                {/* Protected Pages */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/onboarding" element={<PageTransition><OnboardingPage /></PageTransition>} />
                  <Route path="/products" element={<PageTransition><ProductsPage /></PageTransition>} />
                  <Route path="/products/:id" element={<PageTransition><ProductDetailPage /></PageTransition>} />
                  <Route path="/compare" element={<PageTransition><ComparePage /></PageTransition>} />
                  <Route path="/cart" element={<PageTransition><CartPage /></PageTransition>} />
                  <Route path="/checkout" element={<PageTransition><CheckoutPage /></PageTransition>} />
                  <Route path="/success" element={<PageTransition><OrderSuccessPage /></PageTransition>} />
                  <Route path="/profile" element={<PageTransition><ProfilePage /></PageTransition>} />
                  <Route path="/wishlist" element={<PageTransition><WishlistPage /></PageTransition>} />
                  <Route path="/dashboard" element={<Navigate to="/profile?tab=dashboard" replace />} />
                  <Route path="/orders" element={<Navigate to="/profile?tab=orders" replace />} />
                  <Route path="/settings" element={<Navigate to="/profile?tab=profile" replace />} />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AnimatePresence>
          </React.Suspense>
        </main>
      </div>

      {/* --- BACK TO TOP SCROLL PROGRESS BUTTON --- */}
      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-40 w-11 h-11 bg-[#111118]/80 backdrop-blur-md rounded-full border border-borderCard/30 flex items-center justify-center text-goldAccent hover:text-white shadow-2xl transition-all"
        >
          {/* Circular progress path */}
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle
              cx="22"
              cy="22"
              r="19"
              fill="transparent"
              stroke="currentColor"
              strokeWidth="2.5"
              className="text-goldAccent/10"
            />
            <circle
              cx="22"
              cy="22"
              r="19"
              fill="transparent"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeDasharray="120"
              strokeDashoffset={120 - (120 * scrollProgress) / 100}
              className="text-goldAccent transition-all duration-75"
            />
          </svg>
          <ArrowUp className="w-4 h-4 relative z-10" />
        </button>
      )}

      {/* --- WHATSAPP SUPPORT FLOAT --- */}
      <div className="fixed bottom-6 right-20 z-40">
        <button
          onClick={openSupportChat}
          className="w-11 h-11 bg-goldAccent text-black rounded-full shadow-2xl hover:scale-105 transition-all flex items-center justify-center hover:bg-goldAccent/95 relative border border-borderGold"
          title="Chat with Support"
        >
          <MessageSquare className="w-4.5 h-4.5" />
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-tealAccent rounded-full border border-darkBg animate-ping" />
        </button>

        {showChat && (
          <div className="absolute bottom-16 right-0 w-80 glass-card rounded-2xl border border-borderCard/80 shadow-2xl overflow-hidden z-50 animate-fade-in flex flex-col h-96">
            {/* Header */}
            <div className="bg-[#181824] px-4 py-3 flex justify-between items-center border-b border-borderCard/30">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-tealAccent rounded-full animate-pulse" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">RentEase Support</span>
              </div>
              <button onClick={() => setShowChat(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 scrollbar-none bg-black/10">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`text-xs p-3 rounded-2xl max-w-[85%] ${
                    msg.sender === 'bot'
                      ? 'bg-[#1D1D2C] text-white self-start rounded-tl-none border border-borderCard/50'
                      : 'bg-goldAccent text-black font-semibold self-end rounded-tr-none'
                  }`}
                >
                  {msg.text}
                </div>
              ))}
            </div>

            {/* Chips & Options */}
            {showChips && (
              <div className="p-3 border-t border-borderCard/20 bg-black/20 flex flex-col gap-2">
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest pl-1">Quick Select Options</p>
                <div className="flex flex-wrap gap-1.5">
                  {['Track my order 📦', 'Rental queries 📋', 'Return a product 🚚'].map((text) => (
                    <button
                      key={text}
                      onClick={() => handleChipClick(text)}
                      className="px-2.5 py-1 bg-white/5 border border-borderCard/50 hover:border-goldAccent text-[9px] font-bold text-goldAccent hover:text-white rounded-lg transition-all"
                    >
                      {text}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <ToastProvider>
            <CartProvider>
              <WishlistProvider>
                <ModeProvider>
                  <AppContent />
                </ModeProvider>
              </WishlistProvider>
            </CartProvider>
          </ToastProvider>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}
