import { PartialType } from '@nestjs/mapped-types';
import { CreateCompagnieAerienneDto } from './create-compagnie-aerienne.dto';

export class UpdateCompagnieAerienneDto extends PartialType(CreateCompagnieAerienneDto) {}

