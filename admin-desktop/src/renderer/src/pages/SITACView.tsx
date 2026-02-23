import React, { useCallback, useRef, useState } from 'react';
import { MapContainer, TileLayer, Polygon, Circle, Marker, Polyline, useMap, useMapEvents, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AntPath } from 'leaflet-ant-path';
import * as turf from '@turf/turf';
import './SitacMap.css';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  AlertTriangle, Clock, Radio, Users, RefreshCw,
  CheckCircle, Map as MapIcon, Zap, BrainCircuit, TrendingUp,
  Shield, Search, Layers, User as UserIcon, Activity, Mic, PowerOff
} from 'lucide-react';
import SOSSheet, { Signalement, Agent } from '../components/SOSSheet';
import TalkieWalkieButton from '../components/TalkieWalkieButton';
import { TickerEvent, Zone } from '../App';
import { adminService } from '../services/api';
import { Socket } from 'socket.io-client';

interface SITACViewProps {
  socket: Socket | null;
  signalements: Signalement[];
  agents: Agent[];
  zones: Zone[];
  heatmap: any[];
  isConnected: boolean;
  onReload: () => void;
  addTicker: (msg: string, type?: TickerEvent['type']) => void;
  predictions: any[];
  stats: any | null;
  isCrisis?: boolean; // Phase 38
  onDismissCrisis?: () => void; // Phase 38
  user: any;
}

const FlyController: React.FC<{ target: [any, any] | null }> = ({ target }) => {
  const map = useMap();
  React.useEffect(() => {
    if (target && target[0] != null && target[1] != null) {
       const lat = typeof target[0] === 'string' ? parseFloat(target[0]) : target[0];
       const lng = typeof target[1] === 'string' ? parseFloat(target[1]) : target[1];
       if (!isNaN(lat) && !isNaN(lng)) {
         map.flyTo([lat, lng], 16, { animate: true, duration: 1.2 });
       }
    }
  }, [target, map]);
  return null;
};

const ContextLayer: React.FC<{ onCreateZone: (ll: { lat: number; lng: number }) => void }> = ({ onCreateZone }) => {
  const map = useMapEvents({
    contextmenu(e) {
      L.popup().setLatLng(e.latlng).setContent(`
        <div style="background:#131316;border:1px solid #27272a;border-radius:10px;padding:12px;min-width:160px">
          <p style="color:#71717a;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.15em;margin:0 0 8px">Action Carte</p>
          <button id="add-zone" style="width:100%;background:#2563eb;color:#fff;border:none;padding:7px 10px;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer">+ Zone Tactique</button>
        </div>`).openOn(map);
      setTimeout(() => {
        const btn = document.getElementById('add-zone');
        if (btn) btn.onclick = () => { map.closePopup(); onCreateZone(e.latlng); };
      }, 80);
    }
  });
  return null;
};

// ── Helpers ──
const getGravityClass = (g: string) => {
  if (g === 'VITAL') return 'vital';
  return 'normal';
};

const parseZonePolygons = (loc: string): [number, number][] | [number, number] | null => {
  try {
    const data = JSON.parse(loc);
    if (Array.isArray(data)) return data; // Polygone coordinates
    if (data.lat && data.lng) return [data.lat, data.lng]; // Single point/Circle
  } catch {
    const p = loc.split(',');
    if (p.length === 2) return [parseFloat(p[0]), parseFloat(p[1])];
  }
  return null;
};

