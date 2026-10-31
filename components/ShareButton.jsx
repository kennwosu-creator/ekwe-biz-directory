'use client';

import { useState } from 'react';

export default function ShareButton({ businessName, townName, pageUrl }) {
  const [copied, setCopied] = useState(false);

  const shareTitle = `${businessName} - ${townName} Directory`;
  const shareText = `Check out ${businessName} in ${townName}! View available products and contact them directly here:`;
  const fullUrl = pageUrl || (typeof window !== 'undefined' ? window.location.href : '');

  const handleShare = async () => {
    // 1. Try Native Web Share API first (Mobile Apps / Chrome / Safari)
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: fullUrl,
        });
        return;
      } catch (err) {
        // User cancelled share or browser restricted call
      }
    }

    // 2. Direct WhatsApp Deep Link Fallback
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
      `${shareText} ${fullUrl}`
    )}`;
    window.open(waUrl, '_blank');
  };

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="w-full space-y-2">
      {/* Primary Sticky WhatsApp Share CTA */}
      <button
        onClick={handleShare}
        className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2.5 text-sm transition"
      >
        <span className="text-base">📲</span>
        <span>Share Business Page on WhatsApp</span>
      </button>

      {/* Secondary Copy Link Fallback */}
      <div className="text-center">
        <button
          onClick={handleCopyLink}
          className="text-[11px] text-slate-500 hover:text-slate-700 underline font-medium"
        >
          {copied ? '✓ Link copied to clipboard!' : 'Copy Page Direct Link'}
        </button>
      </div>
    </div>
  );
}