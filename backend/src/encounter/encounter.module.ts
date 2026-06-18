import { Module } from '@nestjs/common';
import { EncounterService } from './encounter.service';
import { EncounterController } from './encounter.controller';

@Module({
  controllers: [EncounterController],
  providers: [EncounterService],
  exports: [EncounterService],
})
export class EncounterModule {}
