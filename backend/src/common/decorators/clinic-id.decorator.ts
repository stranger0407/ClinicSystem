import { createParamDecorator, ExecutionContext, BadRequestException } from '@nestjs/common';

export const ClinicId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    if (!request.clinicId) {
      throw new BadRequestException('Clinic tenant context is missing from request');
    }
    return request.clinicId;
  },
);
