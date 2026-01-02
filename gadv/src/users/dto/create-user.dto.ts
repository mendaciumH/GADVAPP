import { IsString, IsEmail, IsOptional, IsNumber, MinLength, MaxLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  username: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  @MinLength(6)
  @MaxLength(255)
  motdepasse: string;

  @IsOptional()
  @IsNumber()
  role_id?: number;
}

