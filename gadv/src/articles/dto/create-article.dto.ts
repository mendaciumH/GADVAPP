import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  IsDateString,
  MaxLength,
  Min,
  ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';

// DTO for room type with price (used by Omra, Voyage organisé, Réservation hôtel)
export class ChambreDto {
  @IsString({ message: 'Le type de chambre doit être une chaîne de caractères' })
  type_chambre: string;

  @IsNumber({}, { message: 'Le prix doit être un nombre valide' })
  @Min(0, { message: 'Le prix ne peut pas être négatif' })
  prix: number;
}

export class CreateArticleDto {
  @IsString({ message: 'Le libellé doit être une chaîne de caractères' })
  @MaxLength(255, { message: 'Le libellé ne peut pas dépasser 255 caractères' })
  label: string;

  @IsOptional()
  @IsString({ message: 'La description doit être une chaîne de caractères' })
  description?: string;

  @IsOptional()
  @IsString({ message: 'L\'image de bannière doit être une chaîne de caractères' })
  image_banner?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La date de départ doit être au format valide (YYYY-MM-DD)' })
  date_depart?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'L\'ID du type d\'article doit être un nombre valide' })
  id_type_article?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'L\'ID du fournisseur doit être un nombre valide' })
  fournisseur_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'La commission doit être un nombre valide' })
  @Min(0, { message: 'La commission ne peut pas être négative' })
  commission?: number;

  @IsOptional()
  @IsBoolean({ message: 'L\'offre limitée doit être un booléen' })
  offre_limitee?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Le prix d\'offre doit être un nombre valide' })
  @Min(0, { message: 'Le prix d\'offre ne peut pas être négatif' })
  prix_offre?: number;

  @IsOptional()
  @IsBoolean({ message: 'Le champ archivé doit être un booléen' })
  is_archiver?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'Le champ publié doit être un booléen' })
  is_published?: boolean;

  // Sessions for OMRA (date + nombre_place)
  @IsOptional()
  @IsArray({ message: 'Les sessions doivent être un tableau' })
  sessions?: Array<{ date: string; nombre_place: number }>;

  // Chambres field (used by Omra, Voyage organisé, Réservation hôtel)
  @IsOptional()
  @IsArray({ message: 'Les chambres doivent être un tableau' })
  @ValidateNested({ each: true })
  @Type(() => ChambreDto)
  chambres?: ChambreDto[];

  @IsOptional()
  @IsString({ message: 'Le nom de l\'hôtel doit être une chaîne de caractères' })
  @MaxLength(255, { message: 'Le nom de l\'hôtel ne peut pas dépasser 255 caractères' })
  nom_hotel?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'La distance de l\'hôtel doit être un nombre valide' })
  @Min(0, { message: 'La distance de l\'hôtel ne peut pas être négative' })
  distance_hotel?: number;

  @IsOptional()
  @IsString({ message: 'La ville d\'entrée doit être une chaîne de caractères' })
  @MaxLength(255, { message: 'La ville d\'entrée ne peut pas dépasser 255 caractères' })
  entree?: string;

  @IsOptional()
  @IsString({ message: 'La ville de sortie doit être une chaîne de caractères' })
  @MaxLength(255, { message: 'La ville de sortie ne peut pas dépasser 255 caractères' })
  sortie?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Le tarif additionnel doit être un nombre valide' })
  @Min(0, { message: 'Le tarif additionnel ne peut pas être négatif' })
  tarif_additionnel?: number;

  // Visa-specific fields
  @IsOptional()
  @IsString({ message: 'Le pays de destination doit être une chaîne de caractères' })
  @MaxLength(255, { message: 'Le pays de destination ne peut pas dépasser 255 caractères' })
  pays_destination?: string;

  @IsOptional()
  @IsString({ message: 'Le type de visa doit être une chaîne de caractères' })
  @MaxLength(100, { message: 'Le type de visa ne peut pas dépasser 100 caractères' })
  type_visa?: string;

  @IsOptional()
  @IsString({ message: 'La durée de validité doit être une chaîne de caractères' })
  @MaxLength(100, { message: 'La durée de validité ne peut pas dépasser 100 caractères' })
  duree_validite?: string;

  @IsOptional()
  @IsString({ message: 'Le délai de traitement doit être une chaîne de caractères' })
  @MaxLength(100, { message: 'Le délai de traitement ne peut pas dépasser 100 caractères' })
  delai_traitement?: string;

  @IsOptional()
  @IsArray({ message: 'Les documents requis doivent être un tableau' })
  @IsString({ each: true, message: 'Chaque document doit être une chaîne de caractères' })
  documents_requis?: string[];

  // Voyage organisé fields
  @IsOptional()
  @IsString({ message: 'La destination doit être une chaîne de caractères' })
  @MaxLength(255, { message: 'La destination ne peut pas dépasser 255 caractères' })
  destination?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La date de retour doit être au format valide (YYYY-MM-DD)' })
  date_retour?: string;

  @IsOptional()
  @IsString({ message: 'La durée du voyage doit être une chaîne de caractères' })
  @MaxLength(100, { message: 'La durée du voyage ne peut pas dépasser 100 caractères' })
  duree_voyage?: string;

  @IsOptional()
  @IsString({ message: 'Le type d\'hébergement doit être une chaîne de caractères' })
  @MaxLength(100, { message: 'Le type d\'hébergement ne peut pas dépasser 100 caractères' })
  type_hebergement?: string;

  @IsOptional()
  @IsString({ message: 'Le transport doit être une chaîne de caractères' })
  @MaxLength(100, { message: 'Le transport ne peut pas dépasser 100 caractères' })
  transport?: string;

  @IsOptional()
  @IsArray({ message: 'Le programme doit être un tableau' })
  @IsString({ each: true, message: 'Chaque élément du programme doit être une chaîne de caractères' })
  programme?: string[];

  // Assurance voyage fields
  @IsOptional()
  @IsString({ message: 'Le type d\'assurance doit être une chaîne de caractères' })
  @MaxLength(100, { message: 'Le type d\'assurance ne peut pas dépasser 100 caractères' })
  type_assurance?: string;

  @IsOptional()
  @IsString({ message: 'La durée de couverture doit être une chaîne de caractères' })
  @MaxLength(100, { message: 'La durée de couverture ne peut pas dépasser 100 caractères' })
  duree_couverture?: string;

  @IsOptional()
  @IsString({ message: 'La zone de couverture doit être une chaîne de caractères' })
  @MaxLength(100, { message: 'La zone de couverture ne peut pas dépasser 100 caractères' })
  zone_couverture?: string;

  @IsOptional()
  @IsString({ message: 'Le montant de couverture doit être une chaîne de caractères' })
  @MaxLength(100, { message: 'Le montant de couverture ne peut pas dépasser 100 caractères' })
  montant_couverture?: string;

  @IsOptional()
  @IsString({ message: 'La franchise doit être une chaîne de caractères' })
  @MaxLength(100, { message: 'La franchise ne peut pas dépasser 100 caractères' })
  franchise?: string;

  @IsOptional()
  @IsArray({ message: 'Les conditions particulières doivent être un tableau' })
  @IsString({ each: true, message: 'Chaque condition doit être une chaîne de caractères' })
  conditions_particulieres?: string[];

  // Billet d'avion fields
  @IsOptional()
  @IsString({ message: 'L\'aéroport de départ doit être une chaîne de caractères' })
  @MaxLength(255, { message: 'L\'aéroport de départ ne peut pas dépasser 255 caractères' })
  aeroport_depart?: string;

  @IsOptional()
  @IsString({ message: 'L\'aéroport d\'arrivée doit être une chaîne de caractères' })
  @MaxLength(255, { message: 'L\'aéroport d\'arrivée ne peut pas dépasser 255 caractères' })
  aeroport_arrivee?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La date de départ du vol doit être au format valide (YYYY-MM-DD)' })
  date_depart_vol?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La date de retour du vol doit être au format valide (YYYY-MM-DD)' })
  date_retour_vol?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'L\'ID de la compagnie aérienne doit être un nombre valide' })
  compagnie_aerienne_id?: number;

  @IsOptional()
  @IsString({ message: 'Le numéro de vol doit être une chaîne de caractères' })
  @MaxLength(50, { message: 'Le numéro de vol ne peut pas dépasser 50 caractères' })
  numero_vol?: string;

  @IsOptional()
  @IsString({ message: 'La classe de vol doit être une chaîne de caractères' })
  @MaxLength(50, { message: 'La classe de vol ne peut pas dépasser 50 caractères' })
  classe_vol?: string;

  @IsOptional()
  @IsArray({ message: 'Les escales doivent être un tableau' })
  @IsString({ each: true, message: 'Chaque escale doit être une chaîne de caractères' })
  escales?: string[];

  // General fields for all article types
  @IsOptional()
  @IsString({ message: 'La ville de départ doit être une chaîne de caractères' })
  @MaxLength(255, { message: 'La ville de départ ne peut pas dépasser 255 caractères' })
  ville_depart?: string;

  @IsOptional()
  @IsString({ message: 'Le type de vol doit être une chaîne de caractères' })
  @MaxLength(50, { message: 'Le type de vol ne peut pas dépasser 50 caractères' })
  type_fly?: string;

  // Réservation hôtels-specific fields
  @IsOptional()
  @IsDateString({}, { message: 'La date de check-in doit être au format valide (YYYY-MM-DD)' })
  date_check_in?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La date de check-out doit être au format valide (YYYY-MM-DD)' })
  date_check_out?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Le nombre de nuits doit être un nombre valide' })
  @Min(1, { message: 'Le nombre de nuits doit être au moins 1' })
  nombre_nuits?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Le nombre de chambres doit être un nombre valide' })
  @Min(1, { message: 'Le nombre de chambres doit être au moins 1' })
  nombre_chambres?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Le nombre de personnes doit être un nombre valide' })
  @Min(1, { message: 'Le nombre de personnes doit être au moins 1' })
  nombre_personnes?: number;

  @IsOptional()
  @IsString({ message: 'Le type de chambre doit être une chaîne de caractères' })
  @MaxLength(100, { message: 'Le type de chambre ne peut pas dépasser 100 caractères' })
  type_chambre?: string;

  @IsOptional()
  @IsArray({ message: 'Les services de l\'hôtel doivent être un tableau' })
  @IsString({ each: true, message: 'Chaque service doit être une chaîne de caractères' })
  services_hotel?: string[];

  @IsOptional()
  @IsString({ message: 'L\'adresse de l\'hôtel doit être une chaîne de caractères' })
  @MaxLength(500, { message: 'L\'adresse de l\'hôtel ne peut pas dépasser 500 caractères' })
  adresse_hotel?: string;

  @IsOptional()
  @IsString({ message: 'La ville de l\'hôtel doit être une chaîne de caractères' })
  @MaxLength(255, { message: 'La ville de l\'hôtel ne peut pas dépasser 255 caractères' })
  ville_hotel?: string;

  @IsOptional()
  @IsString({ message: 'Le pays de l\'hôtel doit être une chaîne de caractères' })
  @MaxLength(255, { message: 'Le pays de l\'hôtel ne peut pas dépasser 255 caractères' })
  pays_hotel?: string;
}

