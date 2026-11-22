import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import VaultSecurityLoader from '../common/VaultSecurityLoader';

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <VaultSecurityLoader
        message="Verifying Encrypted Vault Session..."
        subtitle="256-Bit Cryptographic Security Active"
        fullScreen={true}
      />
    );
  }

  if (!user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
