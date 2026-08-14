import { IsString, MinLength } from "class-validator";

export class ConfirmMobilizationDto {
  @IsString()
  @MinLength(10)
  token!: string;
}
