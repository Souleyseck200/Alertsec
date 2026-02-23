import React, { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { MapContainer, TileLayer, Circle, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../pages/SitacMap.css';
import { toast } from 'sonner';
import { AnimatePresence } from 'framer-motion';

// Components
import FloatingNav from '../components/FloatingNav';
import AlertTicker from '../components/AlertTicker';
import SOSCard from '../components/SOSCard';
import SOSSheet from '../components/SOSSheet';
import RightStatsPanel from '../components/RightStatsPanel';
import TalkieWalkieButton from '../components/TalkieWalkieButton';
import CommandPalette from '../components/CommandPalette';

// Services
import { adminService } from '../services/api';
import api from '../services/api';

const SOCKET_URL = 'http://localhost:3000';

// ─── TYPES ─────────────────────────────────────────────────────────────────
export interface Signalement {
  id: number; type: string; description: string; gravite: string; statut: string;
  latitude: number; longitude: number; mediaUrl?: string; audioUrl?: string; videoUrl?: string;
  citoyenId: number; zoneId?: number; dateCreation: string;
}
export interface Agent {
  id: number; nom: string; prenom: string; role: string;
  latitude?: number; longitude?: number; zoneId?: number; isOccupied?: boolean; points?: number;
}
export interface Zone {
  id: number; nom: string; localisation: string; rayon_action: number; niveau_priorite: number;
}
export interface TickerEvent { id: string; message: string; time: Date; }

// ─── MAP CONTROLLER ────────────────────────────────────────────────────────
const MapController: React.FC<{ flyToTarget: [number, number] | null }> = ({ flyToTarget }) => {
  const map = useMap();
  useEffect(() => {
    if (flyToTarget) map.flyTo(flyToTarget, 15, { animate: true, duration: 1.5 });
  }, [flyToTarget, map]);
  return null;
};

// ─── CONTEXT MENU LAYER ────────────────────────────────────────────────────
const ContextMenuLayer: React.FC<{ onCreateZone: (ll: { lat: number; lng: number }) => void }> = ({ onCreateZone }) => {
  const map = useMap();
  useEffect(() => {
    const handler = (e: L.LeafletMouseEvent) => {
      L.popup().setLatLng(e.latlng).setContent(`
        <div style="background:#09090b;border:1px solid #27272a;border-radius:12px;padding:12px;min-width:150px">
          <p style="color:#71717a;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.15em;margin-bottom:8px">Action carte</p>
          <button id="add-zone-btn" style="width:100%;background:#2563eb;color:#fff;border:none;padding:8px 12px;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer;text-transform:uppercase">+ Ajouter zone</button>
        </div>`).openOn(map);
      setTimeout(() => {
        const btn = document.getElementById('add-zone-btn');
        if (btn) btn.onclick = () => { map.closePopup(); onCreateZone(e.latlng); };
      }, 100);
    };
    map.on('contextmenu', handler);
    return () => { map.off('contextmenu', handler); };
  }, [map, onCreateZone]);
  return null;
};

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────
const CommandCenter: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeView, setActiveView] = useState<'SITAC' | 'IA' | 'AGENTS' | 'ARCHIVES'>('SITAC');

  const [signalements, setSignalements] = useState<Signalement[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [heatmap, setHeatmap] = useState<any[]>([]);

  const [selectedSOS, setSelectedSOS] = useState<Signalement | null>(null);
  const [tickerEvents, setTickerEvents] = useState<TickerEvent[]>([]);
  const [flyToTarget, setFlyToTarget] = useState<[number, number] | null>(null);
  const [routeLine, setRouteLine] = useState<[[number, number], [number, number]] | null>(null);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [cmdOpen, setCmdOpen] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const addTicker = useCallback((msg: string) => {
    setTickerEvents(prev => [{ id: Date.now().toString(), message: msg, time: new Date() }, ...prev].slice(0, 20));
  }, []);

  // ─── DATA FETCH ───────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    try {
      const [sigRes, agentsRes, zonesRes, heatRes] = await Promise.all([
        api.get('/signalements/all'),
        api.get('/users/all'),
        adminService.getZones().catch(() => ({ data: [] })),
        api.get('/signalements/heatmap').catch(() => ({ data: [] })),
      ]);
      setSignalements(sigRes.data);
      setAgents(agentsRes.data.filter((u: any) => u.role === 'AGENT'));
      setZones(zonesRes.data);
      setHeatmap(heatRes.data);
    } catch (e) { console.error(e); }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const [sRes, pRes] = await Promise.all([
        api.get('/admin/stats/dashboard').catch(() => ({ data: null })),
        api.get('/admin/analytics/prediction').catch(() => ({ data: [] })),
      ]);
      setStats(sRes.data);
      setPredictions(pRes.data);
    } catch (e) { console.error(e); }
  }, []);

  // ─── SOCKET ──────────────────────────────────────────────────────────────
  useEffect(() => {
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audioRef.current.volume = 0.35;

    // Global CMD+K listener
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setCmdOpen(o => !o); }
    };
    window.addEventListener('keydown', handleKey);

    const token = localStorage.getItem('admin_token');
    const s = io(SOCKET_URL, { auth: { token } });

    s.on('connect', () => { setIsConnected(true); addTicker('✅ Serveur de commandement connecté'); });
    s.on('disconnect', () => { setIsConnected(false); addTicker('🔴 Connexion serveur perdue'); });

    s.on('NOUVEAU_SIGNALEMENT', (sig: Signalement) => {
      setSignalements(prev => prev.find(s => s.id === sig.id) ? prev : [sig, ...prev]);
      addTicker(`🚨 Nouveau SOS ${sig.gravite} — ${sig.type}`);

      // Sonner toast
      toast.error(`🚨 SOS ${sig.gravite} — ${sig.type}`, {
        description: sig.description?.slice(0, 80),
        duration: 8000,
        action: { label: 'Voir', onClick: () => setSelectedSOS(sig) },
      });

      if (sig.gravite === 'VITAL') audioRef.current?.play().catch(() => {});
      if (sig.latitude && sig.longitude) setFlyToTarget([sig.latitude, sig.longitude]);

      if ('electron' in window) {
        (window as any).electron.sendNotification(`🚨 SOS ${sig.gravite} — ${sig.type}`, sig.description?.slice(0, 80) || '');
      }
    });

    s.on('AGENT_LOCATION_UPDATE', (d: { userId: number; latitude: number; longitude: number }) => {
      setAgents(prev => prev.map(a => a.id === d.userId ? { ...a, latitude: d.latitude, longitude: d.longitude } : a));
    });

    s.on('AGENT_CONNECTED', (d: { userId: number; nom?: string }) => {
      addTicker(`🟢 Agent ${d.nom || `#${d.userId}`} vient de se connecter`);
      toast(`🟢 Agent ${d.nom || `#${d.userId}`} connecté`, { duration: 4000 });
    });

    setSocket(s);
    fetchAll();
    fetchStats();
    const interval = setInterval(fetchAll, 30000);
    return () => { s.disconnect(); clearInterval(interval); window.removeEventListener('keydown', handleKey); };
  }, [fetchAll, fetchStats, addTicker]);

  // ─── HANDLERS ────────────────────────────────────────────────────────────
  const handleSOSClick = (sig: Signalement) => {
    setSelectedSOS(sig);
    if (sig.latitude && sig.longitude) setFlyToTarget([sig.latitude, sig.longitude]);
  };

  const handleAssign = async (signalementId: number, agentId: number) => {
    try {
      await adminService.forceAssign(signalementId, agentId);
      const agent = agents.find(a => a.id === agentId);
      const sig = signalements.find(s => s.id === signalementId);
      if (agent?.latitude && agent?.longitude && sig?.latitude && sig?.longitude) {
        setRouteLine([[agent.latitude, agent.longitude], [sig.latitude, sig.longitude]]);
        setTimeout(() => setRouteLine(null), 30000);
      }
      addTicker(`✅ Agent ${agent?.nom || '#' + agentId} affecté au SOS #${signalementId}`);
      toast.success(`Agent ${agent?.nom} affecté`, { description: `SOS #${signalementId}` });
      setSelectedSOS(null);
      fetchAll();
    } catch (e) { toast.error('Erreur lors de l\'affectation'); }
  };

  const handleCreateZone = async (latlng: { lat: number; lng: number }) => {
    const nom = prompt('Nom de la zone de patrouille :');
    if (!nom) return;
    const rayonStr = prompt('Rayon (mètres) :', '1000');
    try {
      await adminService.createZone({ nom, localisation: JSON.stringify({ lat: latlng.lat, lng: latlng.lng }), rayon_action: parseInt(rayonStr || '1000'), niveau_priorite: 1 });
      addTicker(`📍 Zone "${nom}" créée`);
      toast.success(`Zone "${nom}" créée`);
      fetchAll();
    } catch (e) { toast.error('Erreur création de zone'); }
  };

  const parseZone = (loc: string): [number, number] | null => {
    try {
      if (loc.includes('{')) { const c = JSON.parse(loc); if (!isNaN(c.lat) && !isNaN(c.lng)) return [Number(c.lat), Number(c.lng)]; }
      else { const p = loc.split(','); const lat = parseFloat(p[0]); const lng = parseFloat(p[1]); if (!isNaN(lat) && !isNaN(lng)) return [lat, lng]; }
    } catch {}
    return null;
  };

  const activeSOS = signalements.filter(s => s.statut === 'NOUVEAU' || s.statut === 'EN_COURS');

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-zinc-950">
      {/* ── FULL-SCREEN MAP (z-0) ── */}
      <div className="absolute inset-0 z-0">
        <MapContainer center={[14.7167, -17.4677]} zoom={12} style={{ width: '100%', height: '100%' }} zoomControl={false}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution="© CARTO" />
          <MapController flyToTarget={flyToTarget} />
          <ContextMenuLayer onCreateZone={handleCreateZone} />

          {/* Route line */}
          {routeLine && <Polyline positions={routeLine} pathOptions={{ color: '#2563EB', weight: 3, dashArray: '8,6', opacity: 0.9 }} />}

          {/* Zones */}
          {zones.map(z => {
            const c = parseZone(z.localisation);
            if (!c) return null;
            return <Circle key={z.id} center={c} radius={z.rayon_action} pathOptions={{ color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.06, weight: 1.5, dashArray: '4,4' }} />;
          })}

          {/* Heatmap blobs */}
          {heatmap.filter(p => !isNaN(Number(p.latitude)) && !isNaN(Number(p.longitude))).map((p, i) => (
            <Circle key={`h${i}`} center={[Number(p.latitude), Number(p.longitude)]} radius={250} pathOptions={{ fillColor: '#DC2626', color: 'transparent', fillOpacity: 0.3 }} />
          ))}

          {/* SOS Markers */}
          {activeSOS.filter(s => s.latitude && s.longitude && !isNaN(s.latitude) && !isNaN(s.longitude)).map(sig => (
            <Marker key={sig.id} position={[sig.latitude, sig.longitude]} eventHandlers={{ click: () => handleSOSClick(sig) }}
              icon={L.divIcon({ className: 'custom-div-icon', html: `<div class="sos-marker ${sig.gravite === 'VITAL' ? 'vital' : 'normal'}">SOS</div>`, iconSize: [44, 44], iconAnchor: [22, 22] })} />
          ))}

          {/* Agent Markers */}
          {agents.filter(a => a.latitude && a.longitude && !isNaN(a.latitude!) && !isNaN(a.longitude!)).map(agent => (
            <Marker key={agent.id} position={[agent.latitude!, agent.longitude!]}
              eventHandlers={{ click: () => { toast(`👤 ${agent.nom} ${agent.prenom}`, { description: agent.isOccupied ? 'En mission' : 'Disponible' }); } }}
              icon={L.divIcon({ className: 'custom-div-icon', html: `<div class="agent-marker ${agent.isOccupied ? 'occupied' : 'free'}">${agent.nom[0]}${agent.prenom[0]}</div>`, iconSize: [38, 38], iconAnchor: [19, 19] })} />
          ))}
        </MapContainer>
      </div>

      {/* ── OVERLAY LAYERS (z-10+) ── */}

      {/* Top Nav Island */}
      <div className="relative z-[1000]">
        <FloatingNav activeView={activeView} onViewChange={setActiveView} isConnected={isConnected} onOpenCommand={() => setCmdOpen(true)} />
      </div>

      {/* Alert Ticker */}
      <div className="relative z-[999]">
        <AlertTicker events={tickerEvents} />
      </div>

      {/* Left SOS Rail */}
      {activeView === 'SITAC' && (
        <div className="absolute left-4 top-36 bottom-24 z-[900] w-80 flex flex-col gap-2.5 overflow-y-auto custom-scrollbar pointer-events-none pr-1">
          <AnimatePresence>
            {activeSOS.map((sig, i) => (
              <div key={sig.id} className="pointer-events-auto">
                <SOSCard signalement={sig} onClick={() => handleSOSClick(sig)} index={i} />
              </div>
            ))}
            {activeSOS.length === 0 && (
              <div className="pointer-events-auto glass rounded-2xl p-5 border border-zinc-800 text-center">
                <p className="text-[10px] font-black text-green-400 uppercase tracking-widest">✅ Aucun incident actif</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Right Stats Panel */}
      <div className="absolute right-0 top-0 h-full z-[900]">
        <RightStatsPanel isOpen={rightPanelOpen} onToggle={() => setRightPanelOpen(p => !p)} stats={stats} predictions={predictions} agents={agents} activeView={activeView} />
      </div>

      {/* SOS Detail Sheet (slides from right) */}
      <SOSSheet
        signalement={selectedSOS}
        agents={agents}
        onAssign={handleAssign}
        onClose={() => setSelectedSOS(null)}
        onCloturer={() => { addTicker(`✅ SOS #${selectedSOS?.id} clôturé.`); setSelectedSOS(null); fetchAll(); }}
      />

      {/* Command Palette (CMD+K) */}
      <CommandPalette
        open={cmdOpen}
        onClose={() => setCmdOpen(false)}
        agents={agents}
        zones={zones}
        onSelectAgent={agent => { if (agent.latitude && agent.longitude) setFlyToTarget([agent.latitude, agent.longitude]); }}
        onSelectZone={zone => { const c = parseZone(zone.localisation); if (c) setFlyToTarget(c); }}
      />

      {/* Talkie-Walkie */}
      <div className="relative z-[1000]">
        <TalkieWalkieButton socket={socket} agents={agents} />
      </div>
    </div>
  );
};

export default CommandCenter;
