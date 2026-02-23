import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './SitacMap.css';
import api, { adminService, MEDIA_ROOT } from '../services/api';
import { io, Socket } from 'socket.io-client';
import { User, Signalement, Gravite, Statut, Zone } from '../types';
import { Play, Mic, Image as ImageIcon, Zap, Loader2, MessageCircle, Map as MapIcon, Calendar, Volume2, Wifi, WifiOff, Save, Trash2, Plus } from 'lucide-react';
import TacticalChat from '../components/TacticalChat';

// Fix Leaflet icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const MapStateHandler = ({ onStateChange }: { onStateChange: (center: [number, number], zoom: number) => void }) => {
  useMapEvents({
    moveend: (e) => {
      const map = e.target;
      const center = map.getCenter();
      onStateChange([center.lat, center.lng], map.getZoom());
    },
    zoomend: (e) => {
      const map = e.target;
      const center = map.getCenter();
      onStateChange([center.lat, center.lng], map.getZoom());
    }
  });
  return null;
};

const SitacMap = () => {
  const [signalements, setSignalements] = useState<Signalement[]>([]);
  const [agents, setAgents] = useState<User[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [heatmap, setHeatmap] = useState<any[]>([]);
  const [center, setCenter] = useState<[number, number]>([14.7167, -17.4677]);
  const [zoom, setZoom] = useState(13);
  const [loadingAssign, setLoadingAssign] = useState<number | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedAgentChat, setSelectedAgentChat] = useState<User | null>(null);
  const [isEditingZones, setIsEditingZones] = useState(false);
  const [heatmapDays, setHeatmapDays] = useState(0); // 0 = Temps réel
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialiser le son d'alerte (sonar/crise)
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    
    const loadPreferences = async () => {
      if (window.electron?.store) {
        const savedCenter = await window.electron.store.get('map-center');
        const savedZoom = await window.electron.store.get('map-zoom');
        if (savedCenter) setCenter(savedCenter);
        if (savedZoom) setZoom(savedZoom);
      }
    };
    
    loadPreferences();
    fetchData();
    
    const s = io('http://localhost:3000', {
      auth: { token: localStorage.getItem('admin_token') }
    });
    setSocket(s);

    s.on('connect', () => setIsConnected(true));
    s.on('disconnect', () => setIsConnected(false));

    s.on('nouveauSignalement', (sig: Signalement) => {
      setSignalements(prev => [sig, ...prev]);
      if (sig.gravite === Gravite.VITAL) {
        audioRef.current?.play().catch(e => console.log('Audio blocked', e));
      }
      if (window.electron) {
        window.electron.sendNotification('ALERTE SOS', `Nouveau signalement: ${sig.type} - ${sig.description}`);
      }
    });

    s.on('agentPositionUpdate', (data: any) => {
      setAgents((prev) => {
        const index = prev.findIndex((a) => a.id === data.agentId);
        if (index !== -1) {
          const newAgents = [...prev];
          newAgents[index] = { ...newAgents[index], latitude: data.latitude, longitude: data.longitude };
          return newAgents;
        }
        return prev;
      });
    });

    return () => {
      s.disconnect();
    };
  }, []);

  useEffect(() => {
    fetchHeatmap();
  }, [heatmapDays]);

  const fetchData = async () => {
    try {
      const [sigRes, agentsRes, zonesRes] = await Promise.all([
        api.get('/signalements/all'),
        api.get('/users/all'), 
        adminService.getZones()
      ]);
      setSignalements(sigRes.data);
      setAgents(agentsRes.data.filter((u: any) => u.role === 'AGENT'));
      setZones(zonesRes.data);
      fetchHeatmap();
    } catch (error) {
      console.error('Erreur fetchData:', error);
    }
  };

  const fetchHeatmap = async () => {
    try {
      const res = await adminService.getHeatmap(heatmapDays > 0 ? heatmapDays : undefined);
      setHeatmap(res.data);
    } catch (error) {
       console.error(error);
    }
  };

  const handleMapChange = (newCenter: [number, number], newZoom: number) => {
    if (window.electron?.store) {
      window.electron.store.set('map-center', newCenter);
      window.electron.store.set('map-zoom', newZoom);
    }
  };

  const handleForceAssign = async (sigId: number) => {
    const freeAgent = agents.find(a => !a.isOccupied);
    if (!freeAgent) {
      alert("Aucun agent libre disponible.");
      return;
    }

    setLoadingAssign(sigId);
    try {
      await adminService.forceAssign(sigId, freeAgent.id);
      fetchData();
    } catch (err: any) {
      alert("Échec de l'affectation.");
    } finally {
      setLoadingAssign(null);
    }
  };

  const handleUpdateZoneRadius = async (zone: Zone, newRadius: number) => {
    try {
      await adminService.updateZone(zone.id, { rayon_action: newRadius });
      setZones(prev => prev.map(z => z.id === zone.id ? { ...z, rayon_action: newRadius } : z));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex-1 relative flex overflow-hidden">
      <div className="flex-1 relative">
        <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }} zoomControl={false}>
          <MapStateHandler onStateChange={handleMapChange} />
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; CARTO'
          />

          {zones.map(zone => {
            let lat = 0, lng = 0;
            try {
              // Support multi-format (JSON ou "lat, lng")
              if (zone.localisation.includes('{')) {
                const coords = JSON.parse(zone.localisation);
                lat = Number(coords.lat);
                lng = Number(coords.lng);
              } else {
                const parts = zone.localisation.split(',');
                lat = parseFloat(parts[0].trim());
                lng = parseFloat(parts[1].trim());
              }
            } catch (e) {
              console.error(`Erreur localisation zone ${zone.id}`, e);
              return null;
            }

            if (isNaN(lat) || isNaN(lng)) return null;

            return (
              <Circle
                key={zone.id}
                center={[lat, lng]}
                radius={zone.rayon_action}
                pathOptions={{ 
                  fillColor: isEditingZones ? '#3B82F6' : '#1F2937', 
                  color: isEditingZones ? '#3B82F6' : '#374151', 
                  fillOpacity: isEditingZones ? 0.2 : 0.05,
                  weight: isEditingZones ? 2 : 1
                }}
                eventHandlers={{
                  click: () => {
                    if (isEditingZones) {
                      const newRad = parseInt(prompt("Nouveau rayon de patrouille (mètres) :", zone.rayon_action.toString()) || "");
                      if (newRad) handleUpdateZoneRadius(zone, newRad);
                    }
                  }
                }}
              >
                <Popup className="dark-popup">
                  <p className="font-bold text-xs uppercase tracking-widest">{zone.nom}</p>
                  <p className="text-[10px] text-gray-500">Priorité: {zone.niveau_priorite}</p>
                </Popup>
              </Circle>
            );
          })}

          {heatmap.filter(p => !isNaN(Number(p.latitude)) && !isNaN(Number(p.longitude))).map((point: any, i: number) => (
            <Circle
              key={`heat-${i}`}
              center={[Number(point.latitude), Number(point.longitude)]}
              radius={heatmapDays > 0 ? 300 : 200}
              pathOptions={{ fillColor: '#DC2626', color: 'transparent', fillOpacity: heatmapDays > 0 ? 0.4 : 0.3 }}
            />
          ))}

          {signalements.filter(s => s.statut !== Statut.CLOTURE && s.statut !== Statut.ANNULE && s.latitude && s.longitude).map(sig => (
            <Marker 
              key={sig.id} 
              position={[sig.latitude!, sig.longitude!]}
              icon={L.divIcon({
                className: 'custom-div-icon',
                html: `<div class="w-6 h-6 bg-danger rounded-full border-2 border-white ${sig.gravite === Gravite.VITAL ? 'animate-ping' : 'animate-pulse'} flex items-center justify-center text-[10px] font-bold">SOS</div>`,
                iconSize: [24, 24],
                iconAnchor: [12, 12]
              })}
            >
              <Popup className="dark-popup">
                <div className="p-2 space-y-3 min-w-[200px]">
                  <div className="flex justify-between items-start">
                    <p className="font-bold text-danger text-lg">{sig.type}</p>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                      sig.gravite === Gravite.VITAL ? 'bg-danger text-white' : 'bg-warning text-black'
                    }`}>
                      {sig.gravite}
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed">{sig.description}</p>
                  <div className="flex gap-2 pt-1">
                    {sig.mediaUrl && <a href={`${MEDIA_ROOT}/${sig.mediaUrl}`} target="_blank" className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"><ImageIcon className="w-4 h-4 text-primary" /></a>}
                    {sig.audioUrl && <a href={`${MEDIA_ROOT}/${sig.audioUrl}`} target="_blank" className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"><Mic className="w-4 h-4 text-warning" /></a>}
                    {sig.videoUrl && <a href={`${MEDIA_ROOT}/${sig.videoUrl}`} target="_blank" className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"><Play className="w-4 h-4 text-green-500" /></a>}
                  </div>
                  <button 
                    onClick={() => handleForceAssign(sig.id)}
                    disabled={loadingAssign === sig.id}
                    className="w-full bg-primary hover:bg-primary-dark disabled:bg-gray-700 text-white text-[10px] font-bold py-2.5 rounded-xl transition-all uppercase tracking-wider flex items-center justify-center gap-2"
                  >
                    {loadingAssign === sig.id ? <Loader2 className="w-3 h-3 animate-spin"/> : <Zap className="w-3 h-3"/>}
                    Affectation Prioritaire
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}

          {agents.filter(a => a.latitude && a.longitude).map(agent => (
            <Marker 
              key={agent.id} 
              position={[agent.latitude!, agent.longitude!]}
              icon={L.divIcon({
                className: 'custom-div-icon',
                html: `<div class="w-5 h-5 ${agent.isOccupied ? 'bg-danger' : 'bg-green-500'} rounded-full border-2 border-white shadow-xl shadow-black/50 overflow-hidden flex items-center justify-center text-[8px] font-bold text-white">${agent.nom[0]}</div>`,
                iconSize: [20, 20],
                iconAnchor: [10, 10]
              })}
            >
              <Popup className="dark-popup">
                <div className="p-1 text-center">
                  <p className="font-bold text-sm leading-tight">{agent.nom} {agent.prenom}</p>
                  <p className="text-[10px] font-bold text-gray-500 uppercase mt-1">Zone: {zones.find(z => z.id === agent.zoneId)?.nom || 'N/A'}</p>
                  <button 
                    onClick={() => setSelectedAgentChat(agent)}
                    className="mt-3 w-full bg-gray-800 hover:bg-primary transition-colors py-2 rounded-lg text-[9px] font-bold uppercase flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-3 h-3" />
                    Chat TACTIQUE
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Top Indicators */}
        <div className="absolute top-6 left-6 z-[1000] flex gap-3">
          <div className="bg-surface/80 backdrop-blur-md border border-gray-800 px-4 py-2 rounded-2xl flex items-center gap-2 shadow-xl">
             {isConnected ? <Wifi className="w-4 h-4 text-green-500" /> : <WifiOff className="w-4 h-4 text-danger" />}
             <span className="text-[10px] font-bold uppercase tracking-widest">{isConnected ? 'Connecté' : 'Hors Ligne'}</span>
          </div>
          
          <div className="bg-surface/80 backdrop-blur-md border border-gray-800 p-1 rounded-2xl flex shadow-xl">
             {[0, 1, 7, 30].map(d => (
               <button 
                 key={d}
                 onClick={() => setHeatmapDays(d)}
                 className={`px-3 py-1.5 rounded-xl text-[9px] font-extrabold transition-all uppercase ${heatmapDays === d ? 'bg-primary text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
               >
                 {d === 0 ? 'Live' : `${d}j`}
               </button>
             ))}
             <div className="w-px bg-gray-800 mx-1"></div>
             <button className="px-3 py-1.5 text-gray-400 hover:text-white transition-colors"><Calendar className="w-4 h-4" /></button>
          </div>
        </div>

        {/* Action Controls */}
        <div className="absolute bottom-6 left-6 z-[1000] flex flex-col gap-3">
           <button 
             onClick={() => setIsEditingZones(!isEditingZones)}
             className={`w-12 h-12 rounded-2xl shadow-2xl flex items-center justify-center transition-all ${isEditingZones ? 'bg-primary text-white scale-110' : 'bg-surface text-gray-400 border border-gray-800'}`}
             title="Édition de Zone"
           >
             <MapIcon className="w-6 h-6" />
           </button>
           <button className="w-12 h-12 bg-surface border border-gray-800 rounded-2xl shadow-2xl flex items-center justify-center text-gray-400 hover:text-white transition-all"><Plus className="w-6 h-6" /></button>
        </div>

        {/* Live Feed Overlay */}
        <div className="absolute top-6 right-6 w-80 max-h-[500px] overflow-hidden bg-surface/90 backdrop-blur border border-gray-800 rounded-[2rem] shadow-2xl z-[1000] p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">Flux Tactique</h3>
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse delay-75"></div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {signalements.slice(0, 15).map((sig) => (
              <div key={sig.id} className="p-4 bg-gray-800/40 rounded-2xl border border-gray-800 hover:border-primary/30 transition-all cursor-pointer group hover:bg-gray-800/60 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-tighter ${
                    sig.statut === Statut.EN_COURS ? 'bg-primary/20 text-primary' : 
                    sig.statut === Statut.CLOTURE ? 'bg-green-500/20 text-green-500' : 'bg-danger/20 text-danger'
                  }`}>
                    {sig.statut}
                  </span>
                  <span className="text-[9px] text-gray-600 font-mono font-bold">REQ.IDX-0{sig.id}</span>
                </div>
                <p className="text-sm font-bold group-hover:text-primary transition-colors tracking-tight">{sig.type}</p>
                <div className="flex items-center gap-2 mt-1">
                   <p className="text-[10px] text-gray-500 font-medium">{new Date(sig.dateCreation).toLocaleTimeString()}</p>
                   <div className="w-1 h-1 rounded-full bg-gray-700"></div>
                   <p className="text-[10px] text-gray-500 font-bold uppercase">{sig.gravite}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Drawer */}
        {selectedAgentChat && (
          <TacticalChat 
            socket={socket} 
            agent={selectedAgentChat} 
            onClose={() => setSelectedAgentChat(null)} 
          />
        )}
      </div>

      {isEditingZones && (
        <div className="w-80 bg-surface border-l border-gray-800 p-8 flex flex-col gap-6 animate-in slide-in-from-right duration-300">
           <div>
              <h2 className="text-xl font-bold tracking-tight text-white mb-2">Geo-Fencing</h2>
              <p className="text-xs text-gray-500">Mode édition actif. Cliquez sur un cercle pour modifier son rayon.</p>
           </div>
           
           <div className="space-y-4">
              {zones.map(z => (
                <div key={z.id} className="p-4 bg-gray-900 border border-gray-800 rounded-2xl">
                   <p className="text-xs font-bold text-white mb-1">{z.nom}</p>
                   <div className="flex justify-between items-center text-[10px] text-gray-500 uppercase font-bold">
                      <span>{z.rayon_action} m</span>
                      <span>Prio: {z.niveau_priorite}</span>
                   </div>
                   <div className="flex gap-2 mt-3">
                      <button className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-[9px] font-bold transition-all uppercase">Tracer</button>
                      <button className="p-2 text-danger hover:bg-danger/10 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                   </div>
                </div>
              ))}
           </div>
           
           <button className="mt-auto w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-2xl text-[11px] uppercase tracking-widest shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" />
              Nouvelle Zone
           </button>
           <button 
             onClick={() => setIsEditingZones(false)}
             className="w-full bg-gray-800 hover:bg-gray-700 text-gray-400 font-bold py-3 rounded-2xl text-[11px] uppercase tracking-widest transition-all"
           >
             Fermer
           </button>
        </div>
      )}
    </div>
  );
};

export default SitacMap;
