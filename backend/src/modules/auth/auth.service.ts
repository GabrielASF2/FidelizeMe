import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { SyncProfileDto } from './dto/sync-profile.dto';

@Injectable()
export class AuthService {
  constructor(private readonly supabase: SupabaseService) {}

  async syncProfile(userId: string, data: SyncProfileDto) {
    const client = this.supabase.getClient();

    // 1. Criamos o objeto de atualização com os dados básicos
    // Usamos 'any' aqui para poder adicionar propriedades dinamicamente
    const profileData: any = {
      id: userId, // Vínculo forte com o Auth do Supabase
      email: data.email,
      full_name: data.full_name,
      avatar_url: data.avatar_url,
      // REMOVEMOS a linha "role: ..." daqui.
    };

    // 2. Lógica de Proteção da Role:
    // Só incluímos a role no update se ela veio no DTO.
    // Se for undefined (login automático/F5), não enviamos nada,
    // assim o banco mantém o valor atual (ex: OWNER) ou usa o default (CUSTOMER).
    if (data.role) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      profileData.role = data.role;
    }

    // 3. Upsert na tabela 'profiles'
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { data: profile, error } = await client
      .from('profiles')
      .upsert(profileData)
      .select()
      .single();

    if (error) {
      console.error('Erro ao sincronizar perfil:', error);
      throw new InternalServerErrorException(
        'Não foi possível salvar o perfil do usuário',
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return profile;
  }
}
