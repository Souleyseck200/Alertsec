import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Search, RefreshCw, UserCheck, UserX, MapPin, Zap,
  Phone, Mail, Plus, X, Shield, Lock, BadgeCheck, Fingerprint, Printer, Loader2
} from 'lucide-react';
import { Agent, Zone } from '../App';
import { adminService } from '../services/api';
import { toast } from 'sonner';

interface AgentsViewProps {
  agents: Agent[];
  zones: Zone[];
  onReload: () => void;
}

const TacticalIDModal: React.FC<{ isOpen: boolean; onClose: () => void; agent: Agent }> = ({ isOpen, onClose, agent }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-xl" />
      <motion.div initial={{ scale: 0.8, opacity: 0, rotateY: 30 }} animate={{ scale: 1, opacity: 1, rotateY: 0 }} className="relative w-[450px] aspect-[1.6/1] bg-gradient-to-br from-zinc-900 to-black border border-white/20 rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col">
        {/* ID Card Background Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-500/5 blur-[100px] -ml-32 -mb-32" />

        {/* Header */}
        <div className="p-5 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-tighter">AlertSec Command</h2>
              <p className="text-[8px] font-bold text-blue-400 uppercase tracking-widest">République du Sénégal</p>
            </div>
          </div>
          <Fingerprint className="w-6 h-6 text-zinc-700" />
        </div>

        {/* Body */}
        <div className="flex-1 p-6 flex gap-6 relative">
          <div className="w-32 h-40 rounded-xl bg-zinc-800 border border-white/10 overflow-hidden shadow-inner flex-shrink-0 relative group">
            {agent.photoUrl ? (
              <img src={agent.photoUrl.startsWith('http') ? agent.photoUrl : `http://localhost:3000${agent.photoUrl}`} className="w-full h-full object-cover grayscale brightness-110" alt="Agent" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl font-black text-white/5 uppercase select-none">{agent.nom[0]}{agent.prenom[0]}</div>
            )}
            <div className="absolute inset-0 bg-blue-500/5 mix-blend-overlay" />
            <div className="absolute inset-0 border-[0.5px] border-white/20 rounded-xl pointer-events-none" />
          </div>

          <div className="flex-1 space-y-4">
            <div className="space-y-1">
              <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Identité de l'Agent</p>
              <h3 className="text-xl font-black text-white uppercase leading-none">{agent.nom} {agent.prenom}</h3>
              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">{agent.grade || 'Agent de Section'}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Matricule</p>
                <p className="text-xs font-mono text-white font-bold">{agent.matricule || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">ID National</p>
                <p className="text-xs font-mono text-white font-bold">{agent.cin || 'CONFIDENTIEL'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Unité Affectée</p>
                <p className="text-[10px] text-white font-bold uppercase">{agent.unite || 'Standard'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Zone Tactique</p>
                <p className="text-[10px] text-white font-bold uppercase tracking-tighter">Secteur Alpha-9</p>
              </div>
            </div>
          </div>

          {/* Hologram Mark */}
          <div className="absolute bottom-4 right-4 w-12 h-12 rounded-full border border-white/10 bg-gradient-to-tr from-white/5 to-transparent flex items-center justify-center -rotate-12 opacity-50">
            <Shield className="w-6 h-6 text-white/20" />
            <div className="absolute inset-0 bg-blue-500/10 blur-xl rounded-full" />
          </div>
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 border-t border-white/5 flex items-center justify-between bg-black/50">
          <div className="flex gap-4">
             <div className="flex flex-col">
               <span className="text-[7px] font-black text-zinc-600 uppercase">Groupe Sanguin</span>
               <span className="text-[10px] font-black text-red-500">{agent.groupeSanguin || 'N/A'}</span>
             </div>
             <div className="flex flex-col">
               <span className="text-[7px] font-black text-zinc-600 uppercase">Habilitation</span>
               <span className="text-[10px] font-black text-green-500 uppercase">Active</span>
             </div>
          </div>
          <div className="text-[10px] font-mono text-zinc-700 font-bold select-none">AS-SECURE-778-2026</div>
        </div>

        <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-white/[0.03] to-transparent" />
      </motion.div>
      <div className="absolute bottom-10 flex gap-4">
        <button onClick={onClose} className="btn btn-ghost bg-white/5 h-10 px-6 rounded-xl text-[10px] uppercase font-black tracking-widest">Fermer</button>
        <button className="btn btn-primary h-10 px-6 rounded-xl text-[10px] uppercase font-black tracking-widest" onClick={() => window.print()}>
          <Printer className="w-4 h-4 mr-2" /> Imprimer ID
        </button>
      </div>
    </div>
  );
};

const AdvancedEnrollmentModal: React.FC<{ isOpen: boolean; onClose: () => void; zones: Zone[]; onCreated: () => void }> = ({ isOpen, onClose, zones, onCreated }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ 
    nom: '', prenom: '', email: '', telephone: '', cin: '', 
    dateNaissance: '', groupeSanguin: '', grade: '', unite: '', 
    specialites: '', adresse: '', matricule: '', zoneId: '' 
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 4) { setStep(s => s + 1); return; }
    
    try {
      setLoading(true);
      await adminService.createAgent({
        ...formData,
        zoneId: formData.zoneId ? parseInt(formData.zoneId) : undefined
      });
      toast.success('Dossier d\'agent validé et activé');
      onCreated();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Erreur lors de l'enrôlement");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const steps = [
    { id: 1, label: 'Identité', icon: Shield },
    { id: 2, label: 'Contact', icon: Mail },
    { id: 3, label: 'Tactique', icon: Zap },
    { id: 4, label: 'Validation', icon: BadgeCheck },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
      <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} className="relative w-full max-w-2xl bg-[#0e0e10] border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header with Stepper */}
        <div className="p-8 border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Plus className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white tracking-tight">Enrôlement Étatique Agent</h3>
                <p className="text-[10px] uppercase font-black text-zinc-500 tracking-[0.2em]">Système de Commandement AlertSec</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-zinc-600 transition-colors"><X className="w-6 h-6" /></button>
          </div>

          <div className="flex items-center justify-between gap-2 px-4">
            {steps.map((s, idx) => (
              <React.Fragment key={s.id}>
                <div className={`flex flex-col items-center gap-2 relative z-10 ${step >= s.id ? 'text-blue-400' : 'text-zinc-600'}`}>
                  <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${step >= s.id ? 'bg-blue-500/10 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'bg-zinc-900 border-zinc-800'}`}>
                    <s.icon className="w-5 h-5" />
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-wider">{s.label}</span>
                </div>
                {idx < steps.length - 1 && (
                  <div className="flex-1 h-[2px] bg-zinc-800 -mt-6">
                    <motion.div initial={{ width: '0%' }} animate={{ width: step > s.id ? '100%' : '0%' }} className="h-full bg-blue-500" />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-black uppercase text-zinc-500 mb-2 block ml-1">Prénom</label>
                    <input type="text" required className="input h-12 rounded-xl bg-white/5 border-white/5 focus:border-blue-500/50" placeholder="Ex: Pape Souleymane" value={formData.prenom} onChange={e => setFormData({ ...formData, prenom: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-zinc-500 mb-2 block ml-1">Nom de famille</label>
                    <input type="text" required className="input h-12 rounded-xl bg-white/5 border-white/5 focus:border-blue-500/50" placeholder="Ex: SECK" value={formData.nom} onChange={e => setFormData({ ...formData, nom: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-black uppercase text-zinc-500 mb-2 block ml-1">Numéro CIN / Passeport</label>
                    <input type="text" required className="input h-12 rounded-xl bg-white/5 border-white/5 focus:border-blue-500/50 font-mono" placeholder="1 234 1990 05678" value={formData.cin} onChange={e => setFormData({ ...formData, cin: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-zinc-500 mb-2 block ml-1">Date de Naissance</label>
                    <input type="date" required className="input h-12 rounded-xl bg-white/5 border-white/5 focus:border-blue-500/50" value={formData.dateNaissance} onChange={e => setFormData({ ...formData, dateNaissance: e.target.value })} />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-black uppercase text-zinc-500 mb-2 block ml-1">Email Gouvernemental</label>
                    <input type="email" required className="input h-12 rounded-xl bg-white/5 border-white/5 focus:border-blue-500/50" placeholder="admin@alertsec.sn" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-zinc-500 mb-2 block ml-1">Téléphone Sécurisé</label>
                    <input type="tel" required className="input h-12 rounded-xl bg-white/5 border-white/5 focus:border-blue-500/50" placeholder="+221 77 ..." value={formData.telephone} onChange={e => setFormData({ ...formData, telephone: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-zinc-500 mb-2 block ml-1">Adresse de Résidence</label>
                  <input type="text" className="input h-12 rounded-xl bg-white/5 border-white/5 focus:border-blue-500/50" placeholder="Quartier, Rue, Ville" value={formData.adresse} onChange={e => setFormData({ ...formData, adresse: e.target.value })} />
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-black uppercase text-zinc-500 mb-2 block ml-1">Grade / Rang</label>
                    <select className="input h-12 rounded-xl bg-white/5 border-white/5 focus:border-blue-500/50" value={formData.grade} onChange={e => setFormData({ ...formData, grade: e.target.value })}>
                      <option value="">Sélectionner un grade</option>
                      <option value="Lieutenant">Lieutenant</option>
                      <option value="Capitaine">Capitaine</option>
                      <option value="Commandant">Commandant</option>
                      <option value="Commissaire">Commissaire</option>
                      <option value="Brigadier">Brigadier</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-zinc-500 mb-2 block ml-1">Unité Opérationnelle</label>
                    <input type="text" className="input h-12 rounded-xl bg-white/5 border-white/5 focus:border-blue-500/50" placeholder="Ex: Brigade de Recherche" value={formData.unite} onChange={e => setFormData({ ...formData, unite: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-black uppercase text-zinc-500 mb-2 block ml-1">Groupe Sanguin</label>
                    <select className="input h-12 rounded-xl bg-white/5 border-white/5 focus:border-blue-500/50" value={formData.groupeSanguin} onChange={e => setFormData({ ...formData, groupeSanguin: e.target.value })}>
                      <option value="">Inconnu</option>
                      <option value="A+">A+</option><option value="A-">A-</option>
                      <option value="B+">B+</option><option value="B-">B-</option>
                      <option value="AB+">AB+</option><option value="AB-">AB-</option>
                      <option value="O+">O+</option><option value="O-">O-</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-zinc-500 mb-2 block ml-1">Zone d'Affectation Initiale</label>
                    <select className="input h-12 rounded-xl bg-white/5 border-white/5 focus:border-blue-500/50" value={formData.zoneId} onChange={e => setFormData({ ...formData, zoneId: e.target.value })}>
                      <option value="">Secteur Libre</option>
                      {zones.map(z => <option key={z.id} value={z.id}>{z.nom}</option>)}
                    </select>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="p-6 rounded-2xl bg-blue-500/5 border border-blue-500/10 space-y-4">
                  <div className="flex items-center gap-4 text-blue-400">
                    <BadgeCheck className="w-6 h-6" />
                    <div>
                      <p className="text-xs font-black uppercase">Prêt pour l'activation</p>
                      <p className="text-[10px] text-zinc-400">Vérifiez les informations avant la validation finale.</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-[11px]">
                    <p className="text-zinc-500 uppercase font-bold">Agent : <span className="text-white">{formData.prenom} {formData.nom}</span></p>
                    <p className="text-zinc-500 uppercase font-bold">Identifiant : <span className="text-white">{formData.cin}</span></p>
                    <p className="text-zinc-500 uppercase font-bold">Unité : <span className="text-white">{formData.unite || 'N/A'}</span></p>
                    <p className="text-zinc-500 uppercase font-bold">Zone : <span className="text-white">{zones.find(z => z.id === parseInt(formData.zoneId))?.nom || 'Secteur Libre'}</span></p>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-zinc-500 mb-2 block ml-1">Matricule de Commandement (Auto-généré si vide)</label>
                  <input type="text" className="input h-12 rounded-xl bg-white/5 border-white/5 font-mono" placeholder="AS-XXXX" value={formData.matricule} onChange={e => setFormData({ ...formData, matricule: e.target.value })} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-4 pt-8">
            {step > 1 && (
              <button type="button" onClick={() => setStep(s => s - 1)} className="btn btn-ghost h-12 px-8 rounded-xl border-white/5 uppercase text-xs font-black tracking-widest">Retour</button>
            )}
            <button type="submit" disabled={loading} className="btn btn-primary flex-1 h-12 rounded-xl justify-center uppercase text-xs font-black tracking-[0.2em] shadow-lg shadow-blue-500/20">
              {loading ? <RefreshCw className="animate-spin w-5 h-5" /> : step === 4 ? 'Confirmer l\'Enrôlement' : 'Continuer'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const AgentsView: React.FC<AgentsViewProps> = ({ agents, zones, onReload }) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'FREE' | 'BUSY'>('ALL');
  const [selected, setSelected] = useState<Agent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isIDModalOpen, setIsIDModalOpen] = useState(false);
  const [targetIDAgent, setTargetIDAgent] = useState<Agent | null>(null);
  const [loadingAction, setLoadingAction] = useState<number | null>(null);

  const handleShowID = (agent: Agent) => {
    setTargetIDAgent(agent);
    setIsIDModalOpen(true);
  };

  const handleBlockUser = async (agentId: number, currentBlocked: boolean) => {
    if (!window.confirm(`Voulez-vous vraiment ${currentBlocked ? 'rétablir' : 'révoquer'} l'accès de cet agent ?`)) return;
    try {
      setLoadingAction(agentId);
      await adminService.setUserBlockStatus(agentId, !currentBlocked);
      toast.success(currentBlocked ? 'Accès rétabli' : 'Accès révoqué');
      onReload();
    } catch {
      toast.error('Erreur lors du changement de statut');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleValidateClearance = async (agentId: number) => {
    if (!window.confirm("Voulez-vous habiliter officiellement cet agent ?")) return;
    try {
      setLoadingAction(agentId);
      await adminService.validateClearance(agentId);
      toast.success('Agent habilité avec succès (+50 XP)');
      onReload();
    } catch {
      toast.error('Erreur lors de la validation');
    } finally {
      setLoadingAction(null);
    }
  };

  const filtered = agents.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = !q || a.nom.toLowerCase().includes(q) || a.prenom.toLowerCase().includes(q) || (a.matricule || '').toLowerCase().includes(q);
    const matchFilter = filter === 'ALL' || (filter === 'FREE' && !a.isOccupied) || (filter === 'BUSY' && a.isOccupied);
    return matchSearch && matchFilter;
  });

  const freeCount = agents.filter(a => !a.isOccupied).length;
  const busyCount = agents.filter(a => a.isOccupied).length;
  const getZone = (zoneId?: number) => zones.find(z => z.id === zoneId);

  return (
    <div className="page-content" style={{ gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 900, letterSpacing: -0.5, margin: 0 }}>Gestion Agents</h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            {agents.length} agents tactiques · {freeCount} disponibles
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={onReload}><RefreshCw style={{ width: 12, height: 12 }} /></button>
          <button className="btn btn-primary btn-sm h-10 px-4 rounded-xl shadow-lg shadow-blue-500/20" onClick={() => setIsModalOpen(true)}>
            <Plus style={{ width: 14, height: 14 }} className="mr-2" /> Enrôlement Avancé
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[
          { label: 'Total Effectif', value: agents.length, icon: Users, color: '#2563eb' },
          { label: 'En Patrouille', value: freeCount, icon: Shield, color: '#16a34a' },
          { label: 'En Intervention', value: busyCount, icon: Zap, color: '#dc2626' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="kpi-card" style={{ padding: 16 }}>
            <div className="kpi-accent-bar" style={{ '--accent-color': s.color } as React.CSSProperties} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <s.icon style={{ width: 20, height: 20, color: s.color }} />
              </div>
              <div>
                <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: -1, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 }}>{s.label}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Table Container */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
            <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: 'var(--text-disabled)' }} />
            <input className="input pl-9 h-8.5 text-xs" value={search} onChange={e => setSearch(e.target.value)} placeholder="Nom, matricule…" />
          </div>
          <div style={{ display: 'flex', gap: 2 }}>
            {(['ALL', 'FREE', 'BUSY'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider border transition-all ${filter === f ? 'bg-blue-600 border-blue-500 text-white' : 'bg-transparent border-white/5 text-zinc-500 hover:text-zinc-300'}`}>
                {f === 'ALL' ? 'Tous' : f === 'FREE' ? 'Dispo' : 'Mission'}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: selected ? '1fr 340px' : '1fr', overflow: 'hidden' }}>
          <div className="scroll-area h-full">
            {filtered.length === 0 ? (
              <div className="empty-state">
                <Users className="empty-state-icon" />
                <p className="empty-state-title">Aucun agent trouvé</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Agent / Unité</th>
                    <th>ID Tactique</th>
                    <th>Statut Opérationnel</th>
                    <th>Zone Assignée</th>
                    <th>Score / XP</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(a => {
                    const zone = getZone(a.zoneId);
                    return (
                      <tr key={a.id} className="clickable" onClick={() => setSelected(prev => prev?.id === a.id ? null : a)} style={{ background: selected?.id === a.id ? 'var(--accent-blue-glow)' : undefined }}>
                        <td>
                          <div className="flex items-center gap-3">
                            {a.photoUrl ? (
                              <img src={a.photoUrl.startsWith('http') ? a.photoUrl : `http://localhost:3000${a.photoUrl}`} className="w-8 h-8 rounded-lg object-cover" alt="Avatar" />
                            ) : (
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] ${a.isOccupied ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>{a.nom[0]}{a.prenom[0]}</div>
                            )}
                            <div>
                              <p className="text-sm font-bold text-white mb-0">{a.nom} {a.prenom}</p>
                              <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-tighter">Forces de Sécurité</p>
                            </div>
                          </div>
                        </td>
                        <td><span className="font-mono text-[11px] text-zinc-400">{a.matricule || '—'}</span></td>
                        <td>
                          <span className={`badge ${a.isOccupied ? 'badge-critique' : 'badge-online'}`} style={{ fontSize: 9 }}>
                            {a.isOccupied ? 'MISSION ACTIVE' : 'PATROUILLE'}
                          </span>
                        </td>
                        <td><span className="text-xs text-zinc-400">{zone ? zone.nom : '—'}</span></td>
                        <td>
                          <div className="flex items-center gap-2">
                             <Zap className="w-3 h-3 text-amber-500" />
                             <span className="font-black text-white text-xs">{a.points || 0}</span>
                             <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-tighter">XP</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Right Detail Panel */}
          <AnimatePresence>
            {(() => {
              const selectedItem = agents.find(a => a.id === selected?.id);
              if (!selectedItem) return null;
              
              return (
                <motion.div initial={{ x: 340 }} animate={{ x: 0 }} exit={{ x: 340 }} className="border-l border-white/5 bg-[#0e0e10] p-6 flex flex-col gap-6 overflow-y-auto">
                   <div className="flex items-center justify-between">
                     <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Profil Tactique</h4>
                     <button onClick={() => setSelected(null)} className="p-1 hover:bg-white/5 rounded-full"><X className="w-4 h-4 text-zinc-600" /></button>
                   </div>
  
                   <div className="text-center">
                     <div className="w-20 h-20 rounded-2xl mx-auto mb-4 border border-white/10 p-1 bg-white/5">
                        {selectedItem.photoUrl ? (
                           <img src={selectedItem.photoUrl.startsWith('http') ? selectedItem.photoUrl : `http://localhost:3000${selectedItem.photoUrl}`} className="w-full h-full rounded-xl object-cover" alt="Agent" />
                        ) : (
                          <div className="w-full h-full rounded-xl bg-zinc-800 flex items-center justify-center text-2xl font-black text-zinc-600">
                            {selectedItem.nom[0]}{selectedItem.prenom[0]}
                          </div>
                        )}
                     </div>
                     <h3 className="text-lg font-black text-white leading-tight">{selectedItem.nom} {selectedItem.prenom}</h3>
                     <p className="text-xs text-blue-400 font-bold mt-1 uppercase tracking-wider">{selectedItem.matricule}</p>
                   </div>
  
                   <div className="grid grid-cols-2 gap-2">
                      <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                         <p className="text-[9px] font-bold text-zinc-500 uppercase mb-1">XP Cumulés</p>
                         <p className="text-lg font-black text-amber-500 uppercase">{selectedItem.points || 0}</p>
                      </div>
                      <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                         <p className="text-[9px] font-bold text-zinc-500 uppercase mb-1">Missions</p>
                         <p className="text-lg font-black text-blue-500 uppercase">{Math.floor((selectedItem.points || 0)/10)}</p>
                      </div>
                   </div>
  
                   <div className="grid grid-cols-2 gap-2">
                      <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                         <p className="text-[9px] font-bold text-zinc-500 uppercase mb-1">XP Cumulés</p>
                         <p className="text-lg font-black text-amber-500 uppercase">{selectedItem.points || 0}</p>
                      </div>
                      <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                         <p className="text-[9px] font-bold text-zinc-500 uppercase mb-1">Grade</p>
                         <p className="text-xs font-black text-blue-400 uppercase leading-none mt-1">{selectedItem.grade || 'Agent'}</p>
                      </div>
                   </div>

                   <div className="space-y-4 pt-4 border-t border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-center"><Shield className="w-3.5 h-3.5 text-zinc-500" /></div>
                        <div>
                          <p className="text-[9px] font-bold text-zinc-600 uppercase">CIN / Identité</p>
                          <p className="text-xs text-white font-mono">{selectedItem.cin || 'CONFIDENTIEL'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-center"><Zap className="w-3.5 h-3.5 text-zinc-500" /></div>
                        <div>
                          <p className="text-[9px] font-bold text-zinc-600 uppercase">Unité / Spécialité</p>
                          <p className="text-xs text-white uppercase">{selectedItem.unite || 'Infanterie'} · {selectedItem.specialites || 'Généraliste'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-center"><Phone className="w-3.5 h-3.5 text-zinc-500" /></div>
                        <div>
                          <p className="text-[9px] font-bold text-zinc-600 uppercase">Contact Réseau</p>
                          <p className="text-xs text-white font-mono">{selectedItem.telephone || 'Non renseigné'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-center"><MapPin className="w-3.5 h-3.5 text-zinc-500" /></div>
                        <div>
                          <p className="text-[9px] font-bold text-zinc-600 uppercase">Affectation</p>
                          <p className="text-xs text-white">{getZone(selectedItem.zoneId)?.nom || 'Secteur Libre'}</p>
                        </div>
                      </div>
                   </div>

                   <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10 flex items-center justify-between">
                     <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Groupe Sanguin</span>
                     <span className="text-lg font-black text-white">{selectedItem.groupeSanguin || 'N/A'}</span>
                   </div>

                   <div className="mt-auto space-y-2">
                       <button onClick={() => handleShowID(selectedItem)} className="btn btn-primary w-full justify-center h-10 text-[10px] uppercase font-black tracking-widest bg-blue-600/10 border-blue-500/20 text-blue-400 hover:bg-blue-600/20">
                          <Printer className="w-4 h-4 mr-2" /> Générer ID Tactique
                       </button>
                       <button 
                         onClick={() => handleValidateClearance(selectedItem.id)}
                         disabled={loadingAction === selectedItem.id || selectedItem.statutOperationnel === 'HABILITÉ'}
                         className="btn btn-ghost w-full justify-center h-10 border-white/5 text-[10px] uppercase font-black tracking-widest bg-white/5 disabled:opacity-50"
                       >
                          {loadingAction === selectedItem.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <BadgeCheck className={`w-4 h-4 mr-2 ${selectedItem.statutOperationnel === 'HABILITÉ' ? 'text-blue-500' : 'text-green-500'}`} />}
                          {selectedItem.statutOperationnel === 'HABILITÉ' ? 'Habilité' : 'Valider Habilitation'}
                       </button>
                       <button 
                         onClick={() => handleBlockUser(selectedItem.id, !!selectedItem.isBlocked)}
                         disabled={loadingAction === selectedItem.id}
                         className={`btn w-full justify-center h-10 text-[10px] uppercase font-black tracking-widest ${selectedItem.isBlocked ? 'bg-green-600/10 border-green-500/20 text-green-400' : 'btn-danger'}`}
                       >
                          {loadingAction === selectedItem.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4 mr-2" />}
                          {selectedItem.isBlocked ? 'Rétablir Accès' : 'Révoquer Accès'}
                       </button>
                   </div>
                </motion.div>
              );
            })()}
          </AnimatePresence>
        </div>
      </motion.div>

      <AnimatePresence>
        {isIDModalOpen && targetIDAgent && <TacticalIDModal isOpen={isIDModalOpen} onClose={() => setIsIDModalOpen(false)} agent={targetIDAgent} />}
        {isModalOpen && <AdvancedEnrollmentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} zones={zones} onCreated={onReload} />}
      </AnimatePresence>
    </div>
  );
};

export default AgentsView;
