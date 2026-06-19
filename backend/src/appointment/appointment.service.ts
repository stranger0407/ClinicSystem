import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

@Injectable()
export class AppointmentService {
  constructor(private prisma: PrismaService) {}

  async createAppointment(
    clinicId: string,
    dto: CreateAppointmentDto,
    operatorId?: string,
  ) {
    // 1. Fetch Doctor Profile to retrieve duration and config
    const doctor = await this.prisma.doctorProfile.findFirst({
      where: { id: dto.doctorId, clinicId },
    });
    if (!doctor) {
      throw new NotFoundException('Doctor profile not found');
    }

    // 2. Perform booking within transaction
    return this.prisma.$transaction(async (tx) => {
      let startTime: Date;
      let endTime: Date | null = null;
      let queueNumber: number | null = null;

      if (dto.startTime) {
        startTime = new Date(dto.startTime);
      } else {
        startTime = new Date();
      }

      const weekdays = [
        'sunday',
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
      ];
      const dayName = weekdays[startTime.getDay()];

      // Local Date YYYY-MM-DD
      const y = startTime.getFullYear();
      const m = String(startTime.getMonth() + 1).padStart(2, '0');
      const d = String(startTime.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;

      const schedule = doctor.schedule as any;
      const weekly = schedule?.weekly || {};
      const workStart = schedule?.workStart || '09:00';
      const workEnd = schedule?.workEnd || '17:00';
      const cancelledDates = schedule?.cancelledDates || [];
      const disabledWeekly = schedule?.disabledWeekly?.[dayName] || [];
      const disabledDatesForDate = schedule?.disabledDates?.[dateStr] || [];

      const daySlots =
        weekly[dayName] !== undefined
          ? weekly[dayName]
          : [`${workStart}-${workEnd}`];
      const isCancelled = cancelledDates.includes(dateStr);

      if (isCancelled || daySlots.length === 0) {
        throw new BadRequestException('Doctor is not available on this date.');
      }

      if (dto.type === 'SLOT') {
        const slotTimeStr = startTime.toTimeString().substring(0, 5); // "09:00"
        const isDisabledWeekly = disabledWeekly.includes(slotTimeStr);
        const isDisabledDate = disabledDatesForDate.includes(slotTimeStr);

        if (isDisabledWeekly || isDisabledDate) {
          throw new ConflictException(
            'The selected time slot is disabled by the doctor.',
          );
        }

        // Add doctor slot duration (minutes)
        endTime = new Date(
          startTime.getTime() + doctor.durationMin * 60 * 1000,
        );

        // Enforce No-Double-Booking Constraint
        const overlapping = await tx.appointment.findFirst({
          where: {
            clinicId,
            doctorId: dto.doctorId,
            type: 'SLOT',
            status: { notIn: ['CANCELLED', 'NO_SHOW'] },
            deletedAt: null,
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gt: startTime } },
            ],
          },
        });

        if (overlapping) {
          throw new ConflictException(
            'The selected time slot is already booked for this doctor',
          );
        }
      } else {
        // WALK-IN booking
        const startOfDay = new Date(startTime);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(startTime);
        endOfDay.setHours(23, 59, 59, 999);

        const walkInCount = await tx.appointment.count({
          where: {
            clinicId,
            doctorId: dto.doctorId,
            type: 'WALK_IN',
            deletedAt: null,
            startTime: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
        });

        queueNumber = walkInCount + 1;
      }

      // Create the appointment
      const appointment = await tx.appointment.create({
        data: {
          clinicId,
          patientId: dto.patientId,
          doctorId: dto.doctorId,
          type: dto.type,
          status: 'BOOKED',
          startTime,
          endTime,
          queueNumber,
          isFollowUp: dto.isFollowUp || false,
          notes: dto.notes,
        },
        include: {
          patient: {
            select: { firstName: true, lastName: true, phone: true },
          },
        },
      });

      // Log to AuditLog
      await tx.auditLog.create({
        data: {
          clinicId,
          userId: operatorId,
          action: 'CREATE',
          entityName: 'Appointment',
          entityId: appointment.id,
          details: { newValues: appointment },
        },
      });

      return appointment;
    });
  }

  async getAppointments(clinicId: string, doctorId?: string, dateStr?: string) {
    const filterDate = dateStr ? new Date(dateStr) : new Date();
    const startOfDay = new Date(filterDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(filterDate);
    endOfDay.setHours(23, 59, 59, 999);

    const whereClause: any = {
      clinicId,
      deletedAt: null,
      OR: [
        // Slot-based: check startTime falls on the target date
        {
          type: 'SLOT',
          startTime: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        // Walk-in: check createdAt falls on the target date
        {
          type: 'WALK_IN',
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      ],
    };

    if (doctorId) {
      whereClause.doctorId = doctorId;
    }

    return this.prisma.appointment.findMany({
      where: whereClause,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            dob: true,
          },
        },
        doctor: {
          select: {
            id: true,
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: [
        { type: 'asc' }, // SLOT first, then WALK_IN
        { startTime: 'asc' }, // Sort slots by start time
        { queueNumber: 'asc' }, // Sort walk-ins by queue number
      ],
    });
  }

  async updateStatus(
    clinicId: string,
    appointmentId: string,
    status: string,
    operatorId: string,
  ) {
    const allowedStatuses = [
      'BOOKED',
      'CHECKED_IN',
      'IN_CONSULTATION',
      'COMPLETED',
      'CANCELLED',
      'NO_SHOW',
      'RESCHEDULED',
    ];
    if (!allowedStatuses.includes(status)) {
      throw new BadRequestException(`Invalid appointment status: ${status}`);
    }

    const appointment = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, clinicId, deletedAt: null },
    });
    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    const updated = await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { status },
    });

    // Write to audit trail
    await this.prisma.auditLog.create({
      data: {
        clinicId,
        userId: operatorId,
        action: 'UPDATE',
        entityName: 'Appointment',
        entityId: appointmentId,
        details: {
          oldStatus: appointment.status,
          newStatus: status,
        },
      },
    });

    return updated;
  }
}
