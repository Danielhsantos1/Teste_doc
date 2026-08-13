import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { DashboardModule } from "./dashboard/dashboard.module";
import { CompaniesModule } from "./companies/companies.module";
import { WorkersModule } from "./workers/workers.module";
import { DocumentsModule } from "./documents/documents.module";
import { ContractsModule } from "./contracts/contracts.module";
import { HealthController } from "./health/health.controller";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    DashboardModule,
    CompaniesModule,
    WorkersModule,
    DocumentsModule,
    ContractsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
