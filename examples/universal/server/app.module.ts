import { Module } from '@nestjs/common';
import { AngularUniversalModule } from '@nitedani/angular-renderer-nestjs';
import { AppComponent } from 'src/app/app.component';
import { AppController } from './app.controller';

@Module({
  controllers: [AppController],
  imports: [
    AngularUniversalModule.forRoot({
      page: AppComponent,
    }),
  ],
  providers: [],
})
export class AppModule {}
