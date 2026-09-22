import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ServiceWorkerRegister } from '@/components/service-worker-register';

export const metadata: Metadata = {
  title: 'TOFAUTI | Market Intelligence',
  description: 'An explainable live spot-market price-action workspace with explicit data boundaries.',
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = { themeColor: '#100d18', colorScheme: 'dark' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><ServiceWorkerRegister />{children}</body></html>;
}
