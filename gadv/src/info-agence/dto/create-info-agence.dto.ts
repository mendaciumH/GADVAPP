import { IsString, IsEmail, IsOptional, MaxLength, IsUrl, IsNotEmpty, ValidateIf } from 'class-validator';

export class CreateInfoAgenceDto {
  @IsString()
  @IsNotEmpty({ message: 'Le nom de l\'agence est requis' })
  @MaxLength(255)
  nom_agence: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  tel?: string;

  @ValidateIf((o) => o.email !== '' && o.email !== null && o.email !== undefined)
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  adresse?: string;

  @ValidateIf((o) => o.site_web !== '' && o.site_web !== null && o.site_web !== undefined)
  @IsUrl()
  site_web?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  code_iata?: string;

  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  @IsString()
  prefix_factures?: string;

  @IsOptional()
  @IsString()
  pied_facture?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  fax?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  n_licence?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  n_rc?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  ar?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  nis?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  nif?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  rib?: string;
}

