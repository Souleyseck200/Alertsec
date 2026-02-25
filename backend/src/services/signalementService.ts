import prisma from '../lib/prisma';
import socketService from './socketService';
import { z } from 'zod';

export const signalementSchema = z.object({
  type: z.enum(['ACCIDENT', 'INCENDIE', 'AGRESSION', 'VOL', 'INONDATION', 'RASSEMBLEMENT_SUSPECT', 'AUTRE', 'URGENCE']),
  description: z.string(),
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
  gravite: z.enum(['FAIBLE', 'MOYEN', 'CRITIQUE', 'VITAL']).default('FAIBLE'),
  est_victime: z.coerce.boolean().optional().default(true),
  type_entree: z.enum(['SOS_AUTO', 'MANUEL']).optional().default('SOS_AUTO'),
});

class SignalementService {
  /**
   * Calcule la zone la plus proche des coordonnées GPS
   */
  async findNearestZone(lat: number, lng: number) {
    const zones = await prisma.zone.findMany();
    if (zones.length === 0) return null;

    let nearestZone = null;
    let minDistance = Infinity;

    for (const zone of zones) {
      try {
        const loc = JSON.parse(zone.localisation);
        let zLat = 0, zLng = 0;

        if (Array.isArray(loc)) {
          // Centroid for Polygons
          zLat = loc.reduce((sum, p) => sum + p[0], 0) / loc.length;
          zLng = loc.reduce((sum, p) => sum + p[1], 0) / loc.length;
        } else if (loc && typeof loc === 'object' && loc.lat) {
          // Circle/Point center
          zLat = loc.lat;
          zLng = loc.lng;
        } else {
          continue;
        }

        const distance = Math.sqrt(Math.pow(lat - zLat, 2) + Math.pow(lng - zLng, 2));
        if (distance < minDistance) {
          minDistance = distance;
          nearestZone = zone;
        }
      } catch (e) {
        continue;
      }
    }
    // Threshold for "in zone" (approx 10km radius for fallback detection)
    if (minDistance > 0.1) return null;
    return nearestZone;
  }

  async create(
    data: any, 
    userId: number, 
    mediaUrl: string | null,
    audioUrl: string | null = null,
    videoUrl: string | null = null
  ) {
    const validatedData = signalementSchema.parse(data);
    const zone = await this.findNearestZone(validatedData.latitude, validatedData.longitude);
    const statut = zone ? 'NOUVEAU' : 'ZONE_INCONNUE';

    const signalement = await prisma.signalement.create({
      data: {
        ...validatedData,
        citoyenId: userId,
        mediaUrl,
        audioUrl,
        videoUrl,
        zoneId: zone?.id || null,
        statut
      },
    });

    // Enrich specifically for socket emission (include citoyen and zone)
    const enrichedSignalement = await prisma.signalement.findUnique({
      where: { id: signalement.id },
      include: {
        citoyen: { 
          select: { 
            nom: true, prenom: true, telephone: true, photoUrl: true,
            contactsUrgence: true 
          } 
        },
        zone: true,
        affectations: {
          include: { 
            agent: { select: { nom: true, prenom: true, photoUrl: true } }
          }
        }
      }
    });

    // Real-time broadcast
    socketService.emitNewSignalement(signalement.zoneId, enrichedSignalement || signalement);

    // ICE Protocol : Alerter les contacts de confiance
    if (validatedData.type_entree === 'SOS_AUTO' || validatedData.gravite === 'VITAL') {
      this.alertEmergencyContacts(enrichedSignalement || signalement);
    }

    // ESCALADE
    if (zone) {
      const activeAgents = await prisma.user.count({
        where: { zoneId: zone.id, role: 'AGENT' }
      });
      if (activeAgents === 0) {
        socketService.emitEscalation(signalement);
      }
    }

    return signalement;
  }

  /**
   * Simule l'envoi d'alertes aux contacts ICE
   */
  private async alertEmergencyContacts(signalement: any) {
    const contacts = signalement.citoyen.contactsUrgence;
    if (!contacts || contacts.length === 0) return;

    console.log(`[ICE Protocol] Alerte envoyée aux ${contacts.length} contacts de ${signalement.citoyen.nom}`);
    contacts.forEach((contact: any) => {
      console.log(`   -> SMS à ${contact.nom} (${contact.telephone}) : SOS de ${signalement.citoyen.prenom} ! Voir : http://alertsec.sn/sos/${signalement.id}`);
    });
  }

  async cancel(id: number, userId: number) {
    const signalement = await prisma.signalement.findUnique({
      where: { id },
      include: { affectations: { include: { agent: true } } }
    });

    if (!signalement) throw new Error('Signalement non trouvé');
    if (signalement.citoyenId !== userId) throw new Error('Non autorisé');

    const updated = await prisma.$transaction(async (tx: any) => {
      const s = await tx.signalement.update({
        where: { id },
        data: { statut: 'ANNULE' }
      });

      // Libérer l'agent si affecté
      if (signalement.affectations.length > 0) {
        const agentId = signalement.affectations[0].agentId;
        await tx.user.update({
          where: { id: agentId },
          data: { isOccupied: false }
        });
      }

      return s;
    });

    // Notifications Sockets
    socketService.emitStatusUpdate(signalement.citoyenId, {
      signalementId: id,
      statut: 'ANNULE',
      message: "L'alerte a été annulée par l'émetteur."
    });

    // Alerter l'admin room du changement
    socketService.emitStatusUpdate('admin_room', {
      signalementId: id,
      statut: 'ANNULE',
      message: `Alerte #${id} annulée par le citoyen.`
    });

    return updated;
  }

  async getHistory(userId: number) {
    return prisma.signalement.findMany({
      where: { citoyenId: userId },
      include: { 
        zone: true,
        affectations: {
          include: { 
            interventions: true,
            agent: { select: { nom: true, prenom: true, grade: true } }
          }
        }
      },
      orderBy: { dateCreation: 'desc' }
    });
  }

  async getHeatmapData() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const signalements = await prisma.signalement.findMany({
      where: {
        dateCreation: { gte: thirtyDaysAgo },
        type_entree: 'SOS_AUTO' // On ne Heatmap que les SOS réels, pas les signalements manuels divers
      },
      select: { latitude: true, longitude: true, gravite: true }
    });

    return signalements.map((s: { latitude: number, longitude: number, gravite: string }) => ({
      lat: s.latitude,
      lng: s.longitude,
      weight: s.gravite === 'VITAL' ? 4 : (s.gravite === 'CRITIQUE' ? 3 : (s.gravite === 'MOYEN' ? 2 : 1))
    }));
  }

  async getAll(role: string, zoneId?: number) {
    const where = role === 'AGENT' && zoneId ? { zoneId } : {};
    return prisma.signalement.findMany({
      where,
      include: {
        citoyen: { select: { nom: true, prenom: true, telephone: true, photoUrl: true } },
        zone: true,
        affectations: {
          include: { 
            agent: { select: { nom: true, prenom: true, photoUrl: true } },
            interventions: { select: { dateFin: true } }
          }
        }
      },
      orderBy: { dateCreation: 'desc' }
    });
  }
}

export default new SignalementService();
