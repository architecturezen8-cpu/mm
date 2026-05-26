'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, BellOff, Check } from 'lucide-react';

/* ─── URL‑safe base64 utility ─── */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/* ═══════════════════════════════════════════
   PUSH NOTIFICATION MANAGER
   ═══════════════════════════════════════════ */
export default function PushNotificationManager() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [vapidAvailable, setVapidAvailable] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deniedMessage, setDeniedMessage] = useState<string | null>(null);

  /* ─── Check browser support & current subscription ─── */
  useEffect(() => {
    const supported =
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window;

    if (!supported) {
      setIsSupported(false);
      return;
    }

    setIsSupported(true);

    // Check if permission was already denied
    if (Notification.permission === 'denied') {
      setPermissionDenied(true);
    }

    // Check VAPID key availability
    fetch('/api/push/vapid')
      .then((res) => {
        if (res.status === 503) {
          setVapidAvailable(false);
          return null;
        }
        if (!res.ok) {
          setVapidAvailable(false);
          return null;
        }
        setVapidAvailable(true);
        return res.json();
      })
      .catch(() => {
        setVapidAvailable(false);
      });

    // Check existing subscription
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        return registration.pushManager.getSubscription();
      })
      .then((subscription) => {
        if (subscription) {
          setIsSubscribed(true);
        }
      })
      .catch(() => {
        // Service worker registration failed — still show component,
        // subscription will just fail gracefully
      });
  }, []);

  /* ─── Subscribe flow ─── */
  const handleSubscribe = useCallback(async () => {
    if (loading) return;
    setLoading(true);

    try {
      // 1. Request notification permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        if (permission === 'denied') {
          setPermissionDenied(true);
          setDeniedMessage('Notifications blocked');
          // Auto-hide the denied message after 3s
          setTimeout(() => setDeniedMessage(null), 3000);
        }
        setLoading(false);
        return;
      }

      // 2. Register / get service worker
      const registration = await navigator.serviceWorker.register('/sw.js');

      // 3. Get VAPID public key
      const vapidRes = await fetch('/api/push/vapid');
      if (!vapidRes.ok) {
        setLoading(false);
        return;
      }
      const { publicKey } = await vapidRes.json();

      if (!publicKey) {
        setLoading(false);
        return;
      }

      // 4. Subscribe via pushManager
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      // 5. Send subscription to backend
      const subRes = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      });

      if (subRes.ok) {
        setIsSubscribed(true);
      }
    } catch {
      // Silently fail — don't disrupt UX
    } finally {
      setLoading(false);
    }
  }, [loading]);

  /* ─── Unsubscribe flow ─── */
  const handleUnsubscribe = useCallback(async () => {
    if (loading) return;
    setLoading(true);

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        setIsSubscribed(false);
        setLoading(false);
        return;
      }

      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        setIsSubscribed(false);
        setLoading(false);
        return;
      }

      // 1. Unsubscribe from push manager
      await subscription.unsubscribe();

      // 2. Notify backend
      await fetch('/api/push/subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });

      setIsSubscribed(false);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [loading]);

  /* ─── Toggle handler ─── */
  const handleClick = useCallback(() => {
    if (isSubscribed) {
      handleUnsubscribe();
    } else {
      handleSubscribe();
    }
  }, [isSubscribed, handleSubscribe, handleUnsubscribe]);

  /* ─── Guard: don't render if unsupported, VAPID unavailable, or permission denied ─── */
  if (!isSupported || !vapidAvailable || permissionDenied) {
    // Show denied message briefly, then hide
    if (permissionDenied && deniedMessage) {
      return (
        <div className="flex items-center gap-2 px-3 py-2 border border-[#C07060]/30 text-[#C07060]/80">
          <BellOff className="w-3.5 h-3.5" />
          <span className="text-[10px] font-medium uppercase tracking-[2px]">
            {deniedMessage}
          </span>
        </div>
      );
    }
    return null;
  }

  /* ─── Render: compact button element ─── */
  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={`
        flex items-center gap-2 px-3 py-2 border
        transition-colors cursor-pointer
        ${
          isSubscribed
            ? 'border-[#8FB06A]/30 hover:border-[#8FB06A]/60 bg-[#8FB06A]/5'
            : 'border-lux-border hover:border-gold'
        }
        disabled:opacity-50 disabled:cursor-wait
      `}
      title={isSubscribed ? 'Unsubscribe from notifications' : 'Enable push notifications'}
    >
      {isSubscribed ? (
        <>
          <span className="relative">
            <Bell className="w-3.5 h-3.5 text-[#8FB06A]" />
            <Check className="absolute -bottom-1 -right-1 w-2 h-2 text-[#8FB06A] fill-[#8FB06A]" />
          </span>
          <span className="text-[10px] font-medium uppercase tracking-[2px] text-[#8FB06A]">
            On
          </span>
        </>
      ) : (
        <>
          <span className="relative">
            <Bell className="w-3.5 h-3.5 text-text-secondary" />
            {/* Red dot badge */}
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[#E63946]" />
          </span>
          <span className="text-[10px] font-medium uppercase tracking-[2px] text-text-secondary">
            Notify
          </span>
        </>
      )}
    </button>
  );
}
