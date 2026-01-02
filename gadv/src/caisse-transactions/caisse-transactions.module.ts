import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaisseTransactionsController } from './caisse-transactions.controller';
import { CaisseTransactionsService } from './caisse-transactions.service';
import { CaisseTransaction } from '../entities/caisse-transaction.entity';
import { Caisse } from '../entities/caisse.entity';
import { User } from '../entities/user.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([CaisseTransaction, Caisse, User]),
    ],
    controllers: [CaisseTransactionsController],
    providers: [CaisseTransactionsService],
    exports: [CaisseTransactionsService],
})
export class CaisseTransactionsModule { }
