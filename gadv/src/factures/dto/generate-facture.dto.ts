import { IsOptional, IsString } from 'class-validator';

export class GenerateFactureDto {
  @IsOptional()
  @IsString()
  notes?: string;
}

