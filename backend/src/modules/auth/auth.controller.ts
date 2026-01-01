import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SyncProfileDto } from './dto/sync-profile.dto';
import { SupaAuthGuard } from '../../common/guards/supa-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sync')
  @UseGuards(SupaAuthGuard) // <--- Protege a rota!
  async sync(@Req() req, @Body() body: SyncProfileDto) {
    // O Guard colocou o user dentro do req.user
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const userId = req.user.id;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument
    return this.authService.syncProfile(userId, body);
  }
}
