import { IsEmail, IsString, MinLength } from "class-validator";

export class CreateCompanyDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @MinLength(14)
  cnpj!: string;

  @IsEmail()
  contactEmail!: string;
}
