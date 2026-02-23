import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { verifyToken } from '../utils/auth';
import prisma from '../lib/prisma';

class SocketService {
  private io: SocketIOServer | null = null;

  init(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
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
        }
      }

      // ... existing location/instruction code ...
      // 3. Mise à jour de localisation en temps réel
      socket.on('UPDATE_LOCATION', async (data: { lat: number, lng: number }) => {
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
      socket.on('VOICE_MESSAGE', (data: { targetId: number | null; data: ArrayBuffer }) => {
        if (role === 'ADMIN') {
          console.log(`🎙️ GLOBAL BROADCAST de l'Admin ${userId} (${data.data.byteLength} bytes)`);
          if (data.targetId) {
            this.io?.to(`user_${data.targetId}`).emit('VOICE_BROADCAST', { from: userId, data: data.data });
          } else {
            // Broadcast to ALL agents
            this.io?.to('agents_room').emit('VOICE_BROADCAST', { from: userId, isGlobal: true, data: data.data });
          }
        } else if (role === 'AGENT') {
          console.log(`🎙️ REPLY VOCAL de l'Agent ${userId} (${data.data.byteLength} bytes)`);
          // Agents voice replies go to admin room
          this.io?.to('admin_room').emit('VOICE_BROADCAST', { from: userId, data: data.data, agentName: `Agent #${userId}` });
        }
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
