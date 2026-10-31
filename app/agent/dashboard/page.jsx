'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AgentDashboardPage() {
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Check if agent details exist in localStorage on mount
  useEffect(() => {
    const savedPhone = localStorage.getItem('agent_phone');
    const savedPin = localStorage.getItem('agent_pin');
    if (savedPhone && savedPin) {
      setPhone(savedPhone);
      setPin(savedPin);
      fetchDashboard(savedPhone, savedPin);
    }
  }, []);

  const fetchDashboard = async (agentPhone, agentPin) => {
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/agent/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: agentPhone, pin: agentPin }),
      });

      const json = await res.json();

      if (json.success) {
        setDashboardData(json);
        setIsAuthenticated(true);
        // Persist session locally
        localStorage.setItem('agent_phone', agentPhone);
        localStorage.setItem('agent_pin', agentPin);
      } else {
        setErrorMsg(json.error || 'Invalid phone number or PIN');
        setIsAuthenticated(false);
      }
    } catch (err) {
      setErrorMsg('Failed to connect to the server. Please try again.');
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    fetchDashboard(phone, pin);
  };

  const handleLogout = () => {
    localStorage.removeItem('agent_phone');
    localStorage.removeItem('agent_pin');
    setIsAuthenticated(false);
    setDashboardData(null);
    setPhone('');
    setPin('');
  };

  // --- 1. LOGIN FORM STATE (If not authenticated) ---
  if (!isAuthenticated) {
    return (
      <div className="bg-slate-100 min-h-screen text-slate-800 font-sans pb-16">
        <header className="sticky top-0 z-30 bg-emerald-800 text-white px-4 py-3.5 flex items-center justify-between shadow-md">
          <h1 className="text-sm font-bold">💼 Agent Earnings Login</h1>
          <Link href="/" className="text-xs bg-emerald-900/60 px-3 py-1.5 rounded-lg text-emerald-100">
            Home
          </Link>
        </header>

        <main className="max-w-md mx-auto px-4 pt-6">
          <form onSubmit={handleLogin} className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
            <div className="text-center space-y-1">
              <span className="text-3xl">🔑</span>
              <h2 className="text-sm font-bold text-slate-900">Access Financial Ledger</h2>
              <p className="text-xs text-slate-500">Enter your registered phone number and 4-digit PIN</p>
            </div>

            {errorMsg && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl">
                ⚠️ {errorMsg}
              </div>
            )}

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
              <label className="block text-xs font-semibold text-slate-600 mb-1">4-Digit Security PIN</label>
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
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl text-xs shadow-md transition"
            >
              {loading ? 'Authenticating...' : 'Access Dashboard'}
            </button>

            <div className="text-center pt-2">
              <Link href="/agent/register" className="text-xs text-emerald-700 font-semibold hover:underline">
                Not registered yet? Sign up as an Agent →
              </Link>
            </div>
          </form>
        </main>
      </div>
    );
  }

  // --- 2. AUTHENTICATED DASHBOARD STATE ---
  const { agent, ledger = [], stats = {} } = dashboardData;

  return (
    <div className="bg-slate-100 min-h-screen text-slate-800 font-sans pb-16">
      <header className="sticky top-0 z-30 bg-emerald-800 text-white px-4 py-3.5 flex items-center justify-between shadow-md">
        <div>
          <h1 className="text-sm font-bold">💼 Agent Ledger</h1>
          <p className="text-[11px] text-emerald-200">{agent.full_name}</p>
        </div>
        <button
          onClick={handleLogout}
          className="text-xs bg-emerald-900/60 hover:bg-emerald-900 px-3 py-1.5 rounded-lg text-emerald-100 transition"
        >
          Exit
        </button>
      </header>

      <main className="max-w-md mx-auto px-4 pt-4 space-y-4">
        {/* WALLET BALANCE & STATS CARD */}
        <section className="bg-slate-900 text-white p-5 rounded-2xl shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <p className="text-[11px] text-slate-400 font-medium">Available Credit Balance</p>
              <p className="text-2xl font-black text-emerald-400 mt-0.5">
                ₦{Number(agent.wallet_balance || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <Link
              href="/agent/onboard"
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition"
            >
              + Onboard Shop
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center pt-1">
            <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
              <p className="text-sm font-extrabold text-white">{stats.total_onboarded || 0}</p>
              <p className="text-[10px] text-slate-400">Shops Onboarded</p>
            </div>
            <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
              <p className="text-sm font-extrabold text-emerald-400">
                ₦{Number(stats.total_commissions || 0).toLocaleString('en-NG')}
              </p>
              <p className="text-[10px] text-slate-400">Cash Earned (₦500/shop)</p>
            </div>
          </div>
        </section>

        {/* FINANCIAL TRANSACTION LEDGER */}
        <section className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Recent Activity & Remittances
          </h2>

          <div className="space-y-2">
            {ledger.length > 0 ? (
              ledger.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50 text-xs"
                >
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-900">{item.description}</p>
                    <p className="text-[10px] text-slate-400">
                      {new Date(item.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <span
                    className={`font-mono font-bold ${
                      item.amount > 0 ? 'text-emerald-700' : 'text-rose-600'
                    }`}
                  >
                    {item.amount > 0 ? `+₦${item.amount}` : `-₦${Math.abs(item.amount)}`}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-xs text-slate-400 italic">
                No transactions recorded yet. Onboard your first shop to start earning!
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}