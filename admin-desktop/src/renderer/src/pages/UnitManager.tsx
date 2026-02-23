import React, { useEffect, useState } from 'react';
import { Users, UserPlus, ShieldAlert, Award, Search, MoreVertical, ShieldCheck, ShieldOff } from 'lucide-react';
import api, { adminService } from '../services/api';
import { User, Role, Agent } from '../types';
import { toast } from 'sonner';

const UnitManager = () => {
  const [agents, setAgents] = useState<User[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const res = await api.get('/users/all');
      setAgents(res.data.filter((u: User) => u.role === Role.AGENT || u.role === Role.ADMIN));
    } catch (error) {
      console.error(error);
    }
  };

  const toggleBlock = async (agent: User) => {
    const action = agent.isBlocked ? 'débloquer' : 'bloquer';
    if (!window.confirm(`Voulez-vous vraiment ${action} l'accès de ${agent.nom} ?`)) return;

    try {
      await adminService.setUserBlockStatus(agent.id, !agent.isBlocked);
      toast.success(`Accès ${agent.isBlocked ? 'rétabli' : 'révoqué'} pour ${agent.nom}`);
      fetchAgents();
    } catch (err) {
      toast.error('Erreur lors de la mise à jour du statut');
      console.error(err);
    }
  };

  const filteredAgents = agents.filter(a => 
    `${a.nom} ${a.prenom} ${a.matricule || ''} ${a.grade || ''} ${a.unite || ''}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 flex-1 flex flex-col overflow-hidden bg-background">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestion des Unités</h2>
          <p className="text-gray-500 mt-1">Supervision des forces et déploiement tactique</p>
        </div>
        <button className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl flex items-center gap-2 font-bold shadow-lg shadow-primary/20 transition-all active:scale-95">
          <UserPlus className="w-5 h-5" />
          Nouvel Agent
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-surface p-6 rounded-2xl border border-gray-800">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Effectif Total</p>
              <p className="text-2xl font-bold">{agents.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-surface p-6 rounded-2xl border border-gray-800">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-danger/10 rounded-xl">
              <ShieldAlert className="w-6 h-6 text-danger" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">En Intervention</p>
              <p className="text-2xl font-bold">{agents.filter(a => a.isOccupied).length}</p>
            </div>
          </div>
        </div>
        <div className="bg-surface p-6 rounded-2xl border border-gray-800">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-warning/10 rounded-xl">
              <Award className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Elite Tier (500+ XP)</p>
              <p className="text-2xl font-bold">{agents.filter(a => (a.experience || 0) > 500).length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-surface rounded-2xl border border-gray-800 flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-800">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input 
              type="text" 
              placeholder="Rechercher par nom, matricule ou zone..."
              className="w-full bg-background border border-gray-800 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-primary transition-colors"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-surface/80 backdrop-blur z-10 border-b border-gray-800">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Agent</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Grade / Unité</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Matricule</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Statut</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Points/EXP</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredAgents.map(agent => (
                <tr key={agent.id} className="hover:bg-gray-800/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center font-bold text-gray-400">
                        {agent.nom[0]}{agent.prenom[0]}
                      </div>
                      <div>
                        <p className="font-bold text-sm tracking-tight">{agent.nom} {agent.prenom}</p>
                        <p className="text-[11px] text-gray-500">{agent.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-blue-400 uppercase tracking-tighter leading-none mb-1">{agent.grade || 'Agent'}</span>
                      <span className="text-[10px] text-zinc-500 font-bold uppercase">{agent.unite || 'Standard'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-gray-400">
                    {agent.matricule || 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                      agent.isOccupied ? 'bg-danger/20 text-danger' : 'bg-green-500/20 text-green-500'
                    }`}>
                      {agent.isOccupied ? 'En Mission' : 'Libre'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="text-gray-400">
                        <span className="text-xs font-bold text-white">{agent.points || 0}</span>
                        <span className="text-[10px] ml-1">pts</span>
                      </div>
                      <div className="text-gray-400">
                        <span className="text-xs font-bold text-white">{agent.experience || 0}</span>
                        <span className="text-[10px] ml-1">xp</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => toggleBlock(agent)}
                      className={`p-2 rounded-lg transition-colors ${
                        agent.isBlocked ? 'text-green-500 hover:bg-green-500/10' : 'text-danger hover:bg-danger/10'
                      }`}
                      title={agent.isBlocked ? 'Débloquer' : 'Bloquer'}
                    >
                      {agent.isBlocked ? <ShieldCheck className="w-5 h-5" /> : <ShieldOff className="w-5 h-5" />}
                    </button>
                    <button className="p-2 text-gray-500 hover:text-white transition-colors">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UnitManager;
