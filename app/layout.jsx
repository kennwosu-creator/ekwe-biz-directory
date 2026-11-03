import './globals.css';
import InstallPrompt from '@/components/InstallPrompt';

// Next.js 14/15 Viewport export for theme and screen configuration
export const viewport = {
  themeColor: '#064e3b',
};

// Next.js Metadata export for SEO and OpenGraph properties
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
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'CommunityShops',
  },
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
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="bg-slate-100 text-slate-800 antialiased min-h-screen font-sans">
        {children}
        <InstallPrompt />
      </body>
    </html>
  );
}