import { IsNumber, IsDateString, Min, IsOptional } from 'class-validator';

export class UpdateSessionDto {
  @IsOptional()
  @IsNumber()
  article_id?: number;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  nombre_place?: number;
}

