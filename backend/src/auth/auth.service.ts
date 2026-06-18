import { Injectable, ConflictException, NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterClinicDto } from './dto/register-clinic.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginDto } from './dto/login.dto';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async registerClinic(dto: RegisterClinicDto) {
    // 1. Verify subdomain unique
    const existingClinic = await this.prisma.clinic.findUnique({
      where: { subdomain: dto.subdomain },
    });
    if (existingClinic) {
      throw new ConflictException('Subdomain is already taken');
    }

    // 2. Perform transaction to create clinic + owner user
    return this.prisma.$transaction(async (tx) => {
      const clinic = await tx.clinic.create({
        data: {
          name: dto.clinicName,
          subdomain: dto.subdomain,
          phone: dto.phone,
          settings: {
            taxPercent: 0,
            currency: 'INR',
            timezone: 'Asia/Kolkata',
          },
        },
      });

      // Check unique constraints for email/phone on OWNER user
      if (dto.email) {
        const existingEmail = await tx.user.findUnique({
          where: { clinicId_email: { clinicId: clinic.id, email: dto.email } },
        });
        if (existingEmail) {
          throw new ConflictException('An owner with this email already exists in this clinic');
        }
      }
      if (dto.phone) {
        const existingPhone = await tx.user.findUnique({
          where: { clinicId_phone: { clinicId: clinic.id, phone: dto.phone } },
        });
        if (existingPhone) {
          throw new ConflictException('An owner with this phone already exists in this clinic');
        }
      }

      const passwordHash = await bcrypt.hash(dto.password, 10);
      const user = await tx.user.create({
        data: {
          clinicId: clinic.id,
          email: dto.email,
          phone: dto.phone,
          passwordHash,
          role: UserRole.OWNER,
          firstName: dto.firstName,
          lastName: dto.lastName,
          permissions: ['*'], // Owner gets all permissions
        },
      });

      // Also create an owner/staff profile
      await tx.staffProfile.create({
        data: {
          clinicId: clinic.id,
          userId: user.id,
          roleTitle: 'Clinic Owner',
        },
      });

      return {
        clinic,
        owner: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      };
    });
  }

  async registerUser(clinicId: string, dto: RegisterUserDto) {
    if (!clinicId) {
      throw new BadRequestException('Clinic tenant context is required to register users');
    }

    // Verify email or phone is unique in this clinic
    if (dto.email) {
      const existingEmail = await this.prisma.user.findUnique({
        where: { clinicId_email: { clinicId, email: dto.email } },
      });
      if (existingEmail) {
        throw new ConflictException('A user with this email already exists in this clinic');
      }
    }
    if (dto.phone) {
      const existingPhone = await this.prisma.user.findUnique({
        where: { clinicId_phone: { clinicId, phone: dto.phone } },
      });
      if (existingPhone) {
        throw new ConflictException('A user with this phone already exists in this clinic');
      }
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          clinicId,
          email: dto.email,
          phone: dto.phone,
          passwordHash,
          role: dto.role,
          firstName: dto.firstName,
          lastName: dto.lastName,
          permissions: dto.permissions || [],
        },
      });

      // Handle role-specific profiles
      if (dto.role === UserRole.PATIENT) {
        await tx.patientProfile.create({
          data: {
            clinicId,
            userId: user.id,
            phone: dto.phone || '',
            firstName: dto.firstName,
            lastName: dto.lastName,
            dob: new Date('2000-01-01'), // Default date of birth to be updated later
            gender: 'UNKNOWN',
            emergencyContact: {},
          },
        });
      } else if (dto.role === UserRole.DOCTOR) {
        await tx.doctorProfile.create({
          data: {
            clinicId,
            userId: user.id,
            licenseNo: 'PENDING',
            specialty: 'General Physician',
            fees: 200.0, // Default fee in INR
            durationMin: 15,
            schedule: {},
          },
        });
      } else if (dto.role === UserRole.STAFF) {
        await tx.staffProfile.create({
          data: {
            clinicId,
            userId: user.id,
            roleTitle: 'Receptionist',
          },
        });
      }

      return {
        id: user.id,
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      };
    });
  }

  async login(clinicId: string, dto: LoginDto) {
    if (!clinicId) {
      throw new BadRequestException('Clinic tenant context is required to login');
    }

    let user = null;

    if (dto.email) {
      user = await this.prisma.user.findUnique({
        where: { clinicId_email: { clinicId, email: dto.email } },
      });
    } else if (dto.phone) {
      user = await this.prisma.user.findUnique({
        where: { clinicId_phone: { clinicId, phone: dto.phone } },
      });
    }

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials or inactive account');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Get specific profile details
    let profileId = null;
    if (user.role === UserRole.PATIENT) {
      const patient = await this.prisma.patientProfile.findUnique({ where: { userId: user.id } });
      profileId = patient?.id;
    } else if (user.role === UserRole.DOCTOR) {
      const doctor = await this.prisma.doctorProfile.findUnique({ where: { userId: user.id } });
      profileId = doctor?.id;
    } else if (user.role === UserRole.STAFF) {
      const staff = await this.prisma.staffProfile.findUnique({ where: { userId: user.id } });
      profileId = staff?.id;
    }

    const payload = {
      sub: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
      clinicId: user.clinicId,
      profileId,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        profileId,
      },
    };
  }

  async getClinicDetails(clinicId: string) {
    const clinic = await this.prisma.clinic.findUnique({
      where: { id: clinicId },
    });
    if (!clinic) {
      throw new NotFoundException('Clinic not found');
    }
    return clinic;
  }

  async resolveClinic(subdomain: string) {
    if (!subdomain) {
      throw new BadRequestException('Subdomain parameter is required');
    }
    const clinic = await this.prisma.clinic.findUnique({
      where: { subdomain: subdomain.toLowerCase() },
      select: { id: true, name: true, subdomain: true },
    });
    if (!clinic) {
      throw new NotFoundException('Clinic subdomain not found');
    }
    return clinic;
  }
}
