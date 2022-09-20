import { NgModule } from '@angular/core';
import { AppService } from './app/app.service';

// This module is imported on client, inside src/main.ts
// This module is imported on server, inside server/app.module.ts

@NgModule({
  imports: [],
  providers: [AppService],
})
export class SharedModule {}
