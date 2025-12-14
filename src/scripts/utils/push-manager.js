import CONFIG from '../config.js';

class PushManager {
  constructor() {
    this.vapidPublicKey = 'BCC2zeonNI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r21CnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk';
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

  async sendSubscriptionToServer(subscription, token) {
    try {
      const response = await fetch(`${CONFIG.BASE_URL}/notifications/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('p256dh')))),
            auth: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('auth'))))
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send subscription to server');
      }

      const result = await response.json();
      console.log('[Push] Subscription sent to server:', result);
      return result;
    } catch (error) {
      console.error('[Push] Error sending subscription:', error);
      throw error;
    }
  }

  async subscribe() {
    try {
      if (!this.isSupported()) {
        throw new Error('Push notifications not supported');
      }

      console.log('[Push] Subscribing...');

      // Get token
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('User not logged in');
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
        console.log('[Push] New subscription created');
      } else {
        console.log('[Push] Already subscribed');
      }

      await this.sendSubscriptionToServer(subscription, token);

      this.subscription = subscription;
      localStorage.setItem('pushSubscription', JSON.stringify(subscription.toJSON()));
      localStorage.setItem('pushEnabled', 'true');

      return subscription;
    } catch (error) {
      console.error('[Push] Subscribe error:', error);
      localStorage.setItem('pushEnabled', 'false');
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
