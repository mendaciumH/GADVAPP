import { IsString, IsOptional, MaxLength, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFournisseurDto {
  @IsString({ message: 'Le nom complet doit être une chaîne de caractères' })
  @MaxLength(255, { message: 'Le nom complet ne peut pas dépasser 255 caractères' })
  nom_complet: string;

  @IsOptional()
  @IsString({ message: 'Le numéro mobile doit être une chaîne de caractères' })
  @MaxLength(20, { message: 'Le numéro mobile ne peut pas dépasser 20 caractères' })
  numero_mobile?: string;

  @IsOptional()
  @IsString({ message: 'Les notes doivent être une chaîne de caractères' })
  notes?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Le crédit de départ doit être un nombre valide' })
  @Min(0, { message: 'Le crédit de départ ne peut pas être négatif' })
  credit_depart?: number;
}

