'use client';

import { useState, useEffect } from 'react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl border border-slate-800 flex items-center justify-between gap-3 animate-slideUp">
      <div className="flex items-center gap-2.5">
        <span className="text-2xl">🏪</span>
        <div>
          <h4 className="text-xs font-bold">Install CommunityShops App</h4>
          <p className="text-[10px] text-slate-400">Add to your home screen for fast access!</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          onClick={handleInstallClick}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-1.5 rounded-xl transition cursor-pointer"
        >
          Install
        </button>
        <button
          onClick={() => setShowPrompt(false)}
          className="text-slate-400 hover:text-white text-xs px-2 py-1"
        >
          ✕
        </button>
      </div>
    </div>
  );
}