import { IsNotEmpty, IsNumber, IsDateString, Min } from 'class-validator';

export class CreateSessionDto {
  @IsNotEmpty()
  @IsNumber()
  article_id: number;

  @IsNotEmpty()
  @IsDateString()
  date: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  nombre_place: number;
}

