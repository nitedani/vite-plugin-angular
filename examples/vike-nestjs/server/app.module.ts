import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { VpsModule } from '@nitedani/vite-plugin-ssr-adapter-nestjs';
@Module({
  controllers: [AppController],
  imports: [VpsModule],
  providers: [],
})
export class AppModule {}
