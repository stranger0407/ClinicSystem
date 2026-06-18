import { IsString, IsNotEmpty } from 'class-validator';

export class MergePatientsDto {
  @IsString()
  @IsNotEmpty()
  sourcePatientId: string; // The duplicate record (will be soft-deleted and merged)

  @IsString()
  @IsNotEmpty()
  targetPatientId: string; // The survivor record
}
