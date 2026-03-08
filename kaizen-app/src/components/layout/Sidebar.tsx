import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, CandlestickChart, BookOpen, Bell,
  Brain, GraduationCap, Shield, CreditCard, Moon, Sun, TrendingUp
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

export default function Sidebar() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <aside className={`w-64 h-screen fixed left-0 top-0 flex flex-col border-r ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
      <div className="p-6 border-b border-inherit">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight">
          <span className="text-navy-800 dark:text-white">KAI</span>
          <span className="text-gold-400">ZEN</span>
        </h1>
        <p className={`text-xs mt-1 tracking-widest uppercase ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          Master Your Edge
        </p>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? `${isDark ? 'bg-navy-900/50 text-gold-400 border-r-2 border-gold-400' : 'bg-navy-50 text-navy-800 border-r-2 border-navy-800'}`
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
