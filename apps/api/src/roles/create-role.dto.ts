import { ArrayMinSize, IsArray, IsString, MinLength } from "class-validator";

export class CreateRoleDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  permissionKeys!: string[];
}
