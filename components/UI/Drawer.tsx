
import React, { useEffect, useState } from 'react';
import { X, ArrowRight } from 'lucide-react';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Drawer: React.FC<DrawerProps> = ({ isOpen, onClose, title, children }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) setVisible(true);
    else setTimeout(() => setVisible(false), 300); // Wait for animation
  }, [isOpen]);

  if (!visible) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className={`fixed top-0 right-0 bottom-0 w-[420px] bg-zinc-950 border-l border-zinc-800 z-[61] shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Header */}
        <div className="h-14 border-b border-zinc-800 flex items-center justify-between px-6 bg-zinc-950 shrink-0">
            <h2 className="font-semibold text-zinc-100">{title}</h2>
            <button onClick={onClose} className="p-2 hover:bg-zinc-900 rounded-full text-zinc-400 transition-colors">
                <X className="w-5 h-5" />
            </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-zinc-950">
            {children}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-zinc-800 bg-zinc-900/30">
            <button className="w-full bg-zinc-100 hover:bg-white text-zinc-950 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                <span>查看全部历史</span>
                <ArrowRight className="w-4 h-4" />
            </button>
        </div>
      </div>
    </>
  );
};
