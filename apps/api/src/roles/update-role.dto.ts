import { ArrayMinSize, IsArray, IsOptional, IsString, MinLength } from "class-validator";

export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  permissionKeys?: string[];
}
