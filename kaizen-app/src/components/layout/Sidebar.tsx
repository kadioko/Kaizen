import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, CandlestickChart, BookOpen, Bell,
  Brain, GraduationCap, Shield, CreditCard, Moon, Sun, TrendingUp, X
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/trade', icon: CandlestickChart, label: 'Paper Trade' },
  { to: '/charts', icon: TrendingUp, label: 'Charts' },
  { to: '/journal', icon: BookOpen, label: 'Journal' },
  { to: '/risk', icon: Shield, label: 'Risk Score' },
  { to: '/alerts', icon: Bell, label: 'Alerts' },
  { to: '/coach', icon: Brain, label: 'AI Coach' },
  { to: '/learn', icon: GraduationCap, label: 'Learn' },
  { to: '/pricing', icon: CreditCard, label: 'Pricing' },
];

interface SidebarProps {
  isMobileOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isMobileOpen = false, onClose }: SidebarProps) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <aside className={`flex h-full w-72 max-w-[85vw] flex-col border-r ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
      <div className="flex items-start justify-between p-5 sm:p-6 border-b border-inherit">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight">
            <span className="text-navy-800 dark:text-white">KAI</span>
            <span className="text-gold-400">ZEN</span>
          </h1>
          <p className={`text-xs mt-1 tracking-widest uppercase ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            Master Your Edge
          </p>
        </div>
        <button
          onClick={onClose}
          className={`rounded-lg p-2 transition-colors lg:hidden ${isDark ? 'text-gray-400 hover:bg-gray-800 hover:text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-navy-800'}`}
          aria-label="Close navigation menu"
          type="button"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={isMobileOpen ? onClose : undefined}
            className={({ isActive }) =>
              `mx-3 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? `${isDark ? 'bg-navy-900/50 text-gold-400' : 'bg-navy-50 text-navy-800'}`
                  : `${isDark ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-600 hover:text-navy-800 hover:bg-gray-50'}`
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className={`p-4 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
        <button
          onClick={toggleTheme}
          className={`flex items-center gap-2 w-full px-4 py-2 rounded-lg text-sm transition-colors ${
            isDark ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-600 hover:text-navy-800 hover:bg-gray-100'
          }`}
          type="button"
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
          {isDark ? 'Light Mode' : 'Dark Mode'}
        </button>

        <div className={`mt-3 px-4 py-3 rounded-lg text-xs ${isDark ? 'bg-gray-800 text-gray-500' : 'bg-amber-50 text-amber-700'}`}>
          Paper Trading Mode
          <br />
          <span className="font-medium">No real money at risk</span>
        </div>
      </div>
    </aside>
  );
}
