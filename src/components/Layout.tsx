import { useState, useCallback } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { Outlet } from 'react-router-dom';
import GoldenBackground from './GoldenBackground';
import PinModal from './PinModal';

const Layout = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = useCallback(() => setSidebarOpen(prev => !prev), []);

  return (
    <div className="flex h-screen bg-background">
      <GoldenBackground />
      <PinModal />
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header toggleSidebar={toggleSidebar} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto relative z-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
