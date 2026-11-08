import { cookies } from 'next/headers';
import Link from 'next/link';

export default async function Footer() {
  const cookieStore = await cookies();
  const isAdmin = cookieStore.has('admin_session');

  return (
    <footer className="mt-16 border-t border-slate-200 bg-white py-6 px-4 text-center text-xs text-slate-500 space-y-3">
      <p>© {new Date().getFullYear()} CommunityShops. Connecting local village trade.</p>
      
      <div className="flex flex-wrap justify-center gap-4 text-[11px] font-semibold text-slate-600">
        <Link href="/agents/portal" className="hover:text-emerald-600 transition">🎯 Field Agent Portal</Link>
        <span>•</span>
        <Link href="/personals" className="hover:text-emerald-600 transition">📜 Personals</Link>

        {/* ADMIN-ONLY LINKS: Hidden from public, visible only when logged in */}
        {isAdmin && (
          <>
            <span>•</span>
            <Link href="/admin/businesses" className="hover:text-emerald-600 transition">🛡️ Merchants Admin</Link>
            <span>•</span>
            <Link href="/admin/agents" className="hover:text-emerald-600 transition">🎯 Agents Admin</Link>
            <span>•</span>
            <Link href="/admin/events" className="hover:text-emerald-600 transition">🎉 Events Admin</Link>
          </>
        )}
      </div>
    </footer>
  );
}