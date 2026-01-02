import { IsNumber, IsString, IsBoolean, IsOptional, MaxLength, Min, Max } from 'class-validator';

export class CreateTaxeDto {
  @IsOptional()
  @IsNumber()
  id_type_article?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  reference?: string;

  @IsOptional()
  @IsBoolean()
  taxe_fixe?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  montant_taxe_fixe?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  taxe_pourcentage?: number;
}

