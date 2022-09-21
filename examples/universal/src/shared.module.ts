import { NgModule } from '@angular/core';
import { AppService } from './app/app.service';

// This module is imported on client, inside src/main.ts
// This module is imported on server, inside server/app.module.ts
// SharedModule provides AppService on client and server

@NgModule({
  imports: [],
  providers: [AppService],
})
export class SharedModule {
  constructor() {
    console.log(
      'This is a shared module, it is imported on client and server.'
    );
  }
}
