import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEncounterDto } from './dto/create-encounter.dto';

@Injectable()
export class EncounterService {
  constructor(private prisma: PrismaService) {}

  async createEncounter(
    clinicId: string,
    doctorUserId: string,
    dto: CreateEncounterDto,
  ) {
    // 1. Resolve Doctor Profile
    const doctor = await this.prisma.doctorProfile.findFirst({
      where: { userId: doctorUserId, clinicId },
    });
    if (!doctor) {
      throw new NotFoundException('Doctor profile not found');
    }

    // 2. Perform execution in database transaction
    return this.prisma.$transaction(async (tx) => {
      // Check if appointment exists and matches
      const appointment = await tx.appointment.findFirst({
        where: {
          id: dto.appointmentId,
          clinicId,
          patientId: dto.patientId,
          deletedAt: null,
        },
      });
      if (!appointment) {
        throw new NotFoundException('Appointment record not found');
      }

      const parsedFollowUpDate = dto.followUpDate
        ? new Date(dto.followUpDate)
        : null;

      // Create clinical Encounter
      const encounter = await tx.encounter.create({
        data: {
          clinicId,
          patientId: dto.patientId,
          doctorId: doctor.id,
          appointmentId: dto.appointmentId,
          complaint: dto.complaint.trim(),
          diagnosis: dto.diagnosis.trim(),
          clinicalNotes: dto.clinicalNotes,
          testsRequired: dto.testsRequired || [],
          followUpDate: parsedFollowUpDate,
          vitals: dto.vitals || {},
        },
      });

      // Handle Prescription if items are added
      if (dto.prescriptionItems && dto.prescriptionItems.length > 0) {
        const prescription = await tx.prescription.create({
          data: {
            clinicId,
            encounterId: encounter.id,
            notes: dto.clinicalNotes,
          },
        });

        // Add prescription items
        await tx.prescriptionItem.createMany({
          data: dto.prescriptionItems.map((item) => ({
            prescriptionId: prescription.id,
            medicineId: item.medicineId,
            dosage: item.dosage,
            instructions: item.instructions,
            durationDays: item.durationDays,
          })),
        });
      }

      // Update Appointment status to COMPLETED
      await tx.appointment.update({
        where: { id: dto.appointmentId },
        data: { status: 'COMPLETED' },
      });

      // Log to AuditLog
      await tx.auditLog.create({
        data: {
          clinicId,
          userId: doctorUserId,
          action: 'CREATE',
          entityName: 'Encounter',
          entityId: encounter.id,
          details: { newValues: encounter },
        },
      });

      return encounter;
    });
  }

  async searchMedicines(clinicId: string, query: string) {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const cleanQuery = query.trim();

    return this.prisma.medicine.findMany({
      where: {
        clinicId,
        OR: [
          { name: { contains: cleanQuery, mode: 'insensitive' } },
          { genericName: { contains: cleanQuery, mode: 'insensitive' } },
        ],
      },
      take: 15,
      orderBy: { name: 'asc' },
    });
  }
}
