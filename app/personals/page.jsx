export const dynamic = 'force-dynamic';

import { query } from '@/lib/db';
import Link from 'next/link';

async function getPersonals() {
  try {
    const res = await query(`SELECT * FROM public.personals WHERE status = 'active' ORDER BY created_at DESC`);
    return res.rows;
  } catch (err) {
    console.error('Error fetching personals:', err);
    return [];
  }
}

export default async function PersonalsPage() {
  const ads = await getPersonals();

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
                <span className="text-sm font-extrabold tracking-tight">
                  Community<span className="text-emerald-400">Shops</span>
                </span>
              </div>
            </div>
          </div>

          <div className="max-w-md mx-auto px-4 py-6 text-center space-y-3">
            <h1 className="text-lg font-black uppercase tracking-wider text-white">
              Personals & Matrimonials
            </h1>
            <p className="text-xs text-emerald-200 font-medium">
              Traditional village classifieds with strict dropdown verification.
            </p>
            <div className="pt-2">
              <Link
                href="/personals/register"
                className="inline-block bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition"
              >
                + Submit Personal Ad
              </Link>
            </div>
          </div>
        </header>

        <main className="max-w-md mx-auto px-4 pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-500 tracking-wider uppercase">
              CLASSIFIED ADVERTISEMENTS ({ads.length})
            </h2>
            <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Verified Dropdown 2.0
            </span>
          </div>

          <div className="space-y-3">
            {ads.length > 0 ? (
              ads.map((ad, idx) => (
                <div 
                  key={ad.id || idx} 
                  className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-3 hover:border-emerald-500 transition"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-900">
                      {ad.profile_type} <span className="text-slate-500 font-normal">(Age: {ad.age})</span>
                    </h3>
                    <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-md">
                      {ad.religion}
                    </span>
                  </div>

                  <p className="text-xs leading-relaxed text-slate-600 font-serif italic bg-slate-50 p-3 rounded-xl border border-slate-100">
                    &ldquo;{ad.formatted_ad || `${ad.body_build} build, ${ad.religion_practice} ${ad.religion}, enjoys ${ad.interests}. Seeking ${ad.seeking}.`}&rdquo;
                  </p>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-800 flex items-center gap-1">
                      <span>📞</span> {ad.contact_info}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-500">
                No classified ads published yet.
              </div>
            )}
          </div>
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