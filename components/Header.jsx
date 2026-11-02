import Link from 'next/link';

export default function Header({ subtitle = 'Local Village & Market Directory' }) {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-xs">
      <Link href="/" className="flex items-center gap-2 group hover:opacity-80 transition">
        <span className="text-xl">🏪</span>
        <div>
          <h1 className="text-sm font-extrabold text-slate-900 leading-none group-hover:text-emerald-600 transition">
            Community<span className="text-emerald-600">Shops</span>
          </h1>
          <p className="text-[10px] text-slate-500 font-medium mt-0.5">
            {subtitle}
          </p>
        </div>
      </Link>

      <Link
        href="/join"
        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-xs transition"
      >
        + Add Shop
      </Link>
    </header>
  );
}