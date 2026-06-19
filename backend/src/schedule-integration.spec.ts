import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { AppointmentService } from './appointment/appointment.service';

describe('Schedule & Slots Integration Tests', () => {
  let controller: AppController;
  let prisma: PrismaService;

  const mockPrisma = {
    doctorProfile: {
      findUnique: jest.fn(),
    },
    appointment: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        AppointmentService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    controller = module.get<AppController>(AppController);
    prisma = module.get<PrismaService>(PrismaService);
  });

  const mockDoctor = {
    id: 'doc-456',
    clinicId: 'clinic-456',
    durationMin: 30, // 30 mins slots
    fees: 400,
    schedule: {
      workStart: '09:00',
      workEnd: '12:00',
      weekly: {
        monday: ['09:00-12:00'],
      },
      cancelledDates: ['2026-06-22'], // Cancelled Monday, Jun 22, 2026
      disabledWeekly: {},
      disabledDates: {},
    },
  };

  it('should generate slots correctly with 30-min duration', async () => {
    mockPrisma.doctorProfile.findUnique.mockResolvedValue(mockDoctor);
    mockPrisma.appointment.findMany.mockResolvedValue([]); // No appointments

    // June 15, 2026 is a Monday (weekly configured)
    const slots = await controller.getDoctorSlots('doc-456', '2026-06-15');

    // Slots from 09:00 to 12:00 with 30 min duration:
    // 09:00, 09:30, 10:00, 10:30, 11:00, 11:30 (6 slots)
    expect(slots).toBeDefined();
    expect(slots.length).toBe(6);
    expect(slots[0].time).toBe('09:00');
    expect(slots[5].time).toBe('11:30');
    expect(slots.every((s) => s.available)).toBe(true);
  });

  it('should return empty slots array for cancelled date overrides', async () => {
    mockPrisma.doctorProfile.findUnique.mockResolvedValue(mockDoctor);

    // June 22, 2026 is a Monday but cancelled
    const slots = await controller.getDoctorSlots('doc-456', '2026-06-22');
    expect(slots).toEqual([]);
  });

  it('should fall back to default work hours if weekly schedule is undefined', async () => {
    const doctorWithEmptyWeekly = {
      ...mockDoctor,
      durationMin: 15, // 15 min slots
      schedule: {
        workStart: '10:00',
        workEnd: '12:00',
        weekly: {}, // Weekly is empty
        cancelledDates: [],
        disabledWeekly: {},
        disabledDates: {},
      },
    };
    mockPrisma.doctorProfile.findUnique.mockResolvedValue(
      doctorWithEmptyWeekly,
    );
    mockPrisma.appointment.findMany.mockResolvedValue([]);

    // June 20, 2026 is Saturday. Weekly is undefined, should fallback to 10:00-12:00
    const slots = await controller.getDoctorSlots('doc-456', '2026-06-20');

    // 10:00-12:00 with 15 min slots:
    // 10:00, 10:15, 10:30, 10:45, 11:00, 11:15, 11:30, 11:45 (8 slots)
    expect(slots.length).toBe(8);
    expect(slots[0].time).toBe('10:00');
    expect(slots[7].time).toBe('11:45');
  });

  it('should mark already booked slots as unavailable', async () => {
    mockPrisma.doctorProfile.findUnique.mockResolvedValue(mockDoctor);

    // Mock a booked appointment on Monday, June 15, 2026 at 10:00 - 10:30
    const testDate = new Date('2026-06-15T00:00:00');

    // Set local hours to match what the controller expects (10:00 local)
    const startTime = new Date(testDate);
    startTime.setHours(10, 0, 0, 0);
    const endTime = new Date(testDate);
    endTime.setHours(10, 30, 0, 0);

    mockPrisma.appointment.findMany.mockResolvedValue([
      {
        startTime: startTime,
        endTime: endTime,
      },
    ]);

    const slots = await controller.getDoctorSlots('doc-456', '2026-06-15');

    // 10:00 slot starts at 10:00 local and ends at 10:30 local.
    // It should overlap with the booked appointment and be marked as unavailable.
    const slot1000 = slots.find((s) => s.time === '10:00');
    expect(slot1000).toBeDefined();
    expect(slot1000.available).toBe(false);

    // Other slots like 09:30 or 10:30 should still be available
    const slot0930 = slots.find((s) => s.time === '09:30');
    expect(slot0930.available).toBe(true);
  });
});
