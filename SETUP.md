# Guide d'Installation : AlertSec (Node.js + Prisma + SQLite)

Ce guide décrit les étapes nécessaires pour configurer et lancer le projet **AlertSec** après la migration vers le nouveau backend Node.js.

## 📋 Prérequis

- **Node.js** (v18+)
- **npm** ou **yarn**
- **Git**

## 🚀 Installation Rapide

### 1. Configuration du Backend

```bash
cd backend
npm install
# Créer le fichier .env (DATABASE_URL, JWT_SECRET, PORT=3000)
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

### 2. Configuration du Dashboard Admin

```bash
cd Admin-Forces-de_Lordre/vigil-alert-hub
npm install
npm run dev
```

### 3. Configuration de l'Application Mobile

```bash
cd Applis/AlerteSec
npm install
# Assurez-vous que EXPO_PUBLIC_API_URL pointe vers http://localhost:3000/api
npx expo start
```

## ⚙️ Architecture & Ports

- **Frontend Dashboard** : http://localhost:5173
- **Backend API** : http://localhost:3000
- **Base de données** : SQLite (`backend/prisma/dev.db`)

## ✅ Vérification

Pour vérifier que le backend est opérationnel :

```bash
curl http://localhost:3000/api/health
```

## 📚 Structure du Projet

- `/backend` : API Express.js + Prisma
- `/Admin-Forces-de_Lordre` : Dashboard Admin (React + Vite)
- `/Applis/AlerteSec` : Application Mobile (Expo / React Native)

## 🎯 Données de Test (Seed)

Le script de seed crée les comptes suivants :

- **Admin** : admin@alertsec.com / password123
- **Agent** : agent1@alertsec.com / password123
- **Citoyen** : citoyen@alertsec.com / password123
