import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthCallbackPage() {
  const { checkSession, user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        await checkSession();
      } catch (err) {
        console.error('Session check failed during callback:', err);
        setError(true);
      }
    };
    fetchUser();
  }, [checkSession]);

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        if (user.is_new_user) {
          navigate('/onboarding');
        } else {
          navigate('/dashboard');
        }
      } else {
        setError(true);
        const timer = setTimeout(() => navigate('/login?error=oauth_failed'), 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [user, isLoading, navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center text-sm font-semibold tracking-widest text-[#ff5b5b] uppercase">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#ff5b5b]/25 border-t-[#ff5b5b] rounded-full animate-spin" />
          <span>OAuth Verification Failed. Redirecting to Login...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center text-sm font-semibold tracking-widest text-[#D4A853] uppercase">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-[#D4A853]/25 border-t-[#D4A853] rounded-full animate-spin" />
        <span>Completing Google Sign-In...</span>
      </div>
    </div>
  );
}
