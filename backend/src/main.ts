import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { FiltreExceptionsGlobal } from './commun/filtres/exceptions.filter';
import { ReponseInterceptor } from './commun/intercepteurs/reponse.interceptor';

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

  // Format d'erreur { error: { message, code } } et de succès { data } uniformes,
  // convenus avec le développeur frontend comme contrat d'API stable.
  app.useGlobalFilters(new FiltreExceptionsGlobal());
  app.useGlobalInterceptors(new ReponseInterceptor());

  app.setGlobalPrefix('api/v1');
  app.enableCors();

  const configSwagger = new DocumentBuilder()
    .setTitle('DBC SAAS API')
    .setDescription("Documentation de l'API du backend DBC SAAS")
    .setVersion('1.0')
    .build();
  const documentSwagger = SwaggerModule.createDocument(app, configSwagger);
  SwaggerModule.setup('api/docs', app, documentSwagger);

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  await app.listen(port, '0.0.0.0');
  // eslint-disable-next-line no-console
  console.log(`DBC backend démarré sur le port ${port}`);
}
bootstrap();
