'use client';

import { useState } from 'react';
import Link from 'next/link';
import AdSenseBanner from '@/components/AdSenseBanner';
import AdvancedSearch from '@/components/AdvancedSearch';
import SafeImage from '@/components/SafeImage';
import WhatsAppButton from '@/components/WhatsAppButton';

export default function DirectoryClientView({ town, businesses, categories, allTowns }) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const totalPages = Math.ceil(businesses.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentBusinesses = businesses.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="bg-slate-100 min-h-screen text-slate-800 font-sans pb-16 flex flex-col justify-between">
      <div>
        {/* HEADER BAR */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-xs">
          <Link href="/" className="flex items-center gap-2 group hover:opacity-80 transition">
            <img src="/logo.png" alt="Logo" className="w-5 h-5 object-contain" />
            <div>
              <h1 className="text-sm font-bold text-slate-900 leading-none group-hover:text-emerald-600 transition">
                {town.name} Directory
              </h1>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                ← Home / {town.lga} LGA, {town.state}
              </p>
            </div>
          </Link>

          <Link
            href="/register"
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-xs transition"
          >
            + Add Shop
          </Link>
        </header>

        <main className="max-w-md mx-auto px-4 pt-4 space-y-4">
          <AdvancedSearch
            towns={allTowns}
            categories={categories}
            initialParams={{ town: town.slug }}
          />

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <span className="bg-slate-900 text-white text-[11px] font-medium px-3 py-1.5 rounded-lg whitespace-nowrap shadow-2xs">
              All Listings ({businesses.length})
            </span>
            {categories.map((cat) => (
              <span
                key={cat.name}
                className="bg-white border border-slate-200 text-slate-600 text-[11px] font-medium px-3 py-1.5 rounded-lg whitespace-nowrap shadow-2xs hover:bg-slate-50 cursor-pointer"
              >
                {cat.name}
              </span>
            ))}
          </div>

          <div className="space-y-3">
            {currentBusinesses.length > 0 ? (
              currentBusinesses.map((biz, index) => (
                <div key={biz.id}>
                  <Link
                    href={`/biz/${biz.slug}`}
                    className="block bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-xs hover:border-emerald-300 active:bg-slate-50 active:scale-[0.98] transition-all duration-150"
                  >
                    <div className="flex gap-3">
                      <SafeImage
                        src={biz.image_url}
                        alt={biz.name}
                        className="h-20 w-20 rounded-xl shrink-0 border border-slate-100"
                        fill
                      />

                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h2 className="text-xs font-bold text-slate-900 truncate">{biz.name}</h2>
                            {biz.is_verified && (
                              <span
                                className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.2 rounded-full shrink-0"
                                title="Verified Business"
                              >
                                ✓
                              </span>
                            )}
                          </div>

                          <p className="text-[11px] text-slate-500 truncate mt-0.5">📍 {biz.address}</p>

                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {biz.products_sample?.slice(0, 3).map((item, idx) => (
                              <span
                                key={idx}
                                className="bg-slate-100 text-slate-700 text-[9px] font-medium px-2 py-0.5 rounded-md"
                              >
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>

                        <WhatsAppButton
                          whatsappNumber={biz.whatsapp_number}
                          businessName={biz.name}
                        />
                      </div>
                    </div>
                  </Link>

                  {/* AdSense banner inserted every 3 listings */}
                  {(index + 1) % 3 === 0 && (
                    <AdSenseBanner slot="DIR_INLINE_DISPLAY_SLOT" />
                  )}
                </div>
              ))
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center space-y-2 shadow-xs">
                <span className="text-3xl">🏪</span>
                <h3 className="text-sm font-bold text-slate-800">No businesses listed in {town.name} yet</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Be the first shop owner in {town.name} to get a free business webpage!
                </p>
                <div className="pt-2">
                  <Link
                    href="/register"
                    className="inline-block bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs"
                  >
                    Register Shop via WhatsApp
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* PAGINATION CONTROLS (6 per page) */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between mt-6">
              <button
                onClick={() => {
                  setCurrentPage((p) => Math.max(p - 1, 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                disabled={currentPage === 1}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-slate-100 transition"
              >
                Previous
              </button>
              <span className="text-xs text-slate-600 font-medium">
                Page <strong className="text-slate-900">{currentPage}</strong> of <strong className="text-slate-900">{totalPages}</strong> ({businesses.length} shops)
              </span>
              <button
                onClick={() => {
                  setCurrentPage((p) => Math.min(p + 1, totalPages));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                disabled={currentPage === totalPages}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-slate-100 transition"
              >
                Next
              </button>
            </div>
          )}
        </main>
      </div>


    </div>
  );
}