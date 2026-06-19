import 'dotenv/config';
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private static pool: Pool;
  private static adapter: PrismaPg;

  constructor() {
    if (!PrismaService.pool) {
      PrismaService.pool = new Pool({
        connectionString: process.env.DATABASE_URL,
      });
      PrismaService.adapter = new PrismaPg(PrismaService.pool);
    }

    super({
      adapter: PrismaService.adapter,
    });

    const softDeleteModels = [
      'User',
      'PatientProfile',
      'Appointment',
      'Encounter',
      'Prescription',
      'Invoice',
    ];

    let extendedClient: any;

    extendedClient = (this as any).$extends({
      query: {
        $allModels: {
          async findMany({ model, args, query }: any) {
            if (softDeleteModels.includes(model)) {
              args.where = args.where || {};
              if (args.where.deletedAt === undefined) {
                args.where.deletedAt = null;
              }
            }
            return query(args);
          },
          async findFirst({ model, args, query }: any) {
            if (softDeleteModels.includes(model)) {
              args.where = args.where || {};
              if (args.where.deletedAt === undefined) {
                args.where.deletedAt = null;
              }
            }
            return query(args);
          },
          async findUnique({ model, args, query }: any) {
            if (softDeleteModels.includes(model)) {
              args.where = args.where || {};
              if (args.where.deletedAt === undefined) {
                args.where.deletedAt = null;

                // Flatten compound unique keys (e.g. clinicId_email, clinicId_phone) for findFirst compatibility
                const flatWhere = { ...args.where };
                for (const key of Object.keys(flatWhere)) {
                  if (
                    typeof flatWhere[key] === 'object' &&
                    flatWhere[key] !== null &&
                    !Array.isArray(flatWhere[key])
                  ) {
                    Object.assign(flatWhere, flatWhere[key]);
                    delete flatWhere[key];
                  }
                }
                args.where = flatWhere;

                // Run findFirst instead to support the non-unique deletedAt column filter
                return extendedClient[model].findFirst(args);
              }
            }
            return query(args);
          },
          async count({ model, args, query }: any) {
            if (softDeleteModels.includes(model)) {
              args.where = args.where || {};
              if (args.where.deletedAt === undefined) {
                args.where.deletedAt = null;
              }
            }
            return query(args);
          },
          async delete({ model, args, query }: any) {
            if (softDeleteModels.includes(model)) {
              return extendedClient[model].update({
                where: args.where,
                data: { deletedAt: new Date() },
              });
            }
            return query(args);
          },
          async deleteMany({ model, args, query }: any) {
            if (softDeleteModels.includes(model)) {
              return extendedClient[model].updateMany({
                where: args.where,
                data: { deletedAt: new Date() },
              });
            }
            return query(args);
          },
        },
      },
    });

    return extendedClient;
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
    if (PrismaService.pool) {
      await PrismaService.pool.end();
    }
  }
}
