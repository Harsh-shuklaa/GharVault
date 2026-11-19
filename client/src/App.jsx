import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

import ProtectedRoute from './components/auth/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import FamilySetupPage from './pages/FamilySetupPage';
import DashboardPage from './pages/DashboardPage';
import VaultPage from './pages/VaultPage';
import DocumentUploadPage from './pages/DocumentUploadPage';
import DocumentPreviewPage from './pages/DocumentPreviewPage';
import FamilyDirectoryPage from './pages/FamilyDirectoryPage';
import MemberProfilePage from './pages/MemberProfilePage';
import CategoriesPage from './pages/CategoriesPage';
import ActivityAuditPage from './pages/ActivityAuditPage';
import PermissionsMatrixPage from './pages/PermissionsMatrixPage';
import BreakGlassPage from './pages/BreakGlassPage';
import SettingsPage from './pages/SettingsPage';
import NotificationsPage from './pages/NotificationsPage';
import PublicShareViewPage from './pages/PublicShareViewPage';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            {/* Public Landing, Auth & Safe Share */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="/share/:token" element={<PublicShareViewPage />} />

            {/* Protected Routes (Strictly blocked if unauthenticated) */}
            <Route element={<ProtectedRoute />}>
              <Route path="/family/setup" element={<FamilySetupPage />} />
              <Route path="/family/join" element={<FamilySetupPage />} />

              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/vault" element={<VaultPage />} />
                <Route path="/vault/upload" element={<DocumentUploadPage />} />
                <Route path="/vault/documents/:id" element={<DocumentPreviewPage />} />
                <Route path="/family" element={<FamilyDirectoryPage />} />
                <Route path="/family/:memberId" element={<MemberProfilePage />} />
                <Route path="/categories" element={<CategoriesPage />} />
                <Route path="/activity" element={<ActivityAuditPage />} />
                <Route path="/permissions" element={<PermissionsMatrixPage />} />
                <Route path="/break-glass" element={<BreakGlassPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
              </Route>
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
