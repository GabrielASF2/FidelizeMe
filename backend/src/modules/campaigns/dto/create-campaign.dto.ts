import { IsInt, IsNotEmpty, IsString, IsUUID, Min } from 'class-validator';

export class CreateCampaignDto {
  @IsString()
  @IsNotEmpty()
  name: string; // Ex: "Almoço Grátis"

  @IsString()
  description?: string; // Ex: "Junte 10 ganhe 1"

  @IsInt()
  @Min(1)
  goal_count: number; // Ex: 10

  @IsUUID()
  establishment_id: string; // ID da loja que criamos no passo anterior
}
