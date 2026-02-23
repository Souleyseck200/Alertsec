import { Request, Response, NextFunction } from 'express';
import adminService from '../services/adminService';

class StatsController {
  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await adminService.getDashboardStats();
      res.json(stats);
    } catch (error) {
      next(error);
    }
  }
}

export default new StatsController();
