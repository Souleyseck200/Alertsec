import prisma from '../lib/prisma';
import bcrypt from 'bcrypt';

class AdminService {
  /**
   * Enregistrer une action administrative dans le journal de sécurité
   */
  async createLog(adminId: number, action: string, cibleId?: number, details?: string) {
    // We don't await this to avoid blocking the main operation
    prisma.logsSysteme.create({
      data: {
        adminId,
        action,
        cibleId,
        details
      }
    }).catch((e: any) => {
       console.warn(`[Log Error] Admin ${adminId} | Action ${action} | Error: ${e.message}`);
    });
    return null;
  }

  /**
   * Créer un agent avec matricule auto et mot de passe temporaire
   */
  async createAgent(adminId: number, data: any) {
    const matricule = `PN-${Math.floor(1000 + Math.random() * 9000)}`;
    const tempPassword = `Pass@${Math.floor(100 + Math.random() * 899)}`;
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const agent = await prisma.user.create({
      data: {
        ...data,
        dateNaissance: data.dateNaissance ? new Date(data.dateNaissance) : undefined,
        password: hashedPassword,
        matricule,
        role: 'AGENT',
        mustChangePassword: true
      }
    });

    this.createLog(adminId, 'CREATE_AGENT', agent.id, `Matricule généré: ${matricule}`);
    
    return { agent, tempPassword };
  }

  /**
   * Mettre à jour les informations d'un agent
   */
  async updateAgent(adminId: number, agentId: number, data: any) {
    const updatedAgent = await prisma.user.update({
      where: { id: agentId },
      data: {
        ...data,
        dateNaissance: data.dateNaissance ? new Date(data.dateNaissance) : undefined,
      }
    });

    this.createLog(adminId, 'UPDATE_AGENT', agentId, `Données modifiées: ${Object.keys(data).join(', ')}`);
    return updatedAgent;
  }

  /**
   * Supprimer un agent (Nettoyage en cascade manuel)
   */
  async deleteAgent(adminId: number, agentId: number) {
    const result = await prisma.$transaction(async (tx: any) => {
      // 1. Trouver les affectations liées
      const affectations = await tx.affectation.findMany({
        where: { agentId },
        select: { id: true }
      });
      const affIds = affectations.map((a: any) => a.id);

      // 2. Supprimer les interventions liées
      if (affIds.length > 0) {
        await tx.intervention.deleteMany({
          where: { affectationId: { in: affIds } }
        });
      }

      // 3. Supprimer les affectations
      await tx.affectation.deleteMany({
        where: { agentId }
      });

      // 4. Supprimer les notifications liées
      await tx.notification.deleteMany({
        where: { userId: agentId }
      });

      // 5. Supprimer les contacts d'urgence
      await tx.contactUrgence.deleteMany({
        where: { userId: agentId }
      });

      // 6. Supprimer les logs vers cet utilisateur (optionnel, on garde la cibleId mais on perd le lien)
      // On choisit de ne pas supprimer les logs pour garder une trace d'audit.

      // 7. Enfin, supprimer l'utilisateur
      return tx.user.delete({
        where: { id: agentId }
      });
    });

    this.createLog(adminId, 'DELETE_AGENT', agentId, `Nom: ${result.nom} ${result.prenom}`);
    return result;
  }

  async getAllZones() {
    return prisma.zone.findMany();
  }

  /**
   * Liste tous les agents (pour la carte tactique)
   */
  async getAllAgents() {
    return prisma.user.findMany({
      where: { role: 'AGENT' },
      select: {
        id: true,
        nom: true,
        prenom: true,
        latitude: true,
        longitude: true,
        isOccupied: true,
        zoneId: true
      }
    });
  }

  /**
   * Créer une nouvelle zone de patrouille
   */
  async createZone(adminId: number, data: any) {
    const zone = await prisma.zone.create({
      data: {
        nom: data.nom,
        localisation: data.localisation, // GeoJSON string
        rayon_action: data.rayon_action || 5000,
        niveau_priorite: data.niveau_priorite || 1
      }
    });

    this.createLog(adminId, 'CREATE_ZONE', zone.id, `Zone: ${data.nom}`);
    return zone;
  }

  /**
   * Mettre à jour une zone existante
   */
  async updateZone(adminId: number, zoneId: number, data: any) {
    const zone = await prisma.zone.update({
      where: { id: zoneId },
      data: {
        nom: data.nom,
        localisation: data.localisation,
        rayon_action: data.rayon_action,
        niveau_priorite: data.niveau_priorite
      }
    });

    this.createLog(adminId, 'UPDATE_ZONE', zoneId, `Modifications: ${Object.keys(data).join(', ')}`);
    return zone;
  }

