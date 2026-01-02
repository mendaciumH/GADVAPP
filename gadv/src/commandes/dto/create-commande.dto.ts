import { IsNumber, IsString, IsBoolean, IsOptional, IsDateString, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCommandeDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'L\'ID du client doit être un nombre valide' })
  client_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'L\'ID de l\'article doit être un nombre valide' })
  article_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'L\'ID de la session doit être un nombre valide' })
  session_id?: number;

  @IsOptional()
  @IsDateString({}, { message: 'La date doit être au format valide (YYYY-MM-DD)' })
  date?: string;

  @IsOptional()
  @IsBoolean({ message: 'Le champ bénéficiaire doit être un booléen' })
  beneficiaire?: boolean;

  @IsOptional()
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  @MaxLength(100, { message: 'Le nom ne peut pas dépasser 100 caractères' })
  nom?: string;

  @IsOptional()
  @IsString({ message: 'Le prénom doit être une chaîne de caractères' })
  @MaxLength(100, { message: 'Le prénom ne peut pas dépasser 100 caractères' })
  prenom?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La date de naissance doit être au format valide (YYYY-MM-DD)' })
  date_naissance?: string;

  @IsOptional()
  @IsString({ message: 'Le genre doit être une chaîne de caractères' })
  @MaxLength(20, { message: 'Le genre ne peut pas dépasser 20 caractères' })
  genre?: string;

  @IsOptional()
  @IsString({ message: 'Le numéro de passeport doit être une chaîne de caractères' })
  @MaxLength(50, { message: 'Le numéro de passeport ne peut pas dépasser 50 caractères' })
  numero_passport?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La date d\'expiration du passeport doit être au format valide (YYYY-MM-DD)' })
  date_expiration_passport?: string;

  @IsOptional()
  @IsString({ message: 'Le numéro mobile doit être une chaîne de caractères' })
  @MaxLength(20, { message: 'Le numéro mobile ne peut pas dépasser 20 caractères' })
  numero_mobile?: string;

  @IsOptional()
  @IsString({ message: 'Les remarques doivent être une chaîne de caractères' })
  remarques?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Le prix doit être un nombre valide' })
  @Min(0, { message: 'Le prix ne peut pas être négatif' })
  prix?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Les réductions doivent être un nombre valide' })
  @Min(0, { message: 'Les réductions ne peuvent pas être négatives' })
  reductions?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Les autres réductions doivent être un nombre valide' })
  @Min(0, { message: 'Les autres réductions ne peuvent pas être négatives' })
  autre_reductions?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Les taxes doivent être un nombre valide' })
  @Min(0, { message: 'Les taxes ne peuvent pas être négatives' })
  taxes?: number;

  @IsOptional()
  @IsBoolean({ message: 'Le champ facturer doit être un booléen' })
  facturer?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Le nombre de personnes doit être un nombre valide' })
  @Min(1, { message: 'Le nombre de personnes doit être au moins 1' })
  nombre_personnes?: number;


  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'L\'ID de la chambre doit être un nombre valide' })
  chambre_id?: number;

}

