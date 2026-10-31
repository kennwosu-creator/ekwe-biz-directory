'use client';

import { useState } from 'react';

export default function AgentOnboardTrader() {
  const [traderPhone, setTraderPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [address, setAddress] = useState('');
  const [townId, setTownId] = useState('');
  const [rawProducts, setRawProducts] = useState('');
  const [loading, setLoading] = useState(false);
  const [receipt, setReceipt] = useState(null);

  const handleAgentOnboard = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/agent/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trader_phone: traderPhone,
          business_name: businessName,
          address,
          town_id: townId,
          raw_products: rawProducts,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setReceipt(json.receipt);
      } else {
        alert(json.error || 'Onboarding failed');
      }
    } catch (err) {
      alert('Network error during onboarding');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-100 min-h-screen text-slate-800 p-4 max-w-md mx-auto font-sans">
      <header className="bg-emerald-700 text-white p-4 rounded-xl mb-4">
        <h1 className="text-base font-bold">📲 Agent Trader Onboarding</h1>
        <p className="text-xs text-emerald-100">Collect ₦1,000 cash after completing registration.</p>
      </header>

      {!receipt ? (
        <form onSubmit={handleAgentOnboard} className="bg-white rounded-2xl p-5 border border-slate-200 space-y-3.5 shadow-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Trader WhatsApp / Phone</label>
            <input
              type="text"
              required
              placeholder="e.g. 08031234567"
              value={traderPhone}
              onChange={(e) => setTraderPhone(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Trader Shop / Business Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Mama Chukwudi Rice & Oil"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Market Stall / Location Address</label>
            <input
              type="text"
              required
              placeholder="e.g. Stall 14, Eke Market, Ekwe"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Initial Goods & Items Sold</label>
            <textarea
              rows={3}
              placeholder="e.g. rice, beans, garri, palm oil"
              value={rawProducts}
              onChange={(e) => setRawProducts(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl text-xs shadow-md"
          >
            {loading ? 'Processing Onboarding...' : 'Submit & Generate Receipt (₦1,000)'}
          </button>
        </form>
      ) : (
        /* DIGITAL RECEIPT CONFIRMATION */
        <div className="bg-white rounded-2xl p-6 border border-emerald-300 shadow-md text-center space-y-4">
          <span className="text-4xl">🧾</span>
          <h2 className="text-sm font-bold text-slate-900">Onboarding Successful!</h2>
          <p className="text-xs text-slate-500">
            Receipt <strong className="text-slate-800">#{receipt.receipt_number}</strong> sent via WhatsApp to{' '}
            <strong>{receipt.trader_phone}</strong>.
          </p>

          <div className="bg-slate-50 p-4 rounded-xl text-xs text-left space-y-1.5 border border-slate-100">
            <div className="flex justify-between"><span>Shop:</span> <strong className="text-slate-800">{receipt.business_name}</strong></div>
            <div className="flex justify-between"><span>Amount Paid:</span> <strong className="text-emerald-700">₦1,000.00</strong></div>
            <div className="flex justify-between"><span>Trader PIN:</span> <strong className="text-slate-800">{receipt.generated_pin}</strong></div>
          </div>

          <button
            onClick={() => setReceipt(null)}
            className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl text-xs"
          >
            + Onboard Another Trader
          </button>
        </div>
      )}
    </div>
  );
}