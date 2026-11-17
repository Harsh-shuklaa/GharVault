import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';
import { signInWithGoogle, signOut as supabaseSignOut } from '../lib/supabaseClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [family, setFamily] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchSession = async () => {
    try {
      setLoading(true);
      const data = await api.getMe();
      if (data.user) {
        setUser(data.user);
        setFamily(data.family);
      }
      // Fetch notifications
      const notifs = await api.getNotifications();
      if (notifs.notifications) {
        setNotifications(notifs.notifications);
        setUnreadCount(notifs.unreadCount || 0);
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
      // Exchange with backend
      const loginRes = await api.loginWithGoogle({
        email: res.user?.email,
        name: res.user?.user_metadata?.full_name,
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

  const switchUser = async (roleOrEmail) => {
    try {
      setLoading(true);
      const res = await api.switchDemoUser(roleOrEmail);
      if (res.token) {
        localStorage.setItem('gharvault_token', res.token);
        setUser(res.user);
        setFamily(res.family);
      }
      return res.user;
    } catch (err) {
      console.error('Switch user error:', err);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await supabaseSignOut();
    setUser(null);
    setFamily(null);
  };

  const markAllNotificationsAsRead = async () => {
    await api.markAllNotificationsRead();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        family,
        loading,
        notifications,
        unreadCount,
        loginWithGoogle,
        switchUser,
        logout,
        refreshSession: fetchSession,
        markAllNotificationsAsRead,
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
