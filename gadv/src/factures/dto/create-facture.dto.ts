import { IsNumber, IsString, IsEnum, IsOptional, IsDateString, Min } from 'class-validator';
import { FactureStatut } from '../../entities/facture.entity';

export class CreateFactureDto {
  @IsNumber()
  commande_id: number;

  @IsOptional()
  @IsString()
  numero_facture?: string;

  @IsOptional()
  @IsDateString()
  date_facture?: string;

  @IsOptional()
  @IsDateString()
  date_echeance?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  montant_ht?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  montant_tva?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  montant_ttc?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  reductions?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  autre_reductions?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  taxes?: number;

  @IsOptional()
  @IsEnum(['en_attente', 'payee', 'annulee', 'impayee'])
  statut?: FactureStatut;

  @IsOptional()
  @IsString()
  notes?: string;
}

