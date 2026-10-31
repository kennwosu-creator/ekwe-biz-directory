'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function AgentRegisterPage() {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [registeredAgent, setRegisteredAgent] = useState(null);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/agent/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName, phone, pin }),
      });

      const json = await res.json();
      if (json.success) {
        setRegisteredAgent(json.agent);
      } else {
        alert(json.error || 'Registration failed');
      }
    } catch (err) {
      alert('Network error during registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-100 min-h-screen text-slate-800 font-sans pb-16">
      <header className="sticky top-0 z-30 bg-emerald-800 text-white px-4 py-3.5 flex items-center justify-between shadow-md">
        <div>
          <h1 className="text-sm font-bold">🤝 Become an Onboarding Agent</h1>
          <p className="text-[11px] text-emerald-200">Earn ₦500 per trader onboarded in Ekwe</p>
        </div>
        <Link href="/" className="text-xs bg-emerald-900/60 hover:bg-emerald-900 px-3 py-1.5 rounded-lg text-emerald-100">
          Home
        </Link>
      </header>

      <main className="max-w-md mx-auto px-4 pt-5 space-y-4">
        {!registeredAgent ? (
          <form onSubmit={handleRegister} className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800">
              💡 <strong>How it works:</strong> Help local shopkeepers get online. Collect ₦1,000 cash per shop, keep ₦500 cash profit instantly, and issue them an instant WhatsApp receipt.
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Chidi Okeke"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">WhatsApp / Phone Number</label>
              <input
                type="text"
                required
                placeholder="e.g. 08012345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Set 4-Digit Security PIN</label>
              <input
                type="password"
                maxLength={4}
                required
                placeholder="****"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold py-3.5 rounded-xl text-xs shadow-md transition"
            >
              {loading ? 'Creating Agent Account...' : 'Register as Field Agent'}
            </button>
          </form>
        ) : (
          <div className="bg-white rounded-2xl p-6 border border-emerald-300 shadow-md text-center space-y-4">
            <span className="text-4xl">🎉</span>
            <h2 className="text-base font-bold text-slate-900">Welcome to the Agent Network!</h2>
            <p className="text-xs text-slate-500">
              Your agent account for <strong>{registeredAgent.full_name}</strong> is ready.
            </p>

            <div className="bg-emerald-50 p-4 rounded-xl text-xs text-left space-y-1.5 border border-emerald-100">
              <div className="flex justify-between"><span>Agent Phone:</span> <strong>{registeredAgent.phone}</strong></div>
              <div className="flex justify-between"><span>Welcome Bonus Credit:</span> <strong className="text-emerald-700">₦2,500.00</strong></div>
            </div>

            <div className="space-y-2 pt-2">
              <Link
                href="/agent/onboard"
                className="block w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-xs"
              >
                📲 Start Onboarding Traders Now
              </Link>
              <Link
                href="/agent/dashboard"
                className="block w-full bg-slate-900 text-white font-bold py-3 rounded-xl text-xs"
              >
                💼 Go to Agent Dashboard
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}