import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BrainCircuit, TrendingUp, AlertTriangle, Map, RefreshCw, 
  Zap, BarChart2, Target, PieChart as PieIcon, Activity, Shield
} from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { Agent, AppStats } from '../App';

interface AnalyticsViewProps {
  predictions: any[];
  stats: AppStats | null;
  agents: Agent[];
  heatmap: any[];
  onReload: () => void;
}

const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#6366f1', '#a855f7'];

const AnalyticsView: React.FC<AnalyticsViewProps> = ({ predictions, stats, agents, heatmap, onReload }) => {
  const [reloading, setReloading] = useState(false);

  const doReload = async () => { 
    setReloading(true); 
    await onReload(); 
    setTimeout(() => setReloading(false), 600); 
  };

  const agentPerf = [...agents].sort((a, b) => (b.points || 0) - (a.points || 0));
  const avgXP = agents.length ? Math.round(agents.reduce((s, a) => s + (a.points || 0), 0) / agents.length) : 0;
  const riskZones = heatmap.slice(0, 6);

  // Data Formatting for Charts
  const gravData = stats?.sosByGravite?.map(g => ({ name: g.gravite, value: g._count })) || [];
  const statutData = stats?.sosByStatut?.map(s => ({ name: s.statut, value: s._count })) || [];
  
  const mockHistoricalTrend = [
    { hour: '00:00', total: 12 }, { hour: '04:00', total: 8 }, { hour: '08:00', total: 25 },
    { hour: '12:00', total: 42 }, { hour: '16:00', total: 38 }, { hour: '20:00', total: 56 }, { hour: '23:59', total: 20 },
  ];

  return (
    <div className="page-content" style={{ gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 900, letterSpacing: -0.5, margin: 0 }}>IA & Analytique Stratégique</h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            Analyse prédictive des risques et monitoring de performance opérationnelle
          </p>
        </div>
        <button className="btn bg-white/5 border border-white/10 hover:bg-white/10 flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all" onClick={doReload}>
          <RefreshCw style={{ width: 12, height: 12, animation: reloading ? 'spin 0.6s linear infinite' : 'none' }} />
          Actualiser
        </button>
      </div>

      {/* KPI Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[
          { label: 'Indice de Risque', value: '78%', sub: 'Tendance : Stable', color: '#ef4444', icon: AlertTriangle },
          { label: 'Efficacité IA', value: '91.4%', sub: 'Modèle Heuristique v1', color: '#a855f7', icon: BrainCircuit },
          { label: 'Précision ETA', value: '94.2%', sub: 'Sur 100 dernières missions', color: '#10b981', icon: Target },
          { label: 'Score d\'Engagement', value: avgXP, sub: 'Moyenne par agent', color: '#3b82f6', icon: Activity },
        ].map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="kpi-card" style={{ padding: 16 }}>
            <div className="kpi-accent-bar" style={{ '--accent-color': k.color } as React.CSSProperties} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: `${k.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <k.icon style={{ width: 15, height: 15, color: k.color }} />
              </div>
              <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>{k.label}</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: -1 }}>{k.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{k.sub}</div>
          </motion.div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16 }}>
        {/* Trend Analysis Chart */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card">
          <div className="card-header">
            <div><div className="card-title">Volume d'Incidents (24h)</div><div className="card-subtitle">Prévision IA vs Réalité</div></div>
            <TrendingUp style={{ width: 16, height: 16, color: 'var(--text-muted)' }} />
          </div>
          <div className="p-6 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockHistoricalTrend}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="hour" stroke="#52525b" fontSize={10} fontWeight={700} axisLine={false} tickLine={false} />
                <YAxis stroke="#52525b" fontSize={10} fontWeight={700} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ background: '#09090b', border: '1px solid #27272a', borderRadius: '12px', fontSize: '11px', fontWeight: 800 }}
                  itemStyle={{ color: '#3b82f6' }}
                />
                <Area type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Status Distribution */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="card">
          <div className="card-header">
            <div><div className="card-title">Flux Opérationnel</div><div className="card-subtitle">Répartitions des statuts</div></div>
            <PieIcon style={{ width: 16, height: 16, color: 'var(--text-muted)' }} />
          </div>
          <div className="p-6 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statutData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {statutData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />)}
                </Pie>
                <Tooltip 
                  contentStyle={{ background: '#09090b', border: '1px solid #27272a', borderRadius: '12px', fontSize: '11px', fontWeight: 800 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginTop: -20 }}>
              {statutData.map((s, i) => (
                <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i % COLORS.length] }} />
                  <span style={{ fontSize: 9, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{s.name}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
         {/* Gravity Analysis */}
         <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card">
          <div className="card-header">
            <div><div className="card-title">Gravité des Incidents</div><div className="card-subtitle">Analyse comparative</div></div>
            <BarChart2 style={{ width: 16, height: 16, color: 'var(--text-muted)' }} />
          </div>
          <div className="p-6 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gravData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="#52525b" fontSize={10} fontWeight={700} axisLine={false} tickLine={false} />
                <YAxis stroke="#52525b" fontSize={10} fontWeight={700} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ background: '#09090b', border: '1px solid #27272a', borderRadius: '12px', fontSize: '11px', fontWeight: 800 }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* AI Prediction Panel */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="card">
          <div className="card-header">
            <div><div className="card-title">Prédictions IA (24h)</div><div className="card-subtitle">Hotspots calculés</div></div>
            <BrainCircuit style={{ width: 16, height: 16, color: '#a855f7' }} />
          </div>
          <div className="p-4 space-y-3">
            {predictions.slice(0, 4).map((p, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${p.niveauRisque === 'CRITIQUE' ? 'bg-red-500/10 text-red-500' : 'bg-purple-500/10 text-purple-500'}`}>
                    <AlertTriangle style={{ width: 14, height: 14 }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 900, color: 'white' }}>Secteur {i + 1}</div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)' }}>Projeté: {p.niveauRisque || 'Moyen'}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div style={{ fontSize: 13, fontWeight: 900, color: '#a855f7' }}>{p.probabiliteDemain || '75%'}</div>
                  <div style={{ fontSize: 8, fontWeight: 900, color: 'var(--text-disabled)', textTransform: 'uppercase' }}>Probabilité</div>
                </div>
              </div>
            ))}
            {predictions.length === 0 && <div className="text-center py-8 text-zinc-600 text-[10px] font-black uppercase">Calcul des scénarios en cours...</div>}
          </div>
        </motion.div>
      </div>

      {/* Leaderboard */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card">
        <div className="card-header">
          <div><div className="card-title">Promotion de l'Excellence</div><div className="card-subtitle">Agents les plus méritants</div></div>
          <Zap style={{ width: 16, height: 16, color: '#fbbf24' }} />
        </div>
        <div className="grid grid-cols-5 gap-4 p-6">
          {agentPerf.slice(0, 5).map((a, i) => (
            <div key={a.id} className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 text-center flex flex-col items-center">
              <div style={{ fontSize: 10, fontWeight: 900, color: '#fbbf24', marginBottom: 8 }}># {i + 1}</div>
              <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-black mb-3 border-2 border-zinc-700">
                {a.nom[0]}{a.prenom[0]}
              </div>
              <div style={{ fontSize: 11, fontWeight: 900, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>{a.nom}</div>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)' }}>{a.points || 0} XP</div>
            </div>
          ))}
        </div>
      </motion.div>
      {/* Cyber Vigilance Panel */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="card border-blue-500/20 bg-blue-500/[0.02]">
        <div className="card-header">
          <div><div className="card-title text-blue-400">Cyber-Vigilance & Sécurité réseau</div><div className="card-subtitle">Monitoring des accès haute-sécurité</div></div>
          <Shield style={{ width: 16, height: 16, color: '#3b82f6' }} />
        </div>
        <div className="p-6 grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-950/50 border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase text-zinc-400">Intégrité du Réseau</span>
              </div>
              <span className="text-[11px] font-black text-white">PROTOCOLE ALPHA-6 ACTIF</span>
            </div>
            
            <div className="h-32 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockHistoricalTrend.map(t => ({ ...t, threats: Math.floor(Math.random() * 5) }))}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(59,130,246,0.1)" />
                  <Tooltip contentStyle={{ background: '#09090b', border: '1px solid #1e3a8a', borderRadius: '8px', fontSize: '10px' }} />
                  <Area type="step" dataKey="threats" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} />
                </AreaChart>
              </ResponsiveContainer>
              <div className="text-center mt-2 text-[8px] font-black uppercase text-blue-500/50 tracking-widest">Tentatives d'intrusion bloquées (24h)</div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div style={{ fontSize: 9, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10 }}>Derniers Terminaux</div>
            {[
              { id: 'NCC-01', ip: '197.234.12.88', loc: 'Dakar', status: 'Online' },
              { id: 'NCC-SERVER', ip: '10.0.0.1', loc: 'Cloud-Enc', status: 'Online' },
              { id: 'MOBILE-CMD', ip: '197.234.15.2', loc: 'Saint-Louis', status: 'Alert' },
            ].map((node, i) => (
              <div key={i} className="p-3 rounded-lg bg-white/[0.02] border border-white/5 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-black text-white">{node.id}</div>
                  <div className="text-[8px] font-bold text-zinc-500">{node.ip}</div>
                </div>
                <Badge className={node.status === 'Alert' ? 'bg-red-500/20 text-red-500' : 'bg-blue-500/20 text-blue-500'} style={{ fontSize: 8 }}>{node.status}</Badge>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AnalyticsView;
