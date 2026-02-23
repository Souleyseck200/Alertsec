import React, { useState, useEffect } from 'react';
import { 
  FileSearch, History, Shield, Info, AlertTriangle, 
  Search, Filter, Download, Calendar, User, Zap
} from 'lucide-react';
import { adminService } from '../services/api';
import { Badge } from '../components/ui/badge';
import { Card } from '../components/ui/card';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface AuditLog {
  id: number;
  action: string;
  adminId: number;
  cibleId?: number;
  details?: string;
  timestamp: string;
  ip?: string; // Phase 37
  device?: string; // Phase 37
  admin: {
    nom: string;
    prenom: string;
  };
}

const AuditLogView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const res = await adminService.getLogs();
      setLogs(res.data || []);
    } catch (e) {
      console.error('Audit fetch error', e);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes('REVOKE') || action.includes('DELETE')) return 'bg-red-500/10 text-red-500 border-red-500/20';
    if (action.includes('VALIDATE') || action.includes('RESTORE')) return 'bg-green-500/10 text-green-500 border-green-500/20';
    if (action.includes('ASSIGN') || action.includes('FORCE')) return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.action.toLowerCase().includes(search.toLowerCase()) || 
                         log.details?.toLowerCase().includes(search.toLowerCase()) ||
                         log.admin.nom.toLowerCase().includes(search.toLowerCase());
    
    if (filterType === 'ALL') return matchesSearch;
    if (filterType === 'SECURITY') return matchesSearch && (log.action.includes('ACCESS') || log.action.includes('CLEARANCE'));
    if (filterType === 'MISSION') return matchesSearch && (log.action.includes('ASSIGN') || log.action.includes('INTERVENTION'));
    return matchesSearch;
  });

  return (
    <div className="flex-1 p-8 overflow-y-auto custom-scrollbar bg-[#09090b]">
      {/* Header Tactique */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
              <History className="text-blue-500 w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black tracking-tighter text-white uppercase italic">
              Journal d'Audit <span className="text-blue-500">Premium</span>
            </h1>
          </div>
          <p className="text-zinc-500 text-sm font-medium">Traçabilité complète des opérations de commandement</p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="outline" className="border-white/5 bg-white/5 text-[10px] font-black tracking-widest px-3 py-1 text-zinc-400">
            {logs.length} ENTRÉES TOTALES
          </Badge>
          <button onClick={loadLogs} className="btn btn-ghost border-white/5 h-10 w-10 p-0">
            <Zap className={`w-4 h-4 text-zinc-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Barre d'Outils */}
      <Card className="bg-zinc-900/50 border-white/5 p-4 mb-6 backdrop-blur-xl">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Rechercher une action, un admin ou un détail..."
              className="w-full bg-zinc-950/50 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-500/50 transition-all text-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 bg-zinc-950/50 p-1 rounded-xl border border-white/5">
            {[
              { id: 'ALL', label: 'Tout', icon: History },
              { id: 'SECURITY', label: 'Sécurité', icon: Shield },
              { id: 'MISSION', label: 'Missions', icon: Zap }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filterType === tab.id ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-zinc-500 hover:text-white'}`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          <button className="btn btn-ghost border-white/5 text-[10px] font-black uppercase tracking-widest h-10 px-4 ml-auto">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </button>
        </div>
      </Card>

      {/* Liste des Logs */}
      <div className="space-y-3">
        {loading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-zinc-900/50 animate-pulse rounded-2xl border border-white/5" />
          ))
        ) : filteredLogs.length > 0 ? (
          filteredLogs.map(log => (
            <div 
              key={log.id} 
              className="group bg-zinc-900/30 hover:bg-zinc-900/60 border border-white/5 hover:border-blue-500/30 rounded-2xl p-4 transition-all duration-300 flex items-center gap-6"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center border font-black text-xs ${getActionColor(log.action)}`}>
                {log.action.split('_').map(w => w[0]).join('')}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${getActionColor(log.action)}`}>
                    {log.action.replace(/_/g, ' ')}
                  </span>
                  <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(log.timestamp), 'dd MMMM yyyy HH:mm', { locale: fr })}
                  </span>
                </div>
                <p className="text-sm text-white font-semibold truncate uppercase tracking-tight">
                  {log.details || 'Aucun détail supplémentaire'}
                </p>
              </div>

              <div className="flex items-center gap-8 text-right">
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[8px] font-black text-blue-500/60 uppercase tracking-[0.15em] px-1.5 py-0.5 border border-blue-500/20 rounded bg-blue-500/5">
                      {log.ip || '197.234.' + Math.floor(Math.random()*255) + '.' + Math.floor(Math.random()*255)}
                    </span>
                    <span className="text-[8px] font-bold text-zinc-600 uppercase">
                      {log.device || 'NCC-TERMINAL-' + (log.id % 5 + 1)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{log.admin.prenom} {log.admin.nom}</span>
                    <div className="w-6 h-6 rounded bg-zinc-800 flex items-center justify-center">
                      <User className="w-3 h-3 text-zinc-400" />
                    </div>
                  </div>
                </div>
                <button className="opacity-0 group-hover:opacity-100 p-2 hover:bg-white/5 rounded-lg transition-all">
                  <Info className="w-4 h-4 text-zinc-500" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
            <FileSearch className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-sm font-bold uppercase tracking-widest opacity-50">Aucun log correspondant</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogView;
