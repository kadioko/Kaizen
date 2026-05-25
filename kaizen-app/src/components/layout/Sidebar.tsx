import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Bell,
  BookOpen,
  Brain,
  CandlestickChart,
  CreditCard,
  GraduationCap,
  LayoutDashboard,
  Moon,
  Shield,
  Sparkles,
  Sun,
  TrendingUp,
  Waves,
  X,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { commanderViews } from '../../orderflow/navigation';

const workspaceItems = [
  { to: '/', icon: LayoutDashboard, label: 'Kaizen', detail: 'Multi-market training OS' },
  { to: '/orderflow-commander', icon: Waves, label: 'OrderFlow Commander', detail: 'Forex majors and XAUUSD flow' },
];

const kaizenNavItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', detail: 'Performance and market pulse' },
  { to: '/trade', icon: CandlestickChart, label: 'Paper Trade', detail: 'Execution simulator' },
  { to: '/charts', icon: TrendingUp, label: 'Charts', detail: 'Analysis and structure' },
  { to: '/journal', icon: BookOpen, label: 'Journal', detail: 'Review and reflection' },
  { to: '/risk', icon: Shield, label: 'Risk Score', detail: 'Exposure and discipline' },
  { to: '/alerts', icon: Bell, label: 'Alerts', detail: 'Triggers and monitoring' },
  { to: '/coach', icon: Brain, label: 'AI Coach', detail: 'Habits and feedback' },
  { to: '/learn', icon: GraduationCap, label: 'Learn', detail: 'Skill-building library' },
  { to: '/pricing', icon: CreditCard, label: 'Pricing', detail: 'Plan and upgrades' },
];

