import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
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

  @Roles(UserRole.OWNER)
  @Get('staff')
  async listStaff(@ClinicId() clinicId: string) {
    return this.adminService.listStaff(clinicId);
  }

  @Roles(UserRole.OWNER)
  @Put('clinic')
  async updateClinic(@ClinicId() clinicId: string, @Body() body: any) {
    return this.adminService.updateClinic(clinicId, body);
  }
}
