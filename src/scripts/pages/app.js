import routes from '../routes/routes.js';
import { getActiveRoute } from '../routes/url-parser.js';

class App {
  #content = null;
  #drawerButton = null;
  #navigationDrawer = null;

  constructor({ navigationDrawer, drawerButton, content }) {
    this.#content = content;
    this.#drawerButton = drawerButton;
    this.#navigationDrawer = navigationDrawer;
    this.#setupDrawer();
    this.#registerServiceWorker();
  }

  #setupDrawer() {
    this.#drawerButton.addEventListener('click', () => {
      this.#navigationDrawer.classList.toggle('open');
    });

    document.body.addEventListener('click', (event) => {
      if (!this.#navigationDrawer.contains(event.target) &&
          !this.#drawerButton.contains(event.target)) {
        this.#navigationDrawer.classList.remove('open');
      }

      this.#navigationDrawer.querySelectorAll('a').forEach((link) => {
        if (link.contains(event.target)) {
          this.#navigationDrawer.classList.remove('open');
        }
      });
    });
  }

  async #registerServiceWorker() {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.register('/service-worker.js');
        console.log('[SW] Registered:', registration);

        const regReady = await navigator.serviceWorker.ready;
        this.#subscribePush(regReady);
      } catch (err) {
        console.error('[SW] Registration failed:', err);
      }
    }
  }

  async #subscribePush(registration) {
    try {
      const VAPID_PUBLIC_KEY = 'BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk';

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const res = await fetch('https://story-api.dicoding.dev/v1/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(subscription),
      });

      if (res.ok) console.log('[Push] Subscribed & sent to server');
      else console.error('[Push] Failed:', await res.text());
    } catch (err) {
      console.error('[Push] Error subscribing:', err);
    }
  }

  async renderPage() {
    const url = getActiveRoute();
    const page = routes[url];
    const content = this.#content;

    if (document.startViewTransition) {
      const html = await page.render();
      await document.startViewTransition(async () => {
        content.innerHTML = html;
      }).finished;
      if (page.afterRender) await page.afterRender();
    } else {
      content.innerHTML = await page.render();
      if (page.afterRender) await page.afterRender();
    }
  }
}

// Helper untuk push
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

export default App;
