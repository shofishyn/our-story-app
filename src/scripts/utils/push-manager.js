import CONFIG from '../config.js';

class PushManager {
  constructor() {
    this.vapidPublicKey = null;
    this.subscription = null;
  }

  isSupported() {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  }

  getPermission() {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission;
  }

  async requestPermission() {
    if (!this.isSupported()) {
      throw new Error('Push notifications not supported');
    }
    return await Notification.requestPermission();
  }

  // Fetch VAPID public key from Dicoding API
  async fetchVapidPublicKey() {
    try {
      const response = await fetch(`${CONFIG.BASE_URL}/push/vapid/public-key`);

      if (!response.ok) {
        throw new Error('Failed to fetch VAPID key');
      }

      const data = await response.json();
      this.vapidPublicKey = data.data.publicKey;
      console.log('[Push] VAPID public key fetched from API:', this.vapidPublicKey);
      return this.vapidPublicKey;
    } catch (error) {
      console.error('[Push] Error fetching VAPID key:', error);
      throw error;
    }
  }

  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  async subscribe() {
    try {
      if (!this.isSupported()) {
        throw new Error('Push notifications not supported');
      }

      console.log('[Push] Subscribing...');

      // Fetch VAPID key from API first
      if (!this.vapidPublicKey) {
        await this.fetchVapidPublicKey();
      }

      const registrationPromise = navigator.serviceWorker.ready;
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Service worker timeout')), 10000)
      );
      
      const registration = await Promise.race([registrationPromise, timeoutPromise]);
      console.log('[Push] Service worker ready');
      
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        console.log('[Push] Creating new subscription...');
        const convertedVapidKey = this.urlBase64ToUint8Array(this.vapidPublicKey);
        
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey
        });

        // Convert subscription to format with base64 keys
        const rawKey = subscription.getKey('p256dh');
        const rawAuth = subscription.getKey('auth');
        
        subscription.keys = {
          p256dh: btoa(String.fromCharCode(...new Uint8Array(rawKey))),
          auth: btoa(String.fromCharCode(...new Uint8Array(rawAuth)))
        };
        
        console.log('[Push] New subscription created');
      } else {
        console.log('[Push] Already subscribed');
      }

      this.subscription = subscription;
      
      // Send subscription to Dicoding API
      await this.sendSubscriptionToServer(subscription);
      
      localStorage.setItem('pushSubscription', JSON.stringify(subscription));
      localStorage.setItem('pushEnabled', 'true');

      return subscription;
    } catch (error) {
      console.error('[Push] Subscribe error:', error);
      localStorage.setItem('pushEnabled', 'false');
      throw error;
    }
  }

  async sendSubscriptionToServer(subscription) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token');
      }

      // Format subscription sesuai dokumentasi API Dicoding
      const subscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth
        }
      };

      const response = await fetch(`${CONFIG.BASE_URL}/notifications/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(subscriptionData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send subscription to server');
      }

      console.log('[Push] Subscription sent to server successfully');
      return await response.json();
    } catch (error) {
      console.error('[Push] Error sending subscription:', error);
      throw error;
    }
  }

  async unsubscribe() {
    try {
      if (!this.isSupported()) {
        throw new Error('Push notifications not supported');
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Unsubscribe from server
        await this.unsubscribeFromServer(subscription);
        
        // Unsubscribe locally
        await subscription.unsubscribe();
        console.log('[Push] Unsubscribed');
      }

      this.subscription = null;
      localStorage.removeItem('pushSubscription');
      localStorage.setItem('pushEnabled', 'false');

      return true;
    } catch (error) {
      console.error('[Push] Unsubscribe error:', error);
      throw error;
    }
  }

  async unsubscribeFromServer(subscription) {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await fetch(`${CONFIG.BASE_URL}/notifications/subscribe`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint
        })
      });

      console.log('[Push] Unsubscribed from server');
    } catch (error) {
      console.error('[Push] Error unsubscribing from server:', error);
    }
  }

  async getSubscription() {
    if (!this.isSupported()) return null;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      this.subscription = subscription;
      return subscription;
    } catch (error) {
      console.error('[Push] Get subscription error:', error);
      return null;
    }
  }

  async isSubscribed() {
    const subscription = await this.getSubscription();
    return !!subscription;
  }

  isEnabled() {
    return localStorage.getItem('pushEnabled') === 'true';
  }

  async toggle() {
    const isSubscribed = await this.isSubscribed();
    
    if (isSubscribed) {
      await this.unsubscribe();
      return false;
    } else {
      const permission = await this.requestPermission();
      if (permission === 'granted') {
        await this.subscribe();
        return true;
      } else {
        throw new Error('Permission denied');
      }
    }
  }
}

const pushManager = new PushManager();
export default pushManager;
