// needs to be first import, it loads the polyfills
import { AngularRendererModule } from '@nitedani/angular-renderer-nestjs';
import { Module } from '@nestjs/common';
import { AppComponent } from 'src/app/app.component';
import { SharedModule } from 'src/shared.module';
import { AppController } from './app.controller';

@Module({
  controllers: [AppController],
  // nestjs providers
  providers: [],

  imports: [
    AngularRendererModule.forRoot({
      page: AppComponent,
      // import only on server
      imports: [SharedModule],
      // provide only on server
      providers: [],
    }),
  ],
})
export class AppModule {}
