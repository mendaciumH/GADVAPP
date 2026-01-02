import { IsString, IsNumber, IsNotEmpty, Min } from 'class-validator';


export class ReplaceLogoDto {
    @IsString()
    @IsNotEmpty()
    pdfFileId: string;

    @IsString()
    @IsNotEmpty()
    logoFileId: string;

    @IsNumber()
    @Min(1)
    pageNumber: number;

    @IsNumber()
    @Min(0)
    x: number;

    @IsNumber()
    @Min(0)
    y: number;

    @IsNumber()
    @Min(1)
    width: number;

    @IsNumber()
    @Min(1)
    height: number;
}
