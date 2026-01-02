import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeArticleController } from './type-article.controller';
import { TypeArticleService } from './type-article.service';
import { TypeArticle } from '../entities/type-article.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TypeArticle])],
  controllers: [TypeArticleController],
  providers: [TypeArticleService],
  exports: [TypeArticleService],
})
export class TypeArticleModule {}

