export interface Signalement {
  id: number;
  type: string;
  description: string;
  gravite: string;
  statut: string;
  latitude: number | string;
  longitude: number | string;
  mediaUrl?: string;
  audioUrl?: string;
  videoUrl?: string;
  citoyenId: number;
  zoneId?: number;
  dateCreation: string;
  citoyen?: { nom: string; prenom: string; telephone: string; photoUrl: string };
  affectations?: any[];
}

export interface Agent {
  id: number; nom: string; prenom: string; role: string;
  latitude?: number; longitude?: number;
  zoneId?: number; isOccupied?: boolean; points?: number; matricule?: string;
  email?: string; telephone?: string; photoUrl?: string;
  cin?: string; dateNaissance?: string; grade?: string; unite?: string;
  specialites?: string; groupeSanguin?: string; adresse?: string;
  statutOperationnel?: string;
  isBlocked?: boolean;
}

export interface Zone {
  id: number; nom: string; localisation: string;
  rayon_action: number; niveau_priorite: number;
}

export interface AppStats {
  totalSignalements: number;
  totalAgents: number;
  totalZones: number;
  sosByStatut: { statut: string; _count: number }[];
  sosByGravite?: { gravite: string; _count: number }[];
  agentsDisponibles?: number;
}

export interface TickerEvent {
  id: string; message: string; time: Date; type: 'info' | 'alert' | 'success';
}

export type ViewId = 'dashboard' | 'sitac' | 'agents' | 'analytics' | 'archives' | 'incidents';
