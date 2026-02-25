import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Radio } from 'lucide-react';
import { Socket } from 'socket.io-client';
import { Agent } from '../types';

interface TalkieWalkieButtonProps {
  socket: Socket | null;
  agents: Agent[];
  addTicker?: (msg: string, type?: 'info' | 'alert' | 'success') => void;
  missionId?: number | null;
}

import RecordRTC, { StereoAudioRecorder } from 'recordrtc';

const TalkieWalkieButton: React.FC<TalkieWalkieButtonProps> = ({ socket, addTicker, missionId }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [volume, setVolume] = useState(0); // 0–1
  const animFrameRef = useRef<number | null>(null);
  const recorderRef = useRef<RecordRTC | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const measureVolume = useCallback(() => {
    if (!analyserRef.current) return;
    const data = new Uint8Array(analyserRef.current.fftSize);
    analyserRef.current.getByteTimeDomainData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) sum += Math.abs(data[i] - 128);
    setVolume(Math.min(1, sum / data.length / 30));
    animFrameRef.current = requestAnimationFrame(measureVolume);
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Volume measurement setup
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      recorderRef.current = new RecordRTC(stream, {
        type: 'audio',
        mimeType: 'audio/wav',
        recorderType: StereoAudioRecorder, // Forces clean WAV encoding
        desiredSampRate: 16000, // 16kHz for fast transmission
        numberOfAudioChannels: 1 // Mono
      });

      recorderRef.current.startRecording();
      setIsRecording(true);
      if (addTicker) addTicker(missionId ? `RADIO : Mission #${missionId} (Tactique)...` : 'RADIO : Diffusion Globale (Tactique)...', 'info');
      measureVolume();
    } catch (e) {
      console.error('Microphone error:', e);
      if (addTicker) addTicker('❌ Erreur microphone', 'alert');
    }
  }, [addTicker, measureVolume, missionId]);

  const stopRecording = useCallback(() => {
    if (recorderRef.current && isRecording) {
      recorderRef.current.stopRecording(() => {
        const blob = recorderRef.current!.getBlob();
        
        // Convert Blob directly to Base64 (Data URI)
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const base64data = reader.result as string; 
          
          if (socket?.connected) {
            console.log(`🎙️ [WAV] Sending Base64 burst (${Math.round(base64data.length / 1024)} KB) - Mission: ${missionId || 'Global'}`);
            // We pass the base64 string directly
            socket.emit('VOICE_MESSAGE', { targetId: null, missionId: missionId, data: base64data });
            if (addTicker) addTicker('✅ Transmission envoyée', 'success');
          } else {
            console.error('❌ Socket non connecté');
            if (addTicker) addTicker('❌ Erreur : Serveur déconnecté', 'alert');
          }
        };

        // Stop all tracks to release mic
        recorderRef.current?.getInternalRecorder()?.getBlob(); // flush internal
        recorderRef.current?.destroy();
        recorderRef.current = null;
      });
    }

    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    audioContextRef.current?.close();
    setIsRecording(false);
    setVolume(0);
  }, [isRecording, socket, addTicker, missionId]);

  useEffect(() => () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    audioContextRef.current?.close();
  }, []);

  return (
    <div className="absolute bottom-12 right-12 z-[9999] flex flex-col items-center gap-3">
      {/* Recording label */}
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="flex items-center gap-2 glass rounded-xl px-4 py-2 border border-zinc-800"
          >
            <Radio className={`w-3 h-3 animate-pulse ${missionId ? 'text-amber-500' : 'text-red-500'}`} />
            <span className={`text-[10px] font-black uppercase tracking-widest ${missionId ? 'text-amber-500' : 'text-red-500'}`}>
              {missionId ? `Mission #${missionId}` : 'Diffusion : Toutes Unités'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mic Button with concentric ring animation */}
      <div className="relative flex items-center justify-center">
        {/* Concentric rings (volume-driven) */}
        {isRecording && [1, 2, 3].map(i => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-red-500/10 border border-red-500/20"
            animate={{
              scale: [1, 1 + i * 0.3 + volume * 0.4],
              opacity: [0.6, 0],
            }}
            transition={{
              duration: 1.2 + i * 0.2,
              repeat: Infinity,
              delay: i * 0.15,
              ease: 'easeOut',
            }}
            style={{ width: 64, height: 64 }}
          />
        ))}

        {/* Volume ring (SVG progress) */}
        {isRecording && (
          <svg className="absolute w-20 h-20" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(239,68,68,0.15)" strokeWidth="2" />
            <circle
              cx="40" cy="40" r="36" fill="none" stroke="#ef4444" strokeWidth="2.5"
              strokeDasharray={`${2 * Math.PI * 36}`}
              strokeDashoffset={`${2 * Math.PI * 36 * (1 - volume)}`}
              strokeLinecap="round"
              transform="rotate(-90 40 40)"
              style={{ transition: 'stroke-dashoffset 0.08s linear' }}
            />
          </svg>
        )}

        <button
          onClick={() => isRecording ? stopRecording() : startRecording()}
          className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-200 select-none
            ${isRecording
              ? 'bg-red-600 shadow-red-500/30 scale-110'
              : 'glass border border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/60 hover:scale-105'
            }`}
        >
          {isRecording
            ? <Mic className="w-7 h-7 text-white" />
            : <MicOff className="w-5 h-5 text-zinc-400" />
          }
        </button>
      </div>

      <p className="text-[8px] font-bold text-zinc-700 uppercase tracking-widest text-center">
        {isRecording ? 'Cliquer pour envoyer' : 'Cliquer pour parler'}
      </p>
    </div>
  );
};

export default TalkieWalkieButton;
