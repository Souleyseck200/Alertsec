# Rapport d'Intégration : AlertSec Command Center (Desktop)

Ce document valide la réciprocité totale entre le backend Expert et le client d'administration native.

## 1. MAPPING DES TYPES (PRISMA <=> TYPESCRIPT)

Les interfaces TypeScript ont été centralisées dans [types/index.ts](<file:///d:/laragon/www/Projet_Fin_D'etude_(AlertSec)/admin-desktop/src/renderer/src/types/index.ts>) et correspondent au `schema.prisma` :

- **User** : Intègre les champs `matricule` (String unique), `points` (Int), `experience` (Int), et `isOccupied` (Boolean).
- **Signalement** : Définit les types `SOS_AUTO` et `MANUEL`, ainsi que les URLs des médias (`mediaUrl`, `audioUrl`, `videoUrl`).
- **Zone** : Correspondance parfaite pour `rayon_action` et `niveau_priorite`.

## 2. VÉRIFICATION SOCKET.IO

L'intégration temps réel est opérée dans [SitacMap.tsx](<file:///d:/laragon/www/Projet_Fin_D'etude_(AlertSec)/admin-desktop/src/renderer/src/pages/SitacMap.tsx>) :

```typescript
socket.on("nouveauSignalement", (sig: Signalement) => {
  setSignalements((prev) => [sig, ...prev]);
  window.electron.sendNotification("ALERTE SOS", `...`);
});
```

**Réaction visuelle** :

1. Ajout instantané dans le "Flux Tactique" latéral.
2. Apparition d'un marqueur SOS animé (pulse rouge) sur la carte Leaflet.
3. Notification système native via le pont IPC.

## 3. FLUX DES MÉDIAS

Le Desktop accède aux preuves via une configuration globale dans `services/api.ts` :

- `MEDIA_ROOT = 'http://localhost:3000/uploads/signalements'`.
- Dans le popup SITAC, des icônes dynamiques (`Play`, `Mic`, `ImageIcon`) apparaissent si le signalement contient des preuves. Elles ouvrent les fichiers directement dans le navigateur système ou le player par défaut.

## 4. AFFECTATION TACTIQUE (FORCE-ASSIGN)

La fonctionnalité a été implémentée dans le module `adminService` :

- **Endpoint** : `PATCH /api/admin/interventions/force-assign`.
- **UX** : L'administrateur peut cliquer sur "Affectation Prioritaire" dans le popup d'un SOS. Le système sélectionne automatiquement le premier agent disponible et override les files d'attente pour une intervention immédiate.

## 5. SÉCURITÉ ET PERSISTANCE

- **Stockage JWT** : Le token est stocké dans le `localStorage` du Renderer pour une gestion native React, mais les préférences système (zoom, centre carte) utilisent **electron-store** pour une persistence robuste après redémarrage.
- **Context Bridge** : Le fichier `preload/index.ts` isole totalement les capacités Node.js. Le Renderer ne voit qu'une API `window.electron` limitée, protégeant le système contre les injections XSS.

## 📋 BACKLOG DE FINALISATION UI

Fonctionnalités backend prêtes mais nécessitant une UI plus détaillée :

1. **Chat Admin-Agent** : Le backend supporte l'envoi de notifications, mais manque une interface de messagerie instantanée.
2. **Visualisation Heatmap Historique** : Possibilité de filtrer la heatmap par date (actuellement temps réel uniquement).
3. **Édition des Zones** : Création/Modification géométrique des zones de patrouille directement depuis la carte.
