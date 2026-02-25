import * as React from 'react';
import { Command } from 'cmdk';
import { Search, User, Map, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Agent, Zone } from '../types';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  agents: Agent[];
  zones: Zone[];
  onSelectAgent: (agent: Agent) => void;
  onSelectZone: (zone: Zone) => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ open, onClose, agents, zones, onSelectAgent, onSelectZone }) => {
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); if (!open) onClose(); }
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[2000] flex items-start justify-center pt-24"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -10 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-xl mx-4"
          onClick={e => e.stopPropagation()}
        >
          <Command
            className="rounded-2xl border border-zinc-800 bg-zinc-950/98 backdrop-blur-2xl shadow-2xl shadow-black/80 overflow-hidden"
            loop
          >
            <div className="flex items-center gap-3 px-4 border-b border-zinc-800">
              <Search className="w-4 h-4 text-zinc-500 shrink-0" />
              <Command.Input
                placeholder="Rechercher un agent, une zone…"
                className="flex h-12 w-full bg-transparent py-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none"
              />
              <button onClick={onClose} className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-white transition">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <Command.List className="max-h-72 overflow-y-auto p-2">
              <Command.Empty className="py-8 text-center text-xs text-zinc-600">
                Aucun résultat trouvé.
              </Command.Empty>

              {agents.length > 0 && (
                <Command.Group heading={<span className="text-[10px] font-black uppercase tracking-widest text-zinc-600 px-2">Agents</span>}>
                  {agents.map(agent => (
                    <Command.Item
                      key={agent.id}
                      onSelect={() => { onSelectAgent(agent); onClose(); }}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-zinc-800 data-[selected=true]:bg-zinc-800 transition-colors"
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black ${agent.isOccupied ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                        {agent.nom[0]}{agent.prenom[0]}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-white">{agent.nom} {agent.prenom}</p>
                        <p className="text-[10px] text-zinc-500">{agent.isOccupied ? '🔴 En mission' : '🟢 Disponible'}</p>
                      </div>
                      <User className="w-3.5 h-3.5 text-zinc-600" />
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              {zones.length > 0 && (
                <Command.Group heading={<span className="text-[10px] font-black uppercase tracking-widest text-zinc-600 px-2">Zones de patrouille</span>}>
                  {zones.map(zone => (
                    <Command.Item
                      key={zone.id}
                      onSelect={() => { onSelectZone(zone); onClose(); }}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-zinc-800 data-[selected=true]:bg-zinc-800 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <Map className="w-3.5 h-3.5 text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-white">{zone.nom}</p>
                        <p className="text-[10px] text-zinc-500">Rayon : {zone.rayon_action}m</p>
                      </div>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}
            </Command.List>

            <div className="flex items-center gap-3 px-4 py-2.5 border-t border-zinc-800">
              <span className="text-[9px] text-zinc-600 font-mono">↑↓ Naviguer</span>
              <span className="text-[9px] text-zinc-600 font-mono">↵ Sélectionner</span>
              <span className="text-[9px] text-zinc-600 font-mono ml-auto">ESC Fermer</span>
            </div>
          </Command>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CommandPalette;
