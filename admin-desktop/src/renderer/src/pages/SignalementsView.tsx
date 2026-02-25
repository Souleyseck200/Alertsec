import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, Search, Filter, Clock, MapPin, User, 
  Phone, Shield, AlertTriangle, CheckCircle, 
  ChevronRight, Radio, Activity, Image as ImageIcon,
  Volume2, Trash2, ExternalLink, Navigation, X,
  Play, Pause, Rewind, FastForward, Maximize2
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Polyline, useMap, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Signalement, Agent } from '../types';
import { MEDIA_ROOT } from '../services/api';
import { Badge } from '../components/ui/badge';
import { Card } from '../components/ui/card';

interface SignalementsViewProps {
  signalements: Signalement[];
  zones: any[];
  citizenLocations: Record<number, { latitude: number; longitude: number }>;
  onReload: () => void;
}

const MapController: React.FC<{ center: [number, number] | null }> = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 15, { animate: true });
    }
  }, [center, map]);
  return null;
};

import { adminService } from '../services/api';
import { toast } from 'sonner';

const DetailRow = ({ icon: Icon, label, val, mono }: any) => (
  <div className="flex items-center gap-3">
    <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-center">
      <Icon className="w-3.5 h-3.5 text-zinc-500" />
    </div>
    <div>
      <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest leading-none mb-1">{label}</p>
      <p className={`text-xs text-white font-bold leading-none ${mono ? 'font-mono' : ''}`}>{val}</p>
    </div>
  </div>
);