interface SidebarProps {
  isMobileOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isMobileOpen = false, onClose }: SidebarProps) {
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const isCommander = location.pathname.startsWith('/orderflow-commander');

  return (
    <aside className={`flex h-full w-80 max-w-[88vw] flex-col border-r ${isDark ? 'border-white/10 bg-slate-950/90' : 'border-white/60 bg-white/80'} backdrop-blur-2xl`}>
      <div className="border-b border-inherit p-5 sm:p-6">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
              <span className="text-navy-800 dark:text-white">KAI</span>
              <span className="text-gold-400">ZEN</span>
            </h1>
            <p className={`mt-1 text-xs uppercase tracking-[0.28em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Build Better Decisions
            </p>
          </div>
          <button
            onClick={onClose}
            className={`rounded-full p-2 transition-colors lg:hidden ${isDark ? 'text-gray-400 hover:bg-gray-800 hover:text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-navy-800'}`}
            aria-label="Close navigation menu"
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        <div className={`rounded-[1.5rem] border p-4 ${isDark ? 'border-white/10 bg-gradient-to-br from-navy-950 via-slate-900 to-slate-950' : 'border-slate-200 bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700 text-white'} shadow-[0_22px_60px_-35px_rgba(15,58,107,0.9)]`}>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-gold-300">
            <Sparkles size={12} />
            {isCommander ? 'Commander Workspace' : 'Kaizen Workspace'}
          </div>
          <p className="text-lg font-semibold leading-tight">
            {isCommander
              ? 'Turn order-flow context into structured forex and gold execution plans.'
              : 'Build calmer execution, cleaner reviews, and repeatable growth.'}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl bg-white/10 px-3 py-3">
              <p className="text-xs uppercase tracking-[0.22em] text-white/60">Focus</p>
              <p className="mt-1 font-semibold">{isCommander ? 'FX + XAUUSD' : 'Risk first'}</p>
            </div>
            <div className="rounded-2xl bg-white/10 px-3 py-3">
              <p className="text-xs uppercase tracking-[0.22em] text-white/60">Mode</p>
              <p className="mt-1 font-semibold">{isCommander ? 'MVP blueprint' : 'Paper only'}</p>
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <p className={`mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.28em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          Platforms
        </p>
        <div className="space-y-2">
          {workspaceItems.map(({ to, icon: Icon, label, detail }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={isMobileOpen ? onClose : undefined}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-[1.25rem] px-3 py-3 transition-all duration-200 ${
                  isActive
                    ? isDark
                      ? 'bg-white/8 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                      : 'bg-white text-navy-900 shadow-[0_18px_40px_-28px_rgba(15,58,107,0.75)]'
                    : isDark
                      ? 'text-slate-400 hover:bg-white/5 hover:text-white'
                      : 'text-slate-600 hover:bg-white/70 hover:text-navy-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`flex h-11 w-11 items-center justify-center rounded-2xl transition-colors ${
                    isActive
                      ? isDark
                        ? 'bg-gold-400/15 text-gold-300'
                        : 'bg-navy-50 text-navy-800'
                      : isDark
                        ? 'bg-white/5 text-slate-400 group-hover:text-white'
                        : 'bg-slate-100 text-slate-500 group-hover:text-navy-800'
                  }`}>
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{label}</p>
                    <p className={`truncate text-xs ${isActive ? (isDark ? 'text-slate-400' : 'text-slate-500') : 'text-slate-400 dark:text-slate-500'}`}>
                      {detail}
                    </p>
                  </div>
                </>
              )}
            </NavLink>
          ))}
        </div>

        {!isCommander && (
          <>
            <p className={`mb-3 mt-6 px-3 text-[11px] font-semibold uppercase tracking-[0.28em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Kaizen Tools
            </p>
            <div className="space-y-2">
              {kaizenNavItems.map(({ to, icon: Icon, label, detail }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  onClick={isMobileOpen ? onClose : undefined}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 rounded-[1.25rem] px-3 py-3 transition-all duration-200 ${
                      isActive
                        ? isDark
                          ? 'bg-white/8 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                          : 'bg-white text-navy-900 shadow-[0_18px_40px_-28px_rgba(15,58,107,0.75)]'
                        : isDark
                          ? 'text-slate-400 hover:bg-white/5 hover:text-white'
                          : 'text-slate-600 hover:bg-white/70 hover:text-navy-900'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl transition-colors ${
                        isActive
                          ? isDark
                            ? 'bg-gold-400/15 text-gold-300'
                            : 'bg-navy-50 text-navy-800'
                          : isDark
                            ? 'bg-white/5 text-slate-400 group-hover:text-white'
                            : 'bg-slate-100 text-slate-500 group-hover:text-navy-800'
                      }`}>
                        <Icon size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{label}</p>
                        <p className={`truncate text-xs ${isActive ? (isDark ? 'text-slate-400' : 'text-slate-500') : 'text-slate-400 dark:text-slate-500'}`}>
                          {detail}
                        </p>
                      </div>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </>
        )}

        {isCommander && (
          <>
            <p className={`mb-3 mt-6 px-3 text-[11px] font-semibold uppercase tracking-[0.28em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Commander Views
            </p>
            <div className="space-y-2">
              {commanderViews.map(({ slug, label, detail }) => {
                const to = slug === 'dashboard' ? '/orderflow-commander' : `/orderflow-commander/${slug}`;
                return (
                  <NavLink
                    key={slug}
                    to={to}
                    end={slug === 'dashboard'}
                    onClick={isMobileOpen ? onClose : undefined}
                    className={({ isActive }) =>
                      `group flex items-center gap-3 rounded-[1.25rem] px-3 py-3 transition-all duration-200 ${
                        isActive
                          ? isDark
                            ? 'bg-white/8 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                            : 'bg-white text-navy-900 shadow-[0_18px_40px_-28px_rgba(15,58,107,0.75)]'
                          : isDark
                            ? 'text-slate-400 hover:bg-white/5 hover:text-white'
                            : 'text-slate-600 hover:bg-white/70 hover:text-navy-900'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl transition-colors ${
                          isActive
                            ? isDark
                              ? 'bg-gold-400/15 text-gold-300'
                              : 'bg-navy-50 text-navy-800'
                            : isDark
                              ? 'bg-white/5 text-slate-400 group-hover:text-white'
                              : 'bg-slate-100 text-slate-500 group-hover:text-navy-800'
                        }`}>
                          <Waves size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{label}</p>
                          <p className={`truncate text-xs ${isActive ? (isDark ? 'text-slate-400' : 'text-slate-500') : 'text-slate-400 dark:text-slate-500'}`}>
                            {detail}
                          </p>
                        </div>
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </>
        )}
      </nav>

      <div className="border-t border-inherit p-4">
        <button
          onClick={toggleTheme}
          className={`flex w-full items-center justify-between rounded-[1.2rem] px-4 py-3 text-sm font-medium transition-colors ${
            isDark ? 'bg-white/5 text-gray-200 hover:bg-white/10' : 'bg-slate-100 text-slate-700 hover:bg-white'
          }`}
          type="button"
        >
          <span className="flex items-center gap-2">
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
            {isDark ? 'Light Mode' : 'Dark Mode'}
          </span>
          <span className={`rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.24em] ${isDark ? 'bg-white/10 text-slate-300' : 'bg-white text-slate-500'}`}>
            Theme
          </span>
        </button>

        <div className={`mt-3 rounded-[1.4rem] border px-4 py-4 text-sm ${isDark ? 'border-white/10 bg-white/5 text-slate-300' : 'border-slate-200 bg-white/75 text-slate-600'}`}>
          <p className="font-semibold text-inherit">{isCommander ? 'Manual MVP Scope' : 'Paper Trading Mode'}</p>
          <p className={`mt-1 text-xs leading-5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {isCommander
              ? 'Documenting the futures execution assistant architecture before live broker or feed integration.'
              : 'Practice execution and review process quality before you scale real capital.'}
          </p>
        </div>
      </div>
    </aside>
  );
}
