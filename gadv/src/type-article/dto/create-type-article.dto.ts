import { IsString, MaxLength } from 'class-validator';

export class CreateTypeArticleDto {
  @IsString()
  @MaxLength(255)
  description: string;
}

