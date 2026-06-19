import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentService } from './appointment.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';

describe('AppointmentService', () => {
  let service: AppointmentService;
  let prisma: PrismaService;

  const mockPrisma = {
    doctorProfile: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    appointment: {
      findFirst: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn((cb) => cb(mockPrisma)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AppointmentService>(AppointmentService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  const mockDoctor = {
    id: 'doc-123',
    clinicId: 'clinic-123',
    fees: 500,
    durationMin: 15,
    schedule: {
      workStart: '09:00',
      workEnd: '17:00',
      weekly: {
        monday: ['09:00-17:00'],
      },
      cancelledDates: ['2026-06-22'], // Cancelled Monday
      disabledWeekly: {
        monday: ['10:00'], // Disabled slot 10:00 AM on mondays
      },
      disabledDates: {
        '2026-06-15': ['11:00'], // Disabled slot 11:00 AM on Monday, Jun 15, 2026
      },
    },
  };

  it('should throw NotFoundException if doctor profile is not found', async () => {
    mockPrisma.doctorProfile.findFirst.mockResolvedValue(null);

    await expect(
      service.createAppointment('clinic-123', {
        doctorId: 'non-existent',
        type: 'SLOT',
        startTime: '2026-06-15T09:00:00.000Z',
        patientId: 'pat-123',
        firstName: 'John',
        lastName: 'Doe',
        phone: '9876543210',
        dob: '1990-01-01',
        gender: 'MALE',
      } as any)
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw BadRequestException for a cancelled date', async () => {
    mockPrisma.doctorProfile.findFirst.mockResolvedValue(mockDoctor);

    // June 22, 2026 is Monday, which is cancelled in doctor schedule
    await expect(
      service.createAppointment('clinic-123', {
        doctorId: 'doc-123',
        type: 'WALK_IN',
        startTime: '2026-06-22T09:00:00.000Z',
        patientId: 'pat-123',
        firstName: 'John',
        lastName: 'Doe',
        phone: '9876543210',
        dob: '1990-01-01',
        gender: 'MALE',
      } as any)
    ).rejects.toThrow(new BadRequestException('Doctor is not available on this date.'));
  });

  it('should throw BadRequestException for weekend/day with no slots and no weekly schedule fallback', async () => {
    const doctorWithNoWeekend = {
      ...mockDoctor,
      schedule: {
        ...mockDoctor.schedule,
        weekly: {
          monday: [], // Monday empty -> unavailable
        },
      },
    };
    mockPrisma.doctorProfile.findFirst.mockResolvedValue(doctorWithNoWeekend);

    await expect(
      service.createAppointment('clinic-123', {
        doctorId: 'doc-123',
        type: 'SLOT',
        startTime: '2026-06-15T09:00:00.000Z', // June 15 is Monday
        patientId: 'pat-123',
        firstName: 'John',
        lastName: 'Doe',
        phone: '9876543210',
        dob: '1990-01-01',
        gender: 'MALE',
      } as any)
    ).rejects.toThrow(new BadRequestException('Doctor is not available on this date.'));
  });

  it('should fallback to default work hours and allow booking if day is not explicitly configured in weekly', async () => {
    const doctorWithDefaultScheduleOnly = {
      id: 'doc-123',
      clinicId: 'clinic-123',
      fees: 500,
      durationMin: 15,
      schedule: {
        workStart: '08:00',
        workEnd: '20:00',
        weekly: {}, // Empty -> should fallback to 08:00-20:00 for all days
        cancelledDates: [],
      },
    };
    mockPrisma.doctorProfile.findFirst.mockResolvedValue(doctorWithDefaultScheduleOnly);
    mockPrisma.appointment.findFirst.mockResolvedValue(null); // No conflicts
    mockPrisma.appointment.create.mockResolvedValue({ id: 'app-abc', status: 'BOOKED' });

    // June 20, 2026 is Saturday.
    const testDate = new Date('2026-06-20T00:00:00');
    testDate.setHours(10, 0, 0, 0);

    const result = await service.createAppointment('clinic-123', {
      doctorId: 'doc-123',
      type: 'SLOT',
      startTime: testDate.toISOString(),
      patientId: 'pat-123',
      firstName: 'John',
      lastName: 'Doe',
      phone: '9876543210',
      dob: '1990-01-01',
      gender: 'MALE',
    } as any);

    expect(result).toBeDefined();
    expect(mockPrisma.appointment.create).toHaveBeenCalled();
  });

  it('should throw ConflictException if a slot is disabled weekly', async () => {
    mockPrisma.doctorProfile.findFirst.mockResolvedValue(mockDoctor);

    // June 15, 2026 is Monday. 10:00 slot is disabled weekly.
    const testDate = new Date('2026-06-15T00:00:00');
    testDate.setHours(10, 0, 0, 0);

    await expect(
      service.createAppointment('clinic-123', {
        doctorId: 'doc-123',
        type: 'SLOT',
        startTime: testDate.toISOString(),
        patientId: 'pat-123',
        firstName: 'John',
        lastName: 'Doe',
        phone: '9876543210',
        dob: '1990-01-01',
        gender: 'MALE',
      } as any)
    ).rejects.toThrow(ConflictException);
  });

  it('should throw ConflictException if a slot is disabled for specific date', async () => {
    mockPrisma.doctorProfile.findFirst.mockResolvedValue(mockDoctor);

    // June 15, 2026 is Monday. 11:00 slot is disabled for this date.
    const testDate = new Date('2026-06-15T00:00:00');
    testDate.setHours(11, 0, 0, 0);

    await expect(
      service.createAppointment('clinic-123', {
        doctorId: 'doc-123',
        type: 'SLOT',
        startTime: testDate.toISOString(),
        patientId: 'pat-123',
        firstName: 'John',
        lastName: 'Doe',
        phone: '9876543210',
        dob: '1990-01-01',
        gender: 'MALE',
      } as any)
    ).rejects.toThrow(ConflictException);
  });

  it('should create walk-in appointment and assign a queue number', async () => {
    mockPrisma.doctorProfile.findFirst.mockResolvedValue(mockDoctor);
    mockPrisma.appointment.count.mockResolvedValue(4); // 4 existing walk-ins today
    mockPrisma.appointment.create.mockImplementation((args) => Promise.resolve({
      id: 'app-walkin',
      ...args.data,
    }));

    // June 15, 2026 is Monday.
    const result = await service.createAppointment('clinic-123', {
      doctorId: 'doc-123',
      type: 'WALK_IN',
      startTime: '2026-06-15T14:30:00.000Z',
      patientId: 'pat-123',
      firstName: 'John',
      lastName: 'Doe',
      phone: '9876543210',
      dob: '1990-01-01',
      gender: 'MALE',
    } as any);

    expect(result).toBeDefined();
    expect(result.type).toBe('WALK_IN');
    expect(result.queueNumber).toBe(5); // 4 + 1
  });
});
