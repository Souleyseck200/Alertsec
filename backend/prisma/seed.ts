import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding technical database for AlertSec Professional...');

  // 0. CLEANUP (Respecting Foreign Key Constraints)
  console.log('🧹 Cleaning up database...');
  await prisma.notification.deleteMany();
  await prisma.intervention.deleteMany();
  await prisma.affectation.deleteMany();
  await prisma.logsSysteme.deleteMany();
  await prisma.contactUrgence.deleteMany();
  await prisma.signalement.deleteMany();
  await prisma.user.deleteMany();
  await prisma.zone.deleteMany();

  // 1. ZONES DEFINITION (Dakar Area)
  const zonesData = [
    {
      nom: 'Zone Rouge (Plateau)',
      niveau_priorite: 3,
      localisation: JSON.stringify([
        [14.671, -17.442], [14.675, -17.435], [14.668, -17.432], [14.665, -17.438]
      ]), // Polygon
    },
    {
      nom: 'Secteur Médina',
      niveau_priorite: 2,
      localisation: JSON.stringify([
        [14.685, -17.452], [14.688, -17.445], [14.680, -17.442], [14.678, -17.448]
      ]), // Polygon
    },
    {
      nom: 'Zone Ngor Safety',
      niveau_priorite: 1,
      localisation: JSON.stringify({ lat: 14.7500, lng: -17.5140 }), // Point/Circle
      rayon_action: 1500
    },
    {
      nom: 'Grille Almadies',
      niveau_priorite: 1,
      localisation: JSON.stringify([
        [14.745, -17.525], [14.755, -17.525], [14.755, -17.510], [14.745, -17.510]
      ]), // Rectangle/Polygon
    }
  ];

  const zones = [];
  for (const z of zonesData) {
    const zone = await prisma.zone.create({ data: z });
    zones.push(zone);
  }
  console.log('✅ Tactical Zones created');

  const hashedPassword = await bcrypt.hash('password123', 10);

  // 2. ADMIN
  await prisma.user.create({
    data: {
      nom: 'Seck', prenom: 'Pape Souleymane', email: 'admin@alertsec.sn',
      password: hashedPassword, role: 'ADMIN', photoUrl: 'https://i.pravatar.cc/150?u=admin'
    }
  });

  // 3. AGENTS
  const agentNames = [
    { n: 'DIOP', p: 'Samba' }, { n: 'SOW', p: 'Awa' }, { n: 'NDIAYE', p: 'Cheikh' },
    { n: 'FALL', p: 'Mariama' }, { n: 'GUEYE', p: 'Babacar' }, { n: 'CISSÉ', p: 'Fatou' }
  ];

  const agents = [];
  for (let i = 0; i < agentNames.length; i++) {
    const agent = await prisma.user.create({
      data: {
        nom: agentNames[i].n, prenom: agentNames[i].p,
        email: `agent${i}@alertsec.sn`, password: hashedPassword, role: 'AGENT',
        matricule: `AS-2024-${1000 + i}`, points: Math.floor(Math.random() * 500),
        latitude: 14.67 + (Math.random() - 0.5) * 0.1,
        longitude: -17.44 + (Math.random() - 0.5) * 0.1,
        isOccupied: i % 3 === 0,
        zoneId: zones[i % zones.length].id,
        photoUrl: `https://i.pravatar.cc/150?u=agent${i}`
      }
    });
    agents.push(agent);
  }
  console.log('✅ Professional Agents deployed');

  // 4. CITOYEN
  const citoyen = await prisma.user.create({
    data: {
      nom: 'SY', prenom: 'Ousmane', email: 'citoyen@alertsec.sn',
      password: hashedPassword, role: 'CITOYEN', telephone: '+221 77 123 45 67',
      photoUrl: 'https://i.pravatar.cc/150?u=citoyen'
    }
  });

  // 5. SIGNALEMENTS
  const sosTypes = [
    { t: 'ACCIDENT', g: 'CRITIQUE', d: 'Collision impliquant 2 véhicules sur la VDN.' },
    { t: 'INCENDIE', g: 'VITAL', d: 'Départ de feu important dans un entrepôt au Plateau.' },
    { t: 'AGRESSION', g: 'MOYEN', d: 'Tentative de vol à l\'arraché signalée.' },
    { t: 'VOL', g: 'FAIBLE', d: 'Cambriolage en cours.' }
  ];

  for (let i = 0; i < 6; i++) {
    const type = sosTypes[i % sosTypes.length];
    const sig = await prisma.signalement.create({
      data: {
        type: type.t, gravite: type.g as any, description: type.d,
        latitude: 14.675 + (Math.random() - 0.5) * 0.05,
        longitude: -17.445 + (Math.random() - 0.5) * 0.05,
        citoyenId: citoyen.id,
        zoneId: zones[i % zones.length].id,
        statut: i === 0 ? 'EN_COURS' : 'NOUVEAU',
        dateCreation: new Date()
      }
    });

    if (i === 0) {
      await prisma.affectation.create({
        data: { signalementId: sig.id, agentId: agents[0].id }
      });
    }
  }
  console.log('✅ Tactical SOS Feed seeded');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