  /**
   * Bloquer/Débloquer un utilisateur
   */
  async setUserBlockStatus(adminId: number, userId: number, isBlocked: boolean) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { isBlocked }
    });

    this.createLog(adminId, isBlocked ? 'REVOKE_ACCESS' : 'RESTORE_ACCESS', userId);
    return user;
  }

  /**
   * Valider l'habilitation d'un agent
   */
  async validateAgentClearance(adminId: number, agentId: number) {
    const agent = await prisma.user.update({
      where: { id: agentId },
      data: { 
        statutOperationnel: 'HABILITÉ',
        points: { increment: 50 } // Bonus de bienvenue pour habilitation
      }
    });

    this.createLog(adminId, 'VALIDATE_CLEARANCE', agentId, 'Agent officiellement habilité');
    return agent;
  }

  /**
   * Affectation prioritaire (Admin Override)
   * Ignore les restrictions de zone et l'état d'occupation
   */
  async forceAssignAgent(adminId: number, signalementId: number, agentId: number) {
    const result = await prisma.$transaction(async (tx: any) => {
      // 1. Créer l'affectation
      const affectation = await tx.affectation.create({
        data: { signalementId, agentId }
      });

      // 2. Créer l'intervention
      const intervention = await tx.intervention.create({
        data: { 
          affectationId: affectation.id,
          dateDebut: new Date()
        }
      });

      // 3. Mettre à jour les états
      await tx.signalement.update({
        where: { id: signalementId },
        data: { statut: 'EN_COURS' }
      });

      await tx.user.update({
        where: { id: agentId },
        data: { isOccupied: true }
      });

      return { affectation, intervention };
    });

    this.createLog(adminId, 'FORCE_ASSIGN', signalementId, `Agent #${agentId} assigné par autorité.`);
    return result;
  }

  /**
   * Algorithme de prédiction des zones à risque (Heuristique densité 7j)
   */
  async getPredictiveAnalytics() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const zones = await prisma.zone.findMany({
      include: {
        _count: {
          select: { signalements: { where: { dateCreation: { gte: sevenDaysAgo } } } }
        }
      }
    });

    // Calculer le score de risque (basé sur le volume récent)
    return zones.map((z: any) => ({
      id: z.id,
      nom: z.nom,
      incidentsRecents: z._count.signalements,
      niveauRisque: z._count.signalements > 10 ? 'CRITIQUE' : (z._count.signalements > 5 ? 'HAUT' : 'MODERÉ'),
      probabiliteDemain: `${Math.min(z._count.signalements * 10, 95)}%`
    })).sort((a: any, b: any) => b.incidentsRecents - a.incidentsRecents);
  }

  /**
   * Statistiques Dashboard pour Admin
   */
  async getDashboardStats() {
    const totalSignalements = await prisma.signalement.count();
    const statsByType = await prisma.signalement.groupBy({
      by: ['type'],
      _count: true
    });

    const closedInterventions = await prisma.intervention.findMany({
      where: { dateFin: { not: null } },
      select: { dateDebut: true, dateFin: true }
    });

    // Calculer temps moyen d'intervention
    let totalMin = 0;
    closedInterventions.forEach((i: any) => {
      if (i.dateFin) {
        totalMin += (i.dateFin.getTime() - i.dateDebut.getTime()) / (1000 * 60);
      }
    });
    const avgResponseTime = closedInterventions.length > 0 
      ? Math.round(totalMin / closedInterventions.length) 
      : 0;

    const leaderboard = await prisma.user.findMany({
      where: { role: 'AGENT' },
      orderBy: { points: 'desc' },
      take: 5,
      select: { id: true, nom: true, prenom: true, points: true, experience: true }
    });

    return {
      totalSignalements,
      statsByType,
      avgResponseTime,
      leaderboard
    };
  }

  /**
   * Logs système récents
   */
  async getSystemLogs() {
    return prisma.logsSysteme.findMany({
      orderBy: { timestamp: 'desc' },
      take: 50,
      include: { admin: { select: { nom: true, prenom: true } } }
    });
  }

  /**
   * Réinitialiser le mot de passe d'un agent
   */
  async resetAgentPassword(adminId: number, agentId: number) {
    const tempPassword = `Pass@${Math.floor(100 + Math.random() * 899)}`;
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const agent = await prisma.user.update({
      where: { id: agentId },
      data: { 
        password: hashedPassword,
        mustChangePassword: true
      }
    });

    this.createLog(adminId, 'RESET_PASSWORD', agentId, 'Nouveau mot de passe temporaire généré');
    return { email: agent.email, tempPassword };
  }

  /**
   * Supprimer une zone
   * Nettoie les références dans User et Signalement avant suppression
   */
  async deleteZone(adminId: number, zoneId: number) {
    const result = await prisma.$transaction(async (tx: any) => {
      // 1. Détacher les agents de cette zone
      await tx.user.updateMany({
        where: { zoneId },
        data: { zoneId: null }
      });

      // 2. Détacher les signalements de cette zone
      await tx.signalement.updateMany({
        where: { zoneId },
        data: { zoneId: null }
      });

      // 3. Supprimer la zone
      return tx.zone.delete({
        where: { id: zoneId }
      });
    });

    this.createLog(adminId, 'DELETE_ZONE', zoneId, `Zone: ${result.nom}`);
    return result;
  }

  /**
   * Supprimer un signalement (Archivage permanent)
   * Nettoie toutes les relations (Affectations, Interventions, Notifications) en cascade manuelle
   */
  async deleteSignalement(adminId: number, sigId: number) {
    const result = await prisma.$transaction(async (tx: any) => {
      // 1. Trouver les affectations liées
      const affectations = await tx.affectation.findMany({
        where: { signalementId: sigId },
        select: { id: true }
      });
      const affIds = affectations.map((a: any) => a.id);

      // 2. Supprimer les interventions liées à ces affectations
      if (affIds.length > 0) {
        await tx.intervention.deleteMany({
          where: { affectationId: { in: affIds } }
        });
      }

      // 3. Supprimer les affectations
      await tx.affectation.deleteMany({
        where: { signalementId: sigId }
      });

      // 4. Supprimer les notifications liées
      await tx.notification.deleteMany({
        where: { signalementId: sigId }
      });

      // 5. Supprimer le signalement
      return tx.signalement.delete({
        where: { id: sigId }
      });
    });

    this.createLog(adminId, 'DELETE_SIGNALEMENT', sigId, `Type: ${result.type}`);
    return result;
  }
}

export default new AdminService();
