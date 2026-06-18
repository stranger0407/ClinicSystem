import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class BillingService {
  constructor(private prisma: PrismaService) {}

  async createInvoice(clinicId: string, dto: CreateInvoiceDto, operatorId?: string) {
    // 1. Calculate Ledger amounts
    const subtotal = dto.items.reduce((acc, item) => acc + item.quantity * item.amount, 0);
    const discount = dto.discount || 0;
    const tax = dto.tax || 0;
    const total = subtotal - discount + tax;

    if (total < 0) {
      throw new BadRequestException('Discount cannot exceed the subtotal amount');
    }

    // 2. Generate random unique invoice number sequence
    const year = new Date().getFullYear();
    const rand = Math.floor(100000 + Math.random() * 900000);
    const invoiceNumber = `INV-${year}-${rand}`;

    // 3. Create invoice in database
    const invoice = await this.prisma.invoice.create({
      data: {
        clinicId,
        patientId: dto.patientId,
        appointmentId: dto.appointmentId,
        invoiceNumber,
        subtotal: new Prisma.Decimal(subtotal),
        discount: new Prisma.Decimal(discount),
        tax: new Prisma.Decimal(tax),
        total: new Prisma.Decimal(total),
        status: 'PENDING',
        items: dto.items as any,
      },
    });

    // 4. Log to AuditLog
    await this.prisma.auditLog.create({
      data: {
        clinicId,
        userId: operatorId,
        action: 'CREATE',
        entityName: 'Invoice',
        entityId: invoice.id,
        details: { newValues: invoice },
      },
    });

    return invoice;
  }

  async recordPayment(clinicId: string, dto: RecordPaymentDto, operatorId?: string) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Resolve Invoice
      const invoice = await tx.invoice.findFirst({
        where: { id: dto.invoiceId, clinicId, deletedAt: null },
      });
      if (!invoice) {
        throw new NotFoundException('Invoice not found');
      }

      // 2. Log Payment
      const payment = await tx.payment.create({
        data: {
          invoiceId: dto.invoiceId,
          amount: new Prisma.Decimal(dto.amount),
          method: dto.method,
          notes: dto.notes,
        },
      });

      // 3. Calculate Sum of Payments
      const allPayments = await tx.payment.findMany({
        where: { invoiceId: dto.invoiceId },
      });

      const totalPaid = allPayments.reduce((acc, pay) => acc + parseFloat(pay.amount.toString()), 0);
      const invoiceTotal = parseFloat(invoice.total.toString());

      // 4. Resolve status
      let status = 'PENDING';
      if (totalPaid >= invoiceTotal) {
        status = 'PAID';
      } else if (totalPaid > 0) {
        status = 'PARTIALLY_PAID';
      }

      const updatedInvoice = await tx.invoice.update({
        where: { id: dto.invoiceId },
        data: { status },
      });

      // 5. Log to AuditLog
      await tx.auditLog.create({
        data: {
          clinicId,
          userId: operatorId,
          action: 'UPDATE',
          entityName: 'Invoice',
          entityId: dto.invoiceId,
          details: {
            paymentLogged: payment,
            newInvoiceStatus: status,
          },
        },
      });

      return {
        payment,
        invoice: updatedInvoice,
      };
    });
  }

  async getInvoiceDetails(clinicId: string, invoiceId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, clinicId, deletedAt: null },
      include: {
        patient: {
          select: { firstName: true, lastName: true, phone: true, address: true, dob: true, gender: true },
        },
        payments: true,
      },
    });
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }
    return invoice;
  }

  async listInvoices(clinicId: string) {
    return this.prisma.invoice.findMany({
      where: { clinicId, deletedAt: null },
      include: {
        patient: {
          select: { firstName: true, lastName: true, phone: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
