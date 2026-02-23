const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/admin';
let token = null;

async function runAdminEliteTests() {
  console.log('🛡️ DEMARRAGE MISSION : TESTS FONCTIONNELS ADMIN "ELITE OPS"\n');

  try {
    // --- [0] AUTHENTIFICATION ADMIN ---
    console.log('--- [0] Authentification Admin ---');
    const loginRes = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'admin@alertsec.sn',
      password: 'password123'
    });
    token = loginRes.data.token;
    console.log('Login Admin: ✅\n');

    const authHeader = { headers: { Authorization: `Bearer ${token}` } };

    // --- [1] TEST PREDICTIONS IA ---
    console.log('--- [1] Test : Analyse Prédictive IA ---');
    const predictRes = await axios.get(`${BASE_URL}/analytics/prediction`, authHeader);
    
    if (Array.isArray(predictRes.data)) {
      console.log(`Predictions récupérées: ✅ (${predictRes.data.length} zones identifiées)`);
      if (predictRes.data.length >= 2) {
        console.log(`Top Zone: ${predictRes.data[0].nom} (Risque: ${predictRes.data[0].niveauRisque})`);
      }
    } else {
      throw new Error('Format de données IA invalide');
    }
    console.log('');

    // --- [2] TEST INTÉGRITÉ LOGS (REPLAY) ---
    console.log('--- [2] Test : Intégrité des Logs pour Replay Tactique ---');
    const logsRes = await axios.get(`${BASE_URL}/logs`, authHeader);
    
    if (Array.isArray(logsRes.data)) {
      console.log(`Historique des logs: ✅ (${logsRes.data.length} entrées disponibles)`);
      const sampleLog = logsRes.data[0];
      if (sampleLog && sampleLog.timestamp) {
        console.log(`Dernière action loguée : [${sampleLog.timestamp}] ${sampleLog.action}`);
      }
    } else {
      throw new Error('Impossible de charger les logs historiques');
    }
    console.log('');

    // --- [3] TEST DASHBOARD ANALYTICS ---
    console.log('--- [3] Test : Dashboard d\'Élite ---');
    const statsRes = await axios.get(`${BASE_URL}/stats/dashboard`, authHeader);
    console.log(`Statistiques Dashboard: ✅`);
    console.log(`Temps de réponse moyen: ${statsRes.data.avgResponseTime} min`);
    console.log(`Total incidents: ${statsRes.data.totalSignalements}\n`);

    console.log('✨ MISSION ACCOMPLIE : LES CAPACITÉS D\'ÉLITE SONT OPÉRATIONNELLES !');
    console.log('Le National Command Center est prêt pour le déploiement tactique.');

  } catch (error) {
    console.error('\n❌ ECHEC DE LA MISSION ADMIN :');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

runAdminEliteTests();
