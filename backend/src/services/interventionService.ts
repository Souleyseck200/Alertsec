import prisma from '../lib/prisma';
import notificationService from './notificationService';
import socketService from './socketService';

class InterventionService {
  /**
   * Prise en charge d'un signalement par un agent (Action Atomique)
   */
  async takeCharge(signalementId: number, agentId: number) {
    console.log(`[InterventionService] Starting takeCharge (Expert): signalementId=${signalementId}, agentId=${agentId}`);
    
    // 1. Database Atomic Transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // VERIFICATION : Est-ce que le signalement est encore libre ?
      const currentSignalement = await tx.signalement.findUnique({
        where: { id: signalementId },
        select: { statut: true, citoyenId: true }
      });

      if (!currentSignalement) throw new Error('Signalement non trouvé');
      if (currentSignalement.statut !== 'NOUVEAU' && currentSignalement.statut !== 'ZONE_INCONNUE') {
        throw new Error('Alerte déjà sécurisée par un autre agent');
      }

      console.log(' - Step 1: Creating affectation');
      const affectation = await tx.affectation.create({
        data: { signalementId, agentId }
      });

      console.log(' - Step 2: Creating intervention');
      const intervention = await tx.intervention.create({
        data: {
          affectationId: affectation.id,
          dateDebut: new Date()
        }
      });

      console.log(' - Step 3: Updating signalement status');
      const updatedSignalement = await tx.signalement.update({
        where: { id: signalementId },
        data: { statut: 'EN_COURS' }
      });

      console.log(' - Step 3b: Updating agent isOccupied');
      await tx.user.update({
        where: { id: agentId },
        data: { isOccupied: true }
      });

      // Simulation de Navigation ETA
      const route = this.getRouteSimulation();

      return { affectation, intervention, updatedSignalement, navigation: route };
    }, {
      timeout: 10000 
    });

    // 2. Background Tasks (Post-Transaction)
    console.log(' - Step 4: Sending notifications & sockets (async)');
    
    notificationService.notifyCitoyen(signalementId, `Agent en route. Arrivée estimée dans ${result.navigation.eta} min.`)
      .catch(err => console.error('   ! Async Notification failed', err));

    try {
      socketService.emitStatusUpdate(result.updatedSignalement.citoyenId, {
        signalementId,
        statut: 'EN_COURS',
        message: "Un agent est en route.",
        eta: result.navigation.eta,
        distance: result.navigation.distance
      });
    } catch (err) {
      console.error('   ! Async Socket update failed', err);
    }

    console.log('✅ takeCharge atomicity verified');
    return result;
  }

  /**
   * Simulation de calcul d'itinéraire (Mock Expert)
   */
  getRouteSimulation() {
    return {
      distance: "1.2 km",
      eta: 4, // minutes
      points: [
        { lat: 14.7167, lng: -17.4677 },
        { lat: 14.7170, lng: -17.4680 },
        { lat: 14.7175, lng: -17.4690 }
      ]
    };
  }

  /**
   * Mise à jour des notes de terrain pendant l'intervention
   */
  async updateNotes(interventionId: number, notes: string) {
    return prisma.intervention.update({
      where: { id: interventionId },
      data: { notesTerrain: notes }
    });
  }

  /**
   * Clôture finale de l'intervention (Calcul durée + Gamification)
   */
  async close(interventionId: number, rapport: string) {
    console.log(`[InterventionService] Finalizing intervention: ID ${interventionId}`);
    
    const result = await prisma.$transaction(async (tx: any) => {
      // 1. Récupérer l'intervention pour calculer la durée
      const currentInter = await tx.intervention.findUnique({
        where: { id: interventionId },
        include: { affectation: true }
      });

      if (!currentInter) throw new Error('Intervention introuvable');

      const dateFin = new Date();
      const durationMs = dateFin.getTime() - currentInter.dateDebut.getTime();
      const durationMin = Math.round(durationMs / (1000 * 60));

      // 1b. Mettre à jour l'intervention
      const intervention = await tx.intervention.update({
        where: { id: interventionId },
        data: {
          dateFin: dateFin,
          rapportCloture: `${rapport} (Durée : ${durationMin} min)`
        },
        include: { affectation: true }
      });

      // 2. Clôturer le signalement
      await tx.signalement.update({
        where: { id: intervention.affectation.signalementId },
        data: { statut: 'CLOTURE' }
      });

      // 3. Récompense Agent (Gamification)
      const agent = await tx.user.update({
        where: { id: intervention.affectation.agentId },
        data: { 
          isOccupied: false,
          points: { increment: 10 },
          experience: { increment: 5 } // Plus d'EXP pour une mission finie
        },
        include: { _count: { select: { affectations: true } } }
      });

      return { intervention, agent, durationMin };
    }, {
      timeout: 10000 
    });

    // 4. Notifications
    notificationService.notifyCitoyen(result.intervention.affectation.signalementId, "L'intervention est terminée. Merci de votre confiance.")
      .catch(err => console.error('   ! Async Closure Notification failed', err));

    socketService.emitStatusUpdate(result.intervention.affectation.signalementId, {
      signalementId: result.intervention.affectation.signalementId,
      statut: 'CLOTURE',
      message: "L'intervention est terminée."
    });

    console.log(`✅ Intervention clôse par agent ${result.agent.id} en ${result.durationMin} min`);
    return result;
  }

  /**
   * Récupérer les signalements non affectés de la zone de l'agent
   */
  async getAvailableSignalements(agentId: number) {
    const agent = await prisma.user.findUnique({
      where: { id: agentId },
      select: { zoneId: true }
    });

    if (!agent || !agent.zoneId) {
      throw new Error("L'agent n'est affecté à aucune zone géographique.");
    }

    return prisma.signalement.findMany({
      where: {
        zoneId: agent.zoneId,
        statut: 'NOUVEAU'
      },
      include: {
        citoyen: { select: { nom: true, prenom: true, telephone: true } }
      },
      orderBy: { dateCreation: 'desc' }
    });
  }

  /**
   * Mise à jour de la position d'un agent (REST fallback)
   */
  async updateAgentLocation(agentId: number, lat: number, lng: number) {
    return prisma.user.update({
      where: { id: agentId },
      data: {
        latitude: lat,
        longitude: lng,
        lastActive: new Date()
      },
      select: { id: true, latitude: true, longitude: true }
    });
  }
  /**
   * Récupérer tous les agents actifs (avec position GPS)
   */
  async getActiveAgents() {
    return prisma.user.findMany({
      where: {
        role: 'AGENT',
        latitude: { not: null },
        longitude: { not: null }
      },
      select: {
        id: true,
        nom: true,
        prenom: true,
        grade: true,
        unite: true,
        latitude: true,
        longitude: true,
        isOccupied: true,
        lastActive: true
      }
    });
  }
}

export default new InterventionService();
