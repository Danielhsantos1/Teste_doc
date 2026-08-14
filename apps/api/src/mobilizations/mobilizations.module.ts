import { Module } from "@nestjs/common";
import { CompaniesModule } from "../companies/companies.module";
import { ContractsModule } from "../contracts/contracts.module";
import { MobilizationsController } from "./mobilizations.controller";
import { MobilizationsService } from "./mobilizations.service";

@Module({
  imports: [CompaniesModule, ContractsModule],
  controllers: [MobilizationsController],
  providers: [MobilizationsService],
})
export class MobilizationsModule {}
