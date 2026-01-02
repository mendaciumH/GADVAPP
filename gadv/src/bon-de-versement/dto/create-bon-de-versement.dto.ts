import { IsNumber, IsString, IsOptional, IsDateString, Min } from 'class-validator';

export class CreateBonDeVersementDto {
  @IsNumber()
  client_id: number;

  @IsNumber()
  commande_id: number;

  @IsOptional()
  @IsString()
  numero?: string;

  @IsOptional()
  @IsDateString()
  date_versement?: string;

  @IsNumber()
  @Min(0)
  montant_verse: number;
}

