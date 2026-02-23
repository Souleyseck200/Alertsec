import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface Coordinate {
  latitude: number;
  longitude: number;
}

/**
 * Calculates the Haversine distance between two points in meters.
 */
export function getDistance(p1: Coordinate, p2: Coordinate): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (p1.latitude * Math.PI) / 180;
  const φ2 = (p2.latitude * Math.PI) / 180;
  const Δφ = ((p2.latitude - p1.latitude) * Math.PI) / 180;
  const Δλ = ((p2.longitude - p1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Formats distance into a human-readable tactical string.
 */
export function formatTacticalDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

export type EmergencyLevel = "INFO_01" | "WARN_02" | "CRIT_03" | "SOS_ACTIVE";

export const PROTOCOL_COLORS: Record<EmergencyLevel, string> = {
  INFO_01: "#0ea5e9",
  WARN_02: "#f59e0b",
  CRIT_03: "#ef4444",
  SOS_ACTIVE: "#7f1d1d",
};

/**
 * Converts Hex to RGBA for glassmorphism effects.
 */
export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const TACTICAL_STRINGS = {
  fr_sn: {
    APP_NAME: "AlertSec",
    SOS_BUTTON_LABEL: "DÉCLENCHER SOS",
    SOS_SUBTEXT: "INTERVENTION IMMÉDIATE",
    MAP_HUD_ACTIVE: "CARTOGRAPHIE TACTIQUE ACTIVE",
    SIGNAL_LOST: "SIGNAL GPS FAIBLE - RECHERCHE...",
    AGENT_PROXIMITY: "AGENT À PROXIMITÉ",
    SAFE_ZONE_FOUND: "REFUGE IDENTIFIÉ",
    PROTOCOL_IN_PROGRESS: "PROTOCOLE D'INTERVENTION EN COURS",
    CONFIRM_CANCEL: "CONFIRMER ANNULATION ?",
    DANGER_DETECTED: "ZONE À RISQUE DÉTECTÉE",
    VIVA_STATUS: "STATUT VIVA : SÉCURISÉ",
  }
};
