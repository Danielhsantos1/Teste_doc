import { IsString, MinLength } from "class-validator";

export class ConfirmCompanyDto {
  @IsString()
  @MinLength(10)
  token!: string;
}
