import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { EncounterService } from './encounter.service';
import { CreateEncounterDto } from './dto/create-encounter.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ClinicId } from '../common/decorators/clinic-id.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('encounter')
export class EncounterController {
  constructor(private readonly encounterService: EncounterService) {}

  @Roles(UserRole.DOCTOR, UserRole.OWNER)
  @Post()
  async createEncounter(
    @ClinicId() clinicId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateEncounterDto,
  ) {
    return this.encounterService.createEncounter(clinicId, user.id, dto);
  }

  @Roles(UserRole.DOCTOR, UserRole.OWNER, UserRole.STAFF)
  @Get('medicine/search')
  async searchMedicines(
    @ClinicId() clinicId: string,
    @Query('q') query: string,
  ) {
    return this.encounterService.searchMedicines(clinicId, query);
  }
}
