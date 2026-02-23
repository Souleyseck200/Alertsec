import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Error Handler]:', err);

  // Zod Validation Errors
  if (err instanceof z.ZodError) {
    return res.status(400).json({
      error: 'Erreur de validation',
      details: err.issues.map((e: any) => ({ path: e.path.join('.'), message: e.message }))
    });
  }

  // Prisma Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Une ressource unique avec cette valeur existe déjà.' });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Ressource non trouvée.' });
    }
  }

  // Auth Errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Jeton invalide.' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Jeton expiré.' });
  }

  // Default Error
  const status = err.status || 500;
  const message = err.message || 'Erreur interne du serveur';
  
  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
