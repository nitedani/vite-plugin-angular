import { Module } from '@nestjs/common';
import { AngularUniversalModule } from '@nitedani/angular-renderer-nestjs';
import { AppComponent } from 'src/app/app.component';
import { AppController } from './app.controller';

@Module({
  controllers: [AppController],
  // nestjs providers
  providers: [],

  imports: [
    AngularUniversalModule.forRoot({
      page: AppComponent,
      // import only on server
      imports: [],
      // provide only on server
      providers: [],
    }),
  ],
})
export class AppModule {}
