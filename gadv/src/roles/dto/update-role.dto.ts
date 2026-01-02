import { PartialType } from '@nestjs/mapped-types';
import { IsString, MaxLength, IsArray, IsOptional, IsNumber, ValidateIf } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { CreateRoleDto } from './create-role.dto';

export class UpdateRoleDto extends PartialType(CreateRoleDto) {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @ValidateIf((o) => o.permission_ids !== undefined)
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

