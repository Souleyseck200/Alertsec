import React, { useEffect, useState } from 'react';
import { FileText, Search, Filter, Terminal } from 'lucide-react';
import api from '../services/api';

const LogsManager = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await api.get('/admin/logs');
      setLogs(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 flex-1 flex flex-col overflow-hidden bg-background">
      <div className="flex justify-between items-end mb-8">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-surface border border-gray-800 rounded-2xl">
            <Terminal className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Audit Trail</h2>
            <p className="text-gray-500 mt-1">Journalisation immuable des actions centralisées</p>
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-3xl border border-gray-800 flex-1 flex flex-col overflow-hidden shadow-xl">
        <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-surface/50">
          <div className="flex gap-4">
             <button className="flex items-center gap-2 px-4 py-2 bg-background border border-gray-800 rounded-xl text-xs font-bold text-gray-400 hover:text-white transition-colors">
               <Filter className="w-4 h-4" />
               Filtrer par Action
             </button>
             <button className="flex items-center gap-2 px-4 py-2 bg-background border border-gray-800 rounded-xl text-xs font-bold text-gray-400 hover:text-white transition-colors">
               <Search className="w-4 h-4" />
               Rechercher
             </button>
          </div>
          <p className="text-[11px] font-bold text-gray-600 uppercase tracking-widest">Digital Black Box v2.1</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-surface/90 backdrop-blur z-10 border-b border-gray-800">
              <tr>
                <th className="px-8 py-5 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Horodatage</th>
                <th className="px-8 py-5 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Action</th>
                <th className="px-8 py-5 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Administrateur</th>
                <th className="px-8 py-5 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Cible</th>
                <th className="px-8 py-5 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Détails</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-800/40 transition-colors group">
                  <td className="px-8 py-4 text-xs font-mono text-gray-500">
                    {new Date(log.timestamp).toLocaleString('fr-FR')}
                  </td>
                  <td className="px-8 py-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-wider ${
                      log.action.includes('BLOCK') || log.action.includes('DELETE')
                        ? 'bg-danger/10 text-danger'
                        : log.action.includes('CREATE')
                        ? 'bg-primary/10 text-primary'
                        : 'bg-warning/10 text-warning'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-8 py-4 font-bold text-sm tracking-tight">
                    {log.admin.nom} {log.admin.prenom}
                  </td>
                  <td className="px-8 py-4">
                    <span className="text-xs font-mono text-gray-400">#{log.cibleId || 'N/A'}</span>
                  </td>
                  <td className="px-8 py-4">
                    <p className="text-xs text-gray-400 italic max-w-sm truncate">{log.details || 'Aucun détail additionnel'}</p>
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

export default LogsManager;
