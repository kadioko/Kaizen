import React from 'react';
import { NavLink } from 'react-router-dom';
import { commanderViews, CommanderViewSlug } from '../navigation';

interface CommanderSubnavProps {
  activeView: CommanderViewSlug;
}

export function CommanderSubnav({ activeView }: CommanderSubnavProps) {
  return (
    <div className="overflow-auto">
      <div className="flex min-w-max gap-3">
        {commanderViews.map((view) => (
          <NavLink
            key={view.slug}
            to={view.slug === 'dashboard' ? '/orderflow-commander' : `/orderflow-commander/${view.slug}`}
            end={view.slug === 'dashboard'}
            className={`rounded-[1.2rem] border px-4 py-3 text-sm transition ${
              activeView === view.slug
                ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300'
                : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <p className="font-semibold">{view.label}</p>
            <p className="text-xs text-slate-400">{view.detail}</p>
          </NavLink>
        ))}
      </div>
    </div>
  );
}
