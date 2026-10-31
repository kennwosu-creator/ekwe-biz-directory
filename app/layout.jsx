import './globals.css';

export const metadata = {
  title: 'Ekwe Biz Directory - Local Shops & Services in Imo State',
  description: 'Find verified local shops, traders, and services across Ekwe and Isu LGA, Imo State.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-slate-100 text-slate-800 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}