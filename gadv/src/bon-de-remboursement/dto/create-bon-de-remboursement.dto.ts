import { IsNumber, IsString, IsOptional, IsDateString, Min } from 'class-validator';

export class CreateBonDeRemboursementDto {
    @IsNumber()
    client_id: number;

    @IsNumber()
    commande_id: number;

    @IsOptional()
    @IsString()
    numero?: string;

    @IsNumber()
    @Min(0)
    montant: number;

    @IsOptional()
    @IsDateString()
    date_remboursement?: string;

    @IsOptional()
    @IsString()
    motif?: string;
}
