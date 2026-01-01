import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseService } from './supabase.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [SupabaseService],
  exports: [SupabaseService], // Exportamos para outros módulos usarem
})
export class SupabaseModule {}
