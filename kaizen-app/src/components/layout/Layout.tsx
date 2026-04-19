import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Bell, Menu, Search, Sparkles } from 'lucide-react';
import Sidebar from './Sidebar';
import { useTheme } from '../../context/ThemeContext';

const pageDetails: Record<string, { title: string; description: string }> = {
  '/': {
    title: 'Trading Command Center',
    description: 'Monitor performance, protect risk, and stay in sync with the market pulse.',
  },
  '/trade': {
    title: 'Paper Trading Desk',
    description: 'Practice execution with clear sizing, context, and decision feedback loops.',
  },
  '/charts': {
    title: 'Chart Lab',
    description: 'Study price structure, compare markets, and sharpen your timing.',
  },
  '/journal': {
    title: 'Trading Journal',
    description: 'Capture what you saw, what you felt, and what the setup taught you.',
  },
  '/risk': {
    title: 'Risk Score',
    description: 'Spot concentration issues early and keep downside under control.',
  },
  '/alerts': {
    title: 'Alerts',
    description: 'Stay proactive on price, momentum, and trigger levels that matter.',
  },
  '/coach': {
    title: 'AI Coach',
    description: 'Turn your recent behavior into concrete coaching and better routines.',
  },
  '/learn': {
    title: 'Learning Hub',
    description: 'Build skill deliberately with lessons connected to live market habits.',
  },
  '/pricing': {
    title: 'Plans',
    description: 'See how Kaizen scales from disciplined practice to full coaching support.',
  },
};

export default function Layout() {
  const { isDark } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const pageMeta = pageDetails[location.pathname] ?? pageDetails['/'];

  useEffect(() => {
    const body = document.body;
    body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
    return () => {
      body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  return (
    <div className={isDark ? 'dark' : ''}>
      <div className={`app-shell flex min-h-screen overflow-hidden ${isDark ? 'bg-gray-950 text-gray-100' : 'bg-offwhite text-gray-900'}`}>
        <div className="hidden lg:block lg:h-screen lg:shrink-0">
          <Sidebar />
        </div>

        <div className={`fixed inset-0 z-40 lg:hidden ${isMobileMenuOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
          <div
            className={`absolute inset-0 transition-opacity duration-300 ${isMobileMenuOpen ? 'bg-black/50 opacity-100' : 'opacity-0'}`}
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className={`absolute left-0 top-0 h-full transform transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <Sidebar isMobileOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
          </div>
        </div>

        <main className={`relative flex min-h-screen flex-1 flex-col overflow-y-auto overflow-x-hidden ${isDark ? 'bg-transparent text-gray-100' : 'bg-transparent text-gray-900'}`}>
          <div className={`sticky top-0 z-30 flex items-center justify-between border-b px-4 py-3 backdrop-blur lg:hidden ${isDark ? 'border-gray-800 bg-gray-950/85' : 'border-white/60 bg-white/80'}`}>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className={`rounded-lg p-2 transition-colors ${isDark ? 'text-gray-300 hover:bg-gray-800 hover:text-white' : 'text-gray-700 hover:bg-white hover:text-navy-800'}`}
              aria-label="Open navigation menu"
            >
              <Menu size={20} />
            </button>
            <h1 className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight">
              <span className="text-navy-800 dark:text-white">KAI</span>
              <span className="text-gold-400">ZEN</span>
            </h1>
            <div className="w-10" />
          </div>

          <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-4 sm:px-6 sm:py-6 lg:p-8">
            <header className={`glass-panel mb-6 hidden items-center justify-between rounded-[1.75rem] px-6 py-5 lg:flex ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
              <div className="max-w-2xl">
                <div className={`mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] ${isDark ? 'bg-white/5 text-gold-300' : 'bg-navy-50 text-navy-700'}`}>
                  <Sparkles size={14} />
                  Kaizen Workspace
                </div>
                <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
                  {pageMeta.title}
                </h1>
                <p className={`mt-2 text-sm leading-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {pageMeta.description}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm ${isDark ? 'border-white/10 bg-white/5 text-gray-300' : 'border-slate-200 bg-white/75 text-slate-600'}`}>
                  <Search size={16} />
                  Search setups
                </div>
                <div className={`flex h-11 w-11 items-center justify-center rounded-full border ${isDark ? 'border-white/10 bg-white/5 text-gray-300' : 'border-slate-200 bg-white/75 text-slate-600'}`}>
                  <Bell size={16} />
                </div>
              </div>
            </header>

            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
