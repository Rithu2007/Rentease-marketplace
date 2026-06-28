import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ArrowRight, ArrowLeft, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user, submitOnboarding } = useAuth();
  
  const [step, setStep] = useState(1);

  // Preference States
  const [purpose, setPurpose] = useState<'buy' | 'rent' | 'both'>('both');
  const [spaces, setSpaces] = useState<string[]>([]);
  const [budget, setBudget] = useState(100000); // Default middle budget
  const [style, setStyle] = useState('Modern');

  // Spaces checklist options
  const spaceOptions = ['Living Room', 'Bedroom', 'Office', 'Study', 'Kids Room', 'Kitchen', 'Outdoor'];

  // Style cards options
  const styleOptions = [
    { name: 'Modern', desc: 'Sleek lines, gold accents, neutral backdrops', img: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300' },
    { name: 'Classic', desc: 'Heavy dark wood carvings, majestic structures', img: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=300' },
    { name: 'Minimalist', desc: 'Bare essentials, bright whites, clean spaces', img: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=300' },
    { name: 'Industrial', desc: 'Exposed dark metal, rugged woods, raw structures', img: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=300' }
  ];

  const handleSpaceToggle = (name: string) => {
    setSpaces(prev =>
      prev.includes(name) ? prev.filter(s => s !== name) : [...prev, name]
    );
  };

  const handleNext = () => {
    if (step < 4) {
      setStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    try {
      // Save preferences in Postgres DB, updates user.is_new_user = false
      await submitOnboarding(purpose, spaces, 500, budget, style);
      navigate('/products');
    } catch (error) {
      console.error('Failed to submit onboarding selections:', error);
    }
  };

  // Stepper container animation
  const stepVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.4 } },
    exit: { opacity: 0, x: -50, transition: { duration: 0.3 } }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0A0F] flex flex-col justify-center items-center p-4">
      
      {/* BACKGROUND DECORATIONS */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-goldAccent/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-tealAccent/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-2xl w-full flex flex-col gap-6 relative z-10">
        
        {/* PROGRESS BAR */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center text-[10px] text-gray-500 font-bold uppercase tracking-widest">
            <span>Onboarding Progress</span>
            <span className="text-goldAccent">Step {step} of 4</span>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-borderCard">
            <div
              className="h-full bg-gradient-to-r from-goldAccent to-tealAccent rounded-full transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* CONTAINER CARD */}
        <div className="glass-card rounded-3xl p-8 md:p-12 border border-borderCard min-h-[380px] flex flex-col justify-between shadow-2xl">
          
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="flex flex-col gap-6"
              >
                <div className="text-center md:text-left">
                  <h2 className="text-2xl md:text-3xl font-serif font-bold text-white uppercase tracking-wide">
                    Welcome {user?.name || 'Customer'}!
                  </h2>
                  <p className="text-xs text-gray-500 mt-2">Let us know what you are here to accomplish so we can tailor your feed.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                  {[
                    { id: 'buy', title: 'Buy Furniture', desc: 'Looking to purchase luxury furniture outright.' },
                    { id: 'rent', title: 'Rent Furniture', desc: 'Looking for flexible subscription-based rentals.' },
                    { id: 'both', title: 'I want Both', desc: 'Interested in exploring both rental and purchase.' }
                  ].map((option) => (
                    <div
                      key={option.id}
                      onClick={() => setPurpose(option.id as any)}
                      className={`glass-card p-6 rounded-2xl border cursor-pointer text-center flex flex-col gap-2 transition-all ${
                        purpose === option.id
                          ? 'border-goldAccent bg-goldAccent/5 shadow-[0_4px_20px_rgba(212,168,83,0.15)]'
                          : 'border-borderCard hover:border-white/10 hover:bg-white/5'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center mx-auto mb-2 ${
                        purpose === option.id ? 'border-goldAccent bg-goldAccent text-black' : 'border-gray-600'
                      }`}>
                        {purpose === option.id && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                      </div>
                      <h3 className="text-sm font-bold text-white">{option.title}</h3>
                      <p className="text-[10px] text-gray-400 leading-normal">{option.desc}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="flex flex-col gap-6"
              >
                <div>
                  <h2 className="text-2xl md:text-3xl font-serif font-bold text-white uppercase tracking-wide">
                    Select Your Spaces
                  </h2>
                  <p className="text-xs text-gray-500 mt-2">Which rooms or areas in your house are you furnishing?</p>
                </div>

                <div className="flex flex-wrap gap-3 mt-4">
                  {spaceOptions.map((name) => {
                    const isSelected = spaces.includes(name);
                    return (
                      <button
                        key={name}
                        onClick={() => handleSpaceToggle(name)}
                        className={`px-5 py-2.5 rounded-full text-xs font-semibold border transition-all ${
                          isSelected
                            ? 'bg-tealAccent border-tealAccent text-black font-extrabold shadow-[0_4px_12px_rgba(0,212,170,0.2)]'
                            : 'bg-transparent border-borderCard text-gray-400 hover:text-white hover:border-white/20'
                        }`}
                      >
                        {name}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="flex flex-col gap-6"
              >
                <div>
                  <h2 className="text-2xl md:text-3xl font-serif font-bold text-white uppercase tracking-wide">
                    Your Budget Range
                  </h2>
                  <p className="text-xs text-gray-500 mt-2">Adjust the slider below to set your maximum budget range.</p>
                </div>

                <div className="flex flex-col gap-6 mt-8">
                  {/* Slider */}
                  <div className="flex flex-col gap-2">
                    <input
                      type="range"
                      min={500}
                      max={200000}
                      step={500}
                      value={budget}
                      onChange={(e) => setBudget(parseInt(e.target.value))}
                      className="w-full accent-goldAccent cursor-pointer h-1.5 bg-white/10 rounded-full outline-none"
                    />
                    <div className="flex justify-between items-center text-[10px] text-gray-500 font-bold">
                      <span>₹500</span>
                      <span>₹2,00,000+</span>
                    </div>
                  </div>

                  {/* Budget Display */}
                  <div className="glass-card rounded-2xl p-6 border border-borderCard/40 text-center">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Set Limit</span>
                    <span className="text-3xl font-serif font-extrabold text-goldAccent">
                      ₹{budget.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="flex flex-col gap-6"
              >
                <div>
                  <h2 className="text-2xl md:text-3xl font-serif font-bold text-white uppercase tracking-wide">
                    Preferred Aesthetics
                  </h2>
                  <p className="text-xs text-gray-500 mt-2">Which home styling aesthetic speaks to your taste?</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                  {styleOptions.map((opt) => {
                    const isSelected = style === opt.name;
                    return (
                      <div
                        key={opt.name}
                        onClick={() => setStyle(opt.name)}
                        className={`relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer border transition-all ${
                          isSelected ? 'border-goldAccent shadow-[0_4px_12px_rgba(212,168,83,0.3)]' : 'border-borderCard'
                        }`}
                      >
                        <img src={opt.img} alt={opt.name} className="w-full h-full object-cover filter brightness-[0.6]" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                        
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full border border-white/20 bg-black/60 flex items-center justify-center">
                          {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-goldAccent" />}
                        </div>

                        <div className="absolute bottom-4 left-4 right-4">
                          <h3 className="text-xs font-bold text-white">{opt.name}</h3>
                          <p className="text-[9px] text-gray-400 mt-1 leading-tight">{opt.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ACTIONS TOOLBAR */}
          <div className="flex justify-between items-center mt-10 pt-6 border-t border-borderCard/30">
            {/* Back Button */}
            <button
              onClick={handlePrev}
              disabled={step === 1}
              className={`flex items-center gap-1.5 text-xs text-gray-400 hover:text-white font-bold tracking-widest uppercase transition-all ${
                step === 1 ? 'opacity-0 pointer-events-none' : ''
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            {/* Next / Complete Button */}
            <button
              onClick={handleNext}
              className="px-6 py-2.5 rounded-full bg-goldAccent hover:bg-goldAccent/95 text-black font-extrabold text-xs uppercase tracking-widest transition-all shadow-[0_4px_12px_rgba(212,168,83,0.2)] flex items-center gap-1.5"
            >
              <span>{step === 4 ? 'Furnish My Home' : 'Next'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
