import { Controller, Post, Patch, Get, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { PatientService } from './patient.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { MergePatientsDto } from './dto/merge-patients.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ClinicId } from '../common/decorators/clinic-id.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('patient')
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  @Roles(UserRole.OWNER, UserRole.STAFF)
  @Post()
  async createPatient(
    @ClinicId() clinicId: string,
    @Body() dto: CreatePatientDto,
    @CurrentUser() user: any,
  ) {
    return this.patientService.createPatient(clinicId, dto, user.id);
  }

  @Roles(UserRole.OWNER, UserRole.DOCTOR, UserRole.STAFF)
  @Get('search')
  async search(@ClinicId() clinicId: string, @Query('q') query: string) {
    return this.patientService.searchPatients(clinicId, query);
  }

  @Roles(UserRole.OWNER, UserRole.DOCTOR, UserRole.STAFF)
  @Get(':id/timeline')
  async getTimeline(@ClinicId() clinicId: string, @Param('id') id: string) {
    return this.patientService.getPatientTimeline(clinicId, id);
  }

  @Roles(UserRole.OWNER, UserRole.STAFF)
  @Post('merge')
  async mergePatients(
    @ClinicId() clinicId: string,
    @Body() dto: MergePatientsDto,
    @CurrentUser() user: any,
  ) {
    return this.patientService.mergePatients(clinicId, user.id, dto);
  }

  @Roles(UserRole.OWNER, UserRole.STAFF)
  @Patch(':id')
  async updatePatient(
    @ClinicId() clinicId: string,
    @Param('id') id: string,
    @Body() dto: Partial<CreatePatientDto>,
    @CurrentUser() user: any,
  ) {
    return this.patientService.updatePatient(clinicId, id, dto, user.id);
  }
}
