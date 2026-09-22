'use client';

import { useEffect, useState } from 'react';

const TIME_ZONE_STORAGE_KEY = 'tofauti.user-time-zone';
const TIME_ZONE_CHANGE_EVENT = 'tofauti-time-zone-changed';

function isValidTimeZone(value: string) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

function deviceTimeZone() {
  const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return detected && isValidTimeZone(detected) ? detected : 'UTC';
}

function readTimeZone() {
  const saved = window.localStorage.getItem(TIME_ZONE_STORAGE_KEY);
  return saved && isValidTimeZone(saved) ? saved : deviceTimeZone();
}

export function useUserTimezone() {
  const [timeZone, setTimeZone] = useState('UTC');
  const [deviceZone, setDeviceZone] = useState('UTC');

  useEffect(() => {
    const sync = () => {
      setDeviceZone(deviceTimeZone());
      setTimeZone(readTimeZone());
    };
    sync();
    window.addEventListener('storage', sync);
    window.addEventListener(TIME_ZONE_CHANGE_EVENT, sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener(TIME_ZONE_CHANGE_EVENT, sync);
    };
  }, []);

  const updateTimeZone = (candidate: string) => {
    if (!isValidTimeZone(candidate)) return false;
    window.localStorage.setItem(TIME_ZONE_STORAGE_KEY, candidate);
    window.dispatchEvent(new Event(TIME_ZONE_CHANGE_EVENT));
    setTimeZone(candidate);
    return true;
  };

  return { timeZone, deviceZone, updateTimeZone, isValidTimeZone };
}

export function formatTimeInZone(date: Date | string | number, timeZone: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(undefined, { ...options, timeZone }).format(new Date(date));
}

export function supportedTimeZones(current: string, deviceZone: string) {
  const suggested = ['UTC', 'Africa/Nairobi', 'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'America/New_York', 'America/Chicago', 'America/Los_Angeles', 'America/Toronto', 'America/Sao_Paulo', 'Asia/Dubai', 'Asia/Kolkata', 'Asia/Singapore', 'Asia/Hong_Kong', 'Asia/Tokyo', 'Australia/Sydney', 'Pacific/Auckland'];
  const all = typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : [];
  return [...new Set([current, deviceZone, ...suggested, ...all])];
}
