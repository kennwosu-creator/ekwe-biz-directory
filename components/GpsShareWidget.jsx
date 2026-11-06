'use client';

import { useState } from 'react';

export default function GpsShareWidget() {
  const [sharing, setSharing] = useState(false);

  const handleShareCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setSharing(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        const mapsUrl = `https://maps.google.com/?q=${lat},${lng}`;
        const waText = encodeURIComponent(`Hello! Join us here at our spot in the village:\n📍 GPS Pin: ${mapsUrl}`);

        setSharing(false);
        window.open(`https://wa.me/?text=${waText}`, '_blank');
      },
      (error) => {
        console.error('GPS error:', error);
        setSharing(false);
        alert('Unable to retrieve your GPS location. Please check permissions.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="bg-emerald-950/80 border border-emerald-800/80 rounded-2xl p-3 flex items-center justify-between text-left shadow-xs">
      <div>
        <span className="text-xs font-bold text-white flex items-center gap-1">
          <span>📍</span> At a kiosk or spot without address?
        </span>
        <p className="text-[10px] text-emerald-200 mt-0.5">Share your live GPS pin instantly on WhatsApp.</p>
      </div>
      <button
        type="button"
        onClick={handleShareCurrentLocation}
        disabled={sharing}
        className="bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-extrabold text-[11px] px-3 py-2 rounded-xl transition shadow-xs whitespace-nowrap disabled:opacity-50"
      >
        {sharing ? 'Sharing...' : 'Share GPS Pin'}
      </button>
    </div>
  );
}