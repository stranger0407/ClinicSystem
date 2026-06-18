import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { DoctorService } from './doctor.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ClinicId } from '../common/decorators/clinic-id.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('doctor')
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  @Get()
  async listDoctors(@ClinicId() clinicId: string) {
    return this.doctorService.listDoctors(clinicId);
  }

  @Roles(UserRole.DOCTOR, UserRole.OWNER)
  @Patch('profile')
  async updateProfile(
    @ClinicId() clinicId: string,
    @CurrentUser() user: any,
    @Body() body: any,
  ) {
    return this.doctorService.updateProfile(clinicId, user.id, body);
  }
}
