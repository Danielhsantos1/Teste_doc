import { IsIn, IsNumber, IsOptional, IsString, IsUUID, Min, MinLength } from "class-validator";

const MODALIDADES = ["CENTRALIZADA", "DESCENTRALIZADA", "EMERGENCIAL"] as const;

export class CreateContractDto {
  @IsUUID()
  companyId!: string;

  @IsString()
  @MinLength(2)
  code!: string;

  @IsString()
  startDate!: string;

  @IsString()
  endDate!: string;

  @IsIn(MODALIDADES)
  modalidade!: (typeof MODALIDADES)[number];

  @IsString()
  @MinLength(3)
  objeto!: string;

  @IsString()
  @MinLength(3)
  escopo!: string;

  @IsString()
  @MinLength(3)
  technicalProposal!: string;

  @IsNumber()
  @Min(0)
  commercialValue!: number;

  @IsString()
  @MinLength(3)
  paymentTerms!: string;

  @IsOptional()
  @IsString()
  additionalNotes?: string;
}
