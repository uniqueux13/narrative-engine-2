import React from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { Zap, LayoutGrid } from 'lucide-react';

const Layout: React.FC = () => {
  const location = useLocation();
  const isStudio = location.pathname.includes('/studio/');

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-200 font-sans selection:bg-amber-500/30">
      {/* Header - Only show full header on dashboard, minimal on Studio */}
      <header className={`border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50 ${isStudio ? 'hidden' : 'block'}`}>
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="p-2 bg-amber-500 rounded-lg group-hover:bg-amber-400 transition-colors">
              <Zap className="w-5 h-5 text-zinc-950 fill-current" />
            </div>
            <span className="font-bold text-xl tracking-tight">Grimwire<span className="text-zinc-600">.forge</span></span>
          </Link>
          <nav className="flex gap-4">
             <Link to="/" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors flex items-center gap-1">
              <LayoutGrid className="w-4 h-4" />
              Projects
             </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;