import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import prisma from './lib/prisma';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import signalementRoutes from './routes/signalementRoutes';
import contactRoutes from './routes/contactRoutes';
import notificationRoutes from './routes/notificationRoutes';
import interventionRoutes from './routes/interventionRoutes';
import statsRoutes from './routes/statsRoutes';
import adminRoutes from './routes/adminRoutes';
import { errorHandler } from './middlewares/errorMiddleware';
import socketService from './services/socketService';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/signalements', signalementRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/interventions', interventionRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/admin', adminRoutes);

// Error Handler
app.use(errorHandler);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'AlertSec Backend is running', 
    timestamp: new Date().toISOString(),
    database: 'SQLite'
  });
});

// Initialisation Socket.io
socketService.init(httpServer);

httpServer.listen(PORT, () => {
  console.log(`🚀 AlertSec Backend ready at http://localhost:${PORT}`);
});

export default app;
