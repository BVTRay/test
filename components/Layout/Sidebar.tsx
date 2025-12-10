
import React from 'react';
import { PlayCircle, Settings, HardDrive, Clapperboard } from 'lucide-react';
import { ModuleType } from '../../types';

interface SidebarProps {
  activeModule: ModuleType;
  onChangeModule: (m: ModuleType) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeModule, onChangeModule }) => {
  const navItems = [
    { id: 'review', icon: PlayCircle, label: '审阅', type: 'review' as ModuleType },
    { id: 'delivery', icon: HardDrive, label: '交付', type: 'delivery' as ModuleType },
    { id: 'showcase', icon: Clapperboard, label: '案例', type: 'showcase' as ModuleType },
  ];

  return (
    <nav className="fixed left-0 top-14 bottom-0 w-[64px] bg-zinc-950 border-r border-zinc-800 z-40 flex flex-col items-center py-4 gap-6">
      
      {/* Main Modules */}
      <div className="flex flex-col gap-2 w-full px-2 pt-2">
        {navItems.map((item) => (
          <SidebarItem 
            key={item.id}
            active={activeModule === item.type}
            icon={item.icon}
            label={item.label}
            onClick={() => onChangeModule(item.type)}
          />
        ))}
      </div>

      <div className="mt-auto flex flex-col gap-4 w-full px-2 pb-4">
        <SidebarItem 
          active={activeModule === 'settings'} 
          icon={Settings} 
          label="设置" 
          onClick={() => onChangeModule('settings')} 
        />
      </div>
    </nav>
  );
};

const SidebarItem: React.FC<{ 
  active: boolean; 
  icon: React.ElementType; 
  label: string; 
  onClick: () => void;
}> = ({ active, icon: Icon, label, onClick }) => (
  <button 
    onClick={onClick}
    className={`
      flex flex-col items-center justify-center w-full py-2.5 rounded-lg transition-all duration-200 group
      ${active ? 'bg-zinc-800 text-indigo-400' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'}
    `}
  >
    <Icon className={`w-6 h-6 mb-1 ${active ? 'stroke-[2.5px]' : 'stroke-2'}`} />
    <span className="text-[10px] font-medium leading-none tracking-wide opacity-80 scale-90">{label}</span>
  </button>
);
