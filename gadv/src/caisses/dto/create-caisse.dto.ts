import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, MaxLength } from 'class-validator';

export class CreateCaisseDto {
  @IsString()
  @IsNotEmpty({ message: 'Le nom de la caisse est requis' })
  @MaxLength(255)
  nom_caisse: string;

  @IsOptional()
  @IsNumber()
  montant_depart?: number;

  @IsOptional()
  @IsNumber()
  solde_actuel?: number;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  devise?: string;

  @IsOptional()
  @IsBoolean()
  is_principale?: boolean;
}

