import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="bg-slate-100 min-h-screen text-slate-800 font-sans pb-16">
      {/* HERO HEADER */}
      <header className="bg-emerald-800 text-white px-4 py-8 text-center space-y-3 shadow-md">
        <span className="text-4xl">🏪</span>
        <h1 className="text-xl font-extrabold tracking-tight">Ekwe Local Business Directory</h1>
        <p className="text-xs text-emerald-100 max-w-xs mx-auto">
          Find verified shops, markets, and services across Ekwe & Imo State. Contact traders directly on WhatsApp.
        </p>

        {/* SEARCH BAR */}
        <div className="pt-2 max-w-md mx-auto">
          <form action="/search" method="GET" className="relative">
            <input
              type="text"
              name="q"
              placeholder="Search rice, beer, garri, mechanics..."
              className="w-full bg-white text-slate-800 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 shadow-sm"
            />
            <span className="absolute left-3.5 top-3.5 text-slate-400 text-xs">🔍</span>
          </form>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-6 space-y-6">
        {/* REGIONAL DIRECTORIES */}
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Explore Towns</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/directory/imo/ekwe"
              className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-emerald-400 transition"
            >
              <span className="text-xl">📍</span>
              <h3 className="text-sm font-bold text-slate-900 mt-1">Ekwe Directory</h3>
              <p className="text-[11px] text-slate-500">Isu LGA, Imo State</p>
            </Link>

            <Link
              href="/directory/imo/owerri"
              className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-emerald-400 transition"
            >
              <span className="text-xl">🏙️</span>
              <h3 className="text-sm font-bold text-slate-900 mt-1">Owerri Directory</h3>
              <p className="text-[11px] text-slate-500">Municipal, Imo State</p>
            </Link>
          </div>
        </section>

        {/* PORTAL ACCESS CARDS */}
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Portals & Tools</h2>

          <div className="space-y-2.5">
            <Link
              href="/agent/onboard"
              className="flex items-center justify-between bg-emerald-700 text-white p-4 rounded-2xl shadow-sm hover:bg-emerald-800 transition"
            >
              <div>
                <h3 className="text-xs font-bold">📲 Agent Field Onboarding Portal</h3>
                <p className="text-[11px] text-emerald-100">Register traders & collect ₦1,000 cash</p>
              </div>
              <span className="text-sm font-bold">→</span>
            </Link>

            <Link
              href="/agent/dashboard"
              className="flex items-center justify-between bg-slate-900 text-white p-4 rounded-2xl shadow-sm hover:bg-slate-800 transition"
            >
              <div>
                <h3 className="text-xs font-bold">💼 Agent Earnings Dashboard</h3>
                <p className="text-[11px] text-slate-300">Track total commissions (50% split) & wallet</p>
              </div>
              <span className="text-sm font-bold">→</span>
            </Link>

            <Link
              href="/manage"
              className="flex items-center justify-between bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs hover:border-emerald-300 transition"
            >
              <div>
                <h3 className="text-xs font-bold text-slate-900">🔑 Shop Owner Web Portal</h3>
                <p className="text-[11px] text-slate-500">Edit shop profile & inventory with 4-digit PIN</p>
              </div>
              <span className="text-sm font-bold text-slate-400">→</span>
            </Link>

            <Link
              href="/admin/businesses"
              className="flex items-center justify-between bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs hover:border-emerald-300 transition"
            >
              <div>
                <h3 className="text-xs font-bold text-slate-900">🛡️ Admin Moderation Portal</h3>
                <p className="text-[11px] text-slate-500">Approve, verify, feature, or suspend shops</p>
              </div>
              <span className="text-sm font-bold text-slate-400">→</span>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}