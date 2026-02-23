import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle, Users, Map, TrendingUp, TrendingDown, Activity,
  Clock, CheckCircle, Zap, BarChart2, Eye, ArrowRight, Shield
} from 'lucide-react';
import { Agent, AppStats, Signalement, TickerEvent, Zone, ViewId } from '../App';

interface DashboardViewProps {
  stats: AppStats | null; signalements: Signalement[]; agents: Agent[];
  zones: Zone[]; tickerEvents: TickerEvent[]; loading: boolean; onNavigate: (v: ViewId) => void;
}

const KpiCard: React.FC<{
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; trend?: number; color: string; delay?: number;
}> = ({ label, value, sub, icon: Icon, trend, color, delay = 0 }) => (
  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.35, ease: [0.16,1,0.3,1] }} className="kpi-card">
    <div style={{ '--accent-color': color } as React.CSSProperties} className="kpi-accent-bar" />
    <div className="kpi-label"><Icon style={{ width: 13, height: 13 }} />{label}</div>
    <div className="kpi-value">{value}</div>
    {sub && <div className="kpi-sub">{sub}</div>}
    {trend !== undefined && (
      <div className={`kpi-trend ${trend >= 0 ? 'up' : 'down'}`} style={{ marginTop: 8 }}>
        {trend >= 0 ? <TrendingUp style={{ width: 12, height: 12 }} /> : <TrendingDown style={{ width: 12, height: 12 }} />}
        {trend >= 0 ? '+' : ''}{trend}% vs hier
      </div>
    )}
  </motion.div>
);

const MiniBar: React.FC<{ label: string; value: number; max: number; color: string }> = ({ label, value, max, color }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, fontSize: 12 }}>
    <span style={{ width: 80, color: 'var(--text-muted)', flexShrink: 0, fontSize: 11 }}>{label}</span>
    <div className="progress-track" style={{ flex: 1 }}>
      <div className={`progress-fill ${color}`} style={{ width: `${Math.round((Math.min(value, max) / max) * 100)}%` }} />
    </div>
    <span style={{ width: 28, textAlign: 'right', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--text-secondary)' }}>{value}</span>
  </div>
);

