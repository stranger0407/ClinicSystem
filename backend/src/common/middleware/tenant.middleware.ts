import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

declare global {
  namespace Express {
    interface Request {
      clinicId?: string;
    }
  }
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // 1. Try x-clinic-id header
    let clinicId = req.headers['x-clinic-id'] as string;

    // 2. Try query parameter (useful for testing or direct links)
    if (!clinicId) {
      clinicId = req.query.clinicId as string;
    }

    // 3. Try subdomain parsing (e.g., apollo.clinic.com -> apollo)
    if (!clinicId) {
      const host = req.headers.host || '';
      const parts = host.split('.');
      // Check if we have a subdomain that is not www or localhost
      if (parts.length > 1 && parts[0] !== 'www' && !host.includes('localhost') && !host.includes('127.0.0.1')) {
        const subdomain = parts[0];
        const clinic = await this.prisma.clinic.findUnique({
          where: { subdomain },
          select: { id: true },
        });
        if (clinic) {
          clinicId = clinic.id;
        }
      }
    }

    if (clinicId) {
      req.clinicId = clinicId;
    }

    next();
  }
}
