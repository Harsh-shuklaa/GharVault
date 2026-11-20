import React, { createContext, useContext, useState, useEffect } from 'react';

const PWAInstallContext = createContext();

export function PWAInstallProvider({ children }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState(() => {
    try {
      return localStorage.getItem('gharvault_install_dismissed') === 'true';
    } catch {
      return false;
    }
  });

  // Device & Browser Detection
  const userAgent = typeof window !== 'undefined' ? (navigator.userAgent || '') : '';
  const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
  const isIOSChrome = isIOS && /CriOS/.test(userAgent);
  const isAndroid = /Android/.test(userAgent);

  useEffect(() => {
    // Check if running as installed standalone PWA
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true;
      setIsStandalone(Boolean(isStandaloneMode));
    };

    checkStandalone();

    // Listen for beforeinstallprompt on Chromium (Android / Desktop Chrome / Edge)
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const openInstallModal = () => setIsInstallModalOpen(true);
  const closeInstallModal = () => setIsInstallModalOpen(false);

  const triggerNativeInstall = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setDeferredPrompt(null);
          setIsInstallModalOpen(false);
        }
      } catch (err) {
        console.error('Install prompt error:', err);
        openInstallModal();
      }
    } else {
      // For iOS or browsers without native prompt, open the visual step-by-step modal
      openInstallModal();
    }
  };

  const dismissBanner = () => {
    setIsBannerDismissed(true);
    try {
      localStorage.setItem('gharvault_install_dismissed', 'true');
    } catch {
      // Ignore localStorage error
    }
  };

  return (
    <PWAInstallContext.Provider
      value={{
        isInstallable: !isStandalone,
        isStandalone,
        isIOS,
        isIOSChrome,
        isAndroid,
        deferredPrompt,
        isInstallModalOpen,
        openInstallModal,
        closeInstallModal,
        triggerNativeInstall,
        isBannerDismissed,
        dismissBanner,
      }}
    >
      {children}
    </PWAInstallContext.Provider>
  );
}

export const usePWAInstall = () => {
  const context = useContext(PWAInstallContext);
  if (!context) {
    throw new Error('usePWAInstall must be used within a PWAInstallProvider');
  }
  return context;
};
