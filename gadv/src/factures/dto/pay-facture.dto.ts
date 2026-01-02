import { IsNumber, IsOptional, IsString, IsPositive, IsDateString, IsEnum } from 'class-validator';
import { FactureModeReglement } from '../../entities/facture.entity';

export class PayFactureDto {
  @IsNumber()
  @IsPositive({ message: 'Le montant doit être positif' })
  montant: number;

  @IsOptional()
  @IsDateString()
  date_versement?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(['espèce', 'chèque'])
  mode_reglement?: FactureModeReglement;
}

