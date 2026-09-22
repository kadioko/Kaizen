'use client';

import { Check, Clock3, LocateFixed, Save } from 'lucide-react';
import { useMemo, useState } from 'react';
import { formatTimeInZone, supportedTimeZones, useUserTimezone } from './use-user-timezone';

export function TimezoneSettings() {
  const { timeZone, deviceZone, updateTimeZone, isValidTimeZone } = useUserTimezone();
  const [draft, setDraft] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const options = useMemo(() => supportedTimeZones(timeZone, deviceZone), [timeZone, deviceZone]);
  const draftValue = draft ?? timeZone;

  const save = () => {
    if (!updateTimeZone(draftValue.trim())) {
      setMessage('Enter a valid IANA time zone, for example Africa/Nairobi or America/New_York.');
      return;
    }
    setDraft(null);
    setMessage('Timezone saved for this browser.');
  };

  const useDeviceTimeZone = () => {
    setDraft(null);
    updateTimeZone(deviceZone);
    setMessage('Using this device timezone.');
  };

  const validDraft = isValidTimeZone(draftValue.trim());
  return <section className="panel rounded-3xl border-violet-300/20 p-6"><div className="flex items-start justify-between gap-4"><div><div className="flex items-center gap-2 text-violet-200"><Clock3 size={18} /><p className="text-[10px] font-black uppercase tracking-[.18em]">Display timezone</p></div><p className="mt-3 text-lg font-black text-white">Show market times in your timezone</p></div><span className="rounded-full border border-violet-300/25 bg-violet-300/10 px-2.5 py-1 text-[9px] font-black tracking-[.12em] text-violet-100">LOCAL PREFERENCE</span></div>
    <p className="mt-3 text-sm leading-6 text-zinc-400">Charts, source bars, the War Room timeline, and the Global Session Clock use this display setting. Provider timestamps remain preserved in the data pipeline.</p>
    <label className="mt-5 block text-[10px] font-black uppercase tracking-[.14em] text-zinc-500">IANA timezone<input value={draftValue} onChange={(event) => { setDraft(event.target.value); setMessage(''); }} list="tofauti-time-zone-options" className={`mt-2 w-full rounded-xl border bg-black/20 px-3 py-3 font-mono text-sm text-white outline-none transition ${validDraft ? 'border-white/10 focus:border-violet-300/50' : 'border-rose-300/50 focus:border-rose-300'}`} aria-describedby="timezone-help" /></label>
    <datalist id="tofauti-time-zone-options">{options.map((option) => <option key={option} value={option} />)}</datalist>
    <p id="timezone-help" className="mt-2 text-xs text-zinc-500">Detected on this device: <span className="font-mono text-zinc-300">{deviceZone}</span>.</p>
    <div className="mt-5 flex flex-wrap gap-3"><button type="button" onClick={save} className="inline-flex items-center gap-2 rounded-xl bg-violet-300 px-4 py-2.5 text-xs font-black uppercase tracking-[.12em] text-[#171122] transition hover:bg-violet-200"><Save size={14} />Save timezone</button><button type="button" onClick={useDeviceTimeZone} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.035] px-4 py-2.5 text-xs font-black uppercase tracking-[.12em] text-zinc-200 transition hover:border-violet-300/35 hover:text-white"><LocateFixed size={14} />Use device timezone</button></div>
    {message && <p role="status" className={`mt-4 flex items-center gap-2 text-xs ${validDraft ? 'text-emerald-200' : 'text-rose-200'}`}><Check size={14} />{message}</p>}
    <p className="mt-4 rounded-xl border border-white/[.07] bg-white/[.025] p-3 text-xs leading-5 text-zinc-400">Current display: <strong className="font-mono text-zinc-100">{formatTimeInZone(new Date(), timeZone, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })}</strong>. This preference is saved on this browser; cloud profile sync requires an authenticated profile and is not implied here.</p>
  </section>;
}
