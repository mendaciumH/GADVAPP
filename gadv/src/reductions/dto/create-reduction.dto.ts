import { IsNumber, IsString, IsBoolean, IsOptional, MaxLength, Min, Max } from 'class-validator';

export class CreateReductionDto {
  @IsOptional()
  @IsNumber()
  type_article_id?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  reference?: string;

  @IsOptional()
  @IsBoolean()
  reduction_fixe?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  montant_reduction_fixe?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  reduction_pourcentage?: number;
}

