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
      where: {
        clinicId,
        status: { in: ['PENDING', 'PARTIALLY_PAID'] },
        deletedAt: null,
      },
      include: { payments: true, patient: true },
    });

    let pendingDues = 0;
    pendingInvoices.forEach((inv) => {
      const total = parseFloat(inv.total.toString());
      const paid = inv.payments.reduce(
        (acc, p) => acc + parseFloat(p.amount.toString()),
        0,
      );
      pendingDues += total - paid;
    });

    // 4. Staff counts
    const doctorsCount = await this.prisma.doctorProfile.count({
      where: { clinicId },
    });
    const staffCount = await this.prisma.staffProfile.count({
      where: { clinicId },
    });

    // --- NEW EXTENDED STATS ---

    // 5. Weekly Trend calculations (Last 7 Days)
    const weeklyRevenue = [];
    const weeklyVisits = [];
    const today = new Date();

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const paymentsLast7Days = await this.prisma.payment.findMany({
      where: {
        invoice: { clinicId },
        createdAt: { gte: sevenDaysAgo },
      },
    });

    const encountersLast7Days = await this.prisma.encounter.findMany({
      where: {
        clinicId,
        createdAt: { gte: sevenDaysAgo },
      },
    });

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const start = new Date(d);
      const end = new Date(d);
      end.setHours(23, 59, 59, 999);

      const label = d.toLocaleDateString('en-US', {
        weekday: 'short',
        day: 'numeric',
      });

      // Daily revenue
      const dayPayments = paymentsLast7Days.filter(
        (p) => p.createdAt >= start && p.createdAt <= end,
      );
      const revSum = dayPayments.reduce(
        (sum, p) => sum + parseFloat(p.amount.toString()),
        0,
      );
      weeklyRevenue.push({ label, value: revSum });

      // Daily visits
      const dayVisits = encountersLast7Days.filter(
        (e) => e.createdAt >= start && e.createdAt <= end,
      ).length;
      weeklyVisits.push({ label, value: dayVisits });
    }

    // 6. Top Prescribed Medicines
    const rxItems = await this.prisma.prescriptionItem.findMany({
      where: {
        prescription: { clinicId },
      },
      include: {
        medicine: {
          select: { name: true, strength: true, dosageForm: true },
        },
      },
    });

    const medCounts: Record<string, { name: string; count: number }> = {};
    rxItems.forEach((item) => {
      if (!item.medicine) return;
      const key = item.medicineId;
      const displayName = `${item.medicine.name} ${item.medicine.strength || ''} (${item.medicine.dosageForm})`;
      if (!medCounts[key]) {
        medCounts[key] = { name: displayName, count: 0 };
      }
      medCounts[key].count += 1;
    });

    const topMedicines = Object.values(medCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 7. Top Diagnoses
    const encounters = await this.prisma.encounter.findMany({
      where: { clinicId },
      select: { diagnosis: true },
    });

    const diagCounts: Record<string, number> = {};
    encounters.forEach((e) => {
      const diag = e.diagnosis.trim();
      if (!diag) return;
      const normalized =
        diag.charAt(0).toUpperCase() + diag.slice(1).toLowerCase();
      diagCounts[normalized] = (diagCounts[normalized] || 0) + 1;
    });

    const topDiagnoses = Object.entries(diagCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 8. Top Actionable Outstanding Invoices
    const topPendingInvoices = pendingInvoices
      .map((inv) => {
        const total = parseFloat(inv.total.toString());
        const paid = inv.payments.reduce(
          (acc, p) => acc + parseFloat(p.amount.toString()),
          0,
        );
        const dues = total - paid;
        return {
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          patientName: inv.patient
            ? `${inv.patient.firstName} ${inv.patient.lastName}`
            : 'Unknown Patient',
          patientPhone: inv.patient?.phone || '',
          total,
          dues,
          createdAt: inv.createdAt,
        };
      })
      .sort((a, b) => b.dues - a.dues)
      .slice(0, 5);

    return {
      visitsCount,
      todayRevenue,
      paymentSplit: split,
      pendingDues,
      doctorsCount,
      staffCount,
      weeklyRevenue,
      weeklyVisits,
      topMedicines,
      topDiagnoses,
      topPendingInvoices,
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
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });
  }

  async updateClinic(clinicId: string, data: any) {
    return this.prisma.clinic.update({
      where: { id: clinicId },
      data: {
        name: data.name,
        address: data.address,
        phone: data.phone,
        settings: data.settings,
      },
    });
  }
}
