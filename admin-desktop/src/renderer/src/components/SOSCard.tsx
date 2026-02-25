import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Zap, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Signalement } from '../types';

interface SOSCardProps {
  signalement: Signalement;
  onClick: () => void;
  index: number;
}

const GRAVITE_VARIANT: Record<string, any> = {
  VITAL: 'vital', CRITIQUE: 'critique', MOYEN: 'moyen', FAIBLE: 'faible',
};

const GRAVITE_GLOW: Record<string, string> = {
  VITAL:    'hover:shadow-red-500/10',
  CRITIQUE: 'hover:shadow-orange-500/10',
  MOYEN:    'hover:shadow-yellow-500/10',
  FAIBLE:   'hover:shadow-blue-500/10',
};

const SOSCard: React.FC<SOSCardProps> = ({ signalement: sig, onClick, index }) => {
  const grav = sig.gravite as string;
  const timeAgo = Math.round((Date.now() - new Date(sig.dateCreation).getTime()) / 60000);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card
        onClick={onClick}
        className={`cursor-pointer border-zinc-800/60 bg-zinc-900/70 backdrop-blur-md
          hover:border-zinc-700 hover:shadow-xl ${GRAVITE_GLOW[grav] || ''} transition-all duration-300 group`}
      >
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-2.5">
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center relative
                ${grav === 'VITAL' ? 'bg-red-500/15' : grav === 'CRITIQUE' ? 'bg-orange-500/15' : 'bg-yellow-500/15'}`}>
                <AlertTriangle className={`w-4 h-4 ${grav === 'VITAL' ? 'text-red-400' : grav === 'CRITIQUE' ? 'text-orange-400' : 'text-yellow-400'}`} />
                {(grav === 'VITAL' || grav === 'CRITIQUE') && (
                  <span className={`absolute inset-0 rounded-xl ${grav === 'VITAL' ? 'bg-red-500/20' : 'bg-orange-500/20'} animate-ping`} />
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-white uppercase tracking-wide leading-tight">{sig.type}</p>
                <p className="text-[9px] text-zinc-600 font-mono">#{sig.id}</p>
              </div>
            </div>
            <Badge variant={GRAVITE_VARIANT[grav] || 'default'}>{grav}</Badge>
          </div>

          {/* Description */}
          <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-2 mb-3">{sig.description}</p>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-[9px] text-zinc-600">
              <Clock className="w-3 h-3" />
              <span>{timeAgo < 1 ? 'À l\'instant' : `${timeAgo} min`}</span>
            </div>
            <div className="flex items-center gap-1 text-[9px] text-blue-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
              <Zap className="w-3 h-3" />
              <span>Détails</span>
            </div>
          </div>

          {/* Media badges */}
          {(sig.mediaUrl || sig.audioUrl || sig.videoUrl) && (
            <div className="flex gap-1 mt-2.5">
              {sig.mediaUrl && <span className="text-[8px] px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded-md font-bold">Photo</span>}
              {sig.audioUrl && <span className="text-[8px] px-1.5 py-0.5 bg-yellow-500/10 text-yellow-400 rounded-md font-bold">Audio</span>}
              {sig.videoUrl && <span className="text-[8px] px-1.5 py-0.5 bg-green-500/10 text-green-400 rounded-md font-bold">Vidéo</span>}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SOSCard;