const SignalementsView: React.FC<SignalementsViewProps> = ({ signalements, zones, citizenLocations, onReload }) => {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [activeMedia, setActiveMedia] = useState<{ type: 'IMAGE' | 'AUDIO' | 'VIDEO', url: string } | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'ALERTS' | 'ZONES'>('ALERTS');
  const [isAutoFollow, setIsAutoFollow] = useState(true);

  const selectedSig = useMemo(() => 
    signalements.find(s => s.id === selectedId), 
  [signalements, selectedId]);

  const filteredSigs = useMemo(() => {
    return signalements
      .filter(s => {
        const matchesSearch = s.type.toLowerCase().includes(search.toLowerCase()) || 
                             s.description.toLowerCase().includes(search.toLowerCase()) ||
                             (s.citoyen?.nom || '').toLowerCase().includes(search.toLowerCase());
        const matchesStatus = filterStatus === 'ALL' || s.statut === filterStatus;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime());
  }, [signalements, search, filterStatus]);

  // Current location of the reporting citizen if available
  const currentLoc = selectedSig ? citizenLocations[selectedSig.citoyenId] : null;

  // ─── ACTIONS ───────────────────────────────────────────────────────────────
  const handleDeleteSignalement = async (id: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir archiver (supprimer) ce signalement définitivement ?')) return;
    try {
      await adminService.deleteSignalement(id);
      toast.success('Signalement archivé avec succès');
      setSelectedId(null);
      onReload();
    } catch (e) {
      toast.error('Erreur lors de l\'archivage');
    }
  };

  const handleDeleteZone = async (id: number) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette zone de patrouille ?')) return;
    try {
      await adminService.deleteZone(id);
      toast.success('Zone supprimée avec succès');
      onReload();
    } catch (e) {
      toast.error('Erreur lors de la suppression de la zone');
    }
  };

  // Custom Icons
  const sosIcon = L.divIcon({
    className: 'sos-marker-initial',
    html: `<div class="w-4 h-4 rounded-full bg-red-600 border-2 border-white shadow-[0_0_10px_rgba(220,38,38,0.5)]"></div>`,
    iconSize: [16, 16]
  });

  const citizenIcon = L.divIcon({
    className: 'citizen-marker-live',
    html: `<div class="relative">
            <div class="absolute inset-0 w-8 h-8 bg-blue-500/30 rounded-full animate-ping -left-1 -top-1"></div>
            <div class="w-6 h-6 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center text-white shadow-xl relative z-10">
              <Navigation className="w-3 h-3 fill-current" />
            </div>
           </div>`,
    iconSize: [24, 24]
  });

  return (
    <div className="flex-1 flex overflow-hidden bg-[var(--bg-base)]">
      {/* ── Left Sidebar: Signalements List ── */}
      <div className="w-[380px] border-r border-[var(--border-subtle)] flex flex-col bg-[var(--bg-elevated)]">
        <div className="p-6 border-b border-[var(--border-subtle)]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[var(--accent-blue-glow)] flex items-center justify-center border border-[var(--border-accent)]">
                <Bell className="w-4 h-4 text-[var(--accent-blue)]" />
              </div>
              <h1 className="text-lg font-bold tracking-tight text-white uppercase">
                {activeTab === 'ALERTS' ? 'Flux' : 'Zones'} <span className="text-[var(--accent-blue)]">{activeTab === 'ALERTS' ? 'Global' : 'Patrouille'}</span>
              </h1>
            </div>
          </div>

          <div className="flex gap-2 p-1 bg-white/5 rounded-lg mb-4">
            <button 
              onClick={() => setActiveTab('ALERTS')}
              className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded transition-all ${activeTab === 'ALERTS' ? 'bg-[var(--accent-blue)] text-white' : 'text-zinc-500 hover:text-white'}`}
            >
              Urgences
            </button>
            <button 
              onClick={() => setActiveTab('ZONES')}
              className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded transition-all ${activeTab === 'ZONES' ? 'bg-[var(--accent-blue)] text-white' : 'text-zinc-500 hover:text-white'}`}
            >
              Secteurs
            </button>
          </div>

          {activeTab === 'ALERTS' && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <input 
                  type="text" 
                  placeholder="Filtrer les alertes..."
                  className="w-full bg-zinc-900 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-xs font-medium text-white focus:border-orange-500/50 outline-none"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {['ALL', 'NOUVEAU', 'EN_COURS', 'CLOTURE'].map(status => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-3 py-1.5 rounded text-[9px] font-bold uppercase tracking-widest whitespace-nowrap transition-all border ${filterStatus === status ? 'bg-[var(--accent-blue)] border-[var(--accent-blue)] text-white' : 'bg-white/5 border-white/5 text-zinc-500 hover:text-zinc-300'}`}
                  >
                    {status === 'ALL' ? 'Tous' : status.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
          {activeTab === 'ALERTS' ? (
            filteredSigs.map((sig, idx) => (
              <motion.div
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03 }}
                key={sig.id}
                onClick={() => setSelectedId(sig.id)}
                className={`p-4 rounded-xl cursor-pointer border transition-all relative overflow-hidden group ${selectedId === sig.id ? 'bg-[var(--accent-blue-glow)] border-[var(--border-accent)]' : 'bg-white/[0.02] border-white/5 hover:border-white/10'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${sig.gravite === 'VITAL' ? 'badge-vital' : 'bg-zinc-800 text-zinc-400'}`}>
                    {sig.gravite}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-600">{new Date(sig.dateCreation).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <h4 className="text-sm font-bold text-white uppercase tracking-tight truncate">{sig.type}</h4>
                <p className="text-[11px] text-zinc-500 mt-1 line-clamp-1">{sig.description}</p>
                
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-3 h-3 text-zinc-600" />
                    <span className="text-[10px] font-bold text-zinc-400 tracking-tight">{sig.citoyen?.prenom} {sig.citoyen?.nom}</span>
                  </div>
                  {sig.statut === 'EN_COURS' && (
                    <div className="flex items-center gap-1 text-[9px] text-[var(--accent-blue)] font-bold uppercase">
                      <Activity className="w-3 h-3" /> Live
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          ) : (
            zones.map((zone, idx) => (
              <motion.div
                key={zone.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-white/[0.02] border border-white/5 rounded-xl group hover:border-[var(--accent-blue-dim)] transition-all"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-white font-bold uppercase tracking-tight text-sm">{zone.nom}</h4>
                    <p className="text-[10px] text-zinc-600 mt-1">Secteur #{zone.id} • {zone.rayon_action}m radius</p>
                  </div>
                  <button 
                    onClick={() => handleDeleteZone(zone.id)}
                    className="p-2 text-zinc-600 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* ── Main Content: Detailed View & Tracking ── */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        <AnimatePresence mode="wait">
          {!selectedSig ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center p-20 text-center"
            >
              <div className="w-20 h-20 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center mb-6">
                 <Shield className="w-8 h-8 text-zinc-800" />
              </div>
              <h2 className="text-xl font-bold text-white uppercase tracking-tight mb-2">Centre de Surveillance</h2>
              <p className="text-zinc-500 text-xs max-w-sm">Sélectionnez une alerte pour accéder au dossier complet et activer le suivi satellite.</p>
            </motion.div>
          ) : (
            <motion.div 
              key={selectedSig.id}
              initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }}
              className="flex-1 flex flex-col p-8 overflow-y-auto custom-scrollbar"
            >
              {/* Header Details */}
              <div className="flex items-start justify-between mb-10">
                <div className="flex gap-6 items-center">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border shadow-xl ${selectedSig.gravite === 'VITAL' ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-[var(--accent-blue-glow)] border-[var(--border-accent)] text-[var(--accent-blue)]'}`}>
                    <AlertTriangle className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                       <h2 className="text-2xl font-bold text-white uppercase tracking-tight leading-none">{selectedSig.type}</h2>
                       <Badge variant={selectedSig.statut.toLowerCase() as any}>
                         {selectedSig.statut === 'EN_COURS' && <span className="inline-block w-1.5 h-1.5 bg-white rounded-full mr-1.5 animate-pulse" />}
                         {selectedSig.statut.replace('_', ' ')}
                       </Badge>
                    </div>
                    <p className="text-zinc-500 text-xs font-medium">Signalement ID #{selectedSig.id} • Protocole {selectedSig.gravite}</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button 
                    onClick={() => handleDeleteSignalement(selectedSig.id)}
                    className="h-10 px-5 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all text-[10px] font-bold uppercase tracking-widest"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-2 inline-block" /> Archiver
                  </button>
                  <button className="h-10 px-6 rounded-lg bg-[var(--accent-blue)] text-white font-bold text-[10px] uppercase tracking-widest hover:brightness-110 transition-all">
                    Déployer Unité
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-12 gap-8">
                {/* Alerteur Profile */}
                <div className="col-span-4 space-y-6">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500 border-l-2 border-[var(--accent-blue)] pl-3">Dossier Alerteur</h3>
                  
                  <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-6">
                    <div className="flex items-center gap-4">
                      {selectedSig.citoyen?.photoUrl ? (
                        <img src={selectedSig.citoyen.photoUrl.startsWith('http') ? selectedSig.citoyen.photoUrl : `http://localhost:3000${selectedSig.citoyen.photoUrl}`} className="w-16 h-16 rounded-xl object-cover border border-white/10" alt="Citizen" />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center">
                          <User className="w-8 h-8 text-zinc-700" />
                        </div>
                      )}
                      <div>
                        <h4 className="text-lg font-bold text-white tracking-tight">{selectedSig.citoyen?.nom} {selectedSig.citoyen?.prenom}</h4>
                        <div className="flex items-center gap-2 mt-1">
                           <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                           <p className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest">Compte Vérifié</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-white/5">
                       <DetailRow icon={Phone} label="Contact" val={selectedSig.citoyen?.telephone || '—'} mono />
                       <DetailRow icon={MapPin} label="Secteur" val={selectedSig.zoneId ? 'Sector ' + selectedSig.zoneId : 'Général'} />
                       <DetailRow icon={Clock} label="Date" val={new Date(selectedSig.dateCreation).toLocaleDateString('fr-FR')} />
                    </div>

                    <button className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-zinc-500 transition-colors">
                       Consulter profil complet
                    </button>
                  </div>

                  <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500 border-l-2 border-[var(--accent-blue)] pl-3">Indices Multimédia</h3>
                  <div className="space-y-3">
                    {selectedSig.mediaUrl && (
                      <div 
                        onClick={() => setActiveMedia({ type: 'IMAGE', url: selectedSig.mediaUrl! })}
                        className="aspect-video rounded-3xl overflow-hidden border border-white/5 bg-zinc-900 relative group cursor-pointer shadow-xl"
                      >
                        <img 
                          src={selectedSig.mediaUrl.startsWith('http') ? selectedSig.mediaUrl : `${MEDIA_ROOT}${selectedSig.mediaUrl}`} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                          alt="Indice" 
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                          <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                             <Maximize2 className="w-6 h-6 text-white" />
                          </div>
                        </div>
                      </div>
                    )}
                    {selectedSig.audioUrl && (
                      <div 
                        onClick={() => setActiveMedia({ type: 'AUDIO', url: selectedSig.audioUrl! })}
                        className="p-5 bg-gradient-to-r from-zinc-900 to-black border border-white/5 rounded-3xl space-y-3 cursor-pointer group hover:border-[var(--accent-blue-dim)] transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                               <Volume2 className="w-4 h-4" />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Audio Scruté par IA</p>
                          </div>
                          <Maximize2 className="w-3.5 h-3.5 text-zinc-600 group-hover:text-white transition-colors" />
                        </div>
                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                           <div className="w-1/3 h-full bg-orange-500/50" />
                        </div>
                      </div>
                    )}
                    {selectedSig.videoUrl && (
                      <div 
                         onClick={() => setActiveMedia({ type: 'VIDEO', url: selectedSig.videoUrl! })}
                         className="aspect-video rounded-3xl overflow-hidden border border-white/5 bg-zinc-900 relative group cursor-pointer shadow-xl"
                      >
                         <video 
                           src={selectedSig.videoUrl.startsWith('http') ? selectedSig.videoUrl : `${MEDIA_ROOT}${selectedSig.videoUrl}`} 
                           className="w-full h-full object-cover muted" 
                         />
                         <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                            <div className="w-14 h-14 rounded-full bg-[var(--accent-blue)] flex items-center justify-center text-white mb-3 shadow-2xl">
                               <Play className="w-6 h-6 ml-1" />
                            </div>
                            <p className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">Analyser Séquence</p>
                         </div>
                      </div>
                    )}
                    {!selectedSig.mediaUrl && !selectedSig.audioUrl && !selectedSig.videoUrl && (
                      <div className="p-8 border border-white/5 border-dashed rounded-3xl text-center text-[10px] font-black uppercase tracking-widest text-zinc-700">
                         Aucun indice multimédia
                      </div>
                    )}
                  </div>
                </div>

                {/* Real-time Tracking & Details */}
                <div className="col-span-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 border-l-2 border-orange-500 pl-3">Centrale de Géolocalisation Live</h3>
                    <div className="flex items-center gap-3">
                       <button 
                         onClick={() => setIsAutoFollow(!isAutoFollow)}
                         className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${isAutoFollow ? 'bg-blue-500 border-blue-400 text-white shadow-lg shadow-blue-500/20' : 'bg-white/5 border-white/5 text-zinc-500'}`}
                       >
                         {isAutoFollow ? 'Focus GPS Actif' : 'Caméra Libre'}
                       </button>
                       {currentLoc && (
                        <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-lg text-blue-400">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping" />
                          <span className="text-[9px] font-black uppercase tracking-widest">Suivi {currentLoc.latitude.toFixed(4)}...</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="h-[450px] w-full rounded-3xl overflow-hidden border border-white/5 bg-zinc-900 relative shadow-2xl group/map">
                    <MapContainer 
                      center={[Number(selectedSig.latitude) || 14.7167, Number(selectedSig.longitude) || -17.4677]} 
                      zoom={16} 
                      className="w-full h-full"
                      zoomControl={false}
                    >
                      <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                      
                      {/* Initial SOS Marker */}
                      <Marker position={[Number(selectedSig.latitude), Number(selectedSig.longitude)]} icon={sosIcon}>
                        <Popup className="tactical-popup">Point de déclenchement SOS</Popup>
                      </Marker>

                      {/* Live Citizen Marker with Trace */}
                      {currentLoc && (
                        <>
                          <Marker position={[currentLoc.latitude, currentLoc.longitude]} icon={citizenIcon}>
                            <Popup className="tactical-popup">Alerteur : {selectedSig.citoyen?.nom} (Mobile)</Popup>
                          </Marker>
                          <Polyline 
                            positions={[
                              [Number(selectedSig.latitude), Number(selectedSig.longitude)],
                              [currentLoc.latitude, currentLoc.longitude]
                            ]} 
                            color="#3b82f6" 
                            dashArray="8, 12"
                            weight={3}
                            opacity={0.6}
                          />
                          {isAutoFollow && <MapController center={[currentLoc.latitude, currentLoc.longitude]} />}
                        </>
                      )}
                    </MapContainer>
                    
                    {/* Scanning Animation */}
                    <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
                    
                    {/* Map Overlay HUD */}
                    <div className="absolute top-4 left-4 z-[400] bg-[var(--bg-card)]/80 backdrop-blur-xl border border-white/5 p-3 rounded-xl flex items-center gap-3">
                       <div className="w-8 h-8 rounded-lg bg-[var(--accent-blue-glow)] flex items-center justify-center">
                          <Activity className="w-4 h-4 text-[var(--accent-blue)]" />
                       </div>
                       <div>
                          <p className="text-[10px] font-bold text-white uppercase tracking-widest">{selectedSig.type}</p>
                          <p className="text-[8px] font-mono text-zinc-500">Live Feed Protocol</p>
                       </div>
                    </div>

                    <div className="absolute bottom-4 right-4 z-[400]">
                       <button className="w-10 h-10 bg-[var(--bg-card)]/80 backdrop-blur-xl border border-white/5 rounded-xl flex items-center justify-center text-white hover:bg-[var(--accent-blue)] transition-all">
                         <Navigation className="w-4 h-4" />
                       </button>
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-[var(--accent-blue)] opacity-40" />
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-3">Déposition</h4>
                    <p className="text-white text-lg font-medium leading-relaxed">
                      "{selectedSig.description}"
                    </p>
                    <div className="mt-6 pt-5 border-t border-white/5 grid grid-cols-3 gap-6">
                       <div className="flex flex-col">
                         <span className="text-[9px] font-bold text-zinc-600 uppercase mb-1">Status</span>
                         <span className="text-[10px] font-bold uppercase text-zinc-400">{selectedSig.statut}</span>
                       </div>
                       <div className="flex flex-col">
                         <span className="text-[9px] font-bold text-zinc-600 uppercase mb-1">Source</span>
                         <span className="text-[10px] font-bold text-zinc-400 uppercase">Mobile App</span>
                       </div>
                       <div className="flex flex-col">
                         <span className="text-[9px] font-bold text-zinc-600 uppercase mb-1">Priorité</span>
                         <span className="text-[10px] font-bold text-[var(--accent-amber)] uppercase">Standard</span>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Media Overlay */}
        <AnimatePresence>
          {activeMedia && (
            <MediaOverlay media={activeMedia} onClose={() => setActiveMedia(null)} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// ─── TACTICAL MEDIA PLAYER OVERLAY ───────────────────────────────────────────
const MediaOverlay = ({ media, onClose }: { media: { type: 'IMAGE' | 'AUDIO' | 'VIDEO', url: string }, onClose: () => void }) => {
  const mediaRef = React.useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const fullUrl = media.url.startsWith('http') ? media.url : `${MEDIA_ROOT}${media.url}`;

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (mediaRef.current) {
      if (isPlaying) mediaRef.current.pause();
      else mediaRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const skip = (seconds: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (mediaRef.current) {
      mediaRef.current.currentTime += seconds;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-12"
    >
      <button 
        onClick={onClose}
        className="absolute top-8 right-8 w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-all border border-white/10"
      >
        <X className="w-6 h-6" />
      </button>

      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        onClick={e => e.stopPropagation()}
        className="max-w-6xl w-full border border-white/10 rounded-[40px] overflow-hidden bg-zinc-900 shadow-[0_0_100px_rgba(0,0,0,0.5)] relative"
      >
        {media.type === 'IMAGE' && (
          <img src={fullUrl} className="w-full h-auto max-h-[80vh] object-contain" alt="Visual Evidence" />
        )}

        {media.type === 'AUDIO' && (
          <div className="py-20 px-12 flex flex-col items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500 mb-8 border border-orange-500/20 shadow-[0_0_40px_rgba(249,115,22,0.1)]">
              <Volume2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-white uppercase tracking-[0.2em] mb-2">Analyse Audio</h3>
            <p className="text-zinc-500 text-xs font-mono mb-12">DECRYPT_PROTOCOL_v4.2 // RAW_FEED</p>
            
            <audio 
              ref={mediaRef} 
              src={fullUrl} 
              onPlay={() => setIsPlaying(true)} 
              onPause={() => setIsPlaying(false)}
            />

            <div className="flex items-center gap-12 text-white">
              <button onClick={e => skip(-10, e)} className="p-4 hover:text-[var(--accent-blue)] transition-colors"><Rewind className="w-8 h-8" /></button>
              <button 
                onClick={togglePlay} 
                className="w-20 h-20 rounded-full bg-white text-zinc-950 flex items-center justify-center hover:scale-105 transition-all shadow-2xl"
              >
                {isPlaying ? <Pause className="w-10 h-10" /> : <Play className="w-10 h-10 ml-1" />}
              </button>
              <button onClick={e => skip(10, e)} className="p-4 hover:text-[var(--accent-blue)] transition-colors"><FastForward className="w-8 h-8" /></button>
            </div>
          </div>
        )}

        {media.type === 'VIDEO' && (
          <div className="relative group">
            <video 
              ref={mediaRef} 
              src={fullUrl} 
              className="w-full h-auto max-h-[80vh]" 
              onPlay={() => setIsPlaying(true)} 
              onPause={() => setIsPlaying(false)}
            />
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            
            <div className="absolute bottom-8 left-0 right-0 px-12 flex items-center justify-center gap-12 text-white z-10">
              <button onClick={e => skip(-10, e)} className="p-3 hover:text-[var(--accent-blue)] transition-colors"><Rewind className="w-6 h-6" /></button>
              <button 
                onClick={togglePlay} 
                className="w-16 h-16 rounded-full bg-white text-zinc-950 flex items-center justify-center hover:scale-105 transition-all shadow-2xl"
              >
                {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
              </button>
              <button onClick={e => skip(10, e)} className="p-3 hover:text-[var(--accent-blue)] transition-colors"><FastForward className="w-6 h-6" /></button>
            </div>

            <div className="absolute top-6 left-6 px-4 py-2 bg-black/60 backdrop-blur-xl border border-white/10 rounded-lg text-[10px] font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Evidence Buffer // Cam_0{Math.floor(Math.random() * 9)}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default SignalementsView;
