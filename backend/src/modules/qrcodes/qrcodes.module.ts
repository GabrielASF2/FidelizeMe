import { Module } from '@nestjs/common';
import { QrcodesController } from './qrcodes.controller';
import { QrcodesService } from './qrcodes.service';

@Module({
  controllers: [QrcodesController],
  providers: [QrcodesService]
})
export class QrcodesModule {}
