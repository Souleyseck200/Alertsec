export enum Role {
  CITOYEN = 'CITOYEN',
  AGENT = 'AGENT',
  ADMIN = 'ADMIN',
}

export enum Gravite {
  FAIBLE = 'FAIBLE',
  MOYEN = 'MOYEN',
  CRITIQUE = 'CRITIQUE',
  VITAL = 'VITAL',
}

export enum Statut {
  NOUVEAU = 'NOUVEAU',
  ZONE_INCONNUE = 'ZONE_INCONNUE',
  EN_COURS = 'EN_COURS',
  CLOTURE = 'CLOTURE',
  ANNULE = 'ANNULE',
}

export enum TypeEntree {
  SOS_AUTO = 'SOS_AUTO',
  MANUEL = 'MANUEL',
}

export interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  adresse?: string;
  role: Role;
  matricule?: string;
  grade?: string;
  unite?: string;
  experience: number;
  points: number;
  isOccupied: boolean;
  latitude?: number;
  longitude?: number;
  zoneId?: number;
  isBlocked: boolean;
  photoUrl?: string;
  createdAt: string;
}

export interface Signalement {
  id: number;
  type: string;
  gravite: Gravite;
  description: string;
  latitude: number | string;
  longitude: number | string;
  mediaUrl?: string;
  audioUrl?: string;
  videoUrl?: string;
  statut: Statut;
  type_entree: TypeEntree;
  citoyenId: number;
  zoneId?: number;
  dateCreation: string;
}

export interface Zone {
  id: number;
  nom: string;
  localisation: string;
  rayon_action: number;
  niveau_priorite: number;
}
