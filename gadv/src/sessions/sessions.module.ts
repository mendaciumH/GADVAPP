import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
import { Session } from '../entities/session.entity';
import { Article } from '../entities/article.entity';
import { Commande } from '../entities/commande.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Session, Article, Commande])],
  controllers: [SessionsController],
  providers: [SessionsService],
  exports: [SessionsService],
})
export class SessionsModule {}

