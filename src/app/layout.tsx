import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { Navbar } from '@/components/layout/Navbar';
import { EmailAccessModal } from '@/components/auth/EmailAccessModal';

export const metadata: Metadata = {
  title: 'Creative Ops Pipeline — Meta Paid Social',
  description: 'Internal operations pipeline replacing spreadsheet for paid social creative requests, production, and campaign launching.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-50 text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-50 font-sans selection:bg-blue-500 selection:text-white">
        <AuthProvider>
          <ToastProvider>
            <div className="flex min-h-screen flex-col w-full max-w-full min-w-0 overflow-x-hidden">
              <Navbar />
              <EmailAccessModal />
              <main className="flex-1 w-full max-w-full min-w-0 pb-16 lg:pb-0">{children}</main>
            </div>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
