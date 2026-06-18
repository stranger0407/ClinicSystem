import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding dummy clinic data...');

  const passwordHash = await bcrypt.hash('Password123', 10);

  // 1. Create Clinic
  const clinic = await prisma.clinic.upsert({
    where: { subdomain: 'apollo' },
    update: {},
    create: {
      name: 'Apollo Family Clinic',
      subdomain: 'apollo',
      address: '102, Residency Road, Bangalore, Karnataka',
      phone: '080-45678901',
    },
  });
  console.log(`Clinic created: ${clinic.name} (${clinic.subdomain})`);

  // 2. Create Owner User
  const owner = await prisma.user.upsert({
    where: {
      clinicId_email: {
        clinicId: clinic.id,
        email: 'owner@apollo.com',
      },
    },
    update: {},
    create: {
      clinicId: clinic.id,
      email: 'owner@apollo.com',
      passwordHash,
      role: 'OWNER',
      firstName: 'Aditya',
      lastName: 'Sharma',
      permissions: ['ALL'],
    },
  });
  console.log(`Owner created: ${owner.firstName} ${owner.lastName} (owner@apollo.com)`);

  // 3. Create Doctor User & Profile
  const doctorUser = await prisma.user.upsert({
    where: {
      clinicId_email: {
        clinicId: clinic.id,
        email: 'doctor@apollo.com',
      },
    },
    update: {},
    create: {
      clinicId: clinic.id,
      email: 'doctor@apollo.com',
      passwordHash,
      role: 'DOCTOR',
      firstName: 'Ramesh',
      lastName: 'Patel',
      permissions: ['CLINICAL'],
    },
  });

  const doctorProfile = await prisma.doctorProfile.upsert({
    where: { userId: doctorUser.id },
    update: {},
    create: {
      clinicId: clinic.id,
      userId: doctorUser.id,
      licenseNo: 'MCI-12345',
      specialty: 'Cardiology & General Physician',
      fees: 500.0,
      durationMin: 15,
      schedule: {
        weekly: {
          monday: ['09:00-13:00', '14:00-17:00'],
          tuesday: ['09:00-13:00', '14:00-17:00'],
          wednesday: ['09:00-13:00', '14:00-17:00'],
          thursday: ['09:00-13:00', '14:00-17:00'],
          friday: ['09:00-13:00', '14:00-17:00'],
        },
      },
    },
  });
  console.log(`Doctor created: Dr. ${doctorUser.firstName} ${doctorUser.lastName} (doctor@apollo.com)`);

  // 4. Create Staff User & Profile
  const staffUser = await prisma.user.upsert({
    where: {
      clinicId_email: {
        clinicId: clinic.id,
        email: 'staff@apollo.com',
      },
    },
    update: {},
    create: {
      clinicId: clinic.id,
      email: 'staff@apollo.com',
      passwordHash,
      role: 'STAFF',
      firstName: 'Sunita',
      lastName: 'Rao',
      permissions: ['REGISTRATION', 'BILLING'],
    },
  });

  const staffProfile = await prisma.staffProfile.upsert({
    where: { userId: staffUser.id },
    update: {},
    create: {
      clinicId: clinic.id,
      userId: staffUser.id,
      roleTitle: 'Senior Receptionist',
    },
  });
  console.log(`Staff created: ${staffUser.firstName} ${staffUser.lastName} (staff@apollo.com)`);

  // 5. Create Patient User & PatientProfile
  const patientUser = await prisma.user.upsert({
    where: {
      clinicId_phone: {
        clinicId: clinic.id,
        phone: '9876543210',
      },
    },
    update: {},
    create: {
      clinicId: clinic.id,
      phone: '9876543210',
      passwordHash,
      role: 'PATIENT',
      firstName: 'Vijay',
      lastName: 'Kumar',
      permissions: ['PORTAL'],
    },
  });

  const patientProfile = await prisma.patientProfile.upsert({
    where: { userId: patientUser.id },
    update: {},
    create: {
      clinicId: clinic.id,
      userId: patientUser.id,
      phone: '9876543210',
      firstName: 'Vijay',
      lastName: 'Kumar',
      dob: new Date('1985-08-20T00:00:00.000Z'),
      gender: 'MALE',
      address: '123, MG Road, Bangalore, Karnataka',
      allergies: ['Penicillin'],
      chronicConditions: ['Hypertension'],
    },
  });
  console.log(`Patient created: ${patientUser.firstName} ${patientUser.lastName} (9876543210)`);

  // 6. Seed Medicines Catalog
  const medicines = [
    { name: 'Paracetamol', genericName: 'Acetaminophen', dosageForm: 'TABLET', strength: '500mg', defaultSchedule: '1-0-1' },
    { name: 'Metformin', genericName: 'Metformin HCl', dosageForm: 'TABLET', strength: '500mg', defaultSchedule: '0-1-0' },
    { name: 'Pantoprazole', genericName: 'Pantoprazole Sodium', dosageForm: 'TABLET', strength: '40mg', defaultSchedule: '1-0-0' },
    { name: 'Amoxicillin', genericName: 'Amoxicillin Trihydrate', dosageForm: 'CAPSULE', strength: '250mg', defaultSchedule: '1-1-1' },
    { name: 'Ibuprofen', genericName: 'Ibuprofen', dosageForm: 'TABLET', strength: '400mg', defaultSchedule: '1-0-1' },
  ];

  for (const med of medicines) {
    const existingMed = await prisma.medicine.findFirst({
      where: {
        clinicId: clinic.id,
        name: med.name,
      },
    });

    if (!existingMed) {
      await prisma.medicine.create({
        data: {
          clinicId: clinic.id,
          name: med.name,
          genericName: med.genericName,
          dosageForm: med.dosageForm,
          strength: med.strength,
          defaultSchedule: med.defaultSchedule,
        },
      });
    }
  }
  console.log('Seed medicines catalog populated successfully.');
  console.log('Seeding complete! You are ready to log in.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
