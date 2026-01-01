import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Habilitar CORS (Permite que o Front na porta 3001 chame o Back na 3000)
  app.enableCors();

  // 2. Habilitar Validação Global (Já que estamos mexendo aqui, ativa os DTOs)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remove campos que não estão no DTO
      forbidNonWhitelisted: true, // Dá erro se mandar campo extra
      transform: true, // Converte tipos automaticamente (ex: string "10" vira number 10)
    }),
  );

  await app.listen(3000);
}
void bootstrap();
