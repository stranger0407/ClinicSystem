import { Controller, Post, Get, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ClinicId } from '../common/decorators/clinic-id.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('appointment')
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Roles(UserRole.OWNER, UserRole.DOCTOR, UserRole.STAFF, UserRole.PATIENT)
  @Post()
  async createAppointment(
    @ClinicId() clinicId: string,
    @Body() dto: CreateAppointmentDto,
    @CurrentUser() user: any,
  ) {
    return this.appointmentService.createAppointment(clinicId, dto, user.id);
  }

  @Roles(UserRole.OWNER, UserRole.DOCTOR, UserRole.STAFF)
  @Get()
  async getAppointments(
    @ClinicId() clinicId: string,
    @Query('doctorId') doctorId?: string,
    @Query('date') date?: string,
  ) {
    return this.appointmentService.getAppointments(clinicId, doctorId, date);
  }

  @Roles(UserRole.OWNER, UserRole.DOCTOR, UserRole.STAFF)
  @Patch(':id/status')
  async updateStatus(
    @ClinicId() clinicId: string,
    @Param('id') id: string,
    @Body('status') status: string,
    @CurrentUser() user: any,
  ) {
    return this.appointmentService.updateStatus(clinicId, id, status, user.id);
  }
}
