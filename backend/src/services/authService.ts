import prisma from '../lib/prisma';
import bcrypt from 'bcrypt';
import { generateToken } from '../utils/auth';
import { z } from 'zod';

export const registerSchema = z.object({
  nom: z.string().min(2),
  prenom: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  telephone: z.string().optional(),
  adresse: z.string().optional(),
  grade: z.string().optional(),
  unite: z.string().optional(),
  secteur: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email().optional(),
  matricule: z.string().optional(),
  password: z.string(),
}).refine(data => data.email || data.matricule, {
  message: "L'email ou le matricule est requis pour la connexion",
  path: ["email"]
});

class AuthService {
  async register(data: z.infer<typeof registerSchema>) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      throw new Error('Cet email est déjà utilisé');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
        role: 'CITOYEN'
      }
    });

    const token = generateToken(user.id, user.role);
    
    // Don't return password
    const { password, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }

  async login(data: z.infer<typeof loginSchema>) {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email },
          { matricule: data.matricule }
        ]
      }
    });

    if (!user) {
      throw new Error('Identifiants invalides');
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);

    if (!isPasswordValid) {
      throw new Error('Identifiants invalides');
    }

    if (user.isBlocked) {
      throw new Error('Votre compte est bloqué. Veuillez contacter l\'administration.');
    }

    const token = generateToken(user.id, user.role);

    const { password, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }
}

export default new AuthService();
