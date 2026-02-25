import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { verifyToken } from '../utils/auth';
import prisma from '../lib/prisma';

class SocketService {
  private io: SocketIOServer | null = null;

  init(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      maxHttpBufferSize: 1e7, // 10MB
      cors: {
        origin: "*", 
        methods: ["GET", "POST"]
      }
    });

    this.io.use(async (socket, next) => {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentification requise'));

      const decoded = verifyToken(token);
      if (!decoded) return next(new Error('Token invalide'));

      socket.data.userId = decoded.userId;
      socket.data.role = decoded.role;
      next();
    });

    this.io.on('connection', async (socket: Socket) => {
      const { userId, role } = socket.data;
      console.log(`🔌 Utilisateur connecté : ${userId} (${role})`);

      socket.join(`user_${userId}`);

      if (role === 'ADMIN') {
        socket.join('admin_room');
      } else if (role === 'AGENT') {
        socket.join('agents_room'); // Global room for all agents
        const agent = await prisma.user.findUnique({
          where: { id: userId },
          select: { zoneId: true }
        });

        if (agent?.zoneId) {
          socket.join(`zone_${agent.zoneId}`);
          console.log(`🏠 Agent ${userId} a rejoint la salle : zone_${agent.zoneId} et agents_room`);
        } else {
          console.log(`🏠 Agent ${userId} a rejoint agents_room (pas de zone)`);
        }
      }

      // ... existing location/instruction code ...
      // 3. Mise à jour de localisation en temps réel
      socket.on('UPDATE_LOCATION', async (data: { lat: number, lng: number }) => {
        try {
          if (role === 'AGENT') {
            await prisma.user.update({
              where: { id: userId },
              data: { latitude: data.lat, longitude: data.lng }
            });

            // Diffuser aux autres agents de la zone pour l'entraide
            const agent = await prisma.user.findUnique({ where: { id: userId }, select: { zoneId: true } });
            if (agent?.zoneId) {
              socket.to(`zone_${agent.zoneId}`).emit('AGENT_LOCATION_UPDATE', {
                agentId: userId,
                latitude: data.lat,
                longitude: data.lng
              });
            }
          } else if (role === 'CITOYEN') {
            // Pour les citoyens, on diffuse simplement à l'admin pour le suivi en temps réel de l'alerte
            this.io?.to('admin_room').emit('CITIZEN_LOCATION_UPDATE', {
              citoyenId: userId,
              latitude: data.lat,
              longitude: data.lng
            });
          }
        } catch (err) {
          console.warn(`⚠️ [Socket] Failed to update location for user ${userId}: Non-existent record.`);
        }
      });

      // 4. Messagerie Tactique (Admin -> Agent)
      socket.on('SEND_INSTRUCTION', (data: { agentId: number, message: string }) => {
        if (role === 'ADMIN') {
          console.log(`📩 Instruction de l'Admin ${userId} pour Agent ${data.agentId}: ${data.message}`);
          this.io?.to(`user_${data.agentId}`).emit('TACTICAL_INSTRUCTION', {
            from: userId,
            message: data.message,
            timestamp: new Date().toISOString()
          });
        }
      });

      // 5. Message Agent -> Admin
      socket.on('AGENT_REPLY', (data: { message: string }) => {
        if (role === 'AGENT') {
          console.log(`💬 Réponse de l'Agent ${userId}: ${data.message}`);
          this.io?.to('admin_room').emit('TACTICAL_REPLY', {
            from: userId,
            message: data.message,
            timestamp: new Date().toISOString()
          });
        }
      });

      // 6. Talkie-Walkie Vocal (Bidirectional Broadcast)
      socket.on('VOICE_MESSAGE', (data: { targetId?: number | null; missionId?: number | null; data: any }) => {
        if (role === 'ADMIN') {
          if (data.missionId) {
            // Private mission room
            console.log(`🎙️ [VOICE] Admin ${userId} -> Mission Room ${data.missionId}`);
            this.io?.to(`room_mission_${data.missionId}`).emit('VOICE_BROADCAST', { from: userId, data: data.data, missionId: data.missionId });
          } else if (data.targetId) {
            // Direct user message
            this.io?.to(`user_${data.targetId}`).emit('VOICE_BROADCAST', { from: userId, data: data.data });
          } else {
            // Global Agent Broadcast
            this.io?.to('agents_room').emit('VOICE_BROADCAST', { from: userId, data: data.data, isGlobal: true });
          }
        } else if (role === 'AGENT') {
          if (data.missionId) {
            console.log(`🎙️ [VOICE] Agent ${userId} -> Mission Room ${data.missionId}`);
            this.io?.to(`room_mission_${data.missionId}`).emit('VOICE_BROADCAST', { from: userId, data: data.data, missionId: data.missionId });
            // RELAY TO ADMIN (Very important for SITAC monitoring)
            this.io?.to('admin_room').emit('VOICE_BROADCAST', { from: userId, data: data.data, missionId: data.missionId, agentName: `Agent #${userId}` });
          } else {
            // Default to Admin room
            this.io?.to('admin_room').emit('VOICE_BROADCAST', { from: userId, data: data.data, agentName: `Agent #${userId}` });
          }
        }
      });

      // 7. Join Mission Room
      socket.on('JOIN_MISSION_ROOM', (data: { missionId: number }) => {
        const roomName = `room_mission_${data.missionId}`;
        socket.join(roomName);
        console.log(`📡 [Socket] User ${userId} joined ${roomName}`);
      });

      socket.on('disconnect', () => {
        console.log(`❌ Utilisateur déconnecté : ${userId}`);
      });
    });
  }

  emitNewSignalement(zoneId: number | null, signalement: any) {
    if (!this.io) {
      console.warn('⚠️ [SocketService] Cannot emit: IO not initialized');
      return;
    }
    console.log(`📡 [SocketService] Emitting NOUVEAU_SIGNALEMENT for #${signalement.id} (Zone: ${zoneId || 'Global'})`);
    this.io.to('admin_room').emit('NOUVEAU_SIGNALEMENT', signalement);
    this.io.to('agents_room').emit('NOUVEAU_SIGNALEMENT', signalement); // Always notify all agents for awareness
    if (zoneId) {
      this.io.to(`zone_${zoneId}`).emit('NOUVEAU_SIGNALEMENT', signalement);
    }
  }

  emitStatusUpdate(recipient: number | string, update: any) {
    if (!this.io) return;
    const target = typeof recipient === 'number' ? `user_${recipient}` : recipient;
    this.io.to(target).emit('MISE_A_JOUR_STATUT', update);
  }

  emitEscalation(signalement: any) {
    if (!this.io) return;
    this.io.to('admin_room').emit('ALERTE_ESCALADE', {
      message: "ALERTE SANS AGENT : Une intervention manuelle est requise.",
      signalement
    });
  }
}

export default new SocketService();
