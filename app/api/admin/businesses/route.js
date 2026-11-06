'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminBusinessesPage() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchBusinesses(filter);
  }, [filter]);

  const fetchBusinesses = async (statusFilter) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/businesses?status=${statusFilter}`);
      const data = await res.json();
      if (data.success) {
        setBusinesses(data.data);
      }
    } catch (err) {
      console.error('Failed to load businesses', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id, payload) => {
    // Optimistic UI update
    setBusinesses((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...payload } : b))
    );

    try {
      const res = await fetch('/api/admin/businesses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...payload }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert('Failed to update status on server.');
        fetchBusinesses(filter); // revert on failure
      } else {
        // Sync with exact returned backend data fields
        setBusinesses((prev) =>
          prev.map((b) => (b.id === id ? { ...b, ...data.data } : b))
        );
      }
    } catch (err) {
      alert('Network error.');
      fetchBusinesses(filter);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/businesses?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBusinesses((prev) => prev.filter((b) => b.id !== id));
      } else {
        alert(data.error || 'Failed to delete business.');
      }
    } catch (err) {
      alert('Network error during deletion.');
    }
  };

  return (
    <div className="bg-slate-100 min-h-screen text-slate-800 font-sans pb-24">
      {/* HEADER */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-xs">
        <Link href="/" className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-full">
          ← Home Directory
        </Link>
        <span className="text-xs font-bold text-slate-700">🛡️ Admin Moderation Portal</span>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <h1 className="text-base font-bold text-slate-900">Manage Village Kiosks & Shops</h1>
            <p className="text-xs text-slate-500">Approve, verify checkmarks, feature, or manage listings across regions.</p>
          </div>

          {/* FILTER TABS matching API status values */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { label: 'All', value: 'all' },
              { label: 'Active', value: 'active' },
              { label: 'Pending', value: 'pending' },
              { label: 'Suspended', value: 'suspended' },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                className={`text-[11px] font-bold px-3 py-1.5 rounded-xl transition ${
                  filter === tab.value
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl p-8 text-center text-xs text-slate-500 border border-slate-200">
            Loading businesses for moderation...
          </div>
        ) : businesses.length > 0 ? (
          <div className="space-y-3">
            {businesses.map((biz) => (
              <div
                key={biz.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-slate-900">{biz.name}</h3>
                    <Link
                      href={`/biz/${biz.slug}`}
                      target="_blank"
                      className="text-[10px] text-emerald-600 font-semibold hover:underline"
                    >
                      View Live ↗
                    </Link>
                    <span className={`text-[9px] uppercase font-extrabold px-2 py-0.5 rounded-md ${
                      biz.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                      biz.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {biz.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    📍 {biz.address} ({biz.town_name}, {biz.state})
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    WhatsApp: {biz.whatsapp_number || biz.phone} • Registered: {new Date(biz.created_at).toLocaleDateString()}
                  </p>
                </div>

                {/* MODERATION ACTION CONTROLS */}
                <div className="flex items-center flex-wrap gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <button
                    onClick={() => handleUpdate(biz.id, { is_verified: !biz.is_verified })}
                    className={`text-[10px] font-bold px-3 py-1.5 rounded-xl transition ${
                      biz.is_verified
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {biz.is_verified ? '✓ Verified' : 'Verify'}
                  </button>

                  <button
                    onClick={() => handleUpdate(biz.id, { is_featured: !biz.is_featured })}
                    className={`text-[10px] font-bold px-3 py-1.5 rounded-xl transition ${
                      biz.is_featured
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {biz.is_featured ? '⭐ Featured' : 'Feature'}
                  </button>

                  {/* Status switcher */}
                  <select
                    value={biz.status}
                    onChange={(e) => handleUpdate(biz.id, { status: e.target.value })}
                    className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2.5 py-1.5 rounded-xl border border-slate-200 focus:outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="suspended">Suspended</option>
                  </select>

                  <button
                    onClick={() => handleDelete(biz.id, biz.name)}
                    className="text-[10px] font-bold bg-rose-50 text-rose-600 hover:bg-rose-100 px-2.5 py-1.5 rounded-xl transition"
                    title="Delete listing"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 text-center text-xs text-slate-500 border border-slate-200">
            No businesses found for this filter.
          </div>
        )}
      </main>
    </div>
  );
}