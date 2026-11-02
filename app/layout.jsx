import './globals.css';

export const metadata = {
  title: {
    default: 'CommunityShops - Local Village & Market Directory across Nigeria',
    template: '%s | CommunityShops',
  },
  description:
    'Find verified local village shops, traders, and services across Imo State and Nigeria. Connecting local communities and markets directly to nearby buyers.',
  keywords: [
    'CommunityShops',
    'Local Village Directory',
    'Imo State Markets',
    'Ekwe Business Directory',
    'Owerri Local Shops',
    'Nigeria Rural Commerce',
  ],
  openGraph: {
    title: 'CommunityShops - Local Village & Market Directory',
    description:
      'Find verified local village shops, merchants, and services in your community.',
    siteName: 'CommunityShops',
    locale: 'en_NG',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-slate-100 text-slate-800 antialiased min-h-screen font-sans">
        {children}
      </body>
    </html>
  );
}