import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Radio } from 'lucide-react';
import { Socket } from 'socket.io-client';
import { Agent } from '../pages/CommandCenter';

interface TalkieWalkieButtonProps {
  socket: Socket | null;
  agents: Agent[];
  addTicker?: (msg: string, type?: 'info' | 'alert' | 'success') => void;
}

const TalkieWalkieButton: React.FC<TalkieWalkieButtonProps> = ({ socket, addTicker }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [volume, setVolume] = useState(0); // 0–1
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const chunksRef = useRef<Blob[]>([]);

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
        blob.arrayBuffer().then(buf => {
          socket?.emit('VOICE_MESSAGE', { targetId: null, data: buf });
        });
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setIsRecording(true);
      if (addTicker) addTicker('RADIO : Diffusion Globale en cours...', 'info');
      measureVolume();
    } catch (e) { console.error('Microphone error:', e); }
  }, [socket, measureVolume, addTicker]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      if (addTicker) addTicker('Transmission Radio terminée', 'success');
    }
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    audioContextRef.current?.close();
    setIsRecording(false);
    setVolume(0);
  }, [isRecording, addTicker]);

  useEffect(() => () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    audioContextRef.current?.close();
  }, []);

  return (
    <div className="absolute bottom-8 right-8 z-[1000] flex flex-col items-center gap-3">
      {/* Recording label */}
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="flex items-center gap-2 glass rounded-xl px-4 py-2 border border-zinc-800"
          >
            <Radio className="w-3 h-3 text-red-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-red-500">Diffusion : Toutes Unités</span>
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
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          onTouchStart={startRecording}
          onTouchEnd={stopRecording}
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
        {isRecording ? 'Relâcher pour envoyer' : 'Maintenir'}
      </p>
    </div>
  );
};

export default TalkieWalkieButton;
