'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function AgentRegisterPage() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [agentCode, setAgentCode] = useState('');
  const [region, setRegion] = useState('');
  const [accessPin, setAccessPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleRegister(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/agents/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          agent_code: agentCode,
          region,
          access_pin: accessPin,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess(true);
      } else {
        alert('Registration failed: ' + (data.error || 'Please try again.'));
      }
    } catch (err) {
      alert('Error submitting registration: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="bg-slate-100 min-h-screen text-slate-800 font-sans pb-24 flex flex-col justify-between">
        <div>
          <header className="bg-emerald-950 text-white shadow-md">
            <div className="bg-emerald-900 px-4 py-3 text-center border-b border-emerald-800">
              <div className="max-w-md mx-auto flex items-center justify-between">
                <Link href="/agents/portal" className="text-xs font-bold text-emerald-300 hover:text-white transition flex items-center gap-1.5">
                  <img src="/logo.png" alt="Logo" className="w-5 h-5 object-contain" />
                  <span>← Back to Agent Portal</span>
                </Link>
                <div className="flex items-center gap-1.5">
                  <img src="/logo.png" alt="CommunityShops Logo" className="w-5 h-5 object-contain" />
                  <span className="text-sm font-extrabold tracking-tight">
                    Community<span className="text-emerald-400">Shops</span>
                  </span>
                </div>
              </div>
            </div>
          </header>

          <main className="max-w-md mx-auto px-4 pt-12">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-lg text-center space-y-4">
              <div className="text-4xl">🎉</div>
              <h2 className="text-lg font-bold text-slate-900">Registration Request Submitted!</h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Thank you for applying to become a Field Agent for <span className="font-bold text-slate-800">{region || 'your region'}</span>. Your account is currently <span className="font-bold text-amber-600">Pending Admin Approval</span>.
              </p>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-left text-xs space-y-1">
                <p><span className="font-semibold text-slate-500">Agent Name:</span> {name}</p>
                <p><span className="font-semibold text-slate-500">Agent Code:</span> {agentCode}</p>
                <p><span className="font-semibold text-slate-500">Status:</span> Pending Review</p>
              </div>
              <Link
                href="/agents/portal"
                className="block w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-3 rounded-xl transition"
              >
                Return to Agent Portal Login
              </Link>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-100 min-h-screen text-slate-800 font-sans pb-24 flex flex-col justify-between">
      <div>
        <header className="bg-emerald-950 text-white shadow-md">
          <div className="bg-emerald-900 px-4 py-3 text-center border-b border-emerald-800">
            <div className="max-w-md mx-auto flex items-center justify-between">
              <Link href="/agents/portal" className="text-xs font-bold text-emerald-300 hover:text-white transition flex items-center gap-1.5">
                <img src="/logo.png" alt="Logo" className="w-5 h-5 object-contain" />
                <span>← Back to Agent Portal</span>
              </Link>
              <div className="flex items-center gap-1.5">
                <img src="/logo.png" alt="CommunityShops Logo" className="w-5 h-5 object-contain" />
                <span className="text-sm font-extrabold tracking-tight">
                  Community<span className="text-emerald-400">Shops</span>
                </span>
              </div>
            </div>
          </div>
          <div className="max-w-md mx-auto px-4 py-6 text-center space-y-1">
            <h1 className="text-lg font-black uppercase tracking-wider text-white">Field Agent Registration</h1>
            <p className="text-xs text-emerald-200">Submit your details to request community expansion access.</p>
          </div>
        </header>

        <main className="max-w-md mx-auto px-4 pt-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">New Agent Application</h3>
            
            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Chief Kenneth Nwosu"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="e.g. 08030000000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Preferred Agent Code *</label>
                  <input
                    type="text"
                    required
                    value={agentCode}
                    onChange={e => setAgentCode(e.target.value.toUpperCase())}
                    placeholder="AG-EKW-02"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">4-Digit Security PIN *</label>
                  <input
                    type="password"
                    required
                    maxLength={4}
                    value={accessPin}
                    onChange={e => setAccessPin(e.target.value)}
                    placeholder="••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none text-center tracking-widest font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Assigned Region / Village *</label>
                <input
                  type="text"
                  required
                  value={region}
                  onChange={e => setRegion(e.target.value)}
                  placeholder="e.g. Ekwe Central / Umuaka"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold py-3 rounded-xl transition shadow-sm disabled:opacity-50 mt-2"
              >
                {loading ? 'Submitting Application...' : 'Submit Registration for Approval'}
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}