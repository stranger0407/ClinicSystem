import { Controller, Get, Post, Body, Query, Param, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { AppointmentService } from './appointment/appointment.service';
import * as bcrypt from 'bcrypt';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
    private readonly appointmentService: AppointmentService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  async getHealth() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'up',
        timestamp: new Date().toISOString(),
        database: 'connected',
      };
    } catch (err: any) {
      return {
        status: 'down',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: err.message,
      };
    }
  }

  @Get('public/clinic')
  async getPublicClinic() {
    const clinic = await this.prisma.clinic.findFirst();
    if (!clinic) {
      throw new NotFoundException('Clinic configuration not found');
    }
    return clinic;
  }

  @Get('public/doctors')
  async getPublicDoctors() {
    const clinic = await this.prisma.clinic.findFirst();
    if (!clinic) {
      throw new NotFoundException('Clinic configuration not found');
    }
    return this.prisma.doctorProfile.findMany({
      where: { clinicId: clinic.id },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
  }

  @Get('public/doctor/:id/slots')
  async getDoctorSlots(
    @Param('id') doctorId: string,
    @Query('date') dateStr: string,
  ) {
    if (!dateStr) {
      throw new BadRequestException('Query parameter date is required');
    }

    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { id: doctorId },
    });
    if (!doctor) {
      throw new NotFoundException('Doctor profile not found');
    }

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      throw new BadRequestException('Invalid date format');
    }

    const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = weekdays[date.getDay()];

    const schedule = doctor.schedule as any;
    const cancelledDates = schedule?.cancelledDates || [];
    if (cancelledDates.includes(dateStr)) {
      return [];
    }

    const weekly = schedule?.weekly || {};
    const workStart = schedule?.workStart || '09:00';
    const workEnd = schedule?.workEnd || '17:00';
    const daySlots = weekly[dayName] !== undefined ? weekly[dayName] : [`${workStart}-${workEnd}`];

    const slots: { time: string; startTime: string; available: boolean }[] = [];
    const durationMin = doctor.durationMin || 15;

    for (const windowStr of daySlots) {
      const [startStr, endStr] = windowStr.split('-');
      if (!startStr || !endStr) continue;

      const [startHour, startMin] = startStr.split(':').map(Number);
      const [endHour, endMin] = endStr.split(':').map(Number);

      let current = new Date(date);
      current.setHours(startHour, startMin, 0, 0);

      const end = new Date(date);
      end.setHours(endHour, endMin, 0, 0);

      const durationMs = durationMin * 60 * 1000;

      while (current.getTime() + durationMs <= end.getTime()) {
        const timeStr = current.toTimeString().substring(0, 5); // "09:00"
        const slotStartIso = current.toISOString();

        slots.push({
          time: timeStr,
          startTime: slotStartIso,
          available: true,
        });

        current = new Date(current.getTime() + durationMs);
      }
    }

    // Filter appointments for this date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const booked = await this.prisma.appointment.findMany({
      where: {
        doctorId: doctor.id,
        type: 'SLOT',
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
        deletedAt: null,
        startTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      select: { startTime: true, endTime: true },
    });

    const disabledSlots = schedule?.disabledWeekly?.[dayName] || [];
    const disabledForDate = schedule?.disabledDates?.[dateStr] || [];

    for (const slot of slots) {
      const slotStart = new Date(slot.startTime);
      const slotEnd = new Date(slotStart.getTime() + durationMin * 60 * 1000);

      const isBooked = booked.some((b) => {
        const bStart = new Date(b.startTime!);
        const bEnd = new Date(b.endTime!);
        return slotStart < bEnd && slotEnd > bStart;
      });

      const isDisabledWeekly = disabledSlots.includes(slot.time);
      const isDisabledDate = disabledForDate.includes(slot.time);

      if (isBooked || isDisabledWeekly || isDisabledDate) {
        slot.available = false;
      }
    }

    return slots;
  }

  @Post('public/book')
  async publicBook(@Body() body: any) {
    const clinic = await this.prisma.clinic.findFirst();
    if (!clinic) {
      throw new NotFoundException('Clinic configuration not found');
    }

    // 1. Validate fields
    if (!body.doctorId || !body.type || !body.firstName || !body.lastName || !body.phone || !body.dob || !body.gender) {
      throw new BadRequestException('Missing mandatory booking fields');
    }

    // 2. Perform transactions for patient creation/claiming
    const result = await this.prisma.$transaction(async (tx) => {
      let patientProfile = await tx.patientProfile.findFirst({
        where: { clinicId: clinic.id, phone: body.phone, deletedAt: null },
      });

      let userId: string | null = patientProfile ? patientProfile.userId : null;

      if (body.createAccount) {
        if (!body.password) {
          throw new BadRequestException('Password is required for creating a patient portal account');
        }

        // Check if user already exists
        let existingUser = await tx.user.findFirst({
          where: { clinicId: clinic.id, OR: [{ phone: body.phone }, body.email ? { email: body.email } : {}] },
        });

        if (existingUser) {
          if (patientProfile && patientProfile.userId === existingUser.id) {
            // Account already claimed, do not overwrite
            userId = existingUser.id;
          } else {
            throw new ConflictException('A portal account with this phone or email already exists');
          }
        } else {
          // Create new user account
          const passwordHash = await bcrypt.hash(body.password, 10);
          const user = await tx.user.create({
            data: {
              clinicId: clinic.id,
              email: body.email || null,
              phone: body.phone,
              passwordHash,
              role: 'PATIENT',
              firstName: body.firstName,
              lastName: body.lastName,
              permissions: ['PORTAL'],
            },
          });
          userId = user.id;
        }
      }

      if (!patientProfile) {
        patientProfile = await tx.patientProfile.create({
          data: {
            clinicId: clinic.id,
            userId,
            phone: body.phone,
            firstName: body.firstName,
            lastName: body.lastName,
            dob: new Date(body.dob),
            gender: body.gender,
            address: '',
          },
        });
      } else if (userId && !patientProfile.userId) {
        // Link existing profile to newly created user context
        patientProfile = await tx.patientProfile.update({
          where: { id: patientProfile.id },
          data: { userId },
        });
      }

      return { patientProfile };
    });

    // 3. Book the appointment
    const appointment = await this.appointmentService.createAppointment(
      clinic.id,
      {
        patientId: result.patientProfile.id,
        doctorId: body.doctorId,
        type: body.type,
        startTime: body.startTime,
        notes: body.notes,
        isFollowUp: false,
      },
      result.patientProfile.userId || undefined,
    );

    return {
      appointment,
      patientProfile: result.patientProfile,
    };
  }
}
