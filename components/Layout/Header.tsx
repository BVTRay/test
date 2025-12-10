
import React from 'react';
import { Bell, ArrowRightLeft, Search, Command } from 'lucide-react';
import { AppState } from '../../types';

interface HeaderProps {
  onToggleDrawer: (drawer: AppState['activeDrawer']) => void;
  activeDrawer: AppState['activeDrawer'];
}

export const Header: React.FC<HeaderProps> = ({ onToggleDrawer, activeDrawer }) => {
  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-zinc-950 border-b border-zinc-800 z-50 flex items-center justify-between px-4 select-none">
      {/* Left: Logo */}
      <div className="flex items-center gap-3 w-64">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
        </div>
        <span className="font-bold text-lg tracking-tight text-zinc-100">Vioflow</span>
      </div>

      {/* Center: Global Omni-search (Visual only) */}
      <div className="hidden md:flex items-center bg-zinc-900 border border-zinc-800 rounded-md px-3 py-1.5 w-[400px] text-sm text-zinc-500 hover:border-zinc-700 transition-colors cursor-text group">
        <Search className="w-4 h-4 mr-2 group-hover:text-zinc-400" />
        <span className="flex-1">跳转至项目、文件或设置...</span>
        <div className="flex items-center gap-1">
          <Command className="w-3 h-3" />
          <span className="text-xs">K</span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <button 
          onClick={() => onToggleDrawer(activeDrawer === 'transfer' ? 'none' : 'transfer')}
          className={`p-2 rounded-md transition-colors relative ${activeDrawer === 'transfer' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'}`}
        >
          <ArrowRightLeft className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full border-2 border-zinc-950"></span>
        </button>
        
        <button 
          onClick={() => onToggleDrawer(activeDrawer === 'messages' ? 'none' : 'messages')}
          className={`p-2 rounded-md transition-colors relative ${activeDrawer === 'messages' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'}`}
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
        </button>

        <div className="w-px h-6 bg-zinc-800 mx-2"></div>
        
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 border border-zinc-700 shadow-sm cursor-pointer hover:ring-2 ring-indigo-500/50 transition-all"></div>
      </div>
    </header>
  );
};
