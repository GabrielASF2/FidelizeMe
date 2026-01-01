import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { ScanQrDto } from './dto/scan-qr.dto';
import { RedeemPointsDto } from './dto/redeem-points.dto';
import { SupaAuthGuard } from '../../common/guards/supa-auth.guard';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post('scan')
  @UseGuards(SupaAuthGuard) // Cliente tem que estar logado
  async scan(@Req() req, @Body() body: ScanQrDto) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const userId = req.user.id;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.transactionsService.scan(userId, body);
  }

  @Post('redeem')
  @UseGuards(SupaAuthGuard) // Só o Dono chama isso
  async redeem(@Req() req, @Body() body: RedeemPointsDto) {
    const ownerId = req.user.id;
    return this.transactionsService.redeem(ownerId, body.card_id);
  }
}
