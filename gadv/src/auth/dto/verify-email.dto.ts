import { IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyEmailDto {
  @IsNotEmpty()
  @IsString()
  @Length(6, 6, { message: 'Le code de vérification doit contenir exactement 6 chiffres' })
  code: string;
}
