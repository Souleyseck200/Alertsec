import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Image, Volume2, Play, User, Zap, CheckCircle, BrainCircuit,
  RadioTower, Phone, UserCheck, ShieldAlert, X, MoreHorizontal, Mic, Radio,
  Printer, FileText, Download, Rewind, FastForward, Pause, Maximize2, Video
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from './ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

import { Signalement, Agent } from '../types';

interface SOSSheetProps {
  socket: any;
  signalement: Signalement | null;
  agents: Agent[];
  onAssign: (signalementId: number, agentId: number) => void;
  onClose: () => void;
  onCloturer: () => void;
}

import { MEDIA_ROOT } from '../services/api';

const USER_ROOT = 'http://localhost:3000/uploads/users';

const GRAVITE_VARIANT: Record<string, any> = {
  VITAL: 'vital', CRITIQUE: 'critique', MOYEN: 'moyen', FAIBLE: 'faible',
};

const SOSSheet: React.FC<SOSSheetProps> = ({ socket, signalement: sig, agents, onAssign, onClose, onCloturer }) => {
  const [loadingAssign, setLoadingAssign] = useState(false);
  const [done, setDone] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [activeMedia, setActiveMedia] = useState<{ type: 'IMAGE' | 'AUDIO' | 'VIDEO', url: string } | null>(null);

  const currentAffectation = sig?.affectations?.[0];

  const nearestAgents = agents
    .filter(a => !a.isOccupied && a.latitude && a.longitude)
    .sort((a, b) => {
      if (!sig) return 0;
      const d = (a: Agent) => Math.hypot(
        (Number(a.latitude) || 0) - Number(sig.latitude), 
        (Number(a.longitude) || 0) - Number(sig.longitude)
      );
      return d(a) - d(b);
    }).slice(0, 3);

  const zoneAgents = agents.filter(a => !a.isOccupied && sig?.zoneId && a.zoneId === sig.zoneId && !nearestAgents.find(na => na.id === a.id));
  const hasAgents = nearestAgents.length > 0 || zoneAgents.length > 0;

  const defaultTab = (sig?.statut === 'NOUVEAU' && !sig?.affectations?.length) ? 'affectation' : 'alerteur';

  const handleAssign = async () => {
    if (!sig || !selectedAgent) return;
    setLoadingAssign(true);
    await onAssign(sig.id, selectedAgent.id);
    setLoadingAssign(false);
  };

  const handlePrintReport = () => {
    window.print();
  };

  // ── Talkie Walkie Logic ──
  const [isRecording, setIsRecording] = useState(false);
  const [volume, setVolume] = useState(0);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioContextRef = React.useRef<AudioContext | null>(null);
  const analyserRef = React.useRef<AnalyserNode | null>(null);
  const animFrameRef = React.useRef<number | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);

  const measureVolume = React.useCallback(() => {
    if (!analyserRef.current) return;
    const data = new Uint8Array(analyserRef.current.fftSize);
    analyserRef.current.getByteTimeDomainData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) sum += Math.abs(data[i] - 128);
    setVolume(Math.min(1, sum / data.length / 30));
    animFrameRef.current = requestAnimationFrame(measureVolume);
  }, []);

  const startRecording = React.useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const base64data = reader.result as string;
          if (socket?.connected) {
            socket.emit('VOICE_MESSAGE', { 
              targetId: currentAffectation?.agentId || null, 
              missionId: sig?.id || null,
              data: base64data 
            });
          }
        };
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setIsRecording(true);
      measureVolume();
    } catch (e) { console.error('Microphone error:', e); }
  }, [socket, measureVolume, currentAffectation]);

  const stopRecording = React.useCallback(() => {
    mediaRecorderRef.current?.stop();
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    audioContextRef.current?.close();
    setIsRecording(false);
    setVolume(0);
  }, []);

  React.useEffect(() => () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    audioContextRef.current?.close();
  }, []);


  return (
    <Sheet open={!!sig} onOpenChange={open => { if (!open) onClose(); }}>
      <SheetContent side="right" className="w-[460px] flex flex-col p-0 bg-[#0c0c0e] border-l border-white/10 shadow-2xl">
        <AnimatePresence>
          {sig && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-full overflow-hidden">
              {/* Header with Visual Identity */}
              <div className="p-6 bg-[#121214] border-b border-white/5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${sig.gravite === 'VITAL' ? 'bg-red-500/20 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]' : 'bg-blue-500/10 text-blue-400'}`}>
                      <RadioTower className="w-6 h-6" />
                    </div>
                    <div>
                      <SheetTitle className="text-xl font-black tracking-tight text-white mb-0">{sig.type}</SheetTitle>
                      <p className="text-[10px] uppercase font-bold tracking-[0.15em] text-zinc-500">Signalement ID #{sig.id}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant={GRAVITE_VARIANT[sig.gravite] || 'default'} className="px-3 py-1 text-[10px] font-black tracking-widest uppercase">
                      {sig.gravite}
                    </Badge>
                    <button 
                      onClick={handlePrintReport}
                      className="flex items-center gap-1.5 px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-all no-print"
                    >
                      <Printer className="w-3 h-3" />
                      PDF
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                   <div className="flex-1 px-3 py-2 bg-white/5 border border-white/5 rounded-lg flex items-center justify-between">
                     <span className="text-[9px] uppercase font-bold text-zinc-500">Statut</span>
                     <span className={`text-[10px] font-bold ${sig.statut === 'CLOTURE' ? 'text-green-400' : 'text-amber-400 animate-pulse'}`}>
                       {sig.statut}
                     </span>
                   </div>
                   <div className="flex-1 px-3 py-2 bg-white/5 border border-white/5 rounded-lg flex items-center justify-between">
                     <span className="text-[9px] uppercase font-bold text-zinc-500">Affectation</span>
                     <span className={`text-[10px] font-bold ${currentAffectation ? 'text-blue-400' : 'text-zinc-500'}`}>
                       {currentAffectation ? 'En cours' : 'Non assigné'}
                     </span>
                   </div>
                </div>
              </div>

              {/* Main Body */}
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <Tabs defaultValue={defaultTab} className="w-full">
                  <div className="px-6 py-2 bg-[#121214]/50 border-b border-white/5 sticky top-0 z-20 backdrop-blur-md">
                    <TabsList className="w-full h-9 bg-transparent p-0 gap-4">
                      <TabsTrigger value="alerteur" className="flex-1 text-[10px] uppercase font-black tracking-widest p-0 border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent rounded-none">Alerteur</TabsTrigger>
                      <TabsTrigger value="medias" className="flex-1 text-[10px] uppercase font-black tracking-widest p-0 border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent rounded-none">Indice</TabsTrigger>
                      <TabsTrigger value="affectation" className="flex-1 text-[10px] uppercase font-black tracking-widest p-0 border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent rounded-none relative">
                        Agents
                        {hasAgents && <span className="absolute top-1 -right-2 w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />}
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  {/* ─── Alerteur Tab ─── */}
                  <TabsContent value="alerteur" className="p-6 m-0 space-y-6">
                    {sig.citoyen ? (
                      <div className="bg-white/5 rounded-2xl border border-white/5 overflow-hidden">
                        <div className="p-4 flex items-center gap-4 border-b border-white/5">
                          {sig.citoyen.photoUrl ? (
                            <img src={sig.citoyen.photoUrl.startsWith('http') ? sig.citoyen.photoUrl : `http://localhost:3000${sig.citoyen.photoUrl}`}
                              className="w-14 h-14 rounded-xl object-cover ring-2 ring-white/10" alt="Avatar" />
                          ) : (
                            <div className="w-14 h-14 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-500/20">
                              <User className="w-7 h-7 text-blue-400" />
                            </div>
                          )}
                          <div>
                            <h4 className="text-white font-black text-base">{sig.citoyen.nom} {sig.citoyen.prenom}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Phone className="w-3 h-3 text-zinc-500" />
                              <span className="text-blue-400 text-xs font-bold font-mono">{sig.citoyen.telephone || 'Non renseigné'}</span>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 space-y-3">
                          <p className="text-xs text-zinc-400 leading-relaxed italic">
                            "{sig.description}"
                          </p>
                          <div className="pt-2 flex justify-between">
                            <span className="text-[9px] uppercase font-bold text-zinc-600">Reçu le</span>
                            <span className="text-[10px] font-mono text-white">{new Date(sig.dateCreation).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-8 text-center bg-white/5 rounded-2xl border border-dashed border-white/10">
                        <User className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                        <p className="text-xs text-zinc-500">Informations citoyen non disponibles</p>
                      </div>
                    )}

                    {/* Affected Agent & Talkie Toggle */}
                    {currentAffectation && (
                      <div className="space-y-4">
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                            <UserCheck className="w-5 h-5 text-blue-400" />
                          </div>
                          <div>
                            <p className="text-[9px] uppercase font-bold text-blue-400/70 mb-0.5">Agent en intervention</p>
                            <p className="text-sm font-bold text-white">{currentAffectation.agent.nom} {currentAffectation.agent.prenom}</p>
                          </div>
                          <Badge variant="outline" className="ml-auto border-blue-500/30 text-blue-400 text-[9px]">EN ROUTE</Badge>
                        </div>

                        {/* Tactical Talkie Panel */}
                        <div className="bg-zinc-900 border border-white/5 rounded-2xl p-6 flex flex-col items-center gap-4 relative overflow-hidden">
                          {isRecording && (
                            <div className="absolute inset-0 bg-red-500/5 animate-pulse" />
                          )}
                          <div className="flex items-center gap-3 mb-2">
                            <Radio className={`w-4 h-4 ${isRecording ? 'text-red-500 animate-pulse' : 'text-zinc-600'}`} />
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Canal Tactique Sécurisé</span>
                          </div>

                          <div className="relative flex items-center justify-center">
                            {isRecording && (
                              <div className="absolute w-24 h-24 rounded-full border border-red-500/20 animate-ping" />
                            )}
                            <button
                              onMouseDown={startRecording}
                              onMouseUp={stopRecording}
                              onTouchStart={startRecording}
                              onTouchEnd={stopRecording}
                              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 shadow-2xl ${isRecording ? 'bg-red-600 scale-110 shadow-red-500/40' : 'bg-zinc-800 hover:bg-zinc-700 border border-white/10'}`}
                            >
                              <Mic className={`w-8 h-8 ${isRecording ? 'text-white' : 'text-zinc-500'}`} />
                            </button>
                          </div>
                          
                          <div className="text-center">
                            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                              {isRecording ? 'DÉMISSION EN COURS...' : 'Maintenir pour parler à l\'agent'}
                            </p>
                            {isRecording && (
                              <div className="flex gap-1 justify-center mt-2 h-4 items-end">
                                {[...Array(8)].map((_, i) => (
                                  <div key={i} className="w-1 bg-red-500 rounded-full" style={{ height: `${20 + Math.random() * 80 * volume}%`, transition: 'height 0.1s ease' }} />
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  {/* ─── Indice/Médias Tab ─── */}
                  <TabsContent value="medias" className="p-6 m-0 space-y-4">
                    <div className="p-4 bg-violet-500/5 border border-violet-500/10 rounded-xl flex gap-3">
                      <BrainCircuit className="w-5 h-5 text-violet-400 shrink-0" />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-violet-300">Analyse Intelligence Centrale</p>
                        <p className="text-xs text-violet-200/80 mt-1">Niveau d'urgence élevé. Type d'incident compatible avec l'urgence signalée.</p>
                      </div>
                    </div>
                    {!(sig.mediaUrl || sig.audioUrl || sig.videoUrl) ? (
                      <div className="py-12 text-center">
                        <ShieldAlert className="w-8 h-8 text-zinc-800 mx-auto mb-3" />
                        <p className="text-xs text-zinc-600">Aucune preuve multimédia n'a été rattachée à cette alerte.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {sig.mediaUrl && (
                          <div 
                            onClick={() => setActiveMedia({ type: 'IMAGE', url: sig.mediaUrl! })}
                            className="group relative rounded-2xl overflow-hidden border border-white/10 aspect-video bg-black cursor-pointer"
                          >
                            <img 
                              src={sig.mediaUrl.startsWith('http') ? sig.mediaUrl : `${MEDIA_ROOT}${sig.mediaUrl}`} 
                              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                              alt="SOS" 
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                               <Maximize2 className="w-6 h-6 text-white" />
                            </div>
                            <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                              <p className="text-[10px] font-bold text-white">Capture Photo Terrain</p>
                            </div>
                          </div>
                        )}
                        {sig.audioUrl && (
                          <div 
                            onClick={() => setActiveMedia({ type: 'AUDIO', url: sig.audioUrl! })}
                            className="p-4 bg-zinc-900 border border-white/5 rounded-xl space-y-3 cursor-pointer group hover:border-orange-500/30 transition-all"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Volume2 className="w-4 h-4 text-amber-400" />
                                <span className="text-xs font-bold text-white">Capture Audio (Ambiance)</span>
                              </div>
                              <Maximize2 className="w-3.5 h-3.5 text-zinc-600 group-hover:text-white" />
                            </div>
                            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                               <div className="w-1/3 h-full bg-orange-500/50" />
                            </div>
                          </div>
                        )}
                        {sig.videoUrl && (
                          <div 
                            onClick={() => setActiveMedia({ type: 'VIDEO', url: sig.videoUrl! })}
                            className="group relative rounded-2xl overflow-hidden border border-white/10 aspect-video bg-black cursor-pointer"
                          >
                            <video 
                              src={sig.videoUrl.startsWith('http') ? sig.videoUrl : `${MEDIA_ROOT}${sig.videoUrl}`} 
                              className="w-full h-full object-cover muted" 
                            />
                            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                               <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white mb-2">
                                  <Play className="w-5 h-5 ml-1" />
                               </div>
                               <p className="text-[9px] font-bold text-white uppercase tracking-widest">Voir Vidéo SOS</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </TabsContent>

                  {/* ─── Affectation Tab ─── */}
                  <TabsContent value="affectation" className="p-6 m-0 space-y-4">
                    {currentAffectation ? (
                      <div className="text-center py-10">
                        <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-4" />
                        <h4 className="text-white font-bold">Un agent est déjà sur l'affaire</h4>
                        <p className="text-xs text-zinc-500 mt-2">Vous recevrez des mises à jour dès que l'agent arrive sur place.</p>
                      </div>
                    ) : !hasAgents ? (
                      <div className="py-12 text-center bg-white/5 rounded-2xl border border-dashed border-white/10">
                        <X className="w-8 h-8 text-red-500/50 mx-auto mb-3" />
                        <p className="text-xs text-zinc-500">Aucun agent disponible dans la zone ou à proximité</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {nearestAgents.length > 0 && (
                          <div className="space-y-3">
                            <h4 className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Agents à proximité (GPS)</h4>
                            {nearestAgents.map((agent) => (
                              <button key={agent.id}
                                onClick={() => setSelectedAgent(prev => prev?.id === agent.id ? null : agent)}
                                className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left group ${selectedAgent?.id === agent.id ? 'bg-blue-600/20 border-blue-500' : 'bg-[#121214] border-white/5 hover:border-white/10'}`}
                              >
                                {agent.photoUrl ? (
                                  <img src={agent.photoUrl.startsWith('http') ? agent.photoUrl : `http://localhost:3000${agent.photoUrl}`} className="w-11 h-11 rounded-lg object-cover" alt="Agent" />
                                ) : (
                                  <div className="w-11 h-11 rounded-lg bg-zinc-800 flex items-center justify-center font-black text-zinc-600">
                                    {agent.nom[0]}{agent.prenom[0]}
                                  </div>
                                )}
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-0.5">
                                    <p className="text-sm font-bold text-white mb-0">{agent.nom} {agent.prenom}</p>
                                    <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">{agent.grade || 'Agent'}</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-mono text-zinc-500">{agent.unite || 'Unité Standard'}</span>
                                    <div className="flex items-center gap-1">
                                      <Zap className="w-3 h-3 text-amber-500" />
                                      <span className="text-[10px] font-bold text-amber-500">{agent.points} XP</span>
                                    </div>
                                  </div>
                                </div>
                                {selectedAgent?.id === agent.id && <CheckCircle className="w-5 h-5 text-blue-500 animate-in zoom-in" />}
                              </button>
                            ))}
                          </div>
                        )}

                        {zoneAgents.length > 0 && (
                          <div className="space-y-3">
                            <h4 className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Agents affectés à cette Zone</h4>
                            {zoneAgents.map((agent) => (
                              <button key={agent.id}
                                onClick={() => setSelectedAgent(prev => prev?.id === agent.id ? null : agent)}
                                className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left group ${selectedAgent?.id === agent.id ? 'bg-blue-600/20 border-blue-500' : 'bg-[#121214] border-white/5 hover:border-white/10'}`}
                              >
                                {agent.photoUrl ? (
                                  <img src={agent.photoUrl.startsWith('http') ? agent.photoUrl : `http://localhost:3000${agent.photoUrl}`} className="w-11 h-11 rounded-lg object-cover" alt="Agent" />
                                ) : (
                                  <div className="w-11 h-11 rounded-lg bg-zinc-800 flex items-center justify-center font-black text-zinc-600">
                                    {agent.nom[0]}{agent.prenom[0]}
                                  </div>
                                )}
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-0.5">
                                    <p className="text-sm font-bold text-white mb-0">{agent.nom} {agent.prenom}</p>
                                    <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">{agent.grade || 'Agent'}</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-mono text-zinc-500">{agent.unite || 'Unité Standard'}</span>
                                    <span className="text-[9px] font-bold text-zinc-600 uppercase italic">Position inconnue</span>
                                  </div>
                                </div>
                                {selectedAgent?.id === agent.id && <CheckCircle className="w-5 h-5 text-blue-500" />}
                              </button>
                            ))}
                          </div>
                        )}

                        {selectedAgent && (
                          <Button className="w-full h-12 bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-900/20 rounded-xl"
                            onClick={handleAssign} disabled={loadingAssign}>
                            {loadingAssign ? <Loader2 className="animate-spin" /> : <><Zap className="w-4 h-4 mr-2" /> Affecter la mission</>}
                          </Button>
                        )}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>

              {/* Footer */}
              <div className="p-6 bg-[#121214] border-t border-white/5 flex gap-3">
                <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent border-white/10 hover:bg-white/5 text-xs h-11">Annuler</Button>
                <Button onClick={() => { setDone(true); setTimeout(() => { setDone(false); onCloturer(); }, 2500); }}
                  className="flex-1 bg-green-600 hover:bg-green-500 h-11 text-xs">
                  <CheckCircle className="w-4 h-4 mr-2" /> Clôturer SOS
                </Button>
              </div>

              {/* Success Overlay */}
              {done && (
                 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-50 bg-[#0c0c0e]/95 backdrop-blur-sm flex items-center justify-center">
                    <div className="text-center">
                      <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring' }}
                        className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-green-500" />
                      </motion.div>
                      <h3 className="text-xl font-black text-white">INTERVENTION TERMINÉE</h3>
                      <p className="text-sm text-zinc-500 mt-2">Dossier archivé · Agent crédité</p>
                    </div>
                 </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </SheetContent>

      {/* Tactical Media Overlay */}
      <AnimatePresence>
        {activeMedia && (
          <MediaOverlay media={activeMedia} onClose={() => setActiveMedia(null)} />
        )}
      </AnimatePresence>
    </Sheet>
  );
};

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
      className="fixed inset-0 z-[10000] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-12"
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
        className="max-w-6xl w-full border border-white/10 rounded-[32px] overflow-hidden bg-[#0c0c0e] shadow-[0_0_100px_rgba(0,0,0,0.8)] relative"
      >
        {media.type === 'IMAGE' && (
          <img src={fullUrl} className="w-full h-auto max-h-[85vh] object-contain" alt="Tactical Evidence" />
        )}

        {media.type === 'AUDIO' && (
          <div className="py-24 px-12 flex flex-col items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500 mb-8 border border-orange-500/20 shadow-[0_0_40px_rgba(249,115,22,0.15)]">
              <Volume2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-black text-white uppercase tracking-[0.25em] mb-2">Décryptage Audio SOS</h3>
            <p className="text-zinc-500 text-[10px] font-mono mb-12 uppercase tracking-widest">SITAC_PROTO_v8 // INTERCEPT_LIVE</p>
            
            <audio 
              ref={mediaRef} 
              src={fullUrl} 
              onPlay={() => setIsPlaying(true)} 
              onPause={() => setIsPlaying(false)}
            />

            <div className="flex items-center gap-12 text-white">
              <button onClick={e => skip(-10, e)} className="p-4 hover:text-blue-500 transition-colors"><Rewind className="w-8 h-8" /></button>
              <button 
                onClick={togglePlay} 
                className="w-20 h-20 rounded-full bg-white text-zinc-950 flex items-center justify-center hover:scale-105 transition-all shadow-2xl"
              >
                {isPlaying ? <Pause className="w-10 h-10" /> : <Play className="w-10 h-10 ml-1" />}
              </button>
              <button onClick={e => skip(10, e)} className="p-4 hover:text-blue-500 transition-colors"><FastForward className="w-8 h-8" /></button>
            </div>
          </div>
        )}

        {media.type === 'VIDEO' && (
          <div className="relative group">
            <video 
              ref={mediaRef} 
              src={fullUrl} 
              className="w-full h-auto max-h-[85vh]" 
              onPlay={() => setIsPlaying(true)} 
              onPause={() => setIsPlaying(false)}
            />
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            
            <div className="absolute bottom-10 left-0 right-0 px-12 flex items-center justify-center gap-12 text-white z-10 transition-transform duration-300 transform translate-y-4 group-hover:translate-y-0">
              <button onClick={e => skip(-10, e)} className="p-3 hover:text-blue-400 transition-colors"><Rewind className="w-7 h-7" /></button>
              <button 
                onClick={togglePlay} 
                className="w-16 h-16 rounded-full bg-white text-[#0c0c0e] flex items-center justify-center hover:scale-110 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)]"
              >
                {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
              </button>
              <button onClick={e => skip(10, e)} className="p-3 hover:text-blue-400 transition-colors"><FastForward className="w-7 h-7" /></button>
            </div>

            <div className="absolute top-8 left-8 px-5 py-2.5 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-xl text-[10px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.5)]" />
              SITAC_CAM_FEED // LIVE_SECURE
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default SOSSheet;

const Loader2 = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-loader-2 animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
);
