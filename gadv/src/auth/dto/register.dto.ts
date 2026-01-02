import { IsEmail, IsNotEmpty, IsString, MinLength, IsInt, IsOptional } from 'class-validator';

export class RegisterDto {
    @IsNotEmpty()
    @IsString()
    firstName: string;

    @IsNotEmpty()
    @IsString()
    lastName: string;

    @IsNotEmpty()
    @IsEmail()
    email: string;

    @IsNotEmpty()
    @IsString()
    @MinLength(6)
    password: string;

    @IsNotEmpty()
    @IsString()
    phone: string;

    @IsOptional()
    @IsInt()
    address_id?: number;

    @IsNotEmpty()
    @IsInt()
    role: number;
} 