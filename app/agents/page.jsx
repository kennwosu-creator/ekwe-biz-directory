import Link from 'next/link';

export const metadata = {
  title: 'Field Agent Hub - CommunityShops',
  description: 'Field onboarding and commission management portal for CommunityShops agents.',
};

export default function AgentsHubPage() {
  return (
    <div className="bg-slate-100 min-h-screen text-slate-800 font-sans p-4 flex flex-col items-center justify-center pb-16">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-6">
        <div className="text-center space-y-1">
          <span className="text-3xl inline-block">📲</span>
          <h1 className="text-lg font-bold text-slate-900">Field Agent Hub</h1>
          <p className="text-xs text-slate-500">
            Field agent tools for onboarding shop owners and tracking commissions across communities.
          </p>
        </div>

        <div className="space-y-3">
          {/* AGENT ONBOARDING PORTAL */}
          <Link
            href="/agent/onboard"
            className="block bg-emerald-800 text-white rounded-2xl p-4 shadow-xs hover:bg-emerald-700 transition active:scale-[0.99]"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xs font-bold flex items-center gap-1.5">
                  <span>📲</span> Agent Field Onboarding Portal
                </h2>
                <p className="text-[11px] text-emerald-200 mt-0.5">
                  Register traders & collect ₦1,000 cash
                </p>
              </div>
              <span className="text-sm">→</span>
            </div>
          </Link>

          {/* AGENT DASHBOARD */}
          <Link
            href="/agent/dashboard"
            className="block bg-slate-900 text-white rounded-2xl p-4 shadow-xs hover:bg-slate-800 transition active:scale-[0.99]"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xs font-bold flex items-center gap-1.5">
                  <span>💼</span> Agent Earnings Dashboard
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Track total commissions (50% split) & wallet
                </p>
              </div>
              <span className="text-sm">→</span>
            </div>
          </Link>
        </div>

        <div className="pt-2 text-center border-t border-slate-100">
          <Link href="/" className="text-xs font-medium text-slate-400 hover:text-slate-600">
            ← Return to CommunityShops Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}