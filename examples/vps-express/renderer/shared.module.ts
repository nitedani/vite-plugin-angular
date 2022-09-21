import { NgModule } from '@angular/core';
import { AppService } from 'services/app.service';

// This module is imported on client, inside _default.page.client.ts
// This module is imported on server, inside _default.page.server.ts
// SharedModule provides AppService on client and server
@NgModule({
  imports: [],
  providers: [AppService],
})
export class SharedModule {
  constructor() {
    console.log('This is a shared module, it is imported on client and server');
  }
}
