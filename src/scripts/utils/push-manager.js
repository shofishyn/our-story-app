class PushManager {
  constructor() {
    this.vapidPublicKey = 'BN7-r0Svv7CsTi18-OPYtJLVW0bfuZ1x1UtrygczKjennA_kkAol6vsMePnK8l_8kV3FKJFc-CViV7xlG5O-n_KrMs';
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

  async subscribe() {
    try {
      if (!this.isSupported()) {
        throw new Error('Push notifications not supported');
      }

      console.log('[Push] Subscribing...');

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

      this.subscription = subscription;
      localStorage.setItem('pushSubscription', JSON.stringify(subscription));
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