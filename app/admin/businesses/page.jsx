'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminBusinessesPage() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchBusinesses = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/businesses?status=${filter}`);
      const json = await res.json();
      if (json.success) {
        setBusinesses(json.data);
      }
    } catch (err) {
      console.error('Failed to load businesses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, [filter]);

  const updateBusiness = async (id, updatePayload) => {
    try {
      const res = await fetch('/api/admin/businesses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updatePayload }),
      });
      const json = await res.json();
      if (json.success) {
        setBusinesses((prev) =>
          prev.map((b) => (b.id === id ? { ...b, ...json.data } : b))
        );
      }
    } catch (err) {
      alert('Failed to update business');
    }
  };

  const deleteBusiness = async (id) => {
    if (!confirm('Are you sure you want to permanently delete this business?')) return;
    try {
      const res = await fetch(`/api/admin/businesses?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setBusinesses((prev) => prev.filter((b) => b.id !== id));
      }
    } catch (err) {
      alert('Failed to delete business');
    }
  };

  return (
    <div className="bg-slate-100 min-h-screen text-slate-800 font-sans pb-12">
      {/* HEADER */}
      <header className="bg-slate-900 text-white px-4 py-4 shadow-md sticky top-0 z-30">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold flex items-center gap-2">
              <span>🛡️</span> Directory Moderation Portal
            </h1>
            <p className="text-[11px] text-slate-400">Manage, verify, and moderate local shop listings</p>
          </div>
          <Link href="/" className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg text-slate-200">
            Exit Admin
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-6 space-y-4">
        {/* STATUS FILTER BAR */}
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2 overflow-x-auto">
          {['all', 'active', 'pending', 'suspended'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg uppercase tracking-wider transition ${
                filter === status
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* LISTINGS TABLE / CARDS */}
        {loading ? (
          <div className="text-center py-12 text-slate-400 text-xs">Loading businesses...</div>
        ) : businesses.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border border-slate-200 text-xs text-slate-500">
            No businesses found under the selected status filter.
          </div>
        ) : (
          <div className="space-y-3">
            {businesses.map((biz) => (
              <div
                key={biz.id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-slate-900">{biz.name}</h2>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          biz.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : biz.status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {biz.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      📍 {biz.address} ({biz.town_name}, {biz.state})
                    </p>
                    <p className="text-xs text-slate-500">📞 {biz.phone} | WhatsApp: {biz.whatsapp_number}</p>
                  </div>

                  {/* ACTION CONTROLS */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateBusiness(biz.id, { is_verified: !biz.is_verified })}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded border transition ${
                        biz.is_verified
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                          : 'bg-slate-50 border-slate-200 text-slate-500'
                      }`}
                    >
                      {biz.is_verified ? '✓ Verified' : '+ Verify'}
                    </button>

                    <button
                      onClick={() => updateBusiness(biz.id, { is_featured: !biz.is_featured })}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded border transition ${
                        biz.is_featured
                          ? 'bg-amber-50 border-amber-300 text-amber-700'
                          : 'bg-slate-50 border-slate-200 text-slate-500'
                      }`}
                    >
                      {biz.is_featured ? '★ Featured' : 'Feature'}
                    </button>
                  </div>
                </div>

                {/* MODERATION ACTION BUTTONS */}
                <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {biz.status !== 'active' && (
                      <button
                        onClick={() => updateBusiness(biz.id, { status: 'active' })}
                        className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-1 rounded-lg"
                      >
                        Approve / Activate
                      </button>
                    )}
                    {biz.status !== 'suspended' && (
                      <button
                        onClick={() => updateBusiness(biz.id, { status: 'suspended' })}
                        className="text-xs bg-amber-500 hover:bg-amber-600 text-white font-semibold px-3 py-1 rounded-lg"
                      >
                        Suspend
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => deleteBusiness(biz.id)}
                    className="text-xs text-rose-600 hover:text-rose-800 font-semibold"
                  >
                    Delete Shop
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}