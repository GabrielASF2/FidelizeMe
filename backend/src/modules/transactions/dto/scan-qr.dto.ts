import { IsNotEmpty, IsString } from 'class-validator';

export class ScanQrDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class RedeemDto {
  card_id: string;
}
