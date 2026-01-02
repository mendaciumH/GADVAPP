import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateCompagnieAerienneDto {
  @IsString()
  @MaxLength(255)
  nom: string;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  code_iata?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4)
  code_icao?: string;
}

