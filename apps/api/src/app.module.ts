import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { DashboardModule } from "./dashboard/dashboard.module";
import { CompaniesModule } from "./companies/companies.module";
import { WorkersModule } from "./workers/workers.module";
import { DocumentsModule } from "./documents/documents.module";
import { ContractsModule } from "./contracts/contracts.module";
import { RolesModule } from "./roles/roles.module";
import { HealthController } from "./health/health.controller";

@Module({
  imports: [
    // Aceita tanto um .env local em apps/api quanto o .env compartilhado na
    // raiz do monorepo — necessário porque Turborepo executa o script "dev"
    // de cada workspace com cwd = apps/api, então o ConfigModule sozinho
    // (que só olha o cwd por padrão) nunca acharia o .env da raiz.
    ConfigModule.forRoot({ isGlobal: true, envFilePath: [".env", "../../.env"] }),
    PrismaModule,
    AuthModule,
    DashboardModule,
    CompaniesModule,
    WorkersModule,
    DocumentsModule,
    ContractsModule,
    RolesModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
