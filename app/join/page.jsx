import Link from 'next/link';

export const metadata = {
  title: 'Register Your Shop - Ekwe Business Directory',
  description: 'Add your business to the digital directory in less than 2 minutes.',
};

export default function JoinPage() {
  const whatsappNumber = '2348030000000'; // Replace with your official WhatsApp onboarding line
  const whatsappMessage = encodeURIComponent(
    'Hello! I would like to register my business on the Ekwe Business Directory.'
  );

  return (
    <div className="bg-slate-100 min-h-screen text-slate-800 font-sans p-4 flex flex-col items-center justify-center">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center space-y-4 max-w-sm shadow-sm">
        <span className="text-4xl">🏪</span>
        <h1 className="text-lg font-bold text-slate-900">Register Your Business</h1>
        <p className="text-xs text-slate-600 leading-relaxed">
          Get a free digital webpage for your shop and reach customers across your town instantly!
        </p>

        <div className="pt-2 space-y-2">
          <a
            href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-3 px-4 rounded-xl shadow-sm transition"
          >
            Register via WhatsApp
          </a>

          <Link
            href="/agent/onboard"
            className="block w-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold py-2.5 px-4 rounded-xl transition"
          >
            Use Agent Assisted Portal
          </Link>
        </div>

        <div className="pt-2">
          <Link href="/" className="text-xs text-slate-400 hover:text-slate-600">
            ← Return to Directory
          </Link>
        </div>
      </div>
    </div>
  );
}