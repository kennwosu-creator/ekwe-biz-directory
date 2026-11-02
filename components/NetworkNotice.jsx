'use client';

import { useState, useEffect } from 'react';

export default function NetworkNotice() {
  const [isSlowOrOffline, setIsSlowOrOffline] = useState(false);
  const [statusText, setStatusText] = useState('');

  useEffect(() => {
    const updateStatus = () => {
      if (!navigator.onLine) {
        setIsSlowOrOffline(true);
        setStatusText('You are currently offline. Showing cached results.');
        return;
      }

      // Check Network Information API (where supported on Android/Chrome)
      const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (conn && (conn.effectiveType === '2g' || conn.effectiveType === 'slow-2g' || conn.saveData)) {
        setIsSlowOrOffline(true);
        setStatusText('Low-bandwidth mode active (images compressed).');
      } else {
        setIsSlowOrOffline(false);
      }
    };

    updateStatus();
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);

    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
    };
  }, []);

  if (!isSlowOrOffline) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-1.5 text-center text-[10px] font-semibold text-amber-800 flex items-center justify-center gap-1.5 sticky top-0 z-40">
      <span>⚡</span>
      <span>{statusText}</span>
    </div>
  );
}