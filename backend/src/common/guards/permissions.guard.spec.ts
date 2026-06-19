import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { PermissionsGuard } from './permissions.guard';
import { UserRole } from '@prisma/client';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new PermissionsGuard(reflector);
  });

  const createMockContext = (user: any, requiredPermissions?: string[]): ExecutionContext => {
    const request = { user };
    const httpContext = {
      getRequest: () => request,
    };
    const context = {
      switchToHttp: () => httpContext,
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;

    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(requiredPermissions);

    return context;
  };

  it('should allow access if no permissions are required', () => {
    const context = createMockContext(null, undefined);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny access if permissions are required but user is not authenticated', () => {
    const context = createMockContext(null, ['CLINICAL']);
    expect(guard.canActivate(context)).toBe(false);
  });

  it('should unconditionally allow access to OWNER', () => {
    const context = createMockContext({ role: UserRole.OWNER }, ['CLINICAL', 'BILLING']);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should unconditionally allow access to DOCTOR', () => {
    const context = createMockContext({ role: UserRole.DOCTOR }, ['REGISTRATION', 'BILLING']);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny access to STAFF if they lack required permissions', () => {
    const context = createMockContext(
      { role: UserRole.STAFF, permissions: ['BILLING'] },
      ['REGISTRATION']
    );
    expect(guard.canActivate(context)).toBe(false);
  });

  it('should allow access to STAFF if they possess all required permissions', () => {
    const context = createMockContext(
      { role: UserRole.STAFF, permissions: ['REGISTRATION', 'BILLING'] },
      ['REGISTRATION', 'BILLING']
    );
    expect(guard.canActivate(context)).toBe(true);
  });
});
