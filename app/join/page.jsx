import Link from 'next/link';

export const metadata = {
  title: 'Join CommunityShops | Register Your Business',
  description: 'Add your business to CommunityShops directory in under 2 minutes.',
};

export default function JoinPage() {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans text-slate-800">
      <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-sm space-y-6 border border-slate-200">
        <div className="text-center space-y-2">
          <div className="text-4xl">🏪</div>
          <h1 className="text-xl font-bold text-slate-900">List Your Shop on CommunityShops</h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            Reach thousands of local customers across your community. Get listed in under 2 minutes completely free.
          </p>
        </div>

        <div className="space-y-3 pt-2">
          {/* Direct Web Form Button */}
          <Link
            href="/register"
            className="block w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-3.5 rounded-xl text-center transition shadow-xs"
          >
            📝 Fill Online Registration Form
          </Link>

          {/* Optional Direct Contact Button */}
          <a
            href="https://wa.me/14165261826?text=Hello%20Admin,%20I%20would%20like%20assistance%20registering%20my%20shop%20on%20CommunityShops."
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-3 rounded-xl text-center transition"
          >
            💬 Contact Admin on WhatsApp
          </a>
        </div>

        <div className="text-center pt-2">
          <Link href="/" className="text-xs font-semibold text-slate-500 hover:text-emerald-600">
            ← Back to Directory Home
          </Link>
        </div>
      </div>
    </div>
  );
}