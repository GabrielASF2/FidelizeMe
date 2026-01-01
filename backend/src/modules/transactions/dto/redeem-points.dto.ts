import { IsNotEmpty, IsUUID } from 'class-validator';

export class RedeemPointsDto {
  @IsUUID()
  @IsNotEmpty()
  card_id: string;
}