const SOSSideItem: React.FC<{ sig: Signalement; onClick: () => void; index: number }> = ({ sig, onClick, index }) => {
  const ago = Math.round((Date.now() - new Date(sig.dateCreation).getTime()) / 60000);
  const badgeClass = sig.gravite === 'VITAL' ? 'badge-vital' : sig.gravite === 'CRITIQUE' ? 'badge-critique' : sig.gravite === 'MOYEN' ? 'badge-moyen' : 'badge-faible';

  return (
    <motion.div layout initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
      transition={{ delay: index * 0.03 }} onClick={onClick}
      className="sos-side-item"
      style={{
        padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer',
        background: sig.gravite === 'VITAL' ? 'rgba(239,68,68,0.05)' : 'transparent',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div className={`sos-marker ${getGravityClass(sig.gravite)} ${sig.gravite.toLowerCase()}`} style={{ position: 'static', width: 8, height: 8, border: 'none' }} />
          <span style={{ fontWeight: 800, fontSize: 11, color: 'var(--text-primary)' }}>{sig.type}</span>
        </div>
        <span className={`badge ${badgeClass}`} style={{ fontSize: 8 }}>{sig.gravite}</span>
      </div>
      <div className="flex items-center justify-between mt-2">
        <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: 0, opacity: 0.8 }}>#{sig.id} · {ago < 1 ? 'Maintenant' : `${ago}m`}</p>
        <div className="flex items-center gap-2">
          {!sig.affectations?.length && (
            <button className="px-2 py-0.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-[8px] font-black uppercase tracking-widest transition-colors">
              Assigner
            </button>
          )}
          <p style={{ fontSize: 9, fontWeight: 900, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{sig.citoyen?.nom || 'Anonyme'}</p>
        </div>
      </div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
const SITACView: React.FC<SITACViewProps> = ({
  socket, signalements, agents, zones, heatmap, isConnected, onReload, addTicker,
  predictions, stats, isCrisis, onDismissCrisis, user
}) => {
  const [selectedSOS, setSelectedSOS] = useState<Signalement | null>(null);
  const [flyTarget, setFlyTarget] = useState<[any, any] | null>(null);
  const [routeLine, setRouteLine] = useState<[[number, number], [number, number]] | null>(null);
  const [gravFilter, setGravFilter] = useState<string>('ALL');
  const [reloading, setReloading] = useState(false);
  const [lockedAgentId, setLockedAgentId] = useState<number | null>(null);
  const [sectorPolygons, setSectorPolygons] = useState<any[]>([]);
  const [eta, setEta] = useState<string>('Calcul...');
  const [showPredictions, setShowPredictions] = useState(false);
  const [patrolRoute, setPatrolRoute] = useState<[number, number][] | null>(null);
  
  // Tactical Auto-Focus Logic
  React.useEffect(() => {
    if (activeSOS.length > 0) {
      const sorted = [...activeSOS].sort((a, b) => new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime());
      const latest = sorted[0];
      const isVeryRecent = (Date.now() - new Date(latest.dateCreation).getTime()) < 15000;
      if (isVeryRecent && latest.latitude != null && latest.longitude != null) {
        setFlyTarget([latest.latitude, latest.longitude]);
      }
    }
  }, [activeSOS.length]);
  
  // Tactical Replay State (Phase 38)
  const [replayTime, setReplayTime] = useState<number>(0); // 0 = live, < 0 = past minutes
  const [isReplayMode, setIsReplayMode] = useState(false);

  // Tactical Replay State (Phase 38)

  const activeSOS = signalements.filter(s => s.statut === 'NOUVEAU' || s.statut === 'EN_COURS' || s.statut === 'ZONE_INCONNUE');
  
  // Filter by time if in Replay Mode (Elite Logic)
  const timeFilteredSOS = isReplayMode 
    ? signalements.filter(s => {
        const createT = new Date(s.dateCreation).getTime();
        const targetT = Date.now() + replayTime * 60000;
        
        // Check closing time from interventions
        const closeT = s.affectations?.flatMap(a => a.interventions || [])
          .map(i => i.dateFin ? new Date(i.dateFin).getTime() : null)
          .filter(t => t !== null)
          .sort((a, b) => (b as number) - (a as number))[0]; // Latest close time

        return createT <= targetT && (!closeT || closeT > targetT);
      })
    : activeSOS;

  const filteredSOS = gravFilter === 'ALL' ? timeFilteredSOS : timeFilteredSOS.filter(s => s.gravite === gravFilter);

  React.useEffect(() => {
    if (lockedAgentId) {
      const agent = agents.find(a => a.id === lockedAgentId);
      if (agent?.latitude && agent?.longitude) {
        setFlyTarget([agent.latitude, agent.longitude]);

        // Calculate dynamic ETA if agent is on mission
        const targetSOS = filteredSOS.find(s => s.affectations?.some((af: any) => af.agentId === lockedAgentId));
        if (targetSOS) {
          const from = turf.point([agent.longitude, agent.latitude]);
          const to = turf.point([targetSOS.longitude, targetSOS.latitude]);
          const distance = turf.distance(from, to, { units: 'kilometers' });
          const speed = 40; // 40 km/h average in urban intervention
          const timeInMinutes = Math.ceil((distance / speed) * 60);
          setEta(`${timeInMinutes} min`);
        } else {
          setEta('--');
        }
      }
    }
  }, [agents, lockedAgentId, filteredSOS]);


  React.useEffect(() => {
    if (!socket) return;
    
    socket.on('VOICE_BROADCAST', (payload: { from: number; data: ArrayBuffer; agentName?: string }) => {
      if (payload.from === user?.id) return; 
      
      const blob = new Blob([payload.data], { type: 'audio/webm' });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.play().catch(e => console.warn('Audio playback failed:', e));
      
      addTicker(`Réception Tactical Voice : ${payload.agentName || 'Unité de terrain'}`, 'info');
    });

    return () => {
      socket.off('VOICE_BROADCAST');
    };
  }, [socket, user, addTicker]);

  // ── Geo-Vigilance: Danger zone entry detection ──
  React.useEffect(() => {
    agents.forEach(agent => {
      if (agent.latitude && agent.longitude && sectorPolygons.length > 0) {
        const point = turf.point([agent.longitude, agent.latitude]);
        sectorPolygons.forEach(sector => {
          if (turf.booleanPointInPolygon(point, sector)) {
            // Only alert once or periodically
            if (Math.random() > 0.98) { // Simulate threshold/debounce for demo
              addTicker(`Alerte Géo-Vigilance : Agent ${agent.nom} en zone critique`, 'alert');
            }
          }
        });
      }
    });
  }, [agents, sectorPolygons, addTicker]);

  // ── Intelligence: Identify Risk Sectors via Turf.js ──
  React.useEffect(() => {
    const clusterRiskSectors = () => {
      const vitalSOS = signalements.filter(s => s.gravite === 'VITAL' || s.gravite === 'CRITIQUE');
      if (vitalSOS.length < 2) return;

      const points = turf.featureCollection(
        vitalSOS.map(s => turf.point([s.longitude, s.latitude]))
      );
      
      try {
        // Generate a concave hull around hotspots
        const hull = turf.concave(points, { maxEdge: 0.1, units: 'kilometers' });
        if (hull) {
          // Buffering to simulate "road alignment" (blocks)
          const buffered = turf.buffer(hull, 0.05, { units: 'kilometers' });
          setSectorPolygons([buffered]);
        }
      } catch (e) { console.warn('Turf concave failed', e); }
    };

    clusterRiskSectors();
  }, [signalements]);

  // ── IA: Generate Patrol Suggestion baseline ──
  const generatePatrolSuggestion = () => {
    if (predictions.length < 2) {
      toast.info('Pas assez de préditions IA pour suggérer une patrouille.');
      return;
    }
    const points = predictions.slice(0, 5)
      .filter(p => p.latitude != null && p.longitude != null)
      .map(p => [p.latitude, p.longitude]);
    if (points.length < 2) {
      toast.info('Pas assez de préditions valides pour suggérer une patrouille.');
      return;
    }
    setPatrolRoute(points as [number, number][]);
    addTicker('Itinéraire de patrouille prédictif généré par l\'IA', 'success');
  };

  const handleAssign = async (sigId: number, agentId: number) => {
    try {
      await adminService.forceAssign(sigId, agentId);
      const agent = agents.find(a => a.id === agentId);
      const sig = signalements.find(s => s.id === sigId);
      if (agent?.latitude && agent?.longitude && sig?.latitude && sig?.longitude) {
        setRouteLine([[agent.latitude, agent.longitude], [sig.latitude, sig.longitude]]);
        setTimeout(() => setRouteLine(null), 30000);
      }
      addTicker(`Agent ${agent?.nom} affecté au SOS #${sigId}`, 'success');
      toast.success(`Agent ${agent?.nom} affecté`);
      setSelectedSOS(null);
      onReload();
    } catch { toast.error('Erreur lors de l\'affectation'); }
  };

  const handleCreateZone = async (latlng: { lat: number; lng: number }) => {
    const nom = prompt('Nom de la zone :'); if (!nom) return;
    try {
      await adminService.createZone({ nom, localisation: JSON.stringify({ lat: latlng.lat, lng: latlng.lng }), rayon_action: 1000, niveau_priorite: 1 });
      onReload();
    } catch { toast.error('Erreur'); }
  };

  // ── Optimization: Memoized Marker Layers ──
  const sosMarkers = React.useMemo(() => {
    console.log(`🗺️ [SITACMap] Rendering SOS Markers. Active Count: ${activeSOS.length}, Filtered Count: ${filteredSOS.length}`);
    return filteredSOS.filter(sig => sig.latitude != null && sig.longitude != null).map(sig => {
      const lat = typeof sig.latitude === 'string' ? parseFloat(sig.latitude) : sig.latitude;
      const lng = typeof sig.longitude === 'string' ? parseFloat(sig.longitude) : sig.longitude;
      
      console.log(`📍 [SITACMap] Drawing Marker for #${sig.id} at [${lat}, ${lng}] - Status: ${sig.statut}`);
      
      if (isNaN(lat) || isNaN(lng)) {
        console.error(`❌ [SITACMap] Invalid coordinates for #${sig.id}:`, { lat: sig.latitude, lng: sig.longitude });
        return null;
      }

      return (
        <Marker 
          key={sig.id} 
          position={[lat, lng]}
          eventHandlers={{ click: () => { setSelectedSOS(sig); setFlyTarget([lat, lng]); } }}
          icon={L.divIcon({ 
            className: 'custom-div-icon', 
            html: `<div class="sos-marker ${getGravityClass(sig.gravite)} ${sig.gravite.toLowerCase()}"></div>` 
          })} 
        />
      );
    });
  }, [filteredSOS]);

  const agentMarkers = React.useMemo(() => (
    agents.map((a, i) => {
      const lat = typeof a.latitude === 'string' ? parseFloat(a.latitude) : a.latitude;
      const lng = typeof a.longitude === 'string' ? parseFloat(a.longitude) : a.longitude;
      if (lat == null || lng == null || isNaN(lat) || isNaN(lng)) return null;

      return (
        <Marker key={a.id} position={[lat, lng]}
          eventHandlers={{ click: () => setLockedAgentId(a.id === lockedAgentId ? null : a.id) }}
          icon={L.divIcon({ 
            className: 'custom-div-icon', 
            html: `
              <div class="agent-marker-container" style="transform: scale(${lockedAgentId === a.id ? 1.2 : 1})">
                <div class="agent-marker ${a.isOccupied ? 'occupied' : 'free'}" title="${a.grade || 'Agent'} - ${a.unite || 'Unité Standard'}">
                  <span class="agent-grade-tag">${(a.grade || 'A').slice(0, 2).toUpperCase()}</span>
                  <div style="font-size: 8px; font-weight: 900;">${a.nom[0]}${a.prenom[0]}</div>
                  
                  <!-- Unit Status Widget (Phase 38) -->
                  ${lockedAgentId === a.id ? `
                    <div class="unit-status-widget">
                      <div class="u-stat"><div class="u-bar" style="width: ${80 - i*5}%"></div></div>
                      <div class="u-meta">
                         <span>${90 - i*2}% BAT</span>
                         <span>${i%2 === 0 ? 'MOV' : 'STBY'}</span>
                      </div>
                    </div>
                  ` : ''}
                </div>
              </div>
            ` 
          })} />
      );
    })
  ), [agents, lockedAgentId]);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{ height: 48, background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12 }}>
        <MapIcon style={{ width: 14, height: 14, color: 'var(--text-muted)' }} />
        <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>SITAC OPERATIONS</span>
        <div className="divider-v" />
        {['ALL', 'VITAL', 'CRITIQUE', 'MOYEN'].map(f => (
          <button key={f} onClick={() => setGravFilter(f)}
            style={{
              padding: '4px 10px', borderRadius: 6, fontSize: 9, fontWeight: 900,
              background: gravFilter === f ? 'var(--accent-blue)' : 'transparent',
              color: gravFilter === f ? 'white' : 'var(--text-muted)', border: 'none', cursor: 'pointer'
            }}>{f}</button>
        ))}
        <div className="divider-v" />
        <button 
          onClick={() => setShowPredictions(!showPredictions)}
          className={`btn border-white/5 text-[9px] font-black uppercase tracking-widest px-3 h-8 flex items-center gap-2 transition-all ${showPredictions ? 'bg-purple-500/30 text-purple-300 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.3)]' : 'bg-white/5 text-zinc-500'}`}
        >
          <div className={`w-2 h-2 rounded-full ${showPredictions ? 'bg-purple-400 animate-pulse' : 'bg-zinc-600'}`} />
          {showPredictions ? 'IA PROACTIVE : ACTIVE' : 'IA PROACTIVE : STANDBY'}
        </button>
        {showPredictions && (
          <button 
            onClick={generatePatrolSuggestion}
            className="btn bg-amber-500/20 text-amber-500 border-amber-500/30 text-[9px] font-black uppercase tracking-widest px-3 h-8 flex items-center gap-2"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Suggérer Patrouille
          </button>
        )}
        <div className="divider-v" />
        <button 
          onClick={() => { setIsReplayMode(!isReplayMode); if(isReplayMode) setReplayTime(0); }}
          className={`btn border-white/5 text-[9px] font-black uppercase tracking-widest px-3 h-8 flex items-center gap-2 ${isReplayMode ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-white/5 text-zinc-500'}`}
        >
          <Clock className="w-3.5 h-3.5" />
          {isReplayMode ? 'Sortir du Replay' : 'Replay Tactique'}
        </button>
        <div className="divider-v" />
        <button className="btn btn-ghost btn-sm btn-icon" style={{ marginLeft: 'auto' }} onClick={() => { setReloading(true); onReload(); setTimeout(() => setReloading(false), 500); }}>
          <RefreshCw style={{ width: 12, height: 12, animation: reloading ? 'spin 1s linear infinite' : 'none' }} />
        </button>
      </div>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 320px', overflow: 'hidden' }}>
        <div style={{ position: 'relative' }}>
          <MapContainer center={[14.7167, -17.4677]} zoom={13} style={{ width: '100%', height: '100%' }} zoomControl={false}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
            <FlyController target={flyTarget} />
            <ContextLayer onCreateZone={handleCreateZone} />

            {/* AntPath for Tactical Routing */}
            {routeLine && (
              <AntPath
                positions={routeLine}
                options={{
                  use: L.polyline,
                  delay: 400,
                  dashArray: [10, 20],
                  weight: 3,
                  color: '#3b82f6',
                  pulseColor: '#ffffff',
                  opacity: 0.8,
                  paused: false,
                  reverse: false,
                  className: 'patrol-line-animated'
                } as any}
              />
            )}

            {/* Turf-generated Risk Polygons (Neon Glow) */}
            {sectorPolygons.map((p, i) => {
              if (!p?.geometry?.coordinates?.[0]) return null;
              const ring = p.geometry.coordinates[0];
              const validPos = (ring as any[]).map((c: any) => {
                if (Array.isArray(c) && c[0] != null && c[1] != null) return [c[1], c[0]];
                return null;
              }).filter(c => c !== null);

              if (validPos.length < 3) return null;
              
              return (
                <Polygon 
                  key={i} 
                  positions={validPos as any} 
                  className="zone-grid-red" 
                />
              );
            })}

            {/* Tactical Heatmap Layer (Visual density) */}
            {heatmap.filter(h => h.lat && h.lng).map((h, i) => (
              <Circle 
                key={`heat-${i}`} 
                center={[h.lat, h.lng]} 
                radius={200 * (h.intensity || 1)} 
                pathOptions={{ 
                  fillColor: '#ef4444', 
                  fillOpacity: 0.15 * (h.intensity || 1), 
                  color: 'transparent',
                  className: 'heatmap-pulse' 
                }} 
              />
            ))}

            {/* AI Predictive Hotspots (Purple Glow) */}
            {showPredictions && predictions.filter(p => p.latitude && p.longitude).map((p, i) => (
              <Circle
                key={`pred-${i}`}
                center={[p.latitude, p.longitude]}
                radius={250}
                pathOptions={{
                  fillColor: '#a855f7',
                  fillOpacity: 0.3,
                  color: '#a855f7',
                  weight: 2,
                  className: 'predictive-hospot-pulse'
                }}
              >
                <Popup>
                  <div className="telemetry-widget" style={{ minWidth: 140, padding: 8, borderLeft: '3px solid #a855f7' }}>
                    <div className="tel-label" style={{ color: '#a855f7', marginBottom: 4 }}>Prediction IA</div>
                    <div className="tel-row"><span className="tel-label">Risque:</span><span className="tel-val">{p.niveauRisque || 'Haut'}</span></div>
                    <div className="tel-row"><span className="tel-label">Probabilité:</span><span className="tel-val">{p.probabiliteDemain || '88%'}</span></div>
                  </div>
                </Popup>
              </Circle>
            ))}

            {/* IA Patrol Suggestion Path */}
            {patrolRoute && (
              <Polyline
                positions={patrolRoute}
                className="patrol-line-animated"
                pathOptions={{
                  color: '#fbbf24',
                  dashArray: '10, 10',
                  weight: 3,
                  opacity: 0.7
                }}
              />
            )}

            {/* Render Zones (Circle or Polygon) */}
            {zones.map(z => {
              const loc = parseZonePolygons(z.localisation);
              if (!loc) return null;
              const severityClass = z.niveau_priorite >= 3 ? 'zone-grid-red' : z.niveau_priorite >= 2 ? 'zone-grid-yellow' : 'zone-grid-green';

              if (Array.isArray(loc[0])) {
                const validRing = (loc as any[]).filter(p => p && p[0] != null && p[1] != null);
                if (validRing.length < 3) return null;
                return <Polygon key={z.id} positions={validRing as any} className={severityClass} />;
              }
              if (Array.isArray(loc) && loc[0] != null && loc[1] != null) {
                return <Circle key={z.id} center={loc as [number, number]} radius={z.rayon_action} className={severityClass} />;
              }
              return null;
            })}

            {sosMarkers}
            {agentMarkers}
          </MapContainer>

          <TalkieWalkieButton socket={socket} agents={agents} addTicker={addTicker} />

          {/* Map Totals Overlay */}
          <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 1000, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '8px 12px', display: 'flex', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} /><span style={{ fontSize: 10, fontWeight: 800 }}>{activeSOS.length} SOS</span></div>
            <div className="divider-v" />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} /><span style={{ fontSize: 10, fontWeight: 800 }}>{agents.filter(a => !a.isOccupied).length} AGENTS</span></div>
          </div>

          {/* Intervention Status Banner Overlay */}
          <AnimatePresence>
            {lockedAgentId && (
              <motion.div 
                initial={{ y: 50, opacity: 0 }} 
                animate={{ y: 0, opacity: 1 }} 
                exit={{ y: 50, opacity: 0 }}
                style={{ 
                  position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', 
                  zIndex: 2000, minWidth: 400,
                  background: 'rgba(12,12,14,0.95)', border: '1px solid #27272a',
                  borderRadius: 12, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 16,
                  backdropFilter: 'blur(20px)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
                }}
              >
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Radio className="w-5 h-5 text-blue-500 animate-pulse" />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 9, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', margin: 0 }}>
                    Suivi Tactique - Agent {agents.find(a => a.id === lockedAgentId)?.nom}
                  </p>
                  <p style={{ fontSize: 13, fontWeight: 900, color: 'white', margin: '2px 0 0' }}>
                    {agents.find(a => a.id === lockedAgentId)?.isOccupied ? 'En route vers intervention' : 'En patrouille active'}
                    <span style={{ color: '#71717a', fontSize: 11, marginLeft: 8, fontWeight: 500 }}>
                      · Arrivée estimée : {eta}
                    </span>
                  </p>
                </div>
                <div className="telemetry-widget" style={{ marginLeft: 20 }}>
                  <div className="tel-row">
                    <span className="tel-label">Vitesse</span>
                    <span className="tel-val">{Math.floor(Math.random() * 30) + 10} KM/H</span>
                  </div>
                  <div className="tel-row">
                    <span className="tel-label">Session</span>
                    <span className="tel-val">04:22:15</span>
                  </div>
                  <div className="tel-row">
                    <span className="tel-label">Perf</span>
                    <span className="tel-val">12 SUCCESS</span>
                  </div>
                </div>

                <button 
                  onClick={() => setLockedAgentId(null)}
                  className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors"
                >
                  Détacher
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Replay Indicator (Phase 38) */}
          <AnimatePresence>
            {isReplayMode && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                className="replay-alert-badge"
              >
                <div className="replay-red-dot" />
                <span>Tactical Stream : Historical Mode <span style={{ color: '#3b82f6', marginLeft: 8 }}>T - {Math.abs(replayTime)}m</span></span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tactical Replay Slider (Phase 38) */}
          <AnimatePresence>
            {isReplayMode && (
              <motion.div 
                initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
                className="timeline-bar"
                style={{ 
                  position: 'absolute', bottom: 20, left: 20, right: 340, zIndex: 3000,
                  borderRadius: 12, padding: '16px 24px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                  <div style={{ minWidth: 120 }}>
                    <div style={{ fontSize: 10, fontWeight: 900, color: '#3b82f6', textTransform: 'uppercase' }}>Mode Replay</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: 'white' }}>T - {Math.abs(replayTime)} MIN</div>
                  </div>
                  <input 
                    type="range" min="-120" max="0" step="1" 
                    value={replayTime} onChange={(e) => setReplayTime(parseInt(e.target.value))}
                    style={{ flex: 1, accentColor: '#3b82f6' }}
                  />
                  <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--text-muted)', textAlign: 'right' }}>
                    Visualisation historique des flux d'intervention
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Crisis Management Side Panel (Phase 38) */}
          <AnimatePresence>
            {isCrisis && (
              <motion.div 
                initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }}
                style={{ 
                  position: 'absolute', top: 60, left: 12, bottom: 80, width: 260, zIndex: 4000,
                  background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', borderRadius: 16,
                  backdropFilter: 'blur(20px)', padding: 20, display: 'flex', flexDirection: 'column',
                  boxShadow: '0 0 40px rgba(239,68,68,0.2)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <AlertTriangle className="text-red-500 w-6 h-6 animate-pulse" />
                  <span style={{ fontSize: 14, fontWeight: 900, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Crisis Command</span>
                </div>
                
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { label: 'Déployer Renforts', icon: Users, color: '#ef4444' },
                    { label: 'Confinement Zone', icon: Shield, color: '#ef4444' },
                    { label: 'Alerte Générale', icon: Radio, color: '#ef4444' }
                  ].map(btn => (
                    <button key={btn.label} className="btn w-full justify-start gap-3 bg-red-500/10 border-red-500/20 hover:bg-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest p-3">
                      <btn.icon className="w-4 h-4" />
                      {btn.label}
                    </button>
                  ))}
                </div>

                <button 
                  onClick={onDismissCrisis}
                  className="mt-auto btn w-full bg-white text-black font-black uppercase text-[10px] py-3 hover:bg-zinc-200"
                >
                  Levée de l'alerte
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* SOS Panel */}
        <div style={{ background: 'var(--bg-elevated)', borderLeft: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Radio style={{ width: 14, height: 14, color: activeSOS.length > 0 ? '#ef4444' : '#52525b' }} />
            <span style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase' }}>Flux d'incidents</span>
          </div>
          <div className="scroll-area" style={{ flex: 1 }}>
            <AnimatePresence>
              {filteredSOS.map((sig, i) => (
                <SOSSideItem key={sig.id} sig={sig} index={i} onClick={() => { setSelectedSOS(sig); setFlyTarget([sig.latitude, sig.longitude]); }} />
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <SOSSheet 
        socket={socket}
        signalement={selectedSOS} 
        agents={agents} 
        onAssign={handleAssign} 
        onClose={() => setSelectedSOS(null)} 
        onCloturer={() => onReload()} 
      />
    </div>
  );
};

export default SITACView;
