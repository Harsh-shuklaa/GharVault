import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';
import { supabase, isSupabaseConfigured, signInWithGoogle, signOut as supabaseSignOut } from '../lib/supabaseClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [family, setFamily] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);

  const syncBackendUser = async (profileData) => {
    try {
      const pendingCode = localStorage.getItem('pending_invite_code') || sessionStorage.getItem('pending_invite_code');
      const pendingRelation = localStorage.getItem('pending_invite_relation') || sessionStorage.getItem('pending_invite_relation');
      const pendingName = localStorage.getItem('pending_invite_name') || sessionStorage.getItem('pending_invite_name');

      const payload = {
        ...profileData,
        ...(pendingCode ? { inviteCode: pendingCode.trim().toUpperCase(), relationship: pendingRelation || 'Member' } : {}),
        ...(pendingName ? { name: pendingName } : {}),
      };

      const loginRes = await api.syncAuth(payload);
      if (loginRes?.token) {
        localStorage.setItem('gharvault_token', loginRes.token);
        setUser(loginRes.user);
        setFamily(loginRes.family);

        if (pendingCode) {
          localStorage.removeItem('pending_invite_code');
          localStorage.removeItem('pending_invite_relation');
          localStorage.removeItem('pending_invite_name');
          sessionStorage.removeItem('pending_invite_code');
          sessionStorage.removeItem('pending_invite_relation');
          sessionStorage.removeItem('pending_invite_name');
        }

        return loginRes;
      }
    } catch (err) {
      console.error('[AuthContext] Sync backend user failed:', err);
    }
    return null;
  };

  const fetchSession = async () => {
    try {
      setLoading(true);

      // 1. Check if Supabase has an active OAuth session
      if (isSupabaseConfigured && supabase) {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.warn('[AuthContext] Supabase getSession warning:', error.message);
        }

        if (session?.user) {
          const synced = await syncBackendUser({
            email: session.user.email,
            name: session.user.user_metadata?.full_name || session.user.email.split('@')[0],
            avatar: session.user.user_metadata?.avatar_url,
            googleId: session.user.id,
          });
          if (synced?.user) {
            setLoading(false);
            return;
          }
        }
      }

      // 2. Check local JWT token from GharVault backend
      const token = localStorage.getItem('gharvault_token');
      if (token && token !== 'null' && token !== 'undefined') {
        const data = await api.getMe();
        if (data?.user) {
          setUser(data.user);
          setFamily(data.family);
          setLoading(false);
          return;
        } else {
          // Token is invalid/expired
          localStorage.removeItem('gharvault_token');
        }
      }

      setUser(null);
      setFamily(null);
    } catch (err) {
      console.warn('[AuthContext] Session load error:', err);
      setUser(null);
      setFamily(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();

    // Listen to Supabase auth events (e.g. returning from Google OAuth redirect)
    if (isSupabaseConfigured && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') && session?.user) {
          await syncBackendUser({
            email: session.user.email,
            name: session.user.user_metadata?.full_name || session.user.email.split('@')[0],
            avatar: session.user.user_metadata?.avatar_url,
            googleId: session.user.id,
          });
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setFamily(null);
          localStorage.removeItem('gharvault_token');
          sessionStorage.clear();
        }
      });
      return () => subscription?.unsubscribe();
    }
  }, []);

  const loginWithGoogle = async (customEmail = null) => {
    try {
      // Preserve pending invite credentials across logins
      const pendingCode = localStorage.getItem('pending_invite_code') || sessionStorage.getItem('pending_invite_code');
      const pendingRelation = localStorage.getItem('pending_invite_relation') || sessionStorage.getItem('pending_invite_relation');
      const pendingName = localStorage.getItem('pending_invite_name') || sessionStorage.getItem('pending_invite_name');

      // Clear previous cached session state
      localStorage.removeItem('gharvault_token');
      sessionStorage.clear();

      if (pendingCode) {
        localStorage.setItem('pending_invite_code', pendingCode);
        sessionStorage.setItem('pending_invite_code', pendingCode);
      }
      if (pendingRelation) {
        localStorage.setItem('pending_invite_relation', pendingRelation);
        sessionStorage.setItem('pending_invite_relation', pendingRelation);
      }
      if (pendingName) {
        localStorage.setItem('pending_invite_name', pendingName);
        sessionStorage.setItem('pending_invite_name', pendingName);
      }

      setUser(null);
      setFamily(null);

      // Direct email sign-in for users
      if (customEmail) {
        const loginRes = await api.loginWithGoogle({
          email: customEmail.trim().toLowerCase(),
          name: pendingName || customEmail.split('@')[0],
          inviteCode: pendingCode ? pendingCode.trim().toUpperCase() : undefined,
          relationship: pendingRelation || undefined,
        });
        if (loginRes?.token) {
          localStorage.setItem('gharvault_token', loginRes.token);
          setUser(loginRes.user);
          setFamily(loginRes.family);

          if (pendingCode) {
            localStorage.removeItem('pending_invite_code');
            localStorage.removeItem('pending_invite_relation');
            localStorage.removeItem('pending_invite_name');
            sessionStorage.removeItem('pending_invite_code');
            sessionStorage.removeItem('pending_invite_relation');
            sessionStorage.removeItem('pending_invite_name');
          }

          return loginRes;
        }
        throw new Error(loginRes?.error || 'Authentication failed');
      }

      // Real Supabase Google OAuth
      return await signInWithGoogle();
    } catch (err) {
      console.error('[AuthContext] Login error:', err);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await supabaseSignOut();
    } catch (e) {
      console.warn('SignOut warning:', e);
    }
    setUser(null);
    setFamily(null);
    localStorage.removeItem('gharvault_token');
    sessionStorage.clear();
    window.location.href = '/auth/login';
  };

  const updateUser = (updatedUser) => {
    setUser(prev => (prev ? { ...prev, ...updatedUser } : updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        family,
        loading,
        loginWithGoogle,
        logout,
        updateUser,
        refreshSession: fetchSession,
        isEmergencyModalOpen,
        setIsEmergencyModalOpen,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
