import { PartialType } from '@nestjs/mapped-types';
import { CreateReductionDto } from './create-reduction.dto';

export class UpdateReductionDto extends PartialType(CreateReductionDto) {}

