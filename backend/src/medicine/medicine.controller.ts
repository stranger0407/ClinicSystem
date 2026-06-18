import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { MedicineService } from './medicine.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ClinicId } from '../common/decorators/clinic-id.decorator';
import { UserRole } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('medicine')
export class MedicineController {
  constructor(private readonly medicineService: MedicineService) {}

  @Get()
  async list(@ClinicId() clinicId: string) {
    return this.medicineService.listMedicines(clinicId);
  }

  @Roles(UserRole.OWNER, UserRole.STAFF)
  @Post()
  async create(@ClinicId() clinicId: string, @Body() body: any) {
    return this.medicineService.createMedicine(clinicId, body);
  }

  @Roles(UserRole.OWNER, UserRole.STAFF)
  @Patch(':id')
  async update(@ClinicId() clinicId: string, @Param('id') id: string, @Body() body: any) {
    return this.medicineService.updateMedicine(clinicId, id, body);
  }

  @Roles(UserRole.OWNER, UserRole.STAFF)
  @Delete(':id')
  async delete(@ClinicId() clinicId: string, @Param('id') id: string) {
    return this.medicineService.deleteMedicine(clinicId, id);
  }
}
