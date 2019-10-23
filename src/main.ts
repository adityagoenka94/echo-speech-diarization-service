import { NestFactory } from '@nestjs/core';
import * as bodyParser from 'body-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // enable large json files by default
  app.use(bodyParser.json({limit: '50mb', type: 'application/json'}));
  app.use(bodyParser.text({limit: '50mb', type: 'text/plain'}));
  app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
  await app.listen(3000);
}
bootstrap();
