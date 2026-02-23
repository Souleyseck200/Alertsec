import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Shield, Lock, Mail, AlertTriangle, Loader2, ScanFace, 
  CheckCircle2, Cpu, Globe, Zap, Terminal, TerminalSquare, 
  Activity, Eye, EyeOff, Fingerprint, Database, Network, 
  Key, Server, AlertCircle, BarChart3, Binary
} from 'lucide-react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { authService } from '../services/api';

/**
 * ALERTSEC COMMAND CENTER - PREMIUM LOGIN REDESIGN
 * Protocol: National Defence v4.0.2
 * Aesthetic: Maximalist / High-Fidelity / Glassmorphism
 * Estimated LOC: ~700
 */

// --- Types & Interfaces ---

interface LoginPageProps {
  onLoginSuccess: (user: any) => void;
}

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'CRIT' | 'AUTH';
  msg: string;
}

// --- Components ---

/**
 * AnimatedMeshBackground
 * Creates a dynamic, flowing mesh gradient using absolute positioning and blur filters.
 */
const AnimatedMeshBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 bg-[#060608]">
      <motion.div 
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 50, 0],
          y: [0, 30, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-blue-900/10 blur-[120px]"
      />
      <motion.div 
        animate={{
          scale: [1.2, 1, 1.2],
          x: [0, -40, 0],
          y: [0, -50, 0],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="absolute top-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-indigo-900/10 blur-[120px]"
      />
      <motion.div 
        animate={{
          scale: [1, 1.5, 1],
          x: [0, 30, 0],
          y: [0, 100, 0],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute -bottom-[20%] left-[20%] w-[50%] h-[50%] rounded-full bg-purple-900/10 blur-[120px]"
      />
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
    </div>
  );
};

/**
 * ParticleSystem
 * Simulates network nodes and data packets floating in the background.
 */
const ParticleSystem: React.FC = () => {
  const particles = useMemo(() => Array.from({ length: 30 }).map((_, i) => ({
    id: i,
    size: Math.random() * 2 + 1,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 40 + 20,
    delay: Math.random() * -20,
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map(p => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0, 0.5, 0],
            y: [`${p.y}%`, `${p.y - 20}%`],
            x: [`${p.x}%`, `${p.x + (Math.random() - 0.5) * 10}%`],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "linear"
          }}
          className="absolute bg-blue-500/30 rounded-full"
          style={{ width: p.size, height: p.size }}
        />
      ))}
    </div>
  );
};

/**
 * SimulatedTerminal
 * Displays live "security events" to enhance the command center atmosphere.
 */
const SimulatedTerminal: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const events = [
    "Establishing handshake with Gouv.SN gateway...",
    "Encryption keys: AES-256-GCM synchronized.",
    "Bypass relay detected at node ID: 8821.",
    "Patching core kernel... [OK]",
    "Identity provider contacted: Ministerial-Auth-v3.",
    "Scrutinizing IP traffic for anomalies...",
    "Neural firewall at 98.4% capacity.",
    "Session heartbeat initialized.",
    "Querying national database for credentials...",
    "Intrusion detection system armed.",
  ];

  useEffect(() => {
    const addLog = () => {
      const newLog: LogEntry = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour12: false }),
        level: Math.random() > 0.8 ? 'WARN' : 'INFO',
        msg: events[Math.floor(Math.random() * events.length)],
      };
      setLogs(prev => [...prev.slice(-12), newLog]);
    };

    const interval = setInterval(addLog, 4000);
    addLog();
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="hidden lg:flex flex-col absolute left-10 bottom-10 w-[350px] h-[300px] glass-card rounded-xl p-4 font-mono text-[10px] z-20 border-l-2 border-l-blue-500/50">
      <div className="flex items-center gap-2 mb-3 border-b border-white/10 pb-2">
        <TerminalSquare className="w-3 h-3 text-blue-400" />
        <span className="text-white/60 font-bold uppercase tracking-widest">Sys_Log_Daemon</span>
        <div className="flex gap-1 ml-auto">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500/50" />
          <div className="w-1.5 h-1.5 rounded-full bg-amber-500/50" />
          <div className="w-1.5 h-1.5 rounded-full bg-green-500/50" />
        </div>
      </div>
      <div ref={containerRef} className="flex-1 overflow-hidden space-y-1.5 flex flex-col justify-end">
        <AnimatePresence initial={false}>
          {logs.map(log => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex gap-2"
            >
              <span className="text-white/30">[{log.timestamp}]</span>
              <span className={`${log.level === 'WARN' ? 'text-amber-400' : 'text-blue-400'} font-bold`}>
                {log.level}
              </span>
              <span className="text-white/70 truncate">{log.msg}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

/**
 * BiometricHologram
 * The core scanning animation component.
 */
const BiometricHologram: React.FC<{ status: 'idle' | 'scanning' | 'success' }> = ({ status }) => {
  return (
    <div className="relative w-48 h-48 mx-auto mb-8 flex items-center justify-center">
      {/* Outer Rotating Circles */}
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 rounded-full border border-blue-500/10 border-dashed"
      />
      <motion.div 
        animate={{ rotate: -360 }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute inset-4 rounded-full border border-blue-500/20"
      />
      
      {/* Tactical Borders */}
      <div className="absolute inset-0 border-[2px] border-blue-500/40 rounded-3xl" style={{ clipPath: 'polygon(0 0, 20% 0, 0 20%, 0 0, 100% 0, 80% 0, 100% 20%, 100% 0, 100% 100%, 80% 100%, 100% 80%, 100% 100%, 0 100%, 20% 100%, 0 80%, 0 100%)'}} />

      {/* Internal Scanner Content */}
      <div className={`relative w-36 h-36 rounded-2xl overflow-hidden glass-card transition-all duration-700 ${status === 'success' ? 'border-green-500/50 bg-green-500/5' : 'bg-blue-500/5'}`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {status === 'success' ? (
              <motion.div 
                key="success"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center"
              >
                <CheckCircle2 className="w-16 h-16 text-green-500 drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]" />
                <span className="text-[10px] text-green-500 font-black mt-2 tracking-[0.2em] uppercase">Verified</span>
              </motion.div>
            ) : (
              <motion.div 
                key="scanning"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="relative"
              >
                <ScanFace className={`w-16 h-16 transition-colors duration-500 ${status === 'scanning' ? 'text-blue-400' : 'text-white/20'}`} />
                {status === 'scanning' && (
                  <motion.div 
                    initial={{ top: '0%' }}
                    animate={{ top: '100%' }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                    className="absolute left-0 w-full h-1 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)] z-10"
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Data readout overlay */}
        <div className="absolute inset-x-2 bottom-2 font-mono text-[6px] text-blue-400/60 uppercase flex justify-between">
          <span>X: 198.22</span>
          <span>Y: 004.91</span>
          <span>Z: 002.1</span>
        </div>
      </div>

      {/* Decorative pulse rings */}
      {status === 'scanning' && (
        <>
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
            className="absolute inset-0 rounded-full border-2 border-blue-500/30"
          />
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1.8, opacity: 0 }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "easeOut", delay: 0.5 }}
            className="absolute inset-0 rounded-full border-2 border-blue-500/10"
          />
        </>
      )}
    </div>
  );
};

/**
 * StatusTicker
 * Scrollable ticker at the bottom of the page.
 */
const StatusTicker: React.FC = () => {
  return (
    <div className="absolute bottom-0 inset-x-0 h-10 glass-card border-none border-t border-white/5 flex items-center px-4 overflow-hidden z-20">
      <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 rounded mr-6 border border-blue-500/20">
        <Globe className="w-3 h-3 text-blue-400" />
        <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest whitespace-nowrap">Global Uplink: Active</span>
      </div>
      <div className="flex-1 overflow-hidden">
        <motion.div 
          animate={{ x: '-50%' }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          className="flex gap-12 whitespace-nowrap"
        >
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 text-[10px] font-mono text-white/30 uppercase tracking-widest">
              <span>Node_#{1024 + i * 8} Online</span>
              <span className="w-1 h-1 rounded-full bg-green-500/50" />
              <span>Ministerial Relay: SENSITIVE</span>
              <span className="w-1 h-1 rounded-full bg-blue-500/50" />
              <span>Defence_Net Gateway_v4.2</span>
              <span className="w-1 h-1 rounded-full bg-purple-500/50" />
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

// --- Main LoginPage Component ---

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  // State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanStep, setScanStep] = useState<'idle' | 'scanning' | 'success'>('idle');
  const [showPassword, setShowPassword] = useState(false);
  const [protocolAck, setProtocolAck] = useState(false);

  // Audio effects
  const playBeep = (freq = 440, type = 'sine', vol = 0.05) => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type as OscillatorType;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      g.gain.setValueAtTime(vol, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.connect(g); g.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.1);
    } catch {}
  };

  const startScan = () => {
    if (scanStep !== 'idle') return;
    setScanStep('scanning');
    playBeep(880, 'square', 0.03);
    
    // Simulate biometric steps
    setTimeout(() => {
      setScanStep('success');
      playBeep(1320, 'sine', 0.05);
    }, 3500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (scanStep !== 'success') {
      setError("Protocole de vérification interrompu : Biométrie manquante.");
      playBeep(220, 'sawtooth', 0.05);
      return;
    }

    if (!protocolAck) {
      setError("Veuillez accepter le protocole de sécurité ministériel.");
      return;
    }

    setLoading(true);
    setError(null);

    // Dynamic logging feel
    playBeep(1000, 'sine', 0.02);

    try {
      const data = await authService.login({ email, password });
      onLoginSuccess(data.user);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Échec d\'authentification réseau');
      playBeep(150, 'sawtooth', 0.1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-screen h-screen bg-[#080809] flex items-center justify-center overflow-hidden">
      {/* 1. Background Layers */}
      <AnimatedMeshBackground />
      <ParticleSystem />
      <div className="absolute inset-0 bg-gradient-to-t from-[#080809] via-transparent to-[#080809] pointer-events-none z-10" />

      {/* 2. Side Panels Decor */}
      <SimulatedTerminal />
      
      <div className="hidden lg:block absolute right-10 top-10 w-[200px] z-20">
        <div className="flex flex-col gap-4 text-right">
          <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
            Level: Classified<br />
            Auth: Level 7+<br />
            Unit: CyberDefence
          </div>
          <div className="flex justify-end gap-1">
             <Binary className="w-12 h-12 text-blue-500/20" />
          </div>
        </div>
      </div>

      {/* 3. Main Login Card */}
      <div className="relative z-30 w-full max-w-[500px] px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="glass-card rounded-[2.5rem] p-10 relative overflow-hidden"
        >
          {/* Internal Glow Light */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-blue-500 blur-md opacity-20" />
          
          {/* Logo Section */}
          <div className="text-center mb-10">
            <motion.div 
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-[2rem] bg-gradient-to-br from-blue-500 to-indigo-600 p-0.5 mb-6 shadow-2xl shadow-blue-500/20"
            >
              <div className="w-full h-full rounded-[1.8rem] bg-[#0c0c0e] flex items-center justify-center">
                <Shield className="w-10 h-10 text-white" />
              </div>
            </motion.div>
            <h1 className="text-4xl font-black text-white tracking-tighter mb-2 italic">
              ALERT<span className="text-blue-500 not-italic">SEC</span>
            </h1>
            <div className="flex items-center justify-center gap-3">
              <span className="h-[1px] w-8 bg-white/10" />
              <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Command Center v4.0</p>
              <span className="h-[1px] w-8 bg-white/10" />
            </div>
          </div>

          <AnimatePresence mode="wait">
            {scanStep !== 'success' ? (
              <motion.div
                key="biometric-view"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                className="flex flex-col items-center"
              >
                <BiometricHologram status={scanStep} />
                
                <h2 className="text-xl font-bold text-white mb-2">Vérification d'Identité</h2>
                <p className="text-sm text-white/50 text-center mb-8 max-w-[280px]">
                  Scrutin biométrique requis pour accéder au réseau confidentiel national.
                </p>

                <button
                  onClick={startScan}
                  disabled={scanStep === 'scanning'}
                  className={`group relative w-full h-16 rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 overflow-hidden ${
                    scanStep === 'scanning' ? 'bg-blue-500/10 cursor-wait' : 'bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-500/20'
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  {scanStep === 'scanning' ? (
                    <>
                      <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                      <span className="text-blue-400 font-bold uppercase tracking-widest text-xs">Analyse en cours...</span>
                    </>
                  ) : (
                    <>
                      <ScanFace className="w-6 h-6 text-white" />
                      <span className="text-white font-black uppercase tracking-widest text-sm">Actionner le Scan</span>
                    </>
                  )}
                </button>
                
                <div className="mt-6 flex items-center gap-4 text-[9px] text-white/30 font-mono uppercase">
                  <span className="flex items-center gap-1"><Cpu className="w-3 h-3" /> Hardware OK</span>
                  <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> Uplink 10Gbps</span>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="login-form-view"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                {/* ID Tag */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-green-500/5 border border-green-500/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                      <Fingerprint className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <div className="text-[9px] text-white/40 uppercase font-black tracking-widest leading-none">Status</div>
                      <div className="text-xs font-bold text-green-500 uppercase mt-1">Identité Approuvée</div>
                    </div>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                </div>

                {error && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex gap-3 items-center"
                  >
                    <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <p className="text-[11px] font-bold text-red-100 leading-tight">{error}</p>
                  </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Identifiant Ministériel</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-blue-500 transition-colors">
                        <Mail className="w-5 h-5" />
                      </div>
                      <input 
                        type="email" required value={email} onChange={e => setEmail(e.target.value)}
                        placeholder="agent.id@alertsec.sn"
                        className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 text-white text-sm focus:outline-none focus:border-blue-500 focus:bg-blue-500/5 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Code de Cryptage</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-blue-500 transition-colors">
                        <Lock className="w-5 h-5" />
                      </div>
                      <input 
                        type={showPassword ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-12 text-white text-sm focus:outline-none focus:border-blue-500 focus:bg-blue-500/5 transition-all"
                      />
                      <button 
                        type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/60 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-1">
                    <div 
                      onClick={() => setProtocolAck(!protocolAck)}
                      className={`w-5 h-5 rounded-md border flex items-center justify-center cursor-pointer transition-all ${
                        protocolAck ? 'bg-blue-500 border-blue-500 shadow-lg shadow-blue-500/20' : 'border-white/20 bg-white/5'
                      }`}
                    >
                      {protocolAck && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <span className="text-[10px] text-white/40 font-bold uppercase tracking-wide cursor-pointer user-select-none" onClick={() => setProtocolAck(!protocolAck)}>
                      J'accepte le protocole de sécurité de classe A
                    </span>
                  </div>

                  <button
                    type="submit" disabled={loading}
                    className="relative w-full h-16 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-sm hover:bg-white/90 active:scale-[98%] transition-all overflow-hidden flex items-center justify-center gap-2 "
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Synchronisation...</span>
                      </>
                    ) : (
                      <>
                        <span>Accéder au Système</span>
                        <Zap className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <div className="flex justify-between items-center px-1">
                    <button type="button" className="text-[9px] font-black text-white/30 uppercase hover:text-blue-400 transition-colors">Incident d'accès ?</button>
                    <button type="button" className="text-[9px] font-black text-white/30 uppercase hover:text-blue-400 transition-colors tracking-tight">Support : +221 XX XXX XX XX</button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Footer Meta */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8 flex flex-col items-center gap-4"
        >
          <div className="flex gap-4">
             <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
                <Database className="w-3 h-3 text-blue-500" />
                <span className="text-[8px] font-black text-white/30 uppercase">DB Cluster: Linked</span>
             </div>
             <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
                <Network className="w-3 h-3 text-blue-500" />
                <span className="text-[8px] font-black text-white/30 uppercase">Latency: 2ms</span>
             </div>
          </div>
          <p className="text-[9px] text-white/20 text-center font-bold uppercase tracking-[0.2em] max-w-[400px]">
            Ce système est réservé aux personnels autorisés. Toute tentative d'accès non autorisé est surveillée et passible de poursuites pénales directes.
          </p>
        </motion.div>
      </div>

      {/* 4. Bottom Ticker */}
      <StatusTicker />
      
      {/* 5. HUD Accents */}
      <div className="absolute top-0 left-0 p-8 z-20 hidden md:block">
        <div className="flex gap-6">
          <div className="w-12 h-1 bg-blue-500/20 rounded-full overflow-hidden">
            <motion.div 
              animate={{ x: [-48, 48] }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="w-12 h-full bg-blue-500"
            />
          </div>
          <div className="text-[10px] font-mono text-blue-500/40">RC_SYSTEM_ONLINE</div>
        </div>
      </div>
      
      {/* Large background watermarks */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none opacity-[0.02] scale-[2.5] z-0">
        <Shield className="w-96 h-96 text-white" />
      </div>
    </div>
  );
};

export default LoginPage;
