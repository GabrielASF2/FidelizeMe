import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class CreateEstablishmentDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug deve conter apenas letras minúsculas e hífens',
  })
  slug: string; // Ex: hamburgueria-do-joao (usado na URL)

  @IsString()
  address?: string;
}
