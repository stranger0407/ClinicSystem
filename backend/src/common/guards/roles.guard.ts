import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const clinicId = request.clinicId;

    if (!user) {
      return false;
    }

    // Tenancy Enforcement: Ensure user belongs to the active clinic context
    if (clinicId && user.clinicId !== clinicId) {
      throw new ForbiddenException('Access denied: cross-tenant access is prohibited');
    }

    if (!requiredRoles) {
      return true;
    }

    return requiredRoles.includes(user.role);
  }
}
