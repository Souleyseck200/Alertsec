import React from 'react';
import {
  LayoutDashboard, Map, Users, BrainCircuit, Archive,
  Settings, LogOut, Search, Shield, ChevronRight,
  Bell, Zap, Activity
} from 'lucide-react';
import logo from '../assets/logo.png';
import { ViewId } from '../types';

interface SidebarProps {
  activeView: ViewId;
  onNavigate: (v: ViewId) => void;
  isConnected: boolean;
  user: { nom: string; prenom: string; email?: string };
  onLogout: () => void;
  sosCount: number;
  agentCount: number;
  onOpenCommand: () => void;
  isCrisis?: boolean; // Phase 38
}

// ─── Nav Item Definition ─────────────────────────────────────────────────────
interface NavItemDef {
  id: ViewId; label: string; icon: React.ElementType;
  badge?: number | null; badgeColor?: string; description?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
const Sidebar: React.FC<SidebarProps> = ({
  activeView, onNavigate, isConnected, user, onLogout, sosCount, agentCount, onOpenCommand, isCrisis
}) => {

  const navItems: NavItemDef[] = [
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard, description: 'Vue globale & KPIs' },
    { id: 'sitac', label: 'SITAC Live', icon: Map, badge: sosCount > 0 ? sosCount : null, badgeColor: 'red', description: 'Carte opérationnelle' },
    { id: 'incidents', label: 'Flux Signalements', icon: Bell, badge: sosCount > 0 ? sosCount : null, badgeColor: 'orange', description: 'Monitoring global' },
    { id: 'agents', label: 'Agents', icon: Users, badge: agentCount > 0 ? agentCount : null, badgeColor: 'blue', description: `${agentCount} disponibles` },
    { id: 'analytics', label: 'IA & Prédictions', icon: BrainCircuit, description: 'Analyse prédictive' },
    { id: 'archives', label: 'Journal d\'Audit', icon: Archive, description: 'Historique & traçabilité' },
  ];

  const initials = `${user.nom?.[0] || 'A'}${user.prenom?.[0] || 'D'}`;
  const fullName = `${user.nom} ${user.prenom}`;

  return (
    <aside className={`sidebar ${isCrisis ? 'crisis-active' : ''}`} style={isCrisis ? { background: 'linear-gradient(to bottom, #110505, #09090b)', borderRight: '1px solid rgba(239, 68, 68, 0.2)' } : {}}>
      {/* ── Logo ── */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon" style={{ background: 'transparent', boxShadow: 'none' }}>
          <img src={logo} alt="AlertSec" style={{ width: 36, height: 36, objectFit: 'contain' }} />
        </div>
        <div className="sidebar-logo-text">
          <div className="sidebar-logo-name">AlertSec</div>
          <div className="sidebar-logo-sub">Command Center</div>
        </div>

        {/* Connection indicator */}
        <div
          title={isConnected ? 'Serveur connecté' : 'Déconnecté'}
          style={{
            width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
            background: isConnected ? 'var(--accent-green)' : 'var(--accent-red)',
            boxShadow: isConnected ? '0 0 6px var(--accent-green)' : '0 0 6px var(--accent-red)',
          }}
          className={isConnected ? 'pulse-dot' : ''}
        />
      </div>

      {/* ── Search (CMD+K) ── */}
      <div style={{ padding: '12px 8px 0' }}>
        <button className="topbar-btn" style={{ width: '100%', justifyContent: 'space-between' }} onClick={onOpenCommand}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Search style={{ width: 13, height: 13 }} />
            <span style={{ fontSize: 12, color: 'var(--text-disabled)' }}>Rechercher…</span>
          </span>
          <kbd className="topbar-kbd">⌘K</kbd>
        </button>
      </div>

      {/* ── Navigation principale ── */}
      <div className="sidebar-section" style={{ flex: 1, overflowY: 'auto' }}>
        <div className="sidebar-section-label">Navigation</div>

        {navItems.map(item => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onNavigate(item.id)}
              title={item.description}
            >
              <item.icon style={{ width: 15, height: 15 }} className={`nav-icon ${isActive ? '' : ''}`} />
              <span style={{ flex: 1, textAlign: 'left', fontSize: 13, fontWeight: isActive ? 700 : 500 }}>
                {item.label}
              </span>
              {item.badge != null && (
                <span
                  className="nav-badge"
                  style={{ background: item.badgeColor === 'red' ? 'var(--accent-red)' : 'var(--accent-blue)' }}
                >
                  {item.badge}
                </span>
              )}
              {isActive && (
                <ChevronRight style={{ width: 12, height: 12, color: '#3b82f6', marginRight: -2 }} />
              )}
            </button>
          );
        })}

        {/* ── Divider ── */}
        <div className="divider" style={{ margin: '8px 0' }} />
        <div className="sidebar-section-label">Système</div>

        <button className="nav-item" title="Paramètres (bientôt disponible)">
          <Settings style={{ width: 15, height: 15 }} className="nav-icon" />
          <span style={{ fontSize: 13 }}>Paramètres</span>
          <span style={{ fontSize: 10, color: 'var(--text-disabled)', marginLeft: 'auto', fontFamily: 'JetBrains Mono, monospace' }}>
            bientôt
          </span>
        </button>
      </div>

      {/* ── Server Stats Row ── */}
      <div style={{ padding: '8px 12px', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <Activity style={{ width: 12, height: 12, color: sosCount > 0 ? 'var(--accent-red)' : 'var(--text-disabled)' }} />
            <span style={{ fontWeight: 800, fontSize: 14, color: sosCount > 0 ? '#fca5a5' : 'var(--text-disabled)' }}>{sosCount}</span>
            <span>SOS actifs</span>
          </div>
          <div className="divider-v" />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <Zap style={{ width: 12, height: 12, color: agentCount > 0 ? 'var(--accent-green)' : 'var(--text-disabled)' }} />
            <span style={{ fontWeight: 800, fontSize: 14, color: agentCount > 0 ? '#86efac' : 'var(--text-disabled)' }}>{agentCount}</span>
            <span>Disponibles</span>
          </div>
          <div className="divider-v" />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <div style={{ width: 12, height: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 8 }}>{isConnected ? '🟢' : '🔴'}</span>
            </div>
            <span style={{ fontWeight: 800, fontSize: 14, color: isConnected ? '#86efac' : '#fca5a5' }}>
              {isConnected ? 'ON' : 'OFF'}
            </span>
            <span>Serveur</span>
          </div>
        </div>
      </div>

      {/* ── User Footer ── */}
      <div className="sidebar-footer">
        <div className="user-card">
          <div className="user-avatar">{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="user-info-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {fullName}
            </div>
            <div className="user-info-role">Administrateur</div>
          </div>
          <div className="status-dot" />
        </div>

        <button
          className="nav-item danger"
          onClick={onLogout}
          style={{ width: '100%', marginTop: 4 }}
        >
          <LogOut style={{ width: 14, height: 14 }} className="nav-icon" />
          <span style={{ fontSize: 12 }}>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
