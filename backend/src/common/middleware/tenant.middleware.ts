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
    // Single-tenant default: always bind requests to the active clinic in the database
    const clinic = await this.prisma.clinic.findFirst({
      select: { id: true },
    });
    if (clinic) {
      req.clinicId = clinic.id;
    }
    next();
  }
}
