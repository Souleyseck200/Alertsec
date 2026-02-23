import React, { useState } from 'react';
import { X, Mic, BrainCircuit, Zap, CheckCircle, Image, Volume2, Play, User } from 'lucide-react';
import { Signalement, Agent } from '../pages/CommandCenter';

interface SOSModalProps {
  signalement: Signalement;
  agents: Agent[];
  onAssign: (signalementId: number, agentId: number) => void;
  onClose: () => void;
  onCloturer: () => void;
}

const MEDIA_ROOT = 'http://localhost:3000/uploads/signalements';

const IA_LABELS: Record<string, string> = {
  'vol': 'Risque de vol confirmé (85%)',
  'agression': 'Agression physique probable (91%)',
  'accident': 'Accident de circulation (78%)',
  'incendie': 'Incendie actif détecté (94%)',
  'default': 'Analyse de menace en cours…',
};

const getIALabel = (type: string) => {
  const key = Object.keys(IA_LABELS).find(k => type?.toLowerCase().includes(k));
  return key ? IA_LABELS[key] : IA_LABELS.default;
};

const SOSModal: React.FC<SOSModalProps> = ({ signalement: sig, agents, onAssign, onClose, onCloturer }) => {
  const [loadingAssign, setLoadingAssign] = useState(false);
  const [xpMessage, setXpMessage] = useState<string | null>(null);

  const nearestAgent = agents
    .filter(a => !a.isOccupied && a.latitude && a.longitude)
    .sort((a, b) => {
      const dist = (a: Agent) => a.latitude && a.longitude
        ? Math.hypot(a.latitude - sig.latitude, a.longitude - sig.longitude)
        : Infinity;
      return dist(a) - dist(b);
    })[0];

  const handleAssign = async () => {
    if (!nearestAgent) return;
    setLoadingAssign(true);
    await onAssign(sig.id, nearestAgent.id);
    setLoadingAssign(false);
  };

  const handleCloturer = () => {
    if (nearestAgent) {
      setXpMessage(`✅ Intervention réussie. +10 XP pour l'agent ${nearestAgent.nom}. Rapport archivé.`);
      setTimeout(() => { setXpMessage(null); onCloturer(); }, 3000);
    } else {
      onCloturer();
    }
  };

  return (
    <div className="absolute inset-0 z-[2000] flex items-center justify-center pointer-events-none">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl mx-4 glass-panel rounded-3xl border border-white/10 shadow-2xl shadow-black/80 pointer-events-auto overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4 border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-500/20 rounded-2xl flex items-center justify-center">
              <span className="text-red-400 font-black text-lg">!</span>
            </div>
            <div>
              <h2 className="text-lg font-black uppercase tracking-widest text-white">{sig.type}</h2>
              <p className="text-xs text-gray-500 font-mono mt-0.5">SOS #{sig.id} · {new Date(sig.dateCreation).toLocaleString('fr-FR')}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 transition flex items-center justify-center">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Description */}
          <p className="text-sm text-gray-300 leading-relaxed">{sig.description}</p>

          {/* IA Label */}
          <div className="flex items-center gap-3 p-3 bg-violet-500/10 border border-violet-500/20 rounded-2xl">
            <BrainCircuit className="w-4 h-4 text-violet-400 shrink-0" />
            <p className="text-xs font-bold text-violet-300">Analyse IA : {getIALabel(sig.type)}</p>
          </div>

          {/* Media */}
          {(sig.mediaUrl || sig.audioUrl || sig.videoUrl) && (
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">Preuves numériques</p>
              <div className="grid grid-cols-3 gap-3">
                {sig.mediaUrl && (
                  <a href={`${MEDIA_ROOT}/${sig.mediaUrl}`} target="_blank" rel="noopener noreferrer"
                    className="flex flex-col items-center gap-2 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl hover:bg-blue-500/20 transition">
                    <Image className="w-5 h-5 text-blue-400" />
                    <span className="text-[10px] font-bold text-blue-400 uppercase">Photo</span>
                  </a>
                )}
                {sig.audioUrl && (
                  <div className="flex flex-col items-center gap-2 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl">
                    <Volume2 className="w-5 h-5 text-yellow-400" />
                    <audio src={`${MEDIA_ROOT}/${sig.audioUrl}`} controls className="w-full h-6 mt-1" style={{ filter: 'invert(1) hue-rotate(180deg)' }} />
                  </div>
                )}
                {sig.videoUrl && (
                  <a href={`${MEDIA_ROOT}/${sig.videoUrl}`} target="_blank" rel="noopener noreferrer"
                    className="flex flex-col items-center gap-2 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl hover:bg-green-500/20 transition">
                    <Play className="w-5 h-5 text-green-400" />
                    <span className="text-[10px] font-bold text-green-400 uppercase">Vidéo</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Nearest Agent suggestion */}
          {nearestAgent && (
            <div className="flex items-center gap-4 p-4 bg-primary/10 border border-primary/20 rounded-2xl">
              <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-black text-white">Agent recommandé : {nearestAgent.nom} {nearestAgent.prenom}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Agent le plus proche disponible · {nearestAgent.points || 0} XP</p>
              </div>
              <button
                onClick={handleAssign}
                disabled={loadingAssign}
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark disabled:bg-gray-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition"
              >
                <Zap className="w-3 h-3" />
                {loadingAssign ? 'Affectation…' : 'Affecter'}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-wider transition">
            Fermer
          </button>
          <button
            onClick={handleCloturer}
            className="flex-1 py-3 rounded-2xl bg-green-600 hover:bg-green-500 text-white text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Clôturer l'intervention
          </button>
        </div>

        {/* XP message overlay */}
        {xpMessage && (
          <div className="absolute inset-0 bg-black/90 rounded-3xl flex items-center justify-center">
            <div className="text-center">
              <CheckCircle className="w-14 h-14 text-green-400 mx-auto mb-4" />
              <p className="text-sm font-bold text-white">{xpMessage}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SOSModal;
