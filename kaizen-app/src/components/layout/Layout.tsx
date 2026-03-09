import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useTheme } from '../../context/ThemeContext';

export default function Layout() {
  const { isDark } = useTheme();

  return (
    <div className={`${isDark ? 'dark' : ''}`}>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className={`flex-1 overflow-y-auto overflow-x-hidden ${isDark ? 'bg-gray-950 text-gray-100' : 'bg-offwhite text-gray-900'}`}>
          <div className="mx-auto max-w-7xl p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
