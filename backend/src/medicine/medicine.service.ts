import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MedicineService {
  constructor(private prisma: PrismaService) {}

  async listMedicines(clinicId: string) {
    return this.prisma.medicine.findMany({
      where: { clinicId },
      orderBy: { name: 'asc' },
    });
  }

  async createMedicine(
    clinicId: string,
    data: { name: string; genericName?: string; dosageForm: string; strength: string; defaultSchedule?: string },
  ) {
    return this.prisma.medicine.create({
      data: {
        clinicId,
        name: data.name.trim(),
        genericName: data.genericName?.trim(),
        dosageForm: data.dosageForm,
        strength: data.strength,
        defaultSchedule: data.defaultSchedule,
      },
    });
  }

  async updateMedicine(
    clinicId: string,
    id: string,
    data: { name?: string; genericName?: string; dosageForm?: string; strength?: string; defaultSchedule?: string },
  ) {
    const med = await this.prisma.medicine.findFirst({
      where: { id, clinicId },
    });
    if (!med) {
      throw new NotFoundException('Medicine not found');
    }

    return this.prisma.medicine.update({
      where: { id },
      data,
    });
  }

  async deleteMedicine(clinicId: string, id: string) {
    const med = await this.prisma.medicine.findFirst({
      where: { id, clinicId },
    });
    if (!med) {
      throw new NotFoundException('Medicine not found');
    }

    return this.prisma.medicine.delete({
      where: { id },
    });
  }
}
