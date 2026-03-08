import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useTheme } from '../../context/ThemeContext';

export default function Layout() {
  const { isDark } = useTheme();

  return (
    <div className={isDark ? 'dark' : ''}>
      <Sidebar />
      <main className={`ml-64 min-h-screen ${isDark ? 'bg-gray-950 text-gray-100' : 'bg-offwhite text-gray-900'}`}>
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
