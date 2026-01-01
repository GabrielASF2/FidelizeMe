import { IsEmail, IsOptional, IsString, IsIn } from 'class-validator';

export class SyncProfileDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  full_name?: string;

  @IsString()
  @IsOptional()
  avatar_url?: string;

  // Opcional: só se quisermos permitir que o front decida o papel no cadastro inicial
  @IsOptional()
  @IsString()
  role?: 'OWNER' | 'CUSTOMER';
}
