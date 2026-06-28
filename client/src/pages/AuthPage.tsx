import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Eye, EyeOff, Mail, Lock, User as UserIcon, Phone, ShieldCheck, CheckCircle, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ThreeDScene } from '../three/ThreeDScene';
import api from '../api/axios';

// --- ZOD VALIDATION SCHEMAS ---
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.')
});

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Please enter a valid email address.'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ['confirmPassword']
});

interface AuthPageProps {
  mode: 'login' | 'register';
}

export default function AuthPage({ mode }: AuthPageProps) {
  const navigate = useNavigate();
  const { login, register, mockGoogleLogin } = useAuth();
  
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  
  // Forgot Password / OTP Flow States
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2>(1); // 1 = send email/OTP, 2 = verify OTP/reset password
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);

  // Mock Google Sign-In Selector State
  const [showMockGoogleSelector, setShowMockGoogleSelector] = useState(false);
  const [mockGoogleName, setMockGoogleName] = useState('');
  const [mockGoogleEmail, setMockGoogleEmail] = useState('');

  // Register Password Strength Evaluator
  const [passStrength, setPassStrength] = useState(0);

  // Form setups
  const {
    register: loginRegister,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors, isSubmitting: isLoginSubmitting }
  } = useForm({
    resolver: zodResolver(loginSchema)
  });

  const {
    register: regRegister,
    handleSubmit: handleRegSubmit,
    watch: regWatch,
    formState: { errors: regErrors, isSubmitting: isRegSubmitting }
  } = useForm({
    resolver: zodResolver(registerSchema)
  });

  const passwordValue = regWatch('password');

  // Watch password changing to calculate strength
  React.useEffect(() => {
    if (!passwordValue) {
      setPassStrength(0);
      return;
    }
    let score = 0;
    if (passwordValue.length >= 8) score++;
    if (/[a-z]/.test(passwordValue) && /[A-Z]/.test(passwordValue)) score++;
    if (/\d/.test(passwordValue)) score++;
    if (/[^A-Za-z0-9]/.test(passwordValue)) score++;
    setPassStrength(score);
  }, [passwordValue]);

  // Form submission actions
  const onLogin = async (data: any) => {
    setServerError(null);
    try {
      await login(data.email, data.password);
      navigate('/products');
    } catch (err: any) {
      setServerError(err.response?.data?.message || 'Login failed. Incorrect credentials.');
    }
  };

  const onRegister = async (data: any) => {
    setServerError(null);
    try {
      await register(data.name, data.email, data.password, data.phone);
      navigate('/onboarding'); // Redirect successful registrations to onboarding stepper
    } catch (err: any) {
      setServerError(err.response?.data?.message || 'Registration failed.');
    }
  };

  // Google OAuth flow initiator
  const handleGoogleClick = () => {
    window.location.href = 'http://localhost:5000/api/auth/google';
  };

  const handleMockGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mockGoogleEmail || !mockGoogleName) return;
    try {
      await mockGoogleLogin(mockGoogleName, mockGoogleEmail);
      setShowMockGoogleSelector(false);
      navigate('/onboarding');
    } catch (err: any) {
      setServerError(err.response?.data?.message || 'Mock Google login failed.');
    }
  };

  // Forgot Password / OTP verify actions
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotMessage(null);
    try {
      const res = await api.post('/auth/forgot-password', { email: forgotEmail });
      setForgotMessage(res.data.message);
      // In development mode, mock alerts OTP
      if (res.data.otp) {
        setForgotMessage(`${res.data.message} OTP is: ${res.data.otp}`);
      }
      setForgotStep(2);
    } catch (err: any) {
      setForgotError(err.response?.data?.message || 'Failed to request password reset.');
    }
  };

  const handleVerifyAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotMessage(null);
    try {
      await api.post('/auth/reset-password', {
        email: forgotEmail,
        otp: forgotOtp,
        newPassword: forgotNewPassword
      });
      setForgotMessage('Password reset successful. You can log in now!');
      setTimeout(() => {
        setShowForgotModal(false);
        setForgotStep(1);
        setForgotEmail('');
        setForgotOtp('');
        setForgotNewPassword('');
        setForgotMessage(null);
      }, 2000);
    } catch (err: any) {
      setForgotError(err.response?.data?.message || 'Failed to reset password.');
    }
  };

  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['bg-[#ff5b5b]', 'bg-orange-500', 'bg-yellow-500', 'bg-tealAccent'];

  return (
    <div className="min-h-[calc(100vh-65px)] flex relative bg-darkBg text-white overflow-hidden">
      
      {/* LEFT SIDE - Blurred 3D Scene */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-black overflow-hidden items-center justify-center">
        {/* Render ThreeDScene in background */}
        <div className="absolute inset-0 z-0 scale-95 blur-[4px] opacity-75">
          <ThreeDScene />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-darkBg z-10" />
        <div className="absolute inset-0 bg-black/40 z-10" />

        <div className="relative z-20 text-center max-w-md px-8">
          <h2 className="text-4xl font-serif font-bold text-goldAccent mb-4 tracking-wide uppercase">LUXURY RESIDENCE</h2>
          <p className="text-xs text-gray-400 leading-relaxed uppercase tracking-widest">
            A carefully curated blend of premium aesthetics and functional ease. Sign in to design your spaces with RentEase.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE - Authentication Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 z-20 bg-darkBg relative">
        <div className="max-w-md w-full glass-card border border-borderCard rounded-3xl p-8 shadow-2xl relative">
          
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-serif font-bold tracking-wide uppercase text-white">
              {mode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-xs text-gray-500 mt-2">
              {mode === 'login' ? 'Sign in to manage your spaces and orders.' : 'Sign up to start renting or buying.'}
            </p>
          </div>

          {serverError && (
            <div className="bg-[#ff5b5b]/10 border border-[#ff5b5b]/30 text-[#ff5b5b] p-3.5 rounded-xl text-xs mb-6 text-center font-medium">
              {serverError}
            </div>
          )}

          {/* Form Switch: Login vs Register */}
          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit(onLogin)} className="flex flex-col gap-5">
              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-400 font-semibold tracking-wide uppercase">Email Address</label>
                <div className="flex items-center bg-black/40 border border-borderCard rounded-xl px-4 py-3 focus-within:border-goldAccent transition-all">
                  <Mail className="w-4 h-4 text-gray-500 mr-3" />
                  <input
                    type="email"
                    placeholder="youremail@gmail.com"
                    {...loginRegister('email')}
                    className="bg-transparent border-none outline-none text-xs text-white placeholder-gray-600 w-full"
                  />
                </div>
                {loginErrors.email && <span className="text-[10px] text-[#ff5b5b] font-medium">{loginErrors.email.message as string}</span>}
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs text-gray-400 font-semibold tracking-wide uppercase">Password</label>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-[10px] text-goldAccent hover:underline uppercase tracking-wider font-semibold"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="flex items-center bg-black/40 border border-borderCard rounded-xl px-4 py-3 focus-within:border-goldAccent transition-all">
                  <Lock className="w-4 h-4 text-gray-500 mr-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...loginRegister('password')}
                    className="bg-transparent border-none outline-none text-xs text-white placeholder-gray-600 w-full"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="w-4 h-4 text-gray-500 hover:text-white" /> : <Eye className="w-4 h-4 text-gray-500 hover:text-white" />}
                  </button>
                </div>
                {loginErrors.password && <span className="text-[10px] text-[#ff5b5b] font-medium">{loginErrors.password.message as string}</span>}
              </div>

              <button
                type="submit"
                disabled={isLoginSubmitting}
                className="w-full py-3.5 mt-2 rounded-xl bg-goldAccent hover:bg-goldAccent/95 text-black font-extrabold text-xs uppercase tracking-widest transition-all shadow-[0_4px_12px_rgba(212,168,83,0.2)] disabled:opacity-50"
              >
                {isLoginSubmitting ? 'Signing In...' : 'Log In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegSubmit(onRegister)} className="flex flex-col gap-4">
              {/* Full Name */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400 font-semibold tracking-wide uppercase">Full Name</label>
                <div className="flex items-center bg-black/40 border border-borderCard rounded-xl px-4 py-2.5 focus-within:border-goldAccent transition-all">
                  <UserIcon className="w-4 h-4 text-gray-500 mr-3" />
                  <input
                    type="text"
                    placeholder="John Doe"
                    {...regRegister('name')}
                    className="bg-transparent border-none outline-none text-xs text-white placeholder-gray-600 w-full"
                  />
                </div>
                {regErrors.name && <span className="text-[10px] text-[#ff5b5b] font-medium">{regErrors.name.message as string}</span>}
              </div>

              {/* Email */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400 font-semibold tracking-wide uppercase">Email Address</label>
                <div className="flex items-center bg-black/40 border border-borderCard rounded-xl px-4 py-2.5 focus-within:border-goldAccent transition-all">
                  <Mail className="w-4 h-4 text-gray-500 mr-3" />
                  <input
                    type="email"
                    placeholder="youremail@gmail.com"
                    {...regRegister('email')}
                    className="bg-transparent border-none outline-none text-xs text-white placeholder-gray-600 w-full"
                  />
                </div>
                {regErrors.email && <span className="text-[10px] text-[#ff5b5b] font-medium">{regErrors.email.message as string}</span>}
              </div>

              {/* Phone Number */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400 font-semibold tracking-wide uppercase">Phone Number</label>
                <div className="flex items-center bg-black/40 border border-borderCard rounded-xl px-4 py-2.5 focus-within:border-goldAccent transition-all">
                  <Phone className="w-4 h-4 text-gray-500 mr-3" />
                  <input
                    type="tel"
                    placeholder="9876543210"
                    {...regRegister('phone')}
                    className="bg-transparent border-none outline-none text-xs text-white placeholder-gray-600 w-full"
                  />
                </div>
                {regErrors.phone && <span className="text-[10px] text-[#ff5b5b] font-medium">{regErrors.phone.message as string}</span>}
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400 font-semibold tracking-wide uppercase">Password</label>
                <div className="flex items-center bg-black/40 border border-borderCard rounded-xl px-4 py-2.5 focus-within:border-goldAccent transition-all">
                  <Lock className="w-4 h-4 text-gray-500 mr-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...regRegister('password')}
                    className="bg-transparent border-none outline-none text-xs text-white placeholder-gray-600 w-full"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="w-4 h-4 text-gray-500 hover:text-white" /> : <Eye className="w-4 h-4 text-gray-500 hover:text-white" />}
                  </button>
                </div>
                {regErrors.password && <span className="text-[10px] text-[#ff5b5b] font-medium">{regErrors.password.message as string}</span>}
                
                {/* Password Strength Indicator */}
                {passwordValue && (
                  <div className="mt-1 flex flex-col gap-1">
                    <div className="flex justify-between items-center text-[9px] text-gray-400 font-bold uppercase tracking-wider">
                      <span>Password Strength</span>
                      <span className="text-white">{strengthLabels[passStrength - 1] || 'Weak'}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1 h-1 w-full bg-white/10 rounded-full overflow-hidden">
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className={`h-full rounded-full transition-all ${
                            i < passStrength ? strengthColors[passStrength - 1] : 'bg-transparent'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400 font-semibold tracking-wide uppercase">Confirm Password</label>
                <div className="flex items-center bg-black/40 border border-borderCard rounded-xl px-4 py-2.5 focus-within:border-goldAccent transition-all">
                  <Lock className="w-4 h-4 text-gray-500 mr-3" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    {...regRegister('confirmPassword')}
                    className="bg-transparent border-none outline-none text-xs text-white placeholder-gray-600 w-full"
                  />
                </div>
                {regErrors.confirmPassword && <span className="text-[10px] text-[#ff5b5b] font-medium">{regErrors.confirmPassword.message as string}</span>}
              </div>

              <button
                type="submit"
                disabled={isRegSubmitting}
                className="w-full py-3.5 mt-2 rounded-xl bg-goldAccent hover:bg-goldAccent/95 text-black font-extrabold text-xs uppercase tracking-widest transition-all shadow-[0_4px_12px_rgba(212,168,83,0.2)] disabled:opacity-50"
              >
                {isRegSubmitting ? 'Creating...' : 'Sign Up'}
              </button>
            </form>
          )}

          {/* Social Google OAuth Section */}
          <div className="mt-6">
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-borderCard/30"></div>
              <span className="flex-shrink mx-4 text-[9px] text-gray-500 uppercase tracking-widest font-semibold">Or continue with</span>
              <div className="flex-grow border-t border-borderCard/30"></div>
            </div>

            <button
              onClick={handleGoogleClick}
              className="w-full mt-4 py-3 rounded-xl bg-transparent border border-borderCard hover:border-goldAccent/30 hover:bg-white/5 text-xs text-white font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-3"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.62 15.02 1 12 1 7.24 1 3.2 3.73 1.24 7.72l3.86 3c.92-2.78 3.51-4.68 6.9-4.68z" />
                <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.43c-.28 1.48-1.11 2.73-2.36 3.58l3.67 2.84c2.15-1.98 3.75-4.9 3.75-8.57z" />
                <path fill="#FBBC05" d="M5.1 10.72c-.24-.72-.38-1.5-.38-2.3s.14-1.58.38-2.3l-3.86-3C.43 4.75 0 6.32 0 8s.43 3.25 1.24 4.88l3.86-3.16z" />
                <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.67-2.84c-1.01.68-2.31 1.09-3.9 1.09-3.39 0-6.26-2.28-7.29-5.36l-3.86 3C3.52 20.08 7.42 23 12 23z" />
              </svg>
              <span>Sign in with Google</span>
            </button>
          </div>

          <div className="mt-8 text-center text-xs text-gray-500">
            {mode === 'login' ? (
              <span>
                Don&apos;t have an account?{' '}
                <Link to="/register" className="text-goldAccent hover:underline font-bold">Sign Up</Link>
              </span>
            ) : (
              <span>
                Already have an account?{' '}
                <Link to="/login" className="text-goldAccent hover:underline font-bold">Log In</Link>
              </span>
            )}
          </div>

        </div>
      </div>

      {/* --- FORGOT PASSWORD MODAL --- */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm">
          <div className="glass-card rounded-3xl p-8 border border-borderCard max-w-sm w-full mx-4 shadow-2xl relative">
            <button
              onClick={() => {
                setShowForgotModal(false);
                setForgotStep(1);
                setForgotError(null);
                setForgotMessage(null);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-serif text-xl text-white mb-2 font-bold uppercase tracking-wide text-center">Reset Password</h3>
            <p className="text-[11px] text-gray-400 mb-6 text-center leading-relaxed">
              {forgotStep === 1
                ? 'Enter your email address below to receive a password reset One-Time Password (OTP).'
                : 'Enter the 6-digit OTP sent to your email along with your new secure password.'
              }
            </p>

            {forgotError && (
              <div className="bg-[#ff5b5b]/10 border border-[#ff5b5b]/30 text-[#ff5b5b] p-3 rounded-xl text-[10px] mb-4 text-center font-medium">
                {forgotError}
              </div>
            )}

            {forgotMessage && (
              <div className="bg-tealAccent/10 border border-tealAccent/30 text-tealAccent p-3 rounded-xl text-[10px] mb-4 text-center font-medium">
                {forgotMessage}
              </div>
            )}

            {forgotStep === 1 ? (
              <form onSubmit={handleRequestOtp} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Email Address</label>
                  <div className="flex items-center bg-black/40 border border-borderCard rounded-xl px-4 py-2.5">
                    <Mail className="w-4 h-4 text-gray-500 mr-2" />
                    <input
                      type="email"
                      required
                      placeholder="youremail@gmail.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="bg-transparent border-none outline-none text-xs text-white w-full"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-3 mt-2 rounded-xl bg-goldAccent hover:bg-goldAccent/95 text-black font-extrabold text-xs uppercase tracking-widest transition-all"
                >
                  Send OTP Code
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyAndReset} className="flex flex-col gap-4">
                {/* OTP code input */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">OTP Reset Code</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="123456"
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value)}
                    className="bg-black/40 border border-borderCard rounded-xl px-4 py-2.5 text-center text-sm text-white font-mono tracking-widest outline-none focus:border-goldAccent"
                  />
                </div>
                {/* New Password input */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">New Password</label>
                  <div className="flex items-center bg-black/40 border border-borderCard rounded-xl px-4 py-2.5">
                    <Lock className="w-4 h-4 text-gray-500 mr-2" />
                    <input
                      type="password"
                      required
                      placeholder="Min 8 characters"
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      className="bg-transparent border-none outline-none text-xs text-white w-full"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-3 mt-2 rounded-xl bg-goldAccent hover:bg-goldAccent/95 text-black font-extrabold text-xs uppercase tracking-widest transition-all"
                >
                  Verify & Reset Password
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* --- MOCK GOOGLE SELECTOR MODAL --- */}
      {showMockGoogleSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm">
          <div className="glass-card rounded-3xl p-8 border border-borderCard max-w-sm w-full mx-4 shadow-2xl relative">
            <button
              onClick={() => setShowMockGoogleSelector(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center gap-3 text-center mb-6">
              <svg className="w-10 h-10" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.62 15.02 1 12 1 7.24 1 3.2 3.73 1.24 7.72l3.86 3c.92-2.78 3.51-4.68 6.9-4.68z" />
                <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.43c-.28 1.48-1.11 2.73-2.36 3.58l3.67 2.84c2.15-1.98 3.75-4.9 3.75-8.57z" />
                <path fill="#FBBC05" d="M5.1 10.72c-.24-.72-.38-1.5-.38-2.3s.14-1.58.38-2.3l-3.86-3C.43 4.75 0 6.32 0 8s.43 3.25 1.24 4.88l3.86-3.16z" />
                <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.67-2.84c-1.01.68-2.31 1.09-3.9 1.09-3.39 0-6.26-2.28-7.29-5.36l-3.86 3C3.52 20.08 7.42 23 12 23z" />
              </svg>
              <h3 className="font-serif text-lg text-white font-bold uppercase tracking-wider">Google OAuth Simulator</h3>
              <p className="text-[10px] text-gray-500 max-w-[240px] leading-relaxed">
                Google Client IDs are unconfigured. Use this form to simulate a Google account sign-in/registration.
              </p>
            </div>

            <form onSubmit={handleMockGoogleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Google Profile Name</label>
                <div className="flex items-center bg-black/40 border border-borderCard rounded-xl px-4 py-2.5">
                  <UserIcon className="w-4 h-4 text-gray-500 mr-2" />
                  <input
                    type="text"
                    required
                    placeholder="Google User Name"
                    value={mockGoogleName}
                    onChange={(e) => setMockGoogleName(e.target.value)}
                    className="bg-transparent border-none outline-none text-xs text-white w-full"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Google Email Address</label>
                <div className="flex items-center bg-black/40 border border-borderCard rounded-xl px-4 py-2.5">
                  <Mail className="w-4 h-4 text-gray-500 mr-2" />
                  <input
                    type="email"
                    required
                    placeholder="user@gmail.com"
                    value={mockGoogleEmail}
                    onChange={(e) => setMockGoogleEmail(e.target.value)}
                    className="bg-transparent border-none outline-none text-xs text-white w-full"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 mt-2 rounded-xl bg-goldAccent hover:bg-goldAccent/95 text-black font-extrabold text-xs uppercase tracking-widest transition-all"
              >
                Sign In Simulating Google
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
