import React, { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import { BrainCircuit, TrendingUp, AlertTriangle, Zap } from 'lucide-react';
import api from '../services/api';

const AnalyticsIA = () => {
  const [stats, setStats] = useState<any>(null);
  const [predictions, setPredictions] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, predRes] = await Promise.all([
        api.get('/admin/stats/dashboard'),
        api.get('/admin/analytics/prediction')
      ]);
      setStats(statsRes.data);
      setPredictions(predRes.data);
    } catch (error) {
      console.error(error);
    }
  };

  if (!stats) return null;

  return (
    <div className="p-8 flex-1 overflow-y-auto bg-background">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight">Intelligence & Analytics</h2>
        <p className="text-gray-500 mt-1">Prédictions basées sur l'historique et monitoring global</p>
      </div>

      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-surface p-6 rounded-2xl border border-gray-800 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full group-hover:bg-primary/10 transition-colors"></div>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Total Incidents</p>
          <div className="flex items-center gap-2">
            <p className="text-3xl font-bold">{stats.totalSignalements}</p>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
        </div>
        <div className="bg-surface p-6 rounded-2xl border border-gray-800">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Temps Moyen de Réponse</p>
          <p className="text-3xl font-bold">{stats.avgResponseTime} <span className="text-sm font-normal text-gray-500">min</span></p>
        </div>
        <div className="bg-surface p-6 rounded-2xl border border-gray-800">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Zones à Risque</p>
          <p className="text-3xl font-bold text-danger">{predictions.filter(p => p.niveauRisque === 'CRITIQUE').length}</p>
        </div>
        <div className="bg-surface p-6 rounded-2xl border border-gray-800">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Score Efficacité Global</p>
          <p className="text-3xl font-bold text-primary">89%</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-8">
        {/* Incident Analysis */}
        <div className="bg-surface p-8 rounded-3xl border border-gray-800">
          <h3 className="text-xl font-bold mb-6">Répartition par Type de Signalement</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.statsByType}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2D2D2D" vertical={false} />
                <XAxis dataKey="type" stroke="#666" fontSize={12} />
                <YAxis stroke="#666" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1E1E1E', border: '1px solid #333', borderRadius: '12px' }}
                  itemStyle={{ color: '#2563EB' }}
                />
                <Bar dataKey="_count" fill="#2563EB" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Predictive AI Panel */}
        <div className="bg-surface p-8 rounded-3xl border border-gray-800">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold flex items-center gap-3">
              <BrainCircuit className="w-6 h-6 text-primary" />
              Prédictions IA - 24 Prochaines Heures
            </h3>
            <span className="text-[10px] font-bold px-2 py-1 bg-primary/10 text-primary rounded-lg uppercase tracking-wider">Moteur Heuristique v1.0</span>
          </div>
          
          <div className="space-y-4">
            {predictions.slice(0, 4).map((pred, i) => (
              <div key={pred.id} className="p-4 bg-background rounded-2xl border border-gray-800 flex items-center justify-between group hover:border-primary/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${
                    pred.niveauRisque === 'CRITIQUE' ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'
                  }`}>
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">{pred.nom}</h4>
                    <p className="text-[11px] text-gray-500">Risque calculé : {pred.niveauRisque}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">{pred.probabiliteDemain}</p>
                  <p className="text-[10px] font-bold text-gray-600 uppercase">Probabilité</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Leaderboard Section */}
      <div className="bg-surface p-8 rounded-3xl border border-gray-800">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
          <Zap className="w-6 h-6 text-warning" />
          Unités les plus actives (Leaderboard)
        </h3>
        <div className="grid grid-cols-5 gap-6">
          {stats.leaderboard.map((agent: any, i: number) => (
            <div key={agent.id} className="p-6 bg-background rounded-2xl border border-gray-800 text-center relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary transition-all group-hover:w-full opacity-0 group-hover:opacity-5"></div>
              <p className="text-xs font-bold text-primary mb-2"># {i + 1}</p>
              <div className="w-16 h-16 mx-auto bg-gray-700 rounded-full mb-4 flex items-center justify-center font-bold text-xl text-gray-400">
                {agent.nom[0]}{agent.prenom[0]}
              </div>
              <h4 className="font-bold text-sm mb-1">{agent.nom} {agent.prenom}</h4>
              <div className="flex items-center justify-center gap-2">
                 <span className="text-xs font-bold">{agent.points}</span>
                 <span className="text-[10px] text-gray-500">pts</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsIA;
