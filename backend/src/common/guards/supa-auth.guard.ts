import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../../modules/supabase/supabase.service';

@Injectable()
export class SupaAuthGuard implements CanActivate {
  constructor(private readonly supabaseService: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const request = context.switchToHttp().getRequest();

    // 1. Pegar o token do cabeçalho "Authorization: Bearer <token>"
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const authHeader = request.headers['authorization'];
    if (!authHeader) throw new UnauthorizedException('Token não fornecido');

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const token = authHeader.split(' ')[1];
    if (!token) throw new UnauthorizedException('Token inválido');

    // 2. Validar com o Supabase
    const client = this.supabaseService.getClient();
    const {
      data: { user },
      error,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    } = await client.auth.getUser(token);

    if (error || !user) {
      throw new UnauthorizedException('Sessão expirada ou inválida');
    }

    // 3. Injetar o usuário no request para usarmos nos Controllers
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    request['user'] = user;

    return true;
  }
}