const DashboardView: React.FC<DashboardViewProps> = ({ stats, signalements, agents, zones, tickerEvents, loading, onNavigate }) => {
  const activeSOS   = signalements.filter(s => s.statut === 'NOUVEAU' || s.statut === 'EN_COURS' || s.statut === 'ZONE_INCONNUE');
  const closedToday = signalements.filter(s => s.statut === 'CLOTURE' && new Date(s.dateCreation).toDateString() === new Date().toDateString());
  const availAgents = agents.filter(a => !a.isOccupied);
  const vitalSOS    = activeSOS.filter(s => s.gravite === 'VITAL');
  const recentSOS   = [...signalements].sort((a, b) => new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime()).slice(0, 8);
  const leaderboard = [...agents].sort((a, b) => (b.points || 0) - (a.points || 0)).slice(0, 5);

  const graviteData = [
    { label: 'VITAL',    value: signalements.filter(s => s.gravite === 'VITAL').length,    color: 'progress-red' },
    { label: 'CRITIQUE', value: signalements.filter(s => s.gravite === 'CRITIQUE').length, color: 'progress-amber' },
    { label: 'MOYEN',    value: signalements.filter(s => s.gravite === 'MOYEN').length,    color: 'progress-blue' },
    { label: 'FAIBLE',   value: signalements.filter(s => s.gravite === 'FAIBLE').length,   color: 'progress-green' },
  ];
  const maxSig = Math.max(1, signalements.length);

  if (loading) return (
    <div className="page-content">
      {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 14 }} />)}
    </div>
  );

  return (
    <div className="page-content">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 900, letterSpacing: -0.5, margin: 0 }}>Tableau de bord</h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, margin: '4px 0 0' }}>
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {vitalSOS.length > 0 && (
            <button className="btn btn-danger btn-sm" onClick={() => onNavigate('sitac')}>
              <AlertTriangle style={{ width: 12, height: 12 }} />
              {vitalSOS.length} VITAL actif{vitalSOS.length > 1 ? 's' : ''}
            </button>
          )}
          <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('sitac')}>
            <Map style={{ width: 12, height: 12 }} />
            Ouvrir SITAC
            <ArrowRight style={{ width: 11, height: 11 }} />
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpi-grid">
        <KpiCard label="SOS Actifs" value={activeSOS.length} sub={`${vitalSOS.length} VITAL`} icon={AlertTriangle} color="#dc2626" trend={activeSOS.length > 0 ? 12 : -5} delay={0} />
        <KpiCard label="Agents Disponibles" value={availAgents.length} sub={`sur ${agents.length} total`} icon={Users} color="#2563eb" delay={0.05} />
        <KpiCard label="Clôturés aujourd'hui" value={closedToday.length} sub="interventions" icon={CheckCircle} color="#16a34a" trend={8} delay={0.1} />
        <KpiCard label="Zones Actives" value={zones.length} sub="périmètres actifs" icon={Map} color="#7c3aed" delay={0.15} />
      </div>

      {/* 2 columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Rank Distribution breakdown */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card">
          <div className="card-header">
            <div><div className="card-title">Répartition des Grades</div><div className="card-subtitle">Hiérarchie opérationnelle</div></div>
            <Shield style={{ width: 16, height: 16, color: 'var(--text-muted)' }} />
          </div>
          <div className="card-body">
            {[
              { label: 'Commissaires', value: agents.filter(a => a.grade?.includes('Commissaire')).length, color: 'progress-red' },
              { label: 'Officiers', value: agents.filter(a => a.grade?.includes('Officier')).length, color: 'progress-amber' },
              { label: 'Brigadiers', value: agents.filter(a => a.grade?.includes('Brigadier')).length, color: 'progress-blue' },
              { label: 'Gardiens', value: agents.filter(a => a.grade?.includes('Gardien') || !a.grade).length, color: 'progress-green' },
            ].map(g => <MiniBar key={g.label} label={g.label} value={g.value} max={Math.max(1, agents.length)} color={g.color} />)}
          </div>
        </motion.div>

        {/* Unit Capacity breakdown */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }} className="card">
          <div className="card-header">
            <div><div className="card-title">Présence par Unité</div><div className="card-subtitle">Capacité opérationnelle</div></div>
            <Users style={{ width: 16, height: 16, color: 'var(--text-muted)' }} />
          </div>
          <div className="scroll-area" style={{ maxHeight: 180 }}>
            {Array.from(new Set(agents.map(a => a.unite || 'Standard'))).map((unit, i) => {
              const uAgents = agents.filter(a => (a.unite || 'Standard') === unit);
              const uBusy = uAgents.filter(a => a.isOccupied).length;
              return (
                <div key={unit} style={{ padding: '10px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-white uppercase">{unit}</span>
                    <span className="text-[10px] font-black text-zinc-500">{uAgents.length} Agents</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill progress-blue" style={{ width: `${(uAgents.length / Math.max(1, agents.length)) * 100}%` }} />
                    <div className="progress-fill progress-red" style={{ width: `${(uBusy / Math.max(1, agents.length)) * 100}%`, position: 'absolute', top: 0, left: 0 }} />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[9px] text-zinc-500 uppercase">Engagement</span>
                    <span className="text-[9px] font-black text-red-400">{Math.round((uBusy / uAgents.length) * 100)}% Actifs</span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Recent SOS Table */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }} className="card">
        <div className="card-header">
          <div><div className="card-title">Signalements récents</div><div className="card-subtitle">8 derniers incidents</div></div>
          <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('archives')}><Eye style={{ width: 12, height: 12 }} />Voir tout</button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          {recentSOS.length === 0
            ? <div className="empty-state"><Activity className="empty-state-icon" /><p className="empty-state-title">Aucun signalement</p></div>
            : (
              <table className="data-table">
                <thead><tr><th>ID</th><th>Type</th><th>Gravité</th><th>Statut</th><th>Il y a</th></tr></thead>
                <tbody>
                  {recentSOS.map(sig => {
                    const gc = sig.gravite === 'VITAL' ? 'badge-vital' : sig.gravite === 'CRITIQUE' ? 'badge-critique' : sig.gravite === 'MOYEN' ? 'badge-moyen' : 'badge-faible';
                    const sc = sig.statut === 'NOUVEAU' ? 'badge-nouveau' : sig.statut === 'EN_COURS' ? 'badge-en_cours' : 'badge-cloture';
                    const ago = Math.round((Date.now() - new Date(sig.dateCreation).getTime()) / 60000);
                    return (
                      <tr key={sig.id} className="clickable" onClick={() => onNavigate('sitac')}>
                        <td><span className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>#{sig.id}</span></td>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: 12 }}>{sig.type}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{sig.description?.slice(0, 55)}{(sig.description?.length || 0) > 55 ? '…' : ''}</div>
                        </td>
                        <td><span className={`badge ${gc}`}>{sig.gravite}</span></td>
                        <td><span className={`badge ${sc}`}>{sig.statut}</span></td>
                        <td><span className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{ago < 1 ? 'À l\'instant' : ago < 60 ? `${ago}m` : `${Math.floor(ago/60)}h`}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
          )}
        </div>
      </motion.div>

      {/* Activity + Agent statuses */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }} className="card">
          <div className="card-header"><div className="card-title">Journal d'activité</div></div>
          <div className="scroll-area" style={{ maxHeight: 260 }}>
            {tickerEvents.length === 0
              ? <div className="empty-state"><Clock className="empty-state-icon" /><p className="empty-state-title">Aucun événement</p></div>
              : tickerEvents.slice(0, 15).map(ev => (
                <div key={ev.id} className="activity-item">
                  <div className={`activity-dot ${ev.type === 'alert' ? 'red' : ev.type === 'success' ? 'green' : 'blue'}`} />
                  <div className="activity-content">
                    <div className="activity-msg">{ev.message}</div>
                    <div className="activity-time">{ev.time.toLocaleTimeString('fr-FR')}</div>
                  </div>
                </div>
              ))
            }
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.36 }} className="card">
          <div className="card-header">
            <div className="card-title">État des agents</div>
            <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('agents')}>Gérer <ArrowRight style={{ width: 11, height: 11 }} /></button>
          </div>
          <div className="scroll-area" style={{ maxHeight: 260 }}>
            {agents.length === 0
              ? <div className="empty-state"><Users className="empty-state-icon" /><p className="empty-state-title">Aucun agent</p></div>
              : agents.slice(0, 10).map((a, i) => (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px', borderBottom: i < Math.min(agents.length, 10) - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: a.isOccupied ? 'var(--accent-red)' : 'var(--accent-green)', boxShadow: `0 0 5px ${a.isOccupied ? 'var(--accent-red)' : 'var(--accent-green)'}` }} />
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--bg-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: 'var(--text-muted)' }}>{a.nom[0]}{a.prenom[0]}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, margin: 0, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.nom} {a.prenom}</p>
                  </div>
                  <span style={{ fontSize: 10, color: a.isOccupied ? '#fca5a5' : '#86efac', fontWeight: 700 }}>{a.isOccupied ? 'Mission' : 'Libre'}</span>
                </div>
              ))
            }
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardView;
