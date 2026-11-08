'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminBusinessesPage() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const router = useRouter();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchBusinesses = async () => {
    setLoading(true);
    setCurrentPage(1); // Reset to page 1 on filter change
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

  const updateBusiness = async (e, id, updatePayload) => {
    e.stopPropagation(); // Prevent card click navigation
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

  const deleteBusiness = async (e, id) => {
    e.stopPropagation(); // Prevent card click navigation
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

  // Pagination calculations
  const totalPages = Math.ceil(businesses.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentBusinesses = businesses.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="bg-slate-100 min-h-screen text-slate-800 font-sans pb-12 flex flex-col justify-between">
      <div>
        {/* HEADER */}
        <header className="bg-slate-900 text-white px-4 py-4 shadow-md sticky top-0 z-30">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Logo" className="w-6 h-6 object-contain" />
              <div>
                <h1 className="text-base font-bold flex items-center gap-1.5">
                  <span>🛡️</span> Directory Moderation Portal
                </h1>
                <p className="text-[11px] text-slate-400">Manage, verify, and moderate local shop listings</p>
              </div>
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
            <div className="space-y-4">
              <div className="space-y-3">
                {currentBusinesses.map((biz) => (
                  <div
                    key={biz.id}
                    onClick={() => router.push(`/directory/${biz.state?.toLowerCase() || 'imo'}/${biz.town_slug || biz.town_id}`)}
                    className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3 hover:border-emerald-500 cursor-pointer transition"
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
                          onClick={(e) => updateBusiness(e, biz.id, { is_verified: !biz.is_verified })}
                          className={`text-[11px] font-semibold px-2.5 py-1 rounded border transition ${
                            biz.is_verified
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                              : 'bg-slate-50 border-slate-200 text-slate-500'
                          }`}
                        >
                          {biz.is_verified ? '✓ Verified' : '+ Verify'}
                        </button>

                        <button
                          onClick={(e) => updateBusiness(e, biz.id, { is_featured: !biz.is_featured })}
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
                            onClick={(e) => updateBusiness(e, biz.id, { status: 'active' })}
                            className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-1 rounded-lg"
                          >
                            Approve / Activate
                          </button>
                        )}
                        {biz.status !== 'suspended' && (
                          <button
                            onClick={(e) => updateBusiness(e, biz.id, { status: 'suspended' })}
                            className="text-xs bg-amber-500 hover:bg-amber-600 text-white font-semibold px-3 py-1 rounded-lg"
                          >
                            Suspend
                          </button>
                        )}
                      </div>

                      <button
                        onClick={(e) => deleteBusiness(e, biz.id)}
                        className="text-xs text-rose-600 hover:text-rose-800 font-semibold"
                      >
                        Delete Shop
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* PAGINATION CONTROLS */}
              {totalPages > 1 && (
                <div className="bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-slate-100 transition"
                  >
                    Previous
                  </button>
                  <span className="text-xs text-slate-600 font-medium">
                    Page <strong className="text-slate-900">{currentPage}</strong> of <strong className="text-slate-900">{totalPages}</strong> ({businesses.length} total shops)
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-slate-100 transition"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

    </div>
  );
}