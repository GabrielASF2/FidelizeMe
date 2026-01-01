import { IsUUID, IsNotEmpty } from 'class-validator';

export class GenerateQrCodeDto {
  @IsUUID()
  @IsNotEmpty()
  establishment_id: string;
}
