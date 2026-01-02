import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArticlesController } from './articles.controller';
import { ArticlesPublicController } from './articles-public.controller';
import { ArticlesService } from './articles.service';
import { Article } from '../entities/article.entity';
import { Commande } from '../entities/commande.entity';
import { SessionsModule } from '../sessions/sessions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Article, Commande]),
    forwardRef(() => SessionsModule),
  ],
  controllers: [ArticlesController, ArticlesPublicController],
  providers: [ArticlesService],
  exports: [ArticlesService],
})
export class ArticlesModule {}

