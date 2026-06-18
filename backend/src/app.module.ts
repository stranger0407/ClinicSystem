import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { PatientModule } from './patient/patient.module';
import { AppointmentModule } from './appointment/appointment.module';
import { DoctorModule } from './doctor/doctor.module';
import { EncounterModule } from './encounter/encounter.module';
import { BillingModule } from './billing/billing.module';
import { MedicineModule } from './medicine/medicine.module';
import { AdminModule } from './admin/admin.module';
import { TenantMiddleware } from './common/middleware/tenant.middleware';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    PatientModule,
    AppointmentModule,
    DoctorModule,
    EncounterModule,
    BillingModule,
    MedicineModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
