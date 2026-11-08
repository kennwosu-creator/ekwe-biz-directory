'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState([]);
  const [reports, setReports] = useState([]);
  const [activeTab, setActiveTab] = useState('agents');
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [agentCode, setAgentCode] = useState('');
  const [region, setRegion] = useState('');
  const [accessPin, setAccessPin] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const [agentsRes, reportsRes] = await Promise.all([
        fetch('/api/admin/agents').then(res => res.json()),
        fetch('/api/admin/agent-reports').then(res => res.json())
      ]);

      if (agentsRes.success) setAgents(agentsRes.data);
      if (reportsRes.success) setReports(reportsRes.data);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateAgent(e) {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, agent_code: agentCode, region, access_pin: accessPin })
      });
      const data = await res.json();
      if (data.success) {
        setName('');
        setPhone('');
        setAgentCode('');
        setRegion('');
        setAccessPin('');
        fetchData();
        alert('Field agent successfully created!');
      } else {
        alert('Error: ' + data.error);
      }
    } catch (err) {
      alert('Error creating agent: ' + err.message);
    }
  }

  async function handleUpdateStatus(id, status) {
    try {
      const res = await fetch('/api/admin/agents', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      });
      const data = await res.json();
      if (data.success) fetchData();
    } catch (err) {
      console.error('Error updating status:', err);
    }
  }

  async function handleDeleteAgent(id) {
    if (!confirm('Are you sure you want to delete this agent?')) return;
    try {
      const res = await fetch(`/api/admin/agents?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) fetchData();
    } catch (err) {
      console.error('Error deleting agent:', err);
    }
  }

  return (
    <div className="bg-slate-100 min-h-screen text-slate-800 font-sans pb-24 flex flex-col justify-between">
      <div>
        <header className="bg-emerald-950 text-white shadow-md">
          <div className="bg-emerald-900 px-4 py-3 text-center border-b border-emerald-800">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <Link href="/" className="text-xs font-bold text-emerald-300 hover:text-white transition flex items-center gap-1.5">
                <img src="/logo.png" alt="Logo" className="w-5 h-5 object-contain" />
                <span>← Back to Home</span>
              </Link>
              <div className="flex items-center gap-1.5">
                <img src="/logo.png" alt="CommunityShops Logo" className="w-5 h-5 object-contain" />
                <h1 className="text-sm font-extrabold tracking-tight">
                  Community<span className="text-emerald-400">Shops</span> Admin
                </h1>
              </div>
            </div>
          </div>
          <div className="max-w-4xl mx-auto px-4 py-6">
            <h2 className="text-xl font-black uppercase tracking-wider">Field Agent Administration & Auditing Hub</h2>
            <p className="text-xs text-emerald-200 mt-1">Manage field workers, security PINs, and verify daily task reports (Wage Evaluation: ₦50,000/mo)</p>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 pt-6 space-y-6">
          <div className="flex gap-2 border-b border-slate-200 pb-3">
            <button
              onClick={() => setActiveTab('agents')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition ${activeTab === 'agents' ? 'bg-emerald-800 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}
            >
              Managed Agents ({agents.length})
            </button>
          </div>

          {activeTab === 'agents' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Field Personnel</h3>
                {loading ? (
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">Loading agents...</div>
                ) : agents.length > 0 ? (
                  agents.map(agent => (
                    <div key={agent.id} className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900">{agent.name || agent.full_name}</h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase">{agent.agent_code || 'AG'}</span>
                        </div>
                        <p className="text-[11px] text-slate-500">📞 {agent.phone} | Region: {agent.region || 'General'} | PIN: <span className="font-mono font-bold text-emerald-700">{agent.access_pin}</span></p>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={agent.status || 'active'}
                          onChange={(e) => handleUpdateStatus(agent.id, e.target.value)}
                          className="text-[11px] bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-semibold"
                        >
                          <option value="active">Active</option>
                          <option value="suspended">Suspended</option>
                        </select>
                        <button onClick={() => handleDeleteAgent(agent.id)} className="text-[11px] font-bold text-red-600 hover:text-red-800 px-2 py-1">Delete</button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">No agents registered yet.</div>
                )}
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-4 h-fit">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">Add Field Agent & PIN</h3>
                <form onSubmit={handleCreateAgent} className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Full Name</label>
                    <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Kenneth Nwosu" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Phone Number</label>
                    <input type="text" required value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. 0803..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">Agent Code</label>
                      <input type="text" required value={agentCode} onChange={e => setAgentCode(e.target.value)} placeholder="AG-EKW-01" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">Security PIN</label>
                      <input type="text" required maxLength={4} value={accessPin} onChange={e => setAccessPin(e.target.value)} placeholder="4 digits" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Assigned Region / Village</label>
                    <input type="text" value={region} onChange={e => setRegion(e.target.value)} placeholder="e.g. Ekwe Central" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
                  </div>
                  <button type="submit" className="w-full bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 rounded-xl transition shadow-sm">Save Agent & PIN</button>
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