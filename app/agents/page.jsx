'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function FieldAgentHubPage() {
  const [agentCode, setAgentCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [agentData, setAgentData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLookup = async (e) => {
    e.preventDefault();
    if (!agentCode.trim()) return;

    setLoading(true);
    setErrorMsg('');

    try {
      // Fetch stats for this agent code
      const res = await fetch(`/api/agents/stats?code=${encodeURIComponent(agentCode.trim())}`);
      const data = await res.json();

      if (res.ok && data.success) {
        setAgentData(data);
      } else {
        setErrorMsg(data.error || 'Agent code not found. Check your code and try again.');
      }
    } catch (err) {
      setErrorMsg('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-100 min-h-screen text-slate-800 font-sans pb-24">
      {/* HEADER */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-xs">
        <Link href="/" className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-full">
          ← Home Directory
        </Link>
        <span className="text-xs font-bold text-slate-700">📋 Field Agent Hub</span>
      </header>

      <main className="max-w-md mx-auto px-4 pt-6 space-y-6">
        {!agentData ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="text-center space-y-1">
              <span className="text-3xl">🎯</span>
              <h1 className="text-base font-bold text-slate-900">Agent Performance Portal</h1>
              <p className="text-xs text-slate-500">Enter your assigned Agent ID to view your onboarding metrics and stats.</p>
            </div>

            {errorMsg && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl text-center">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleLookup} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Agent Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., AG-101"
                  value={agentCode}
                  onChange={(e) => setAgentCode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-bold"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-xs shadow-sm transition active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? 'Checking Records...' : 'View My Onboarding Stats'}
              </button>
            </form>

            <div className="bg-emerald-50 border border-emerald-200/80 p-3 rounded-xl text-[11px] text-emerald-900 space-y-1">
              <p className="font-bold">💡 Field Tips:</p>
              <p>Make sure shop owners include your Agent Code when registering their kiosks so they are credited to your profile!</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h1 className="text-base font-bold text-slate-900">{agentData.agentName || agentCode}</h1>
                  <p className="text-[11px] text-emerald-700 font-semibold">Active Field Agent</p>
                </div>
                <button
                  onClick={() => setAgentData(null)}
                  className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl hover:bg-slate-200"
                >
                  Switch Agent
                </button>
              </div>

              {/* STATS GRID */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 text-center">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Onboarded</p>
                  <p className="text-2xl font-extrabold text-slate-900 mt-1">{agentData.totalShops || 0}</p>
                </div>
                <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-200/80 text-center">
                  <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">Verified Kiosks</p>
                  <p className="text-2xl font-extrabold text-emerald-800 mt-1">{agentData.verifiedShops || 0}</p>
                </div>
              </div>
            </div>

            {/* REGISTERED SHOPS LIST */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Onboarded Kiosks & Shops</h3>
              
              {agentData.shops && agentData.shops.length > 0 ? (
                <div className="space-y-2.5">
                  {agentData.shops.map((shop) => (
                    <div key={shop.id} className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">{shop.name}</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">📍 {shop.address} ({shop.town_name})</p>
                      </div>
                      <Link href={`/biz/${shop.slug}`} target="_blank" className="text-[10px] text-emerald-700 font-bold underline">
                        View ↗
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic text-center py-4">No shops registered with this agent code yet.</p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}