import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ClinicId } from '../common/decorators/clinic-id.decorator';
import { UserRole } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Roles(UserRole.OWNER)
  @Get('stats')
  async getStats(@ClinicId() clinicId: string) {
    return this.adminService.getStats(clinicId);
  }

  @Roles(UserRole.OWNER)
  @Get('audit-logs')
  async getAuditLogs(@ClinicId() clinicId: string) {
    return this.adminService.getAuditLogs(clinicId);
  }
}
