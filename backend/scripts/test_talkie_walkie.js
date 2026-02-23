const { io } = require('socket.io-client');
const axios = require('axios');

const SOCKET_URL = 'http://localhost:3000';
const API_URL = 'http://localhost:3000/api';

async function runTest() {
  console.log('🎙️ DEMARRAGE TEST : ROUTAGE TALKIE-WALKIE\n');

  try {
    // 1. Authentification pour obtenir les tokens
    console.log('--- [1] Authentification ---');
    const adminLogin = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@alertsec.sn',
      password: 'password123'
    });
    const agentLogin = await axios.post(`${API_URL}/auth/login`, {
      email: 'agent1@alertsec.sn',
      password: 'password123'
    });

    const adminToken = adminLogin.data.token;
    const agentToken = agentLogin.data.token;
    const adminId = adminLogin.data.user.id;
    const agentId = agentLogin.data.user.id;

    console.log(`Admin ID: ${adminId}, Agent ID: ${agentId}`);

    // 2. Connexion Sockets
    console.log('\n--- [2] Connexion Sockets ---');
    const adminSocket = io(SOCKET_URL, { auth: { token: adminToken } });
    const agentSocket = io(SOCKET_URL, { auth: { token: agentToken } });

    await Promise.all([
      new Promise(res => adminSocket.on('connect', res)),
      new Promise(res => agentSocket.on('connect', res))
    ]);
    console.log('Sockets connectés: ✅');

    // 3. Test Global Broadcast (Admin -> Agent)
    console.log('\n--- [3] Test : Admin -> Global Agents ---');
    const fakeAudioData = Buffer.from([0x01, 0x02, 0x03, 0x04]);

    const agentReceivedPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject('Timeout: Agent n\'a pas reçu le broadcast'), 5000);
      agentSocket.on('VOICE_BROADCAST', (payload) => {
        if (payload.isGlobal && payload.from === adminId) {
          clearTimeout(timeout);
          console.log(`Agent a reçu le broadcast de l'Admin: ✅ (${payload.data.byteLength} bytes)`);
          resolve();
        }
      });
    });

    adminSocket.emit('VOICE_MESSAGE', { targetId: null, data: fakeAudioData });
    await agentReceivedPromise;

    // 4. Test Reply (Agent -> Admin)
    console.log('\n--- [4] Test : Agent -> Admin (Reply) ---');
    const adminReceivedPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject('Timeout: Admin n\'a pas reçu le retour vocal'), 5000);
      adminSocket.on('VOICE_BROADCAST', (payload) => {
        if (payload.from === agentId) {
          clearTimeout(timeout);
          console.log(`Admin a reçu le retour de l'Agent: ✅ (${payload.agentName})`);
          resolve();
        }
      });
    });

    agentSocket.emit('VOICE_MESSAGE', { targetId: null, data: fakeAudioData });
    await adminReceivedPromise;

    console.log('\n✨ TOUS LES TESTS DE ROUTAGE TALKIE-WALKIE SONT RÉUSSIS !');
    
    adminSocket.disconnect();
    agentSocket.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ ECHEC DU TEST:', error.message || error);
    process.exit(1);
  }
}

runTest();
