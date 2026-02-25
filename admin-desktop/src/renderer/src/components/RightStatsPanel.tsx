import React from 'react';
import { ChevronRight, ChevronLeft, BrainCircuit, Trophy, TrendingUp, Shield, Activity } from 'lucide-react';
import { Agent } from '../types';

interface RightStatsPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  stats: any;
  predictions: any[];
  agents: Agent[];
  activeView: string;
}

const RISK_COLORS: Record<string, string> = {
  CRITIQUE: 'text-red-400 bg-red-500/10 border-red-500/20',
  HAUT: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  MOYEN: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  FAIBLE: 'text-green-400 bg-green-500/10 border-green-500/20',
};

const RightStatsPanel: React.FC<RightStatsPanelProps> = ({ isOpen, onToggle, stats, predictions, agents, activeView }) => {
  const sortedAgents = [...agents].sort((a, b) => (b.points || 0) - (a.points || 0)).slice(0, 5);

  return (
    <div className={`absolute right-0 top-0 h-full z-[900] flex transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      {/* Toggle button */}
      <button
        onClick={onToggle}
        className="absolute -left-10 top-1/2 -translate-y-1/2 w-10 h-20 glass-panel rounded-l-2xl border border-white/10 flex items-center justify-center hover:bg-white/10 transition"
      >
        {isOpen ? <ChevronRight className="w-4 h-4 text-gray-400" /> : <ChevronLeft className="w-4 h-4 text-gray-400" />}
      </button>

      {/* Panel */}
      <div className="w-80 h-full glass-panel border-l border-white/10 overflow-y-auto custom-scrollbar">
        <div className="p-5 space-y-6">
          {/* Header */}
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600">Centre d'Intelligence</h3>
            <p className="text-xs text-gray-400 mt-0.5">Données temps réel</p>
          </div>

          {/* KPI Grid */}
          {stats && (
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'SOS Actifs', value: stats.sosByStatut?.find((s: any) => s.statut === 'NOUVEAU')?._count || 0, icon: Activity, color: 'text-red-400' },
                { label: 'Agents Dispo', value: agents.filter(a => !a.isOccupied).length, icon: Shield, color: 'text-green-400' },
                { label: 'Total SOS', value: stats.totalSignalements || 0, icon: TrendingUp, color: 'text-blue-400' },
                { label: 'Résolus', value: stats.sosByStatut?.find((s: any) => s.statut === 'CLOTURE')?._count || 0, icon: Trophy, color: 'text-yellow-400' },
              ].map(kpi => (
                <div key={kpi.label} className="bg-white/5 rounded-2xl p-3 border border-white/5">
                  <kpi.icon className={`w-4 h-4 ${kpi.color} mb-2`} />
                  <p className="text-xl font-black text-white leading-tight">{kpi.value}</p>
                  <p className="text-[9px] text-gray-600 font-bold uppercase tracking-wider mt-0.5">{kpi.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* IA Predictions */}
          {predictions && predictions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-3.5 h-3.5 text-violet-400" />
                <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-600">IA Prédictions 24h</h4>
              </div>
              <div className="space-y-2">
                {predictions.slice(0, 5).map((p: any, i: number) => (
                  <div key={i} className={`p-3 rounded-xl border text-xs ${RISK_COLORS[p.risque] || RISK_COLORS.FAIBLE}`}>
                    <div className="flex justify-between items-start">
                      <p className="font-bold leading-tight">{p.zone}</p>
                      <span className="text-[9px] font-black uppercase ml-2 shrink-0">{p.risque}</span>
                    </div>
                    {p.explication && <p className="text-[10px] opacity-70 mt-1 leading-tight">{p.explication}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Leaderboard */}
          {sortedAgents.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-3.5 h-3.5 text-yellow-400" />
                <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-600">Leaderboard Agents</h4>
              </div>
              <div className="space-y-2">
                {sortedAgents.map((agent, i) => (
                  <div key={agent.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                    <span className={`text-[10px] font-black w-5 text-center ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-orange-400' : 'text-gray-600'}`}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                    </span>
                    <div className="w-7 h-7 bg-primary/20 rounded-full flex items-center justify-center text-[10px] font-black text-primary">
                      {agent.nom[0]}{agent.prenom[0]}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-white">{agent.nom}</p>
                      <p className="text-[9px] text-gray-600">{agent.isOccupied ? '🔴 En mission' : '🟢 Disponible'}</p>
                    </div>
                    <span className="text-[10px] font-black text-yellow-400">{agent.points || 0} XP</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RightStatsPanel;
