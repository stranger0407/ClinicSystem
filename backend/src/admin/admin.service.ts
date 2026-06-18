import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getStats(clinicId: string) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // 1. Today's encounters / visits
    const visitsCount = await this.prisma.encounter.count({
      where: { clinicId, createdAt: { gte: startOfDay, lte: endOfDay } },
    });

    // 2. Today's collections revenue split
    const payments = await this.prisma.payment.findMany({
      where: {
        invoice: { clinicId },
        createdAt: { gte: startOfDay, lte: endOfDay },
      },
    });

    const split = { CASH: 0, UPI: 0, CARD: 0 };
    let todayRevenue = 0;

    payments.forEach((p) => {
      const amt = parseFloat(p.amount.toString());
      todayRevenue += amt;
      if (p.method === 'CASH') split.CASH += amt;
      else if (p.method === 'UPI') split.UPI += amt;
      else if (p.method === 'CARD') split.CARD += amt;
    });

    // 3. Pending invoice dues calculation
    const pendingInvoices = await this.prisma.invoice.findMany({
      where: { clinicId, status: { in: ['PENDING', 'PARTIALLY_PAID'] }, deletedAt: null },
      include: { payments: true },
    });

    let pendingDues = 0;
    pendingInvoices.forEach((inv) => {
      const total = parseFloat(inv.total.toString());
      const paid = inv.payments.reduce((acc, p) => acc + parseFloat(p.amount.toString()), 0);
      pendingDues += (total - paid);
    });

    // 4. Staff counts
    const doctorsCount = await this.prisma.doctorProfile.count({ where: { clinicId } });
    const staffCount = await this.prisma.staffProfile.count({ where: { clinicId } });

    return {
      visitsCount,
      todayRevenue,
      paymentSplit: split,
      pendingDues,
      doctorsCount,
      staffCount,
    };
  }

  async getAuditLogs(clinicId: string) {
    return this.prisma.auditLog.findMany({
      where: { clinicId },
      include: {
        user: { select: { firstName: true, lastName: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async listStaff(clinicId: string) {
    return this.prisma.staffProfile.findMany({
      where: { clinicId },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true },
        },
      },
    });
  }
}
