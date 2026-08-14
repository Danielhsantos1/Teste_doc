import { IsEmail, IsIn, IsNumber, IsOptional, IsString, Min, MinLength } from "class-validator";

const MODALIDADES = ["CENTRALIZADA", "DESCENTRALIZADA", "EMERGENCIAL"] as const;

// Dados da contratada (etapa "Novo contrato" / "Coleta informações de
// cadastro do prestador" do diagrama) + dados do contrato, coletados juntos
// num único envio — o backend decide se a contratada é nova ou já existe
// (equivalente ao gateway "Contratada cadastrada?").
export class CreateMobilizationDto {
  @IsString()
  @MinLength(2)
  companyName!: string;

  @IsString()
  @MinLength(14)
  companyCnpj!: string;

  @IsEmail()
  companyContactEmail!: string;

  @IsString()
  @MinLength(2)
  contractCode!: string;

  @IsString()
  contractStartDate!: string;

  @IsString()
  contractEndDate!: string;

  @IsIn(MODALIDADES)
  contractModalidade!: (typeof MODALIDADES)[number];

  @IsString()
  @MinLength(3)
  contractObjeto!: string;

  @IsString()
  @MinLength(3)
  contractEscopo!: string;

  @IsString()
  @MinLength(3)
  contractTechnicalProposal!: string;

  @IsNumber()
  @Min(0)
  contractCommercialValue!: number;

  @IsString()
  @MinLength(3)
  contractPaymentTerms!: string;

  @IsOptional()
  @IsString()
  contractAdditionalNotes?: string;
}
