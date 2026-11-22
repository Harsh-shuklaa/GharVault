import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useToast } from './ToastContext';

const PushNotificationContext = createContext();

// Helper to convert VAPID public key string from base64url to Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushNotificationProvider({ children }) {
  const { toast } = useToast();
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [swRegistration, setSwRegistration] = useState(null);

  useEffect(() => {
    const checkSupport = async () => {
      if (
        typeof window !== 'undefined' &&
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window
      ) {
        setIsSupported(true);
        setPermission(Notification.permission);

        try {
          // Register the Service Worker
          const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
          setSwRegistration(reg);

          // Check if subscription already exists
          const existingSub = await reg.pushManager.getSubscription();
          if (existingSub) {
            setIsSubscribed(true);
            // Optionally sync with backend
            syncSubscriptionWithBackend(existingSub);
          } else {
            setIsSubscribed(false);
          }
        } catch (err) {
          console.warn('[PushContext] Service worker registration error:', err.message);
        }
      } else {
        setIsSupported(false);
      }
    };

    checkSupport();
  }, []);

  const syncSubscriptionWithBackend = async (sub) => {
    try {
      await api.subscribePush({
        subscription: sub.toJSON ? sub.toJSON() : sub,
        userAgent: navigator.userAgent,
      });
    } catch (e) {
      // Backend may be offline or unauthenticated yet
    }
  };

  /**
   * Request push permission and subscribe device
   */
  const requestPushPermission = async () => {
    if (!isSupported) {
      toast.error('Web Push is not supported by your current browser.');
      return false;
    }

    try {
      setLoading(true);
      const permResult = await Notification.requestPermission();
      setPermission(permResult);

      if (permResult !== 'granted') {
        toast.error('Notification permission was denied. Please allow notifications in browser site settings.');
        setLoading(false);
        return false;
      }

      // Ensure SW is ready
      const reg = swRegistration || (await navigator.serviceWorker.ready);

      // Fetch VAPID public key from backend
      const { publicKey } = await api.getVapidPublicKey();
      if (!publicKey) {
        throw new Error('VAPID public key could not be retrieved from server.');
      }

      const applicationServerKey = urlBase64ToUint8Array(publicKey);

      // Always unsubscribe stale/old subscription first to guarantee key alignment
      const existingSub = await reg.pushManager.getSubscription();
      if (existingSub) {
        try {
          await existingSub.unsubscribe();
        } catch (unsubErr) {
          console.warn('[PushContext] Unsubscribe old subscription warning:', unsubErr);
        }
      }

      // Fresh subscription with current VAPID applicationServerKey
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      // Send subscription to backend
      await api.subscribePush({
        subscription: subscription.toJSON ? subscription.toJSON() : subscription,
        userAgent: navigator.userAgent,
      });

      setIsSubscribed(true);
      toast.success('📲 Phone Push Notifications active! You will receive updates directly on your phone.');

      // Trigger a small confirmation notification to verify device receipt
      try {
        await reg.showNotification('✅ Notifications Active!', {
          body: 'GharVault alerts are now connected to your phone screen.',
          icon: '/icon-192.svg',
          badge: '/icon-192.svg',
          tag: 'welcome-push',
        });
      } catch (e) {
        // Notification in SW handled
      }

      setLoading(false);
      return true;
    } catch (err) {
      console.error('[PushContext] Subscription error:', err);
      toast.error('Failed to enable push notifications: ' + (err.message || 'Error'));
      setLoading(false);
      return false;
    }
  };

  /**
   * Test local notification on current phone / browser
   */
  const testLocalNotification = async () => {
    try {
      if (Notification.permission !== 'granted') {
        const granted = await requestPushPermission();
        if (!granted) return;
      }

      const reg = swRegistration || (await navigator.serviceWorker.ready);
      if (reg && reg.showNotification) {
        await reg.showNotification('🔔 Test Notification', {
          body: 'GharVault Web Push aapke device par successfully chal raha hai!',
          icon: '/icon-192.svg',
          badge: '/icon-192.svg',
          tag: 'test-push-' + Date.now(),
          vibrate: [200, 100, 200],
          data: { url: '/dashboard' },
        });
        toast.success('Test notification screen par bhej diya gaya hai!');
      } else {
        new Notification('🔔 Test Notification', {
          body: 'GharVault alerts active hain!',
          icon: '/icon-192.svg',
        });
        toast.success('Test notification sent!');
      }
    } catch (e) {
      console.error('Test notification failed:', e);
      toast.error('Could not display test notification: ' + e.message);
    }
  };

  /**
   * Send a broadcast or direct push alert from the app
   */
  const sendPushAlert = async ({ title, body, url, targetMemberId }) => {
    try {
      setLoading(true);
      const res = await api.sendPushBroadcast({
        title,
        body,
        url: url || '/dashboard',
        targetMemberId: targetMemberId || 'ALL',
      });

      toast.success(res.message || 'Push notification sent to phones!');
      setLoading(false);
      return res;
    } catch (err) {
      console.error('[PushContext] Send push error:', err);
      toast.error('Could not send notification: ' + (err.message || 'Server error'));
      setLoading(false);
      throw err;
    }
  };

  const openSendModal = () => setIsSendModalOpen(true);
  const closeSendModal = () => setIsSendModalOpen(false);

  return (
    <PushNotificationContext.Provider
      value={{
        isSupported,
        permission,
        isSubscribed,
        loading,
        isSendModalOpen,
        openSendModal,
        closeSendModal,
        requestPushPermission,
        testLocalNotification,
        sendPushAlert,
      }}
    >
      {children}
    </PushNotificationContext.Provider>
  );
}

export function usePushNotification() {
  const context = useContext(PushNotificationContext);
  if (!context) {
    throw new Error('usePushNotification must be used within a PushNotificationProvider');
  }
  return context;
}
