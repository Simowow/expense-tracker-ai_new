import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navigation from '@/components/Navigation';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ExpenseTrack — Personal Finance Tracker',
  description: 'Track your personal expenses with charts and analytics.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50 text-slate-900 antialiased`}>
        <Navigation />
        {/* lg:pl-60 = sidebar width; pb-20 = bottom nav height on mobile */}
        <div className="lg:pl-60 pb-20 lg:pb-0 min-h-screen">
          <main className="max-w-screen-xl mx-auto">{children}</main>
        </div>
      </body>
    </html>
  );
}
