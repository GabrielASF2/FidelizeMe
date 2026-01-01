import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { EstablishmentsService } from './establishments.service';
import { CreateEstablishmentDto } from './dto/create-establishment.dto';
import { SupaAuthGuard } from '../../common/guards/supa-auth.guard';

@Controller('establishments')
export class EstablishmentsController {
  constructor(private readonly establishmentsService: EstablishmentsService) {}

  @Post()
  @UseGuards(SupaAuthGuard) // <--- Só dono logado cria loja
  async create(@Req() req, @Body() body: CreateEstablishmentDto) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const userId = req.user.id;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument
    return this.establishmentsService.create(userId, body);
  }
}
