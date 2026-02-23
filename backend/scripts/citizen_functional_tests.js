const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const BASE_URL = 'http://localhost:3000/api';
let token = null;
let testData = {
  signalementId: null,
  citoyenId: null
};

/**
 * Fonction utilitaire pour créer un buffer simulant un fichier
 */
function createFakeMedia(content) {
  return Buffer.from(content);
}

async function runCitizenTests() {
  console.log('🚀 DEMARRAGE MISSION : TESTS FONCTIONNELS CITOYEN "CLIC PAR CLIC"\n');

  try {
    // --- CONNEXION ---
    console.log('--- [0] Authentification ---');
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'citoyen.test@example.com',
      password: 'password123'
    });
    token = loginRes.data.token;
    testData.citoyenId = loginRes.data.user.id;
    console.log('Login Citoyen: ✅\n');

    const authHeader = { headers: { Authorization: `Bearer ${token}` } };

    // --- 1. TEST SOS URGENCE ---
    console.log('--- [1] Test : Alerte SOS Urgence (Bouton Central) ---');
    const sosForm = new FormData();
    sosForm.append('type', 'ACCIDENT');
    sosForm.append('gravite', 'CRITIQUE');
    sosForm.append('description', 'SOS URGENCE : Bouton central pressé - Capture auto active');
    sosForm.append('latitude', '14.7167');
    sosForm.append('longitude', '-17.4677');
    
    // Simulation des buffers multimédias
    sosForm.append('audio', createFakeMedia('fake-audio-stream-content'), 'sos_audio.mp3');
    sosForm.append('video', createFakeMedia('fake-video-stream-content'), 'sos_video.mp4');

    const sosRes = await axios.post(`${BASE_URL}/signalements`, sosForm, {
      headers: { 
        ...authHeader.headers,
        ...sosForm.getHeaders()
      }
    });
    testData.signalementId = sosRes.data.id;
    console.log(`SOS Urgence enregistré: ✅ (ID: ${testData.signalementId})`);
    console.log(`Chemin Audio: ${sosRes.data.audioUrl}`);
    console.log(`Chemin Vidéo: ${sosRes.data.videoUrl}\n`);

    // --- 2. TEST SIGNALEMENT MANUEL ---
    console.log('--- [2] Test : Signalement Manuel (Non-critique) ---');
    const manualForm = new FormData();
    manualForm.append('type', 'INCENDIE');
    manualForm.append('gravite', 'MOYEN');
    manualForm.append('description', 'Départ de feu constaté près du marché. Signalement manuel avec photo de la gallerie.');
    manualForm.append('latitude', '14.7112');
    manualForm.append('longitude', '-17.4555');
    
    // Simulation d'une photo de galerie
    manualForm.append('media', createFakeMedia('fake-image-gallery-content'), 'galerie_incendie.jpg');

    const manualRes = await axios.post(`${BASE_URL}/signalements`, manualForm, {
      headers: { 
        ...authHeader.headers,
        ...manualForm.getHeaders()
      }
    });
    console.log(`Signalement manuel enregistré: ✅ (ID: ${manualRes.data.id})`);
    console.log(`Chemin Image: ${manualRes.data.mediaUrl}\n`);

    // --- 3. TEST GESTION PROFIL ---
    console.log('--- [3] Test : Gestion du Profil et Identité ---');
    const profileForm = new FormData();
    profileForm.append('telephone', '778889900');
    profileForm.append('adresse', 'Sacré-Cœur 3, Dakar');
    profileForm.append('photo', createFakeMedia('fake-avatar-content'), 'mon_avatar.png');

    const profileRes = await axios.patch(`${BASE_URL}/users/profile`, profileForm, {
      headers: { 
        ...authHeader.headers,
        ...profileForm.getHeaders()
      }
    });

    console.log('Mise à jour profil: ✅');
    console.log(`Nouveau téléphone: ${profileRes.data.telephone}`);
    console.log(`Nouvelle adresse: ${profileRes.data.adresse}`);
    console.log(`URL Avatar: ${profileRes.data.photoUrl}\n`);

    // --- 4. VERIFICATION HISTORIQUE ---
    console.log('--- [4] Vérification de l\'historique "Mes Alertes" ---');
    const historyRes = await axios.get(`${BASE_URL}/signalements/me`, authHeader);
    const lastSig = historyRes.data[0];
    console.log(`Nombre total de signalements: ${historyRes.data.length}`);
    console.log(`Dernier signalement Type: ${lastSig.type}, Statut: ${lastSig.statut}`);
    console.log('Historique: ✅\n');

    console.log('✨ MISSION ACCOMPLIE : LE PARCOURS CITOYEN EST 100% FONCTIONNEL !');
    console.log('Note : Pour le test Temps Réel (Socket.io), vérifiez les logs du serveur (npm run dev) lors de la prise en charge d\'un SOS.');

  } catch (error) {
    console.error('\n❌ ECHEC DE LA MISSION CITOYEN :');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
  }
}

runCitizenTests();
