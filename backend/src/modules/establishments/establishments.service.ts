import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateEstablishmentDto } from './dto/create-establishment.dto';

@Injectable()
export class EstablishmentsService {
  constructor(private readonly supabase: SupabaseService) {}

  async create(userId: string, data: CreateEstablishmentDto) {
    const client = this.supabase.getClient();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { data: establishment, error } = await client
      .from('establishments')
      .insert({
        owner_id: userId, // Vincula a loja ao dono logado
        name: data.name,
        slug: data.slug,
        address: data.address,
      })
      .select()
      .single();

    if (error) {
      // Dica: Tratar erro de "Slug duplicado" aqui seria ótimo
      throw new InternalServerErrorException(error.message);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return establishment;
  }
}
