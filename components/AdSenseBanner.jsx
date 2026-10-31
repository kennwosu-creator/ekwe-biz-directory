'use client';

import { useEffect } from 'react';

export default function AdSenseBanner({
  client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || 'ca-pub-XXXXXXXXXXXXXXXX',
  slot = '1234567890',
  format = 'auto',
  responsive = 'true',
}) {
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (err) {
      console.error('AdSense script error:', err);
    }
  }, []);

  return (
    <div className="w-full my-3 overflow-hidden rounded-xl bg-slate-50 border border-slate-200/60 p-2 text-center">
      <div className="text-[9px] uppercase tracking-wider text-slate-400 mb-1 font-semibold">
        Advertisement
      </div>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive}
      />
    </div>
  );
}