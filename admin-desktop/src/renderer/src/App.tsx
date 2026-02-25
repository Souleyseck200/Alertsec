import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Shield, Zap, History, User } from 'lucide-react';

import Sidebar from './components/Sidebar';
import SITACView from './pages/SITACView';
import DashboardView from './pages/DashboardView';
import AgentsView from './pages/AgentsView';
import AnalyticsView from './pages/AnalyticsView';
import AuditLogView from './pages/AuditLogView';
import SignalementsView from './pages/SignalementsView';
import LoginPage from './pages/LoginPage';
import CommandPalette from './components/CommandPalette';

import { authService } from './services/api';
import api, { adminService } from './services/api';

import { Signalement, Agent, Zone, AppStats, TickerEvent, ViewId } from './types';
export type { Signalement, Agent, Zone, AppStats, TickerEvent, ViewId };

const SOCKET_URL = 'http://localhost:3000';

// ═══════════════════════════════════════════════════════════════════════════
// ROOT APP COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
const playBeep = (freq = 880, type: OscillatorType = 'square', duration = 0.1) => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    g.gain.setValueAtTime(0.05, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    osc.connect(g); g.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + duration);
  } catch {}
};

const App: React.FC = () => {
  // ── Auth ─────────────────────────────────────────────────────────────────
  const [user, setUser] = useState<any>(() => {
    const saved = localStorage.getItem('admin_user');
    return saved ? JSON.parse(saved) : null;
  });

  // ── Navigation ────────────────────────────────────────────────────────────
  const [activeView, setActiveView] = useState<ViewId>('dashboard');
  const [cmdOpen, setCmdOpen] = useState(false);

  // ── Real-time data ────────────────────────────────────────────────────────
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isCrisis, setIsCrisis] = useState(false); // Phase 38
  const [signalements, setSignalements] = useState<Signalement[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [stats, setStats] = useState<AppStats | null>(null);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [heatmap, setHeatmap] = useState<any[]>([]);
  const [citizenLocations, setCitizenLocations] = useState<Record<number, { latitude: number; longitude: number }>>({});
  const [tickerEvents, setTickerEvents] = useState<TickerEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // ──────────────────────────────────────────────────────────────────────────
  const addTicker = useCallback((msg: string, type: TickerEvent['type'] = 'info') => {
    setTickerEvents(prev => [{ id: Date.now() + Math.random().toString(), message: msg, time: new Date(), type }, ...prev].slice(0, 30));
  }, []);

  // ─── Data Fetching ─────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    try {
      const [sigRes, agentsRes, zonesRes, heatRes] = await Promise.all([
        api.get('/signalements/all').catch(() => ({ data: [] })),
        api.get('/users/all').catch(() => ({ data: [] })),
        adminService.getZones().catch(() => ({ data: [] })),
        api.get('/signalements/heatmap').catch(() => ({ data: [] })),
      ]);
      setSignalements(sigRes.data || []);
      setAgents((agentsRes.data || []).filter((u: any) => u.role === 'AGENT' || u.role === 'ADMIN'));
      setZones(zonesRes.data || []);
      setHeatmap(heatRes.data || []);
    } catch (e) { console.error('fetchAll error', e); }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const [sRes, pRes] = await Promise.all([
        api.get('/admin/stats/dashboard').catch(() => ({ data: null })),
        api.get('/admin/analytics/prediction').catch(() => ({ data: [] })),
      ]);
      setStats(sRes.data);
      setPredictions(pRes.data || []);
    } catch (e) { console.error('fetchStats error', e); }
  }, []);

  // ─── Socket Init ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;

    // CMD+K global
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setCmdOpen(o => !o); }
    };
    window.addEventListener('keydown', onKey);

    const token = localStorage.getItem('admin_token');
    const s = io(SOCKET_URL, { auth: { token }, reconnection: true, reconnectionDelay: 2000 });

    s.on('connect', () => {
      setIsConnected(true);
      addTicker('Serveur de commandement connecté', 'success');
    });
    s.on('disconnect', () => {
      setIsConnected(false);
      addTicker('Connexion serveur perdue — reconnexion…', 'alert');
    });

    s.on('NOUVEAU_SIGNALEMENT', (sig: Signalement) => {
      console.log('🚨 [Socket] NOUVEAU_SIGNALEMENT reçu:', sig);
      setSignalements(prev => {
        const exists = prev.find(p => p.id === sig.id);
        if (exists) {
           console.log(`ℹ️ [Socket] Signalement #${sig.id} déjà présent dans l'état.`);
           return prev;
        }
        return [sig, ...prev];
      });
      addTicker(`ALERTE : ${sig.type} détecté (${sig.gravite})`, 'alert');
      
      // Crisis Trigger (Phase 38)
      if (sig.gravite === 'CRITIQUE') {
        setIsCrisis(true);
        playBeep(220, 'sawtooth', 1.0); // Deep alarm
      } else {
        playBeep(440, 'sawtooth', 0.2);
        setTimeout(() => playBeep(880, 'square', 0.1), 100);
      }

      toast.error(`🚨 SOS ${sig.gravite} — ${sig.type}`, {
        description: sig.description?.slice(0, 90),
        duration: sig.gravite === 'CRITIQUE' ? 0 : 10000,
        action: { label: 'SITAC', onClick: () => { setActiveView('sitac'); setIsCrisis(false); } },
      });

      if ('electron' in window) {
        (window as any).electron?.sendNotification?.(
          `🚨 SOS ${sig.gravite} — ${sig.type}`,
          sig.description?.slice(0, 80) || ''
        );
      }
    });

    s.on('AGENT_LOCATION_UPDATE', (d: any) => {
      const agentId = d.agentId || d.userId;
      if (agentId && d.latitude != null && d.longitude != null) {
        setAgents(prev => prev.map(a => a.id === agentId ? { ...a, latitude: d.latitude, longitude: d.longitude } : a));
      }
    });

    s.on('CITIZEN_LOCATION_UPDATE', (d: any) => {
      if (d.citoyenId && d.latitude != null && d.longitude != null) {
        setCitizenLocations(prev => ({
          ...prev,
          [d.citoyenId]: { latitude: d.latitude, longitude: d.longitude }
        }));
      }
    });

    s.on('AGENT_CONNECTED', (d: any) => {
      addTicker(`Agent ${d.nom || '#' + d.userId} connecté`, 'success');
      playBeep(660, 'sine', 0.05);
    });

    setSocket(s);

    // Initial load
    Promise.all([fetchAll(), fetchStats()]).finally(() => setLoading(false));
    const interval = setInterval(() => { fetchAll(); fetchStats(); }, 30000);

    return () => {
      s.disconnect();
      clearInterval(interval);
      window.removeEventListener('keydown', onKey);
    };
  }, [user, fetchAll, fetchStats, addTicker]);

  // ─── Auth Guard ────────────────────────────────────────────────────────────
  if (!user) {
    return <LoginPage onLoginSuccess={u => setUser(u)} />;
  }

  const activeSOS = signalements.filter(s => s.statut === 'NOUVEAU' || s.statut === 'EN_COURS' || s.statut === 'ZONE_INCONNUE');
  const agentsList = agents.filter(a => a.role === 'AGENT');

  const handleLogout = () => { authService.logout(); setUser(null); };

  // ─── View Renderer ─────────────────────────────────────────────────────────
  const renderView = () => {
    switch (activeView) {
      case 'dashboard': return (
        <DashboardView
          stats={stats} signalements={signalements} agents={agentsList}
          zones={zones} tickerEvents={tickerEvents} loading={loading}
          onNavigate={setActiveView}
        />
      );
      case 'sitac': return (
        <SITACView
          socket={socket} signalements={signalements} agents={agentsList}
          zones={zones} heatmap={heatmap} isConnected={isConnected}
          onReload={fetchAll} addTicker={addTicker}
          predictions={predictions} stats={stats}
          isCrisis={isCrisis} 
          onDismissCrisis={() => setIsCrisis(false)}
          user={user}
        />
      );
      case 'agents': return (
        <AgentsView agents={agentsList} zones={zones} onReload={fetchAll} />
      );
      case 'analytics': return (
        <AnalyticsView predictions={predictions} stats={stats} agents={agentsList} heatmap={heatmap} onReload={fetchStats} />
      );
      case 'archives': return (
        <AuditLogView />
      );
      case 'incidents': return (
        <SignalementsView 
          signalements={signalements} 
          zones={zones}
          citizenLocations={citizenLocations} 
          onReload={() => { fetchAll(); fetchStats(); }} 
        />
      );
    }
  };

  // ─── Current ticker message ────────────────────────────────────────────────
  const latestTicker = tickerEvents[0];

  return (
    <div className={`app-shell ${isCrisis ? 'crisis-mode' : ''}`} style={{ perspective: '1000px' }}>
      {/* Crisis Overlay UI (Phase 38) */}
      <AnimatePresence>
        {isCrisis && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-[9999]"
            style={{ 
              border: '4px solid #ef4444',
              boxShadow: 'inset 0 0 150px rgba(239,68,68,0.4)',
              background: 'radial-gradient(circle, transparent 20%, rgba(239,68,68,0.05) 100%)'
            }}
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-red-500 flex flex-col items-center">
               <motion.div
                 animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                 transition={{ repeat: Infinity, duration: 2 }}
               >
                 <AlertTriangle className="w-32 h-32 mb-6" />
               </motion.div>
               <h1 className="text-5xl font-black italic tracking-tighter uppercase mb-2" style={{ textShadow: '0 0 20px rgba(239,68,68,0.5)' }}>
                 Urgence Absolue
               </h1>
               <div className="text-sm font-black uppercase tracking-[0.5em] mt-2 opacity-80 bg-red-600 text-white px-4 py-1 rounded">
                 Protocole de Crise Identifié
               </div>
            </div>
            
            {/* Pulsing Scan Line */}
            <motion.div 
              animate={{ top: ['0%', '100%', '0%'] }}
              transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
              style={{ position: 'absolute', left: 0, width: '100%', height: '1px', background: 'rgba(239,68,68,0.5)', boxShadow: '0 0 15px #ef4444' }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Sidebar ── */}
      <Sidebar
        activeView={activeView}
        onNavigate={setActiveView}
        isConnected={isConnected}
        user={user}
        onLogout={handleLogout}
        sosCount={activeSOS.length}
        agentCount={agentsList.filter(a => !a.isOccupied).length}
        onOpenCommand={() => setCmdOpen(true)}
        isCrisis={isCrisis} // Phase 38
      />

      {/* ── Main ── */}
      <div className="main-content">
        {/* Ticker Banner */}
        {latestTicker && (
          <div className="ticker-banner">
            <span className={`ticker-label ${latestTicker.type === 'alert' ? 'text-red-400' : latestTicker.type === 'success' ? 'text-green-400' : ''}`}
              style={latestTicker.type === 'alert' ? { background: 'var(--accent-red-glow)', borderColor: 'rgba(220,38,38,0.25)', color: '#fca5a5' } : {}}>
              {latestTicker.type === 'alert' ? '⚠ ALERTE' : latestTicker.type === 'success' ? '✓ INFO' : 'ÉVÉNEMENT'}
            </span>
            <span className="ticker-text ticker-animate">{latestTicker.message}</span>
            <span className="ticker-time">
              {latestTicker.time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
        )}

        {/* View Content */}
        {renderView()}
      </div>

      {/* ── Command Palette ── */}
      <CommandPalette
        open={cmdOpen}
        onClose={() => setCmdOpen(false)}
        agents={agentsList}
        zones={zones}
        onSelectAgent={() => setActiveView('agents')}
        onSelectZone={() => setActiveView('sitac')}
      />
    </div>
  );
};

export default App;
