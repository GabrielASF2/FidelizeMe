import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { ScanQrDto } from './dto/scan-qr.dto';

@Injectable()
export class TransactionsService {
  constructor(private readonly supabase: SupabaseService) {}

  async scan(userId: string, data: ScanQrDto) {
    const client = this.supabase.getClient();

    // 1. Validar o Token do QR Code
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { data: qrToken, error: qrError } = await client
      .from('qr_tokens')
      .select('*')
      .eq('token', data.token)
      .single();

    if (qrError || !qrToken) throw new NotFoundException('QR Code inválido.');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (qrToken.used_at)
      throw new ConflictException('Este QR Code já foi utilizado.');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    if (new Date(qrToken.expires_at) < new Date())
      throw new BadRequestException('QR Code expirado.');

    // 2. Buscar Campanha Ativa da Loja
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { data: campaign, error: campError } = await client
      .from('campaigns')
      .select('*')
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      .eq('establishment_id', qrToken.establishment_id)
      .eq('active', true)
      .single();

    if (campError || !campaign)
      throw new NotFoundException('Não há campanha ativa nesta loja.');

    // 3. Buscar ou Criar o Cartão Fidelidade do Cliente
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    let { data: card } = await client
      .from('loyalty_cards')
      .select('*')
      .eq('user_id', userId)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      .eq('campaign_id', campaign.id)
      .single();

    if (!card) {
      // Cria o cartão zerado se não existir
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const { data: newCard, error: createError } = await client
        .from('loyalty_cards')
        .insert({
          user_id: userId,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          campaign_id: campaign.id,
          current_balance: 0,
        })
        .select()
        .single();

      if (createError)
        throw new InternalServerErrorException(
          'Erro ao criar cartão fidelidade.',
        );
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      card = newCard;
    }

    // 4. Efetivar a Transação (Dar o Ponto)
    // Atualiza saldo do cartão +1
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const newBalance = card.current_balance + qrToken.points_amount;

    const { error: updateCardError } = await client
      .from('loyalty_cards')
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      .update({ current_balance: newBalance, last_activity_at: new Date() })
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      .eq('id', card.id);

    if (updateCardError)
      throw new InternalServerErrorException('Erro ao atualizar saldo.');

    // Registra histórico
    await client.from('transactions').insert({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      card_id: card.id,
      type: 'EARN',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      amount: qrToken.points_amount,
    });

    // 5. Queimar o Token (Impedir reuso)
    await client
      .from('qr_tokens')
      .update({ used_at: new Date() })
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      .eq('id', qrToken.id);

    return {
      success: true,
      message: 'Ponto adicionado com sucesso!',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      new_balance: newBalance,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      goal: campaign.goal_count,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      establishment: campaign.name, // Ou nome da loja se fizer join
    };
  }

  async redeem(ownerId: string, cardId: string) {
    const client = this.supabase.getClient();

    // 1. Buscar o cartão e garantir que ele pertence a uma loja DESTE Dono
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { data: card, error } = await client
      .from('loyalty_cards')
      .select(
        `
        *,
        campaigns (
            goal_count,
            establishments ( owner_id )
        )
      `,
      )
      .eq('id', cardId)
      .single();

    if (error || !card) throw new NotFoundException('Cartão não encontrado.');

    // 2. Validação de Segurança (O Dono Logado é dono da loja desse cartão?)
    // O retorno do supabase vem aninhado: campaigns -> establishments -> owner_id
    // Precisamos fazer o cast para any ou tipar corretamente para ler
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const cardData: any = card;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (cardData.campaigns.establishments.owner_id !== ownerId) {
      throw new UnauthorizedException('Este cartão não pertence à sua loja.');
    }

    // 3. Verificar Saldo
    const goal = cardData.campaigns.goal_count;
    if (card.current_balance < goal) {
      throw new BadRequestException(`Saldo insuficiente. O cliente tem ${card.current_balance} de ${goal}.`);
    }

    // 4. Debitar Pontos (Reseta o saldo ou subtrai a meta? Vamos subtrair a meta para permitir acumulo)
    const newBalance = card.current_balance - goal;
    const newRedeemedCount = (card.total_redeemed || 0) + 1;

    const { error: updateError } = await client
      .from('loyalty_cards')
      .update({ 
        current_balance: newBalance,
        total_redeemed: newRedeemedCount,
        last_activity_at: new Date()
      })
      .eq('id', cardId);

    if (updateError) throw new InternalServerErrorException('Erro ao debitar pontos.');

    // 5. Registrar Transação
    await client.from('transactions').insert({
      card_id: cardId,
      type: 'REDEEM', // Tipo diferente!
      amount: goal,
      created_by: ownerId
    });

    return { success: true, message: 'Resgate efetuado! Entregue o prêmio.', new_balance: newBalance };
  }
}
