import { IsString, MaxLength, IsArray, IsOptional, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateRoleDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => {
    if (!Array.isArray(value)) return value;
    return value.map((id: any) => {
      const num = typeof id === 'string' ? parseInt(id, 10) : id;
      return isNaN(num) ? id : num;
    });
  })
  @IsNumber({}, { each: true })
  permission_ids?: number[];
}

