import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';

@Injectable()
export class CampaignsService {
  constructor(private readonly supabase: SupabaseService) {}

  async create(userId: string, data: CreateCampaignDto) {
    const client = this.supabase.getClient();

    // 1. Verificar se a loja pertence ao usuário logado (SEGURANÇA)
    const { data: establishment, error: findError } = await client
      .from('establishments')
      .select('id')
      .eq('id', data.establishment_id)
      .eq('owner_id', userId) // O pulo do gato: owner tem que ser quem tá logado
      .single();

    if (findError || !establishment) {
      throw new UnauthorizedException(
        'Você não é dono desta loja ou ela não existe.',
      );
    }

    // 2. Criar a campanha
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { data: campaign, error } = await client
      .from('campaigns')
      .insert({
        establishment_id: data.establishment_id,
        name: data.name,
        description: data.description,
        goal_count: data.goal_count,
        active: true,
      })
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return campaign;
  }
}
