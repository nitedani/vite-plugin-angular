import { Module } from '@nestjs/common';
import { AppServerModule } from 'src/main.server';
import { AngularUniversalModule } from './universal.module';
import { AppController } from './app.controller';

@Module({
  controllers: [AppController],
  imports: [
    AngularUniversalModule.forRoot({
      bootstrap: AppServerModule,
    }),
  ],
  providers: [],
})
export class AppModule {}
