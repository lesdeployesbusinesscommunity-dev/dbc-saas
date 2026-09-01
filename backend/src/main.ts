import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { FiltreExceptionsGlobal } from './commun/filtres/exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Validation automatique des DTO entrants (class-validator)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // supprime les champs non déclarés dans le DTO
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Format d'erreur uniforme RFC 7807, tel que défini dans le cahier de conception
  app.useGlobalFilters(new FiltreExceptionsGlobal());

  app.setGlobalPrefix('api/v1');
  app.enableCors();

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  await app.listen(port, '0.0.0.0');
  // eslint-disable-next-line no-console
  console.log(`DBC backend démarré sur le port ${port}`);
}
bootstrap();
