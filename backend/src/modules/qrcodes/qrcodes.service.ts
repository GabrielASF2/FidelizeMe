import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { GenerateQrCodeDto } from './dto/generate-qrcode.dto';
import * as crypto from 'crypto'; // Nativo do Node.js

@Injectable()
export class QrcodesService {
  constructor(private readonly supabase: SupabaseService) {}

  async generateToken(userId: string, data: GenerateQrCodeDto) {
    const client = this.supabase.getClient();

    // 1. Verificar propriedade da Loja
    const { data: establishment } = await client
      .from('establishments')
      .select('id')
      .eq('id', data.establishment_id)
      .eq('owner_id', userId)
      .single();

    if (!establishment) {
      throw new UnauthorizedException(
        'Estabelecimento não encontrado ou não pertence a você.',
      );
    }

    // 2. Gerar Token Único (Hash aleatório)
    const token = crypto.randomBytes(32).toString('hex');

    // 3. Definir Expiração (5 minutos a partir de agora)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);

    // 4. Salvar na tabela qr_tokens
    const { error } = await client.from('qr_tokens').insert({
      establishment_id: data.establishment_id,
      token: token,
      points_amount: 1, // Padrão: 1 selo por scan
      expires_at: expiresAt.toISOString(),
    });

    if (error) {
      throw new InternalServerErrorException(
        'Erro ao gerar QR Code: ' + error.message,
      );
    }

    // Retorna o token para o Front-end gerar a imagem do QR
    return {
      token,
      expires_at: expiresAt,
      establishment_id: data.establishment_id,
    };
  }
}
