import { PartialType } from '@nestjs/mapped-types';
import { CreateInfoAgenceDto } from './create-info-agence.dto';

export class UpdateInfoAgenceDto extends PartialType(CreateInfoAgenceDto) {}

