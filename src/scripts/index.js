import App from './pages/app';
import pushManager from './utils/push-manager.js';

// Register Service Worker
async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.log('[SW] Not supported');
    return;
  }

  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    for (let reg of regs) await reg.unregister();

    const registration = await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/',
      updateViaCache: 'none'
    });
    
    console.log('[SW] Registered:', registration);
    await navigator.serviceWorker.ready;
    console.log('[SW] Ready');
    return registration;
  } catch (err) {
    console.error('[SW] Failed:', err);
  }
}

// Setup Push
async function setupPush() {
  try {
    if (!pushManager.isSupported()) return;
    
    const enabled = pushManager.isEnabled();
    const subscribed = await pushManager.isSubscribed();

    if (enabled && !subscribed) {
      const permission = await pushManager.requestPermission();
      if (permission === 'granted') {
        await pushManager.subscribe();
        console.log('[Push] Subscribed');
      }
    }
  } catch (err) {
    console.error('[Push] Error:', err);
  }
}

// Install Prompt
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  showInstallBtn();
});

function showInstallBtn() {
  let btn = document.getElementById('install-btn');
  if (!btn) {
    btn = document.createElement('button');
    btn.id = 'install-btn';
    btn.textContent = '📱 Install App';
    btn.style.cssText = 'position:fixed;bottom:80px;right:20px;padding:12px 20px;background:#4CAF50;color:white;border:none;border-radius:8px;cursor:pointer;z-index:1000;box-shadow:0 4px 8px rgba(0,0,0,0.2)';
    document.body.appendChild(btn);
  }
  btn.style.display = 'block';
  btn.onclick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') btn.style.display = 'none';
    deferredPrompt = null;
  };
}

window.addEventListener('appinstalled', () => {
  console.log('[PWA] Installed');
  const btn = document.getElementById('install-btn');
  if (btn) btn.style.display = 'none';
});

// Init App
document.addEventListener('DOMContentLoaded', async () => {
  await registerServiceWorker();
  await setupPush();

  const app = new App({
    content: document.querySelector('#main-content'),
    drawerButton: document.querySelector('#drawer-button'),
    navigationDrawer: document.querySelector('#navigation-drawer'),
  });
  
  await app.renderPage();
  window.addEventListener('hashchange', () => app.renderPage());
});