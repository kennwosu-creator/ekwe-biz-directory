'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleAdminLogin(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (data.success) {
        // Redirect to the merchants admin portal upon successful authentication
        router.push('/admin/businesses');
        router.refresh();
      } else {
        alert('Authentication failed: ' + (data.error || 'Invalid credentials'));
      }
    } catch (err) {
      alert('Login error: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-slate-100 min-h-screen text-slate-800 font-sans pb-24 flex flex-col justify-between">
      <div>
        <header className="bg-slate-900 text-white shadow-md">
          <div className="bg-slate-950 px-4 py-3 text-center border-b border-slate-800">
            <div className="max-w-md mx-auto flex items-center justify-between">
              <Link href="/" className="text-xs font-bold text-slate-300 hover:text-white transition flex items-center gap-1.5">
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
          <div className="max-w-md mx-auto px-4 py-6 text-center space-y-1">
            <h1 className="text-lg font-black uppercase tracking-wider">Admin Secure Access</h1>
            <p className="text-xs text-slate-400">Enter administrator credentials to manage platform records.</p>
          </div>
        </header>

        <main className="max-w-md mx-auto px-4 pt-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">Administrator Login</h3>
            
            <form onSubmit={handleAdminLogin} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Admin Username</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Password / Passcode</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 rounded-xl transition shadow-sm disabled:opacity-50 mt-2"
              >
                {loading ? 'Authenticating...' : 'Sign In to Admin Portal'}
              </button>
            </form>
          </div>
        </main>
      </div>


    </div>
  );
}