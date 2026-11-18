import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Shield } from 'lucide-react';

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#121212] flex flex-col items-center justify-center text-center p-4 transition-colors">
        <div className="w-12 h-12 rounded-xl bg-white dark:bg-[#1C1C1C] border border-slate-200 dark:border-[#2E2E2E] flex items-center justify-center mb-4 shadow-sm dark:shadow-xl">
          <Shield className="w-6 h-6 text-[#10B981] dark:text-[#3ECF8E] animate-pulse" />
        </div>
        <div className="w-6 h-6 border-2 border-[#10B981] dark:border-[#3ECF8E] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-medium text-slate-600 dark:text-[#8F8F8F] tracking-wide">
          Verifying Encrypted Vault Session...
        </p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
