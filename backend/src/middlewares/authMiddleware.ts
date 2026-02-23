import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/auth';

export interface AuthRequest extends Request {
  user?: {
    userId: number;
    role: string;
  };
}

/**
 * Middleware d'authentification par JWT
 */
export const auth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Accès non autorisé, jeton manquant' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ error: 'Jeton invalide ou expiré' });
  }

  req.user = decoded;
  next();
};

/**
 * Middleware de contrôle d'accès par rôle (RBAC)
 */
export const checkRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Accès refusé, privilèges insuffisants' });
    }
    next();
  };
};

// Shorthands
export const isCitoyen = checkRole(['CITOYEN']);
export const isAgent = checkRole(['AGENT', 'ADMIN']);
export const isAdmin = checkRole(['ADMIN']);
