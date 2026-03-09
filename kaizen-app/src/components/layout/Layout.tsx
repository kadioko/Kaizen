import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useTheme } from '../../context/ThemeContext';

export default function Layout() {
  const { isDark } = useTheme();

  return (
    <div className={`${isDark ? 'dark' : ''}`}>
      <div style={{ display: 'flex', height: '100vh' }}>
        <Sidebar />
        <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }} className={`${isDark ? 'bg-gray-950 text-gray-100' : 'bg-offwhite text-gray-900'}`}>
          <div style={{ padding: '32px', maxWidth: '1280px', margin: '0 auto' }}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
