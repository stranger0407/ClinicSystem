import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DoctorService {
  constructor(private prisma: PrismaService) {}

  async listDoctors(clinicId: string) {
    return this.prisma.doctorProfile.findMany({
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

  async updateProfile(
    clinicId: string,
    doctorUserId: string,
    data: {
      licenseNo?: string;
      specialty?: string;
      fees?: number;
      durationMin?: number;
      schedule?: any;
    },
  ) {
    const doctor = await this.prisma.doctorProfile.findFirst({
      where: { userId: doctorUserId, clinicId },
    });
    if (!doctor) {
      throw new NotFoundException('Doctor profile not found');
    }

    return this.prisma.doctorProfile.update({
      where: { id: doctor.id },
      data: {
        licenseNo: data.licenseNo,
        specialty: data.specialty,
        fees: data.fees,
        durationMin: data.durationMin,
        schedule: data.schedule,
      },
    });
  }
}
