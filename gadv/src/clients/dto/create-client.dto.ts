import { IsString, IsEmail, IsOptional, MaxLength, IsBoolean, IsEnum, IsDateString, ValidateIf } from 'class-validator';

export enum ClientType {
  PARTICULIER = 'Particulier',
  ENTREPRISE = 'Entreprise',
}

export class CreateClientDto {
  @IsOptional()
  @IsEnum(ClientType, { message: 'Le type de client doit être "Particulier" ou "Entreprise"' })
  type_client?: ClientType;

  @ValidateIf(o => o.type_client === ClientType.PARTICULIER || !o.type_client)
  @IsString({ message: 'Le nom complet doit être une chaîne de caractères' })
  @MaxLength(255, { message: 'Le nom complet ne peut pas dépasser 255 caractères' })
  nom_complet?: string;

  @IsOptional()
  @IsString({ message: 'Le numéro de passeport doit être une chaîne de caractères' })
  @MaxLength(50, { message: 'Le numéro de passeport ne peut pas dépasser 50 caractères' })
  numero_passeport?: string;

  @IsOptional()
  @ValidateIf(o => o.expiration_passeport && o.expiration_passeport.trim() !== '')
  @IsDateString({}, { message: 'La date d\'expiration du passeport doit être au format valide (YYYY-MM-DD)' })
  expiration_passeport?: string;

  @IsOptional()
  @IsString({ message: 'Le numéro mobile doit être une chaîne de caractères' })
  @MaxLength(20, { message: 'Le numéro mobile ne peut pas dépasser 20 caractères' })
  numero_mobile?: string;

  @IsOptional()
  @IsString({ message: 'Le numéro mobile 2 doit être une chaîne de caractères' })
  @MaxLength(20, { message: 'Le numéro mobile 2 ne peut pas dépasser 20 caractères' })
  numero_mobile_2?: string;

  @IsOptional()
  @ValidateIf(o => o.email && o.email.trim() !== '')
  @IsEmail({}, { message: 'L\'adresse email n\'est pas valide' })
  email?: string;

  @IsOptional()
  @ValidateIf(o => o.date_naissance && o.date_naissance.trim() !== '')
  @IsDateString({}, { message: 'La date de naissance doit être au format valide (YYYY-MM-DD)' })
  date_naissance?: string;

  @IsOptional()
  @IsString({ message: 'Les notes doivent être une chaîne de caractères' })
  notes?: string;

  @IsOptional()
  image?: any; // Buffer/bytea field - validation handled by database

  @ValidateIf(o => o.type_client === ClientType.ENTREPRISE)
  @IsString({ message: 'Le nom d\'entreprise doit être une chaîne de caractères' })
  @MaxLength(255, { message: 'Le nom d\'entreprise ne peut pas dépasser 255 caractères' })
  nom_entreprise?: string;

  @IsOptional()
  @IsString({ message: 'Le RC doit être une chaîne de caractères' })
  @MaxLength(100, { message: 'Le RC ne peut pas dépasser 100 caractères' })
  rc?: string;

  @IsOptional()
  @IsString({ message: 'Le NIF doit être une chaîne de caractères' })
  @MaxLength(100, { message: 'Le NIF ne peut pas dépasser 100 caractères' })
  nif?: string;

  @IsOptional()
  @IsString({ message: 'L\'AI doit être une chaîne de caractères' })
  @MaxLength(100, { message: 'L\'AI ne peut pas dépasser 100 caractères' })
  ai?: string;

  @IsOptional()
  @IsString({ message: 'Le NIS doit être une chaîne de caractères' })
  @MaxLength(100, { message: 'Le NIS ne peut pas dépasser 100 caractères' })
  nis?: string;

  @IsOptional()
  @IsBoolean({ message: 'La préférence de facturation doit être un booléen' })
  prefere_facturation?: boolean;
}

