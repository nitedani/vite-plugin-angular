import { Module } from '@nestjs/common';
import { VpsModule } from './vps.module';
import { AppController } from './app.controller';

@Module({
  controllers: [AppController],
  imports: [VpsModule.forRoot()],
  providers: [],
})
export class AppModule {}
