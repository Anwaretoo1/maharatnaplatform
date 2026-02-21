'use client';

import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsIOS(isIOSDevice);

    // Show iOS guide if not installed
    if (isIOSDevice && !isStandalone) {
      const dismissed = localStorage.getItem('pwa-ios-dismissed');
      if (!dismissed) {
        setTimeout(() => setShowBanner(true), 3000);
      }
    }

    // Listen for install prompt (Android/Chrome)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  const dismiss = () => {
    setShowBanner(false);
    if (isIOS) {
      localStorage.setItem('pwa-ios-dismissed', 'true');
    }
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Install Banner */}
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white dark:bg-neutral-800 rounded-xl shadow-2xl border border-gray-200 dark:border-neutral-700 p-4 z-50 animate-slide-up">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
            م
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-sm">تثبيت تطبيق مهاراتنا</h3>
            <p className="text-xs text-gray-500 mt-1">
              {isIOS
                ? 'أضف التطبيق إلى الشاشة الرئيسية للوصول السريع'
                : 'ثبّت التطبيق على جهازك للوصول السريع بدون متصفح'}
            </p>
          </div>
          <button onClick={dismiss} className="text-gray-400 hover:text-gray-600 text-lg">&times;</button>
        </div>
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleInstall}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors"
          >
            {isIOS ? 'كيفية التثبيت' : 'تثبيت التطبيق'}
          </button>
          <button onClick={dismiss} className="px-4 py-2 text-gray-500 hover:text-gray-700 text-sm font-medium">
            لاحقاً
          </button>
        </div>
      </div>

      {/* iOS Installation Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50" onClick={() => setShowIOSGuide(false)}>
          <div className="bg-white dark:bg-neutral-900 rounded-t-2xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-4 text-center">تثبيت التطبيق على iPhone/iPad</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-neutral-800 rounded-lg">
                <span className="text-2xl">1️⃣</span>
                <p className="text-sm">اضغط على زر <strong>المشاركة</strong> (📤) في أسفل المتصفح</p>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-neutral-800 rounded-lg">
                <span className="text-2xl">2️⃣</span>
                <p className="text-sm">مرر للأسفل واضغط <strong>&ldquo;إضافة إلى الشاشة الرئيسية&rdquo;</strong></p>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-neutral-800 rounded-lg">
                <span className="text-2xl">3️⃣</span>
                <p className="text-sm">اضغط <strong>&ldquo;إضافة&rdquo;</strong> في الأعلى</p>
              </div>
            </div>
            <button
              onClick={() => { setShowIOSGuide(false); dismiss(); }}
              className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg"
            >
              فهمت
            </button>
          </div>
        </div>
      )}
    </>
  );
}
