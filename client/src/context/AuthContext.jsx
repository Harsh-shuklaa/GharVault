import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';
import { signInWithGoogle, signOut as supabaseSignOut } from '../lib/supabaseClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [family, setFamily] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);

  const fetchSession = async () => {
    try {
      setLoading(true);
      const data = await api.getMe();
      if (data?.user) {
        setUser(data.user);
        setFamily(data.family);
      } else {
        setUser(null);
        setFamily(null);
      }
    } catch (err) {
      console.warn('Session load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const loginWithGoogle = async () => {
    try {
      const res = await signInWithGoogle();
      const loginRes = await api.loginWithGoogle({
        email: res.user?.email || 'myfamily@gmail.com',
        name: res.user?.user_metadata?.full_name || 'Family Admin',
        avatar: res.user?.user_metadata?.avatar_url,
        googleId: res.user?.id,
      });

      if (loginRes.token) {
        localStorage.setItem('gharvault_token', loginRes.token);
        setUser(loginRes.user);
        setFamily(loginRes.family);
      }
      return loginRes;
    } catch (err) {
      console.error('Login error:', err);
      throw err;
    }
  };

  const logout = async () => {
    await supabaseSignOut();
    setUser(null);
    setFamily(null);
    localStorage.removeItem('gharvault_token');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        family,
        loading,
        loginWithGoogle,
        logout,
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
