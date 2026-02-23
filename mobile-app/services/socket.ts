import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SOCKET_URL = 'http://172.20.10.4:3000';

class SocketService {
  public socket: Socket | null = null;

  async connect() {
    if (this.socket?.connected) return;

    const token = await AsyncStorage.getItem('user_token');
    if (!token) return;

    this.socket = io(SOCKET_URL, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    this.socket.on('connect', () => {
      console.log('🔌 Mobile Socket Connected');
    });

    this.socket.on('connect_error', (err) => {
      console.error('❌ Socket Connection Error:', err.message);
    });
  }

  updateLocation(lat: number, lng: number) {
    this.socket?.emit('UPDATE_LOCATION', { lat, lng });
  }

  sendVoiceMessage(data: ArrayBuffer) {
    this.socket?.emit('VOICE_MESSAGE', { targetId: null, data });
  }

  emitSOS(location: { lat: number, lng: number }) {
    this.socket?.emit('SOS_ALERT', { 
      type: 'SOS_MOBILE',
      latitude: location.lat,
      longitude: location.lng,
      timestamp: new Date().toISOString()
    });
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }
}

export default new SocketService();
