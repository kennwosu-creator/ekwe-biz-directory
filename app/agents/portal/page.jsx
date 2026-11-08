'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function FieldAgentPortalPage() {
  const [agentCode, setAgentCode] = useState('');
  const [accessPin, setAccessPin] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [agentInfo, setAgentInfo] = useState(null);

  // Task reporting form state
  const [groupsPosted, setGroupsPosted] = useState(5);
  const [shopsAdded, setShopsAdded] = useState(2);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    try {
      const res = await fetch('/api/agents/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_code: agentCode, access_pin: accessPin })
      });
      const data = await res.json();
      if (data.success) {
        setAuthenticated(true);
        setAgentInfo(data.agent);
      } else {
        alert('Authentication failed: ' + (data.error || 'Invalid credentials'));
      }
    } catch (err) {
      alert('Login error: ' + err.message);
    }
  }

  async function handleSubmitReport(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/agents/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: agentInfo.id,
          agent_code: agentInfo.agent_code,
          agent_name: agentInfo.name || agentInfo.full_name,
          groups_posted_to: groupsPosted,
          shops_added_count: shopsAdded,
          proof_links_or_notes: notes
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('Daily task report submitted successfully! Wage Evaluation pending review.');
        setNotes('');
      } else {
        alert('Error submitting report: ' + data.error);
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-slate-100 min-h-screen text-slate-800 font-sans pb-24 flex flex-col justify-between">
      <div>
        <header className="bg-emerald-950 text-white shadow-md">
          <div className="bg-emerald-900 px-4 py-3 text-center border-b border-emerald-800">
            <div className="max-w-md mx-auto flex items-center justify-between">
              <Link href="/" className="text-xs font-bold text-emerald-300 hover:text-white transition flex items-center gap-1.5">
                <img src="/logo.png" alt="Logo" className="w-5 h-5 object-contain" />
                <span>← Back to Home</span>
              </Link>
              <div className="flex items-center gap-1.5">
                <img src="/logo.png" alt="CommunityShops Logo" className="w-5 h-5 object-contain" />
                <h1 className="text-sm font-extrabold tracking-tight">
                  Community<span className="text-emerald-400">Shops</span>
                </h1>
              </div>
            </div>
          </div>
          <div className="max-w-md mx-auto px-4 py-6 text-center space-y-1">
            <h2 className="text-lg font-black uppercase tracking-wider">Field Agent Portal</h2>
            <p className="text-xs text-emerald-200">Log task reports and verify community expansion progress.</p>
          </div>
        </header>

        <main className="max-w-md mx-auto px-4 pt-6">
          {!authenticated ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">Agent Secure Login</h3>
              <form onSubmit={handleLogin} className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Agent Code</label>
                  <input
                    type="text"
                    required
                    value={agentCode}
                    onChange={e => setAgentCode(e.target.value)}
                    placeholder="e.g. AG-EKW-01"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none uppercase"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">4-Digit Security PIN</label>
                  <input
                    type="password"
                    required
                    maxLength={4}
                    value={accessPin}
                    onChange={e => setAccessPin(e.target.value)}
                    placeholder="••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 rounded-xl transition shadow-sm"
                >
                  Access Agent Portal
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-emerald-900 text-white p-4 rounded-2xl shadow-sm flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-extrabold">{agentInfo.name || agentInfo.full_name}</h3>
                  <p className="text-[11px] text-emerald-200">Code: {agentInfo.agent_code} | Region: {agentInfo.region || 'General'}</p>
                </div>
                <button
                  onClick={() => setAuthenticated(false)}
                  className="text-[10px] font-bold bg-emerald-800 hover:bg-emerald-700 text-emerald-100 px-2.5 py-1 rounded-lg"
                >
                  Logout
                </button>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">Submit Daily Task Report</h3>
                <form onSubmit={handleSubmitReport} className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">WhatsApp Groups Posted To</label>
                    <input
                      type="number"
                      min={0}
                      value={groupsPosted}
                      onChange={e => setGroupsPosted(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Shops Discovered / Added</label>
                    <input
                      type="number"
                      min={0}
                      value={shopsAdded}
                      onChange={e => setShopsAdded(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Proof Links / Field Notes</label>
                    <textarea
                      rows={3}
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="Enter group link shares, market visit feedback, or trader responses..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 rounded-xl transition shadow-sm disabled:opacity-50"
                  >
                    {submitting ? 'Submitting Report...' : 'Submit Task Report'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>

      <footer className="mt-16 border-t border-slate-200 bg-white py-6 px-4 text-center text-xs text-slate-500 space-y-3">
        <p>© {new Date().getFullYear()} CommunityShops. Connecting local village trade.</p>
        <div className="flex flex-wrap justify-center gap-4 text-[11px] font-semibold text-slate-600">
          <Link href="/agents/portal" className="hover:text-emerald-600 transition">🎯 Field Agent Portal</Link>
          <span>•</span>
          <Link href="/admin/businesses" className="hover:text-emerald-600 transition">🛡️ Merchants Admin</Link>
          <span>•</span>
          <Link href="/admin/agents" className="hover:text-emerald-600 transition">🎯 Agents Admin</Link>
          <span>•</span>
          <Link href="/admin/events" className="hover:text-emerald-600 transition">🎉 Events Admin</Link>
          <span>•</span>
          <Link href="/personals" className="hover:text-emerald-600 transition">📜 Personals</Link>
        </div>
      </footer>
    </div>
  );
}