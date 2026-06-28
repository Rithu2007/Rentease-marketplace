import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { motion } from 'framer-motion';
import {
  Truck, ShieldCheck, HeartHandshake, Zap,
  ArrowRight, Star, Mail, MapPin, Phone, MessageSquare
} from 'lucide-react';
import { ThreeDScene } from '../three/ThreeDScene';
import { useMode } from '../context/ModeContext';

export default function LandingPage() {
  const navigate = useNavigate();
  const { setMode } = useMode();

  const [showLoader, setShowLoader] = useState(false);
  const [progress, setProgress] = useState(0);

  const titleRef = useRef<HTMLHeadingElement>(null);
  const subTitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showLoader) return;

    const duration = 2000;
    const intervalTime = 30;
    const steps = duration / intervalTime;
    let current = 0;

    const timer = setInterval(() => {
      current++;
      const val = Math.min(100, Math.floor((current / steps) * 100));
      setProgress(val);
      if (current >= steps) {
        clearInterval(timer);
        sessionStorage.setItem('rentease_loaded', 'true');
        setTimeout(() => setShowLoader(false), 800);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [showLoader]);

  useEffect(() => {
    if (showLoader) return;

    // GSAP character animation for Hero Headline
    if (titleRef.current) {
      const text = titleRef.current.innerText;
      const chars = text.split('');
      titleRef.current.innerHTML = chars
        .map(char => `<span class="char inline-block">${char === ' ' ? '&nbsp;' : char}</span>`)
        .join('');

      const timeline = gsap.timeline();
      
      timeline.fromTo(
        '.char',
        { opacity: 0, y: 40, rotateX: -40 },
        {
          opacity: 1,
          y: 0,
          rotateX: 0,
          stagger: 0.03,
          duration: 0.8,
          ease: 'back.out(1.7)'
        }
      );

      if (subTitleRef.current) {
        timeline.fromTo(
          subTitleRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' },
          '-=0.4' // Overlaps 0.4s before completion
        );
      }

      if (ctaRef.current) {
        timeline.fromTo(
          ctaRef.current,
          { opacity: 0, scale: 0.9 },
          { opacity: 1, scale: 1, duration: 0.5, ease: 'power2.out' },
          '-=0.2'
        );
      }
    }
  }, [showLoader]);

  const handleCtaClick = (selectedMode: 'buy' | 'rent') => {
    setMode(selectedMode);
    navigate('/products');
  };

  const categories = [
    { name: 'Living Room', query: 'living', img: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500' },
    { name: 'Bedroom', query: 'bedroom', img: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=500' },
    { name: 'Office', query: 'office', img: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=500' },
    { name: 'Kitchen & Dining', query: 'kitchen', img: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=500' },
    { name: 'Appliances & TV', query: 'electronics', img: 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=500' },
    { name: 'Outdoor', query: 'outdoor', img: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=500' }
  ];

  const features = [
    { title: 'Zero Security Deposit', desc: 'Furnish your space without locked-up capital. Pay only for what you rent.', icon: Zap },
    { title: 'Free Delivery & Assembly', desc: 'Sit back while our professional delivery crew installs everything in 72 hours.', icon: Truck },
    { title: 'Flexible Tenures', desc: 'Choose a rental tenure from 1 month to 3 years. Swap or upgrade anytime.', icon: HeartHandshake },
    { title: 'Mint Condition Guarantee', desc: 'Every product goes through a multi-stage cleaning and sanitization check.', icon: ShieldCheck }
  ];

  const testimonials = [
    { name: 'Ananya Sharma', role: 'Software Engineer, Bangalore', text: 'RentEase made relocating completely hassle-free. The velvet chesterfield sofa is gorgeous and feels incredibly premium.', rating: 5 },
    { name: 'Rohit Mehta', role: 'Product Manager, Mumbai', text: 'Why buy appliances when you can rent? The smart double-door refrigerator was installed within 2 days. Top-notch service.', rating: 5 },
    { name: 'Priya Nair', role: 'Architect, Delhi', text: 'The 360-degree interactive viewer on the detail page helped me inspect the oak dining table perfectly. Highly recommend!', rating: 5 },
    { name: 'Vikram Malhotra', role: 'Designer, Pune', text: 'Incredibly luxurious furniture. The dark aesthetic fits my home style beautifully. Customer support is fantastic.', rating: 5 },
    { name: 'Siddharth Sen', role: 'Freelancer, Hyderabad', text: 'Flexible tenures allowed me to rent a high-end office chair for 6 months. Absolute game-changer for working from home.', rating: 5 }
  ];

  const topPicks = [
    { name: 'Marlow Queen Bed', price: '₹18,000', rent: '₹1,200/mo', img: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=300' },
    { name: 'Elysian Velvet Sofa', price: '₹34,000', rent: '₹2,100/mo', img: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=300' },
    { name: 'ArcticInverter 1.5 Ton AC', price: '₹42,000', rent: '₹2,500/mo', img: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=300' },
    { name: 'ErgoRise Adjustable Desk', price: '₹16,000', rent: '₹900/mo', img: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=300' },
    { name: 'SideBySide Neo Fridge', price: '₹68,000', rent: '₹3,500/mo', img: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=300' },
    { name: 'UltraSight 55-inch 4K TV', price: '₹48,000', rent: '₹1,800/mo', img: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=300' }
  ];

  return (
    <div className="relative min-h-screen bg-darkBg overflow-x-hidden flex flex-col justify-between">
      
      {/* --- CINEMATIC SPLIT LOADER --- */}
      {showLoader && (
        <>
          {/* Left panel split */}
          <div
            className="fixed top-0 left-0 w-1/2 h-full bg-[#0A0A0F] border-r border-borderCard/30 z-[9998] transition-transform duration-700 ease-in-out"
            style={{ transform: progress === 100 ? 'translateX(-100%)' : 'translateX(0)' }}
          />
          {/* Right panel split */}
          <div
            className="fixed top-0 right-0 w-1/2 h-full bg-[#0A0A0F] border-l border-borderCard/30 z-[9998] transition-transform duration-700 ease-in-out"
            style={{ transform: progress === 100 ? 'translateX(100%)' : 'translateX(0)' }}
          />
          {/* Central loading content */}
          <div
            className="fixed inset-0 flex flex-col items-center justify-center gap-4 z-[9999] transition-opacity duration-500 ease-in-out"
            style={{ opacity: progress === 100 ? 0 : 1, pointerEvents: 'none' }}
          >
            <h1 className="text-4xl md:text-6xl font-serif font-bold tracking-widest text-gold-gradient animate-pulse filter drop-shadow-[0_0_15px_rgba(212,168,83,0.3)]">
              RentEase
            </h1>
            <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden border border-borderCard/50 relative">
              <div
                className="h-full bg-goldAccent rounded-full transition-all duration-100 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[9px] font-mono text-gray-500 tracking-widest uppercase">{progress}% Loaded</span>
          </div>
        </>
      )}

      {/* 3D background wrapper */}
      <div className="absolute inset-0 z-0 h-[100vh] min-h-[600px] overflow-hidden">
        <ThreeDScene />
        <div className="absolute inset-0 bg-gradient-to-t from-darkBg via-darkBg/30 to-transparent pointer-events-none" />
      </div>

      {/* --- HERO SECTION --- */}
      <section className="relative z-10 min-h-[calc(100vh-65px)] flex flex-col justify-center items-center text-center px-4 md:px-8 max-w-5xl mx-auto py-20">
        <h1
          ref={titleRef}
          className="text-4xl sm:text-6xl md:text-7xl font-bold font-serif leading-tight text-white mb-6 uppercase tracking-wider perspective"
          style={{ transformStyle: 'preserve-3d' }}
        >
          Furnish Your World. Own or Rent.
        </h1>
        <p
          ref={subTitleRef}
          className="text-gray-400 text-lg md:text-xl max-w-2xl font-light mb-10 leading-relaxed"
        >
          RentEase brings curated, dark-luxury furniture and smart appliances straight to your home. Flexible tenures, zero deposits, and stunning quality.
        </p>
        
        {/* CTAs */}
        <div ref={ctaRef} className="flex flex-col sm:flex-row gap-5 w-full sm:w-auto">
          <button
            onClick={() => handleCtaClick('buy')}
            className="px-8 py-3.5 rounded-full bg-goldAccent hover:bg-goldAccent/95 text-black font-extrabold text-sm tracking-widest uppercase transition-all shadow-[0_8px_24px_rgba(212,168,83,0.3)] hover:translate-y-[-2px]"
          >
            Shop Now
          </button>
          <button
            onClick={() => handleCtaClick('rent')}
            className="px-8 py-3.5 rounded-full bg-transparent border border-borderGold hover:border-goldAccent text-white hover:text-goldAccent font-extrabold text-sm tracking-widest uppercase transition-all hover:bg-white/5 hover:translate-y-[-2px]"
          >
            Rent Furniture
          </button>
        </div>
      </section>



      {/* --- HOW IT WORKS SECTION --- */}
      <section className="relative z-10 py-24 border-t border-borderCard/30 max-w-7xl mx-auto px-4 md:px-6 w-full bg-darkBg">
        <div className="text-center mb-16">
          <span className="text-xs font-bold text-tealAccent uppercase tracking-widest bg-tealAccent/10 border border-tealAccent/20 px-3 py-1 rounded-full">Process</span>
          <h2 className="text-3xl md:text-5xl font-serif text-white mt-4 font-semibold uppercase tracking-wide">How RentEase Works</h2>
          <p className="text-gray-500 text-sm mt-3 max-w-lg mx-auto">Get your space fully set up in three simple, stress-free steps.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {[
            { step: '01', title: 'Select Your Mode', desc: 'Toggle between Buy or Rent mode. Browse our premium catalogue and pick your tenure.', backText: 'Rent premium luxury items or buy outright. Customize durations to suit your needs with zero deposits.' },
            { step: '02', title: 'Verify & Pay Securely', desc: 'Add items to cart, select delivery date, and pay via our instant secure Razorpay gateway.', backText: 'Our checkout offers secure payment processing. Subscriptions are billed automatically each month.' },
            { step: '03', title: '72-Hour Assembly', desc: 'Our white-glove assembly crew delivers, sets up, and positions everything in your home.', backText: 'White-glove assembly crew does the heavy lifting, assembly, and testing for you within 72 hours.' }
          ].map((item, idx) => (
            <div
              key={idx}
              className="w-full h-52 perspective-1000 group cursor-pointer"
            >
              <div className="relative w-full h-full transition-transform duration-700 transform-style-3d group-hover:rotate-y-180">
                {/* FRONT FACE */}
                <div className="absolute inset-0 bg-surfaceCard border border-borderCard rounded-2xl p-8 backface-hidden flex flex-col justify-between">
                  <span className="absolute top-4 right-6 font-serif text-5xl font-extrabold text-goldAccent/10">{item.step}</span>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-3 tracking-wide">{item.title}</h3>
                    <p className="text-xs text-gray-400 leading-relaxed">{item.desc}</p>
                  </div>
                  <span className="text-[9px] uppercase tracking-widest text-goldAccent font-bold">Hover to Flip</span>
                </div>
                {/* BACK FACE */}
                <div className="absolute inset-0 bg-goldAccent text-black rounded-2xl p-8 backface-hidden rotate-y-180 flex flex-col justify-between shadow-2xl">
                  <span className="font-serif text-4xl font-extrabold opacity-20">{item.step}</span>
                  <div>
                    <h3 className="text-sm font-extrabold uppercase tracking-wider mb-2">Detailed Process</h3>
                    <p className="text-xs font-semibold leading-relaxed">{item.backText}</p>
                  </div>
                  <span className="text-[9px] uppercase tracking-widest font-extrabold opacity-60">RentEase Services</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* --- WHY RENTEASE? FEATURES --- */}
      <section className="relative z-10 py-24 border-t border-borderCard/30 max-w-7xl mx-auto px-4 md:px-6 w-full bg-darkBg">
        <div className="text-center mb-16">
          <span className="text-xs font-bold text-goldAccent uppercase tracking-widest bg-goldAccent/5 border border-borderGold px-3 py-1 rounded-full">Luxury Experience</span>
          <h2 className="text-3xl md:text-5xl font-serif text-white mt-4 font-semibold uppercase tracking-wide">Why RentEase?</h2>
          <p className="text-gray-500 text-sm mt-3 max-w-lg mx-auto">Experience dark-luxury furniture renting and buying unlike any other platform.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.4 }}
                className="glass-card glass-card-hover rounded-2xl p-6 border border-borderCard flex flex-col gap-4"
              >
                <div className="p-3 bg-goldAccent/10 border border-borderGold w-fit rounded-xl text-goldAccent">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-md font-bold text-white tracking-wide">{feat.title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{feat.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* --- CATEGORIES PREVIEW --- */}
      <section className="relative z-10 py-24 border-t border-borderCard/30 max-w-7xl mx-auto px-4 md:px-6 w-full bg-darkBg">
        <div className="text-center mb-16">
          <span className="text-xs font-bold text-tealAccent uppercase tracking-widest bg-tealAccent/10 border border-tealAccent/20 px-3 py-1 rounded-full">Curated Rooms</span>
          <h2 className="text-3xl md:text-5xl font-serif text-white mt-4 font-semibold uppercase tracking-wide">Shop by Spaces</h2>
          <p className="text-gray-500 text-sm mt-3 max-w-lg mx-auto">Discover high-end sets designed explicitly for your spaces.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.08, duration: 0.4 }}
              onClick={() => {
                setMode('buy');
                navigate(`/products?category=${cat.name}`);
              }}
              className="relative aspect-[4/3] rounded-2xl overflow-hidden group cursor-pointer border border-borderCard"
            >
              <img
                src={cat.img}
                alt={cat.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 filter brightness-[0.7]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-serif font-bold text-white tracking-wide">{cat.name}</h3>
                  <span className="text-[10px] text-goldAccent tracking-widest uppercase mt-1 block">View Catalog</span>
                </div>
                <div className="w-8 h-8 rounded-full border border-borderGold bg-darkBg/60 backdrop-blur-md flex items-center justify-center text-goldAccent group-hover:bg-goldAccent group-hover:text-black transition-all">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* --- TOP PICKS CAROUSEL --- */}
      <section className="relative z-10 py-24 border-t border-borderCard/30 w-full bg-darkBg overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 md:px-6 mb-12 flex justify-between items-end">
          <div>
            <span className="text-xs font-bold text-goldAccent uppercase tracking-widest bg-goldAccent/5 border border-borderGold px-3 py-1 rounded-full">Trending Now</span>
            <h2 className="text-2xl md:text-4xl font-serif text-white mt-4 font-semibold uppercase tracking-wide">Our Top Picks</h2>
          </div>
          <button
            onClick={() => navigate('/products')}
            className="text-xs text-goldAccent hover:underline flex items-center gap-1 font-bold uppercase tracking-widest"
          >
            <span>See All</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Scrolling Carousel Wrapper with Gradient Edge Fades */}
        <div className="relative w-full">
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-darkBg to-transparent z-20 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-darkBg to-transparent z-20 pointer-events-none" />
          
          <div className="flex gap-6 overflow-x-auto py-4 px-8 scrollbar-none snap-x snap-mandatory">
            {topPicks.map((pick, idx) => (
              <div
                key={idx}
                onClick={() => navigate('/products')}
                className="glass-card flex-shrink-0 w-64 rounded-2xl p-4 border border-borderCard snap-start cursor-pointer hover:border-goldAccent/20 transition-all duration-300"
              >
                <img src={pick.img} alt={pick.name} className="w-full h-40 object-cover rounded-xl border border-borderCard" />
                <h3 className="text-sm font-bold text-white mt-4 tracking-wide truncate">{pick.name}</h3>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-borderCard/20">
                  <div>
                    <span className="text-[10px] text-gray-500 block">Buy price</span>
                    <span className="text-sm font-bold text-white">{pick.price}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-gray-500 block">Rent price</span>
                    <span className="text-sm font-bold text-tealAccent">{pick.rent}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- TESTIMONIALS SECTION --- */}
      <section className="relative z-10 py-24 border-t border-borderCard/30 max-w-7xl mx-auto px-4 md:px-6 w-full bg-darkBg">
        <div className="text-center mb-16">
          <span className="text-xs font-bold text-tealAccent uppercase tracking-widest bg-tealAccent/10 border border-tealAccent/20 px-3 py-1 rounded-full">Reviews</span>
          <h2 className="text-3xl md:text-5xl font-serif text-white mt-4 font-semibold uppercase tracking-wide">Client Testimonials</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((test, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              className="glass-card rounded-2xl p-6 border border-borderCard flex flex-col justify-between gap-6"
            >
              <div className="flex flex-col gap-3">
                {/* 5 stars */}
                <div className="flex text-goldAccent gap-0.5">
                  {[...Array(test.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-goldAccent" />
                  ))}
                </div>
                <p className="text-xs text-gray-300 leading-relaxed italic">&ldquo;{test.text}&rdquo;</p>
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">{test.name}</h4>
                <span className="text-[10px] text-gray-500 mt-0.5 block">{test.role}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="relative z-10 bg-[#06060A] border-t border-borderCard pt-16 pb-8 text-xs text-gray-500 w-full mt-auto">
        <div className="max-w-7xl mx-auto px-4 md:px-6 grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          
          {/* Brand Info */}
          <div className="flex flex-col gap-4">
            <span className="font-serif text-xl font-bold tracking-widest text-goldAccent">RentEase</span>
            <p className="leading-relaxed text-gray-400">
              India&apos;s luxury furniture and appliance platform. Elevate your spaces with our subscription-based rentals or outright purchases.
            </p>
            <div className="flex items-center gap-3 text-gray-400 mt-2">
              <MapPin className="w-4 h-4 text-goldAccent" />
              <span>Indiranagar, Bangalore, India</span>
            </div>
            <div className="flex items-center gap-3 text-gray-400">
              <Phone className="w-4 h-4 text-goldAccent" />
              <span>1800-RENT-EASE (Toll Free)</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-bold text-white tracking-wider uppercase mb-1">Company</h4>
            <Link to="/products" className="hover:text-goldAccent transition-all">Browse Catalog</Link>
            <Link to="/compare" className="hover:text-goldAccent transition-all">Product Compare</Link>
            <Link to="/cart" className="hover:text-goldAccent transition-all">Shopping Cart</Link>
            <span className="hover:text-goldAccent transition-all cursor-pointer">Careers</span>
            <span className="hover:text-goldAccent transition-all cursor-pointer">Press & Media</span>
          </div>

          {/* Legal / Policies */}
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-bold text-white tracking-wider uppercase mb-1">Legal</h4>
            <span className="hover:text-goldAccent transition-all cursor-pointer">Terms & Conditions</span>
            <span className="hover:text-goldAccent transition-all cursor-pointer">Privacy Policy</span>
            <span className="hover:text-goldAccent transition-all cursor-pointer">Rental Terms Agreement</span>
            <span className="hover:text-goldAccent transition-all cursor-pointer">Damage Policy</span>
            <span className="hover:text-goldAccent transition-all cursor-pointer">Refund Policies</span>
          </div>

          {/* Newsletter Signup */}
          <div className="flex flex-col gap-4">
            <h4 className="text-sm font-bold text-white tracking-wider uppercase mb-1">Subscribe</h4>
            <p className="leading-relaxed text-gray-400">
              Subscribe to get notified of price drops, exclusive collections, and seasonal offers.
            </p>
            <div className="flex bg-black/40 border border-borderCard rounded-full p-1 max-w-[280px]">
              <input
                type="email"
                placeholder="Your email address"
                className="flex-1 bg-transparent border-none outline-none pl-3 text-xs text-white placeholder-gray-600"
              />
              <button className="bg-goldAccent hover:bg-goldAccent/90 text-black rounded-full p-2 flex items-center justify-center transition-all">
                <Mail className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>

        {/* Copy / Socials */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 pt-8 border-t border-borderCard/30 flex flex-col sm:flex-row justify-between items-center gap-4 text-center">
          <p>&copy; {new Date().getFullYear()} RentEase Private Limited. All rights reserved.</p>
          <div className="flex gap-4 text-gray-400">
            <span className="hover:text-goldAccent transition-all cursor-pointer">Instagram</span>
            <span className="hover:text-goldAccent transition-all cursor-pointer">LinkedIn</span>
            <span className="hover:text-goldAccent transition-all cursor-pointer">Twitter</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
