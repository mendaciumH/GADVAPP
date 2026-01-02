import { PartialType } from '@nestjs/mapped-types';
import { CreateTypeArticleDto } from './create-type-article.dto';

export class UpdateTypeArticleDto extends PartialType(CreateTypeArticleDto) {}

