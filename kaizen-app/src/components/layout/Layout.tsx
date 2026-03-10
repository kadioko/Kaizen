import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import { useTheme } from '../../context/ThemeContext';

export default function Layout() {
  const { isDark } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const body = document.body;
    body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
    return () => {
      body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  return (
    <div className={`${isDark ? 'dark' : ''}`}>
      <div className={`flex min-h-screen overflow-hidden ${isDark ? 'bg-gray-950 text-gray-100' : 'bg-offwhite text-gray-900'}`}>
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

        <main className={`flex min-h-screen flex-1 flex-col overflow-y-auto overflow-x-hidden ${isDark ? 'bg-gray-950 text-gray-100' : 'bg-offwhite text-gray-900'}`}>
          <div className={`sticky top-0 z-30 flex items-center justify-between border-b px-4 py-3 backdrop-blur lg:hidden ${isDark ? 'border-gray-800 bg-gray-950/90' : 'border-gray-200 bg-offwhite/90'}`}>
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

          <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
