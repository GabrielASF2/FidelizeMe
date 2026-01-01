import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { QrcodesService } from './qrcodes.service';
import { GenerateQrCodeDto } from './dto/generate-qrcode.dto';
import { SupaAuthGuard } from '../../common/guards/supa-auth.guard';

@Controller('qrcodes')
export class QrcodesController {
  constructor(private readonly qrcodesService: QrcodesService) {}

  @Post('generate')
  @UseGuards(SupaAuthGuard)
  async generate(@Req() req, @Body() body: GenerateQrCodeDto) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const userId = req.user.id;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.qrcodesService.generateToken(userId, body);
  }
}
