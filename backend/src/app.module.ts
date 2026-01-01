import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from './modules/supabase/supabase.module';
import { AuthModule } from './modules/auth/auth.module';
// Importe seus outros módulos aqui conforme for criando
// import { AuthModule } from './modules/auth/auth.module';
import { EstablishmentsModule } from './modules/establishments/establishments.module';
import { CampaignsModule } from './modules/campaigns/campaigns.module';
import { QrcodesModule } from './modules/qrcodes/qrcodes.module';
import { TransactionsModule } from './modules/transactions/transactions.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // Lê o .env
    SupabaseModule,
    AuthModule,
    EstablishmentsModule,
    CampaignsModule,
    QrcodesModule,
    TransactionsModule,
    // ... outros módulos
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
