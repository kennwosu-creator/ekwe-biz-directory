'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAgent, setNewAgent] = useState({ name: '', phone: '', agent_code: '', region: '' });

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const res = await fetch('/api/admin/agents');
      const json = await res.json();
      if (json.success) setAgents(json.data);
    } catch (err) {
      console.error('Failed to load agents', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAgent = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAgent),
      });
      const json = await res.json();
      if (json.success) {
        setShowAddModal(false);
        setNewAgent({ name: '', phone: '', agent_code: '', region: '' });
        fetchAgents();
      } else {
        alert(json.error || 'Failed to create agent');
      }
    } catch (err) {
      alert('Network error');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      const res = await fetch('/api/admin/agents', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      const json = await res.json();
      if (json.success) {
        setAgents(agents.map(a => a.id === id ? { ...a, status } : a));
      }
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this agent?')) return;
    try {
      const res = await fetch(`/api/admin/agents?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setAgents(agents.filter(a => a.id !== id));
      }
    } catch (err) {
      alert('Failed to delete agent');
    }
  };

  return (
    <div className="bg-slate-100 min-h-screen text-slate-800 font-sans pb-16">
      <header className="bg-slate-900 text-white px-4 py-4 shadow-md sticky top-0 z-30 flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold">🎯 Field Agent Administration</h1>
          <p className="text-[11px] text-slate-400">Add, suspend, block, or manage field agents</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowAddModal(true)} className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg">
            + Add New Agent
          </button>
          <Link href="/admin/businesses" className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg text-slate-200">
            Merchants →
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-6 space-y-4">
        {loading ? (
          <div className="text-center py-12 text-slate-400 text-xs">Loading agents...</div>
        ) : agents.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border border-slate-200 text-xs text-slate-500">
            No agents registered yet. Click &quot;Add New Agent&quot; to begin.
          </div>
        ) : (
          <div className="space-y-3">
            {agents.map((agent) => (
              <div key={agent.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-slate-900">{agent.name}</h2>
                    <span className="text-[10px] bg-slate-100 text-slate-700 font-mono px-2 py-0.5 rounded font-bold">
                      {agent.agent_code}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      agent.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                      agent.status === 'suspended' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {agent.status || 'active'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">📞 {agent.phone} | Region: {agent.region || 'General'}</p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={agent.status || 'active'}
                    onChange={(e) => handleStatusChange(agent.id, e.target.value)}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-1.5 font-semibold"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspend</option>
                    <option value="blocked">Block</option>
                  </select>
                  <button onClick={() => handleDelete(agent.id)} className="text-xs text-rose-600 hover:text-rose-800 font-semibold px-2 py-1">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl">
              <h2 className="text-sm font-bold text-slate-900">Add Field Agent</h2>
              <form onSubmit={handleCreateAgent} className="space-y-3">
                <input
                  type="text"
                  required
                  placeholder="Agent Full Name"
                  value={newAgent.name}
                  onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                />
                <input
                  type="text"
                  required
                  placeholder="Phone Number / WhatsApp"
                  value={newAgent.phone}
                  onChange={(e) => setNewAgent({ ...newAgent, phone: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                />
                <input
                  type="text"
                  required
                  placeholder="Agent Code (e.g. AG-102)"
                  value={newAgent.agent_code}
                  onChange={(e) => setNewAgent({ ...newAgent, agent_code: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 uppercase"
                />
                <input
                  type="text"
                  placeholder="Assigned Region / Town"
                  value={newAgent.region}
                  onChange={(e) => setNewAgent({ ...newAgent, region: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                />
                <div className="flex gap-2 pt-2">
                  <button type="submit" className="flex-1 bg-emerald-600 text-white font-bold text-xs py-2.5 rounded-xl">Save Agent</button>
                  <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 bg-slate-100 text-slate-600 font-bold text-xs py-2.5 rounded-xl">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}