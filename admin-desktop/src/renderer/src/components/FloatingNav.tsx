import React from 'react';
import { Map, BrainCircuit, Users, Archive, Wifi, WifiOff, Search } from 'lucide-react';
import { Button } from './ui/button';

type View = 'SITAC' | 'IA' | 'AGENTS' | 'ARCHIVES';

interface FloatingNavProps {
  activeView: View;
  onViewChange: (v: View) => void;
  isConnected: boolean;
  onOpenCommand: () => void;
}

const NAV_ITEMS: { id: View; label: string; icon: React.ElementType }[] = [
  { id: 'SITAC',    label: 'SITAC',     icon: Map },
  { id: 'IA',       label: 'IA Prédictions', icon: BrainCircuit },
  { id: 'AGENTS',   label: 'Agents',    icon: Users },
  { id: 'ARCHIVES', label: 'Archives',  icon: Archive },
];

const FloatingNav: React.FC<FloatingNavProps> = ({ activeView, onViewChange, isConnected, onOpenCommand }) => (
  <div className="absolute top-5 left-1/2 -translate-x-1/2 z-[1000]">
    <div className="flex items-center gap-1.5 px-2.5 py-2 rounded-2xl glass border border-zinc-800/80 shadow-2xl shadow-black/60">
      {/* Brand */}
      <div className="flex items-center gap-2 px-3 pr-4 border-r border-zinc-800">
        <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center">
          <span className="text-[9px] font-black text-white">AS</span>
        </div>
        <span className="text-[10px] font-black uppercase tracking-wider text-zinc-300">AlertSec</span>
      </div>

      {/* Nav Buttons */}
      <div className="flex items-center gap-1 px-1">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <Button
            key={id}
            variant={activeView === id ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewChange(id)}
            className={`flex items-center gap-1.5 h-8 px-3 text-[11px] font-bold tracking-wide ${activeView === id ? '' : 'text-zinc-500'}`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{label}</span>
          </Button>
        ))}
      </div>

      {/* Separators & Right Controls */}
      <div className="flex items-center gap-1.5 pl-2 border-l border-zinc-800">
        {/* CMD+K shortcut */}
        <Button variant="ghost" size="sm" onClick={onOpenCommand} className="h-8 px-2.5 gap-1.5 text-zinc-500 hover:text-white">
          <Search className="w-3 h-3" />
          <span className="text-[9px] font-mono hidden sm:inline">⌘K</span>
        </Button>

        {/* Connection Status */}
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${isConnected ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
          {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          <span className="hidden sm:inline">{isConnected ? 'Live' : 'Off'}</span>
        </div>
      </div>
    </div>
  </div>
);

export default FloatingNav;
