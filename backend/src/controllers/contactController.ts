import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import prisma from '../lib/prisma';
import { z } from 'zod';

const contactUrgenceSchema = z.object({
  nom: z.string(),
  telephone: z.string(),
  relation: z.string(),
});

class ContactController {
  async add(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ error: 'Non authentifié' });

      const validatedData = contactUrgenceSchema.parse(req.body);

      const contact = await prisma.contactUrgence.create({
        data: {
          ...validatedData,
          userId
        }
      });

      res.status(201).json(contact);
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ error: 'Non authentifié' });

      const contacts = await prisma.contactUrgence.findMany({
        where: { userId }
      });

      res.json(contacts);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const contactId = parseInt(req.params.id as string);

      const contact = await prisma.contactUrgence.findUnique({ where: { id: contactId } });
      if (!contact) return res.status(404).json({ error: 'Contact non trouvé' });
      if (contact.userId !== userId) return res.status(403).json({ error: 'Non autorisé' });

      await prisma.contactUrgence.delete({ where: { id: contactId } });
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export default new ContactController();
