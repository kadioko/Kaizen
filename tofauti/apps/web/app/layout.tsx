import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ServiceWorkerRegister } from '@/components/service-worker-register';
import { MarketWorkspaceProvider } from '@/components/use-market-snapshot';

export const metadata: Metadata = {
  title: 'TOFAUTI | Market Intelligence',
  description: 'An explainable GC/MGC simulation workspace with separate provider-reported spot-market references.',
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = { themeColor: '#100d18', colorScheme: 'dark' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><ServiceWorkerRegister /><MarketWorkspaceProvider>{children}</MarketWorkspaceProvider></body></html>;
}
