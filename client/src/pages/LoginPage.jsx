import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

export default function LoginPage() {
  const { loginWithGoogle, switchUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('google'); // 'google' or 'mpin'
  const [mpin, setMpin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Google authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (email) => {
    try {
      setLoading(true);
      await switchUser(email);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMpinSubmit = async (e) => {
    e.preventDefault();
    if (mpin.length < 4) {
      setError('Please enter a 4-digit MPIN');
      return;
    }
    try {
      setLoading(true);
      await api.verifyMpin(mpin);
      await switchUser('rajesh.sharma@gmail.com');
      navigate('/dashboard');
    } catch (err) {
      setError('Invalid MPIN. Try default 1234');
    } finally {
      setLoading(false);
    }
  };

  const handleKeypadPress = (val) => {
    if (mpin.length < 6) {
      setMpin(prev => prev + val);
    }
  };

  const handleBackspace = () => {
    setMpin(prev => prev.slice(0, -1));
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <Link to="/" className="flex items-center justify-center gap-2.5 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25">
            <span className="material-symbols-outlined text-2xl">shield</span>
          </div>
          <span className="font-headline font-bold text-2xl tracking-tight text-slate-900">GharVault</span>
        </Link>
        <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900">
          Secure Family Access
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500">
          Supabase Zero-Knowledge Authentication • 256-Bit Cryptographic Session
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 sm:rounded-2xl sm:px-10 border border-slate-200">
          {/* Method Tabs */}
          <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl mb-6 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('google')}
              className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'google'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-base">account_circle</span>
              <span>Google OAuth</span>
            </button>
            <button
              onClick={() => setActiveTab('mpin')}
              className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'mpin'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-base">pin</span>
              <span>MPIN & Biometric</span>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-base">error</span>
              <span>{error}</span>
            </div>
          )}

          {activeTab === 'google' ? (
            <div className="space-y-6">
              {/* One-Click Google OAuth */}
              <div>
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 py-3.5 px-4 border border-slate-300 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm shadow-xs transition-all hover:border-slate-400 cursor-pointer"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>{loading ? 'Authenticating with Google...' : 'Sign in with Google (Supabase Auth)'}</span>
                </button>
              </div>

              {/* Demo Test Personas Section */}
              <div className="pt-4 border-t border-slate-100">
                <div className="text-center text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Or Instant Sign-In as Demo Family Member
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleDemoLogin('rajesh.sharma@gmail.com')}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all text-left flex items-center gap-2 group cursor-pointer"
                  >
                    <img
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100"
                      alt="Rajesh"
                      className="w-7 h-7 rounded-full object-cover shrink-0"
                    />
                    <div className="truncate">
                      <div className="text-xs font-bold text-slate-900 group-hover:text-blue-600 truncate">Rajesh</div>
                      <div className="text-[10px] text-slate-500">Head (Admin)</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDemoLogin('priya.sharma@gmail.com')}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all text-left flex items-center gap-2 group cursor-pointer"
                  >
                    <img
                      src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100"
                      alt="Priya"
                      className="w-7 h-7 rounded-full object-cover shrink-0"
                    />
                    <div className="truncate">
                      <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-600 truncate">Priya</div>
                      <div className="text-[10px] text-slate-500">Spouse (Guardian)</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDemoLogin('aarav.sharma@gmail.com')}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/50 transition-all text-left flex items-center gap-2 group cursor-pointer"
                  >
                    <img
                      src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100"
                      alt="Aarav"
                      className="w-7 h-7 rounded-full object-cover shrink-0"
                    />
                    <div className="truncate">
                      <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 truncate">Aarav</div>
                      <div className="text-[10px] text-slate-500">Son (Member)</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDemoLogin('sunita.sharma@gmail.com')}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-purple-500 hover:bg-purple-50/50 transition-all text-left flex items-center gap-2 group cursor-pointer"
                  >
                    <img
                      src="https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?w=100"
                      alt="Sunita"
                      className="w-7 h-7 rounded-full object-cover shrink-0"
                    />
                    <div className="truncate">
                      <div className="text-xs font-bold text-slate-900 group-hover:text-purple-600 truncate">Sunita</div>
                      <div className="text-[10px] text-slate-500">Grandmother</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* MPIN Input Visualizer */}
              <div className="text-center space-y-3">
                <span className="text-xs text-slate-500">Enter your 4 or 6-digit Vault MPIN</span>
                <div className="flex items-center justify-center gap-3">
                  {[0, 1, 2, 3].map((idx) => (
                    <div
                      key={idx}
                      className={`w-11 h-12 rounded-xl border-2 flex items-center justify-center text-lg font-bold font-mono transition-all ${
                        mpin.length > idx
                          ? 'border-blue-600 bg-blue-50 text-blue-600 scale-105'
                          : 'border-slate-200 bg-slate-50 text-slate-400'
                      }`}
                    >
                      {mpin.length > idx ? '●' : ''}
                    </div>
                  ))}
                </div>
              </div>

              {/* Number Keypad */}
              <div className="grid grid-cols-3 gap-2.5 max-w-xs mx-auto">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleKeypadPress(num.toString())}
                    className="h-12 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-lg active:scale-95 transition-all shadow-xs"
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={async () => {
                    setMpin('1234');
                    await switchUser('rajesh.sharma@gmail.com');
                    navigate('/dashboard');
                  }}
                  className="h-12 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs flex flex-col items-center justify-center transition-all"
                  title="Simulate Biometric FaceID"
                >
                  <span className="material-symbols-outlined text-lg">face</span>
                  <span className="text-[9px]">FaceID</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleKeypadPress('0')}
                  className="h-12 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-lg active:scale-95 transition-all shadow-xs"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleBackspace}
                  className="h-12 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold text-lg active:scale-95 transition-all flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-xl">backspace</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleMpinSubmit}
                disabled={loading || mpin.length < 4}
                className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all"
              >
                {loading ? 'Verifying MPIN...' : 'Unlock Vault'}
              </button>
            </div>
          )}

          {/* Quick Setup Link */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
            Need to set up a new Family Vault or join by code?{' '}
            <Link to="/family/setup" className="font-semibold text-blue-600 hover:underline">
              Family Setup / Join
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
