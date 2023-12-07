// needs to be first import, it loads the polyfills
import { AngularRendererModule } from '@nitedani/angular-renderer-nestjs';
import { Module } from '@nestjs/common';
import { SharedModule } from 'src/shared.module';
import { AppController } from './app.controller';
import { RootComponent } from 'src/pages/layout';

@Module({
  controllers: [AppController],
  // nestjs providers
  providers: [],

  imports: [
    AngularRendererModule.forRoot({
      page: RootComponent,
      // import only on server
      imports: [SharedModule],
      // provide only on server
      providers: [],
    }),
  ],
})
export class AppModule {}
