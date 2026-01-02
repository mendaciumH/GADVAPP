import { PartialType } from '@nestjs/mapped-types';
import { CreateTaxeDto } from './create-taxe.dto';

export class UpdateTaxeDto extends PartialType(CreateTaxeDto) {}

