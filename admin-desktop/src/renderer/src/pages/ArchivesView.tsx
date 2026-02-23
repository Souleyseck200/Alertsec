import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Download, Archive, RefreshCw, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { Agent, Signalement, Zone } from '../App';

interface ArchivesViewProps {
  signalements: Signalement[];
  agents: Agent[];
  zones: Zone[];
}

const ArchivesView: React.FC<ArchivesViewProps> = ({ signalements, agents, zones }) => {
  const [search, setSearch] = useState('');
  const [gravFilter, setGravFilter] = useState('ALL');
  const [statutFilter, setStatutFilter] = useState('ALL');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  const sorted = [...signalements].sort((a, b) => new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime());

  const filtered = sorted.filter(s => {
    const q = search.toLowerCase();
    const matchQ = !q || s.type.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q) || String(s.id).includes(q);
    const matchG = gravFilter === 'ALL' || s.gravite === gravFilter;
    const matchS = statutFilter === 'ALL' || s.statut === statutFilter;
    return matchQ && matchG && matchS;
  });

  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const handleExport = () => {
    const rows = [['ID','Type','Gravité','Statut','Date','Description'],
      ...filtered.map(s => [s.id, s.type, s.gravite, s.statut, new Date(s.dateCreation).toLocaleString('fr-FR'), s.description?.replace(/,/g,'') || ''])
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `alertsec_archives_${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page-content" style={{ gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 900, letterSpacing: -0.5, margin: 0 }}>Archives</h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, margin: '4px 0 0' }}>
            {filtered.length} signalement{filtered.length !== 1 ? 's' : ''} · Historique complet
          </p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={handleExport}>
          <Download style={{ width: 12, height: 12 }} />Exporter CSV
        </button>
      </div>

      {/* Main Card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card" style={{ flex: 1 }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 220, maxWidth: 340 }}>
            <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 13, height: 13, color: 'var(--text-disabled)' }} />
            <input className="input" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} placeholder="Rechercher par type, ID, description…" style={{ paddingLeft: 32, height: 34, fontSize: 12 }} />
          </div>

          <div style={{ display: 'flex', gap: 4 }}>
            {['ALL','VITAL','CRITIQUE','MOYEN','FAIBLE'].map(g => (
              <button key={g} onClick={() => { setGravFilter(g); setPage(0); }}
                style={{ padding: '3px 8px', borderRadius: 'var(--radius-sm)', fontSize: 10, fontWeight: 800, cursor: 'pointer', border: 'none', background: gravFilter === g ? 'var(--accent-blue)' : 'transparent', color: gravFilter === g ? 'white' : 'var(--text-muted)', transition: 'all .15s' }}>
                {g}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 4 }}>
            {['ALL','NOUVEAU','EN_COURS','CLOTURE'].map(s => (
              <button key={s} onClick={() => { setStatutFilter(s); setPage(0); }}
                style={{ padding: '3px 8px', borderRadius: 'var(--radius-sm)', fontSize: 10, fontWeight: 800, cursor: 'pointer', border: 'none', background: statutFilter === s ? 'var(--bg-muted)' : 'transparent', color: statutFilter === s ? 'var(--text-primary)' : 'var(--text-muted)', transition: 'all .15s' }}>
                {s === 'ALL' ? 'Tous' : s}
              </button>
            ))}
          </div>

          <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto', fontFamily: 'JetBrains Mono, monospace' }}>
            {filtered.length} résultats
          </span>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 350px)' }} className="scroll-area">
          {paginated.length === 0 ? (
            <div className="empty-state">
              <Archive className="empty-state-icon" />
              <p className="empty-state-title">Aucun résultat</p>
              <p className="empty-state-desc">Modifiez vos filtres de recherche</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Gravité</th>
                  <th>Statut</th>
                  <th>Date</th>
                  <th>Médias</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(sig => {
                  const gc = sig.gravite === 'VITAL' ? 'badge-vital' : sig.gravite === 'CRITIQUE' ? 'badge-critique' : sig.gravite === 'MOYEN' ? 'badge-moyen' : 'badge-faible';
                  const sc = sig.statut === 'NOUVEAU' ? 'badge-nouveau' : sig.statut === 'EN_COURS' ? 'badge-en_cours' : 'badge-cloture';
                  return (
                    <tr key={sig.id}>
                      <td><span className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>#{sig.id}</span></td>
                      <td><span style={{ fontWeight: 700, fontSize: 12 }}>{sig.type}</span></td>
                      <td style={{ maxWidth: 260 }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                          {sig.description?.slice(0, 80)}{(sig.description?.length || 0) > 80 ? '…' : ''}
                        </span>
                      </td>
                      <td><span className={`badge ${gc}`}>{sig.gravite}</span></td>
                      <td><span className={`badge ${sc}`}>{sig.statut}</span></td>
                      <td>
                        <span className="mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                          {new Date(sig.dateCreation).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 3 }}>
                          {sig.mediaUrl && <span style={{ fontSize: 9, padding: '1px 5px', background: 'rgba(37,99,235,0.15)', color: '#93c5fd', borderRadius: 4, fontWeight: 800 }}>IMG</span>}
                          {sig.audioUrl && <span style={{ fontSize: 9, padding: '1px 5px', background: 'rgba(217,119,6,0.15)', color: '#fcd34d', borderRadius: 4, fontWeight: 800 }}>AUD</span>}
                          {sig.videoUrl && <span style={{ fontSize: 9, padding: '1px 5px', background: 'rgba(22,163,74,0.15)', color: '#86efac', borderRadius: 4, fontWeight: 800 }}>VID</span>}
                          {!sig.mediaUrl && !sig.audioUrl && !sig.videoUrl && <span style={{ fontSize: 10, color: 'var(--text-disabled)' }}>—</span>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid var(--border-subtle)' }}>
            <button className="btn btn-ghost btn-sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>← Précédent</button>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
              Page {page + 1} / {totalPages}
            </span>
            <button className="btn btn-ghost btn-sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Suivant →</button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ArchivesView;
