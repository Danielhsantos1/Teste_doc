import { IsString, MinLength } from "class-validator";

export class UpdateDocumentContentDto {
  @IsString()
  @MinLength(1)
  content!: string;
}
