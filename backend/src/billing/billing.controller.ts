import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { BillingService } from './billing.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ClinicId } from '../common/decorators/clinic-id.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Roles(UserRole.OWNER, UserRole.DOCTOR, UserRole.STAFF)
  @Post('invoice')
  async createInvoice(
    @ClinicId() clinicId: string,
    @Body() dto: CreateInvoiceDto,
    @CurrentUser() user: any,
  ) {
    return this.billingService.createInvoice(clinicId, dto, user.id);
  }

  @Roles(UserRole.OWNER, UserRole.DOCTOR, UserRole.STAFF)
  @Post('payment')
  async recordPayment(
    @ClinicId() clinicId: string,
    @Body() dto: RecordPaymentDto,
    @CurrentUser() user: any,
  ) {
    return this.billingService.recordPayment(clinicId, dto, user.id);
  }

  @Roles(UserRole.OWNER, UserRole.DOCTOR, UserRole.STAFF)
  @Get('invoice/:id')
  async getInvoiceDetails(@ClinicId() clinicId: string, @Param('id') id: string) {
    return this.billingService.getInvoiceDetails(clinicId, id);
  }

  @Roles(UserRole.OWNER, UserRole.DOCTOR, UserRole.STAFF)
  @Get('invoice')
  async listInvoices(@ClinicId() clinicId: string) {
    return this.billingService.listInvoices(clinicId);
  }
}
