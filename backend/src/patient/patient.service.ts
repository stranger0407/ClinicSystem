import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { MergePatientsDto } from './dto/merge-patients.dto';

@Injectable()
export class PatientService {
  constructor(private prisma: PrismaService) {}

  async createPatient(clinicId: string, dto: CreatePatientDto, operatorId?: string) {
    const parsedDob = new Date(dto.dob);

    // 1. Duplicate Patient Detection: check phone number
    const duplicatePhone = await this.prisma.patientProfile.findFirst({
      where: {
        clinicId,
        phone: dto.phone.trim(),
        deletedAt: null,
      },
    });

    if (duplicatePhone) {
      throw new ConflictException({
        message: `A patient with the mobile number ${dto.phone.trim()} already exists: ${duplicatePhone.firstName} ${duplicatePhone.lastName}.`,
        isDuplicate: true,
        existingPatient: {
          id: duplicatePhone.id,
          firstName: duplicatePhone.firstName,
          lastName: duplicatePhone.lastName,
          phone: duplicatePhone.phone,
          dob: duplicatePhone.dob,
        },
      });
    }

    // 2. Duplicate Patient Detection: check first name + last name
    const duplicateName = await this.prisma.patientProfile.findFirst({
      where: {
        clinicId,
        firstName: { equals: dto.firstName.trim(), mode: 'insensitive' },
        lastName: { equals: dto.lastName.trim(), mode: 'insensitive' },
        deletedAt: null,
      },
    });

    if (duplicateName) {
      throw new ConflictException({
        message: `A patient with the name ${dto.firstName.trim()} ${dto.lastName.trim()} already exists (Phone: ${duplicateName.phone}).`,
        isDuplicate: true,
        existingPatient: {
          id: duplicateName.id,
          firstName: duplicateName.firstName,
          lastName: duplicateName.lastName,
          phone: duplicateName.phone,
          dob: duplicateName.dob,
        },
      });
    }

    // 2. Create the patient profile
    const patient = await this.prisma.patientProfile.create({
      data: {
        clinicId,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        phone: dto.phone.trim(),
        dob: parsedDob,
        gender: dto.gender,
        address: dto.address,
        allergies: dto.allergies || [],
        chronicConditions: dto.chronicConditions || [],
        emergencyContact: dto.emergencyContact || {},
      },
    });

    // 3. Log to AuditLog
    await this.prisma.auditLog.create({
      data: {
        clinicId,
        userId: operatorId,
        action: 'CREATE',
        entityName: 'PatientProfile',
        entityId: patient.id,
        details: { newValues: patient },
      },
    });

    return patient;
  }

  async searchPatients(clinicId: string, query: string) {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const cleanQuery = query.trim();

    return this.prisma.patientProfile.findMany({
      where: {
        clinicId,
        deletedAt: null,
        OR: [
          { firstName: { contains: cleanQuery, mode: 'insensitive' } },
          { lastName: { contains: cleanQuery, mode: 'insensitive' } },
          { phone: { contains: cleanQuery } },
        ],
      },
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' },
      ],
      take: 50,
    });
  }

  async getPatientTimeline(clinicId: string, patientId: string) {
    const patient = await this.prisma.patientProfile.findFirst({
      where: { id: patientId, clinicId, deletedAt: null },
      include: {
        appointments: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            type: true,
            status: true,
            startTime: true,
            queueNumber: true,
            isFollowUp: true,
            doctor: {
              select: {
                user: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
        encounters: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          include: {
            doctor: {
              select: {
                user: { select: { firstName: true, lastName: true } },
              },
            },
            prescriptions: {
              where: { deletedAt: null },
              include: {
                items: {
                  include: {
                    medicine: true,
                  },
                },
              },
            },
          },
        },
        invoices: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          include: {
            payments: true,
          },
        },
        documents: true,
      },
    });

    if (!patient) {
      throw new NotFoundException('Patient record not found');
    }

    return patient;
  }

  async mergePatients(clinicId: string, operatorId: string, dto: MergePatientsDto) {
    const { sourcePatientId, targetPatientId } = dto;

    if (sourcePatientId === targetPatientId) {
      throw new BadRequestException('Source and target patient profiles cannot be the same');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Verify existence and clinic boundary
      const source = await tx.patientProfile.findFirst({
        where: { id: sourcePatientId, clinicId, deletedAt: null },
      });
      const target = await tx.patientProfile.findFirst({
        where: { id: targetPatientId, clinicId, deletedAt: null },
      });

      if (!source || !target) {
        throw new NotFoundException('One or both patient records do not exist or have been deleted');
      }

      // 2. Re-link related tables
      await tx.appointment.updateMany({
        where: { patientId: sourcePatientId, clinicId },
        data: { patientId: targetPatientId },
      });

      await tx.encounter.updateMany({
        where: { patientId: sourcePatientId, clinicId },
        data: { patientId: targetPatientId },
      });

      await tx.invoice.updateMany({
        where: { patientId: sourcePatientId, clinicId },
        data: { patientId: targetPatientId },
      });

      await tx.medicalDocument.updateMany({
        where: { patientId: sourcePatientId },
        data: { patientId: targetPatientId },
      });

      // 3. Mark source as merged and soft delete it
      const updatedSource = await tx.patientProfile.update({
        where: { id: sourcePatientId },
        data: {
          mergedIntoId: targetPatientId,
          deletedAt: new Date(),
        },
      });

      // 4. Log the merge event to AuditLog
      await tx.auditLog.create({
        data: {
          clinicId,
          userId: operatorId,
          action: 'MERGE',
          entityName: 'PatientProfile',
          entityId: targetPatientId,
          details: {
            mergedSourceId: sourcePatientId,
            mergedTargetId: targetPatientId,
            sourceDetails: {
              firstName: source.firstName,
              lastName: source.lastName,
              phone: source.phone,
            },
          },
        },
      });

      return target;
    });
  }

  async updatePatient(clinicId: string, patientId: string, dto: Partial<CreatePatientDto>, operatorId: string) {
    const patient = await this.prisma.patientProfile.findFirst({
      where: { id: patientId, clinicId, deletedAt: null },
    });

    if (!patient) {
      throw new NotFoundException('Patient record not found');
    }

    const updatedData: any = { ...dto };
    if (dto.dob) {
      updatedData.dob = new Date(dto.dob);
    }

    const updatedPatient = await this.prisma.patientProfile.update({
      where: { id: patientId },
      data: updatedData,
    });

    await this.prisma.auditLog.create({
      data: {
        clinicId,
        userId: operatorId,
        action: 'UPDATE',
        entityName: 'PatientProfile',
        entityId: patientId,
        details: {
          oldValues: patient,
          newValues: updatedPatient,
        },
      },
    });

    return updatedPatient;
  }

  async findProfileByUserId(userId: string) {
    return this.prisma.patientProfile.findUnique({
      where: { userId },
    });
  }
}
