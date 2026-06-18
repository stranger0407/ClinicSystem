import { IsString, IsNotEmpty, IsEnum, IsOptional, IsBoolean, IsDateString } from 'class-validator';

export class CreateAppointmentDto {
  @IsString()
  @IsNotEmpty()
  patientId: string;

  @IsString()
  @IsNotEmpty()
  doctorId: string;

  @IsString()
  @IsNotEmpty()
  type: 'SLOT' | 'WALK_IN';

  @IsDateString()
  @IsOptional()
  startTime?: string; // Mandatory for SLOT

  @IsBoolean()
  @IsOptional()
  isFollowUp?: boolean;

  @IsString()
  @IsOptional()
  notes?: string;
}
