import { IsString, IsNotEmpty, IsOptional, IsArray, IsObject, IsDateString, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class PrescriptionItemDto {
  @IsString()
  @IsNotEmpty()
  medicineId: string;

  @IsString()
  @IsNotEmpty()
  dosage: string; // e.g. "1-0-1" or "5ml"

  @IsString()
  @IsNotEmpty()
  instructions: string; // e.g. "After food"

  @IsNumber()
  @IsNotEmpty()
  durationDays: number;
}

export class CreateEncounterDto {
  @IsString()
  @IsNotEmpty()
  appointmentId: string;

  @IsString()
  @IsNotEmpty()
  patientId: string;

  @IsString()
  @IsNotEmpty()
  complaint: string;

  @IsString()
  @IsNotEmpty()
  diagnosis: string;

  @IsString()
  @IsOptional()
  clinicalNotes?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  testsRequired?: string[];

  @IsDateString()
  @IsOptional()
  followUpDate?: string;

  @IsObject()
  @IsOptional()
  vitals?: {
    bp?: string;
    pulse?: string;
    temp?: string;
    weight?: string;
    height?: string;
    sugar?: string;
  };

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => PrescriptionItemDto)
  prescriptionItems?: PrescriptionItemDto[];
}
