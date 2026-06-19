import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Security Audit & E2E Validation (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let patientToken: string;
  let doctorToken: string;
  let doctorId: string;
  let clinicId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // 1. Retrieve the clinic ID and doctor profile ID
    const clinic = await prisma.clinic.findFirst();
    if (clinic) {
      clinicId = clinic.id;
    }
    const doctor = await prisma.doctorProfile.findFirst();
    if (doctor) {
      doctorId = doctor.id;
    }

    console.log(`E2E Context - Clinic ID: ${clinicId}, Doctor ID: ${doctorId}`);

    // 2. Authenticate as seeded Doctor to get token (passing x-clinic-id header)
    const docLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .set('x-clinic-id', clinicId)
      .send({
        email: 'doctor@apollo.com',
        password: 'Password123',
      });

    console.log(
      `Doctor Login Status: ${docLogin.status}, Body:`,
      docLogin.body,
    );
    if (docLogin.status === 201 || docLogin.status === 200) {
      doctorToken = docLogin.body.accessToken;
    }

    // 3. Authenticate as seeded Patient (Vijay Kumar) to get token (passing x-clinic-id header)
    const patLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .set('x-clinic-id', clinicId)
      .send({
        phone: '9876543210',
        password: 'Password123',
      });

    console.log(
      `Patient Login Status: ${patLogin.status}, Body:`,
      patLogin.body,
    );
    if (patLogin.status === 201 || patLogin.status === 200) {
      patientToken = patLogin.body.accessToken;
    }
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Authentication & Route Authorization Security Audit', () => {
    it('should block unauthenticated requests to protected endpoints', async () => {
      // 1. Try to search patients without token
      await request(app.getHttpServer())
        .get('/patient/search?query=Vijay')
        .expect(401);

      // 2. Try to load admin stats without token
      await request(app.getHttpServer()).get('/admin/stats').expect(401);
    });

    it('should deny PATIENT access to medical search and practice stats (RBAC check)', async () => {
      // A patient should not be allowed to search the database for other patients
      await request(app.getHttpServer())
        .get('/patient/search?query=Kumar')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(403);

      // A patient should not be allowed to view the clinic financial stats
      await request(app.getHttpServer())
        .get('/admin/stats')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(403);
    });

    it('should grant DOCTOR access to clinical and stats endpoints', async () => {
      // A doctor is authorized to search patient profiles
      await request(app.getHttpServer())
        .get('/patient/search?query=Vijay')
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      // A doctor is authorized to view practice analytics
      await request(app.getHttpServer())
        .get('/admin/stats')
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);
    });
  });

  describe('Input Validation & SQL Injection Protection Audit', () => {
    it('should reject malformed or extra parameters in body payload (whitelist check)', async () => {
      // Send extra unrecognized properties to protected `/appointment` endpoint
      await request(app.getHttpServer())
        .post('/appointment')
        .set('Authorization', `Bearer ${doctorToken}`)
        .set('x-clinic-id', clinicId)
        .send({
          doctorId: doctorId,
          type: 'SLOT',
          startTime: new Date().toISOString(),
          patientId: 'dummy-pat-id',
          notes: 'tampering test',
          extraTamperedField: 'MALICIOUS_INJECTION', // Forbidden field
        })
        .expect(400);
    });

    it('should sanitize and allow special chars without crashing db (SQL injection check)', async () => {
      // Test that input is treated as literal and does not trigger SQL syntax errors
      const randSuffix = Math.floor(100000 + Math.random() * 900000);
      const sqlInjectionPhone = `999${randSuffix}`;
      const sqlInjectionName = "Amit' OR '1'='1"; // Common SQL Injection payload

      const res = await request(app.getHttpServer())
        .post('/public/book')
        .set('x-clinic-id', clinicId)
        .send({
          doctorId: doctorId,
          type: 'WALK_IN',
          startTime: new Date().toISOString(),
          firstName: sqlInjectionName,
          lastName: 'InjectionTest',
          phone: sqlInjectionPhone,
          dob: '1990-05-15',
          gender: 'MALE',
        });

      expect(res.status).toBe(201);

      const createdPatient = res.body.patientProfile;
      expect(createdPatient.firstName).toBe(sqlInjectionName);

      // Clean up the created test patient profile to keep DB tidy
      await prisma.appointment.deleteMany({
        where: { patientId: createdPatient.id },
      });
      await prisma.patientProfile.delete({ where: { id: createdPatient.id } });
    });
  });

  describe('Doctor Timings & Cancellation Block E2E', () => {
    const cancelDate = '2026-06-28'; // Sunday

    beforeAll(async () => {
      // Cancel June 28, 2026 in the doctor profile schedule
      const docProfile = await prisma.doctorProfile.findUnique({
        where: { id: doctorId },
      });
      const schedule = (docProfile?.schedule as any) || {};
      const cancelledDates = schedule.cancelledDates || [];
      if (!cancelledDates.includes(cancelDate)) {
        cancelledDates.push(cancelDate);
      }
      schedule.cancelledDates = cancelledDates;

      await prisma.doctorProfile.update({
        where: { id: doctorId },
        data: { schedule },
      });
    });

    afterAll(async () => {
      // Re-open/restore Sunday schedule
      const docProfile = await prisma.doctorProfile.findUnique({
        where: { id: doctorId },
      });
      const schedule = docProfile?.schedule as any;
      if (schedule && schedule.cancelledDates) {
        schedule.cancelledDates = schedule.cancelledDates.filter(
          (d: string) => d !== cancelDate,
        );
        await prisma.doctorProfile.update({
          where: { id: doctorId },
          data: { schedule },
        });
      }
    });

    it('should reject booking requests on cancelled dates (E2E Availability Sync)', async () => {
      // Attempting to book a walk-in on Sunday (which was added to cancelledDates)
      const res = await request(app.getHttpServer())
        .post('/public/book')
        .set('x-clinic-id', clinicId)
        .send({
          doctorId: doctorId,
          type: 'WALK_IN',
          startTime: `${cancelDate}T10:00:00.000Z`,
          firstName: 'E2EPatient',
          lastName: 'CancelBlock',
          phone: '9988776655',
          dob: '1985-05-05',
          gender: 'FEMALE',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Doctor is not available on this date.');
    });
  });
});
