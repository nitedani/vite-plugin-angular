import 'zone.js/dist/zone';
import { bootstrapApplication } from '@angular/platform-browser';
import { importProvidersFrom } from '@angular/core';
import { RoutingModule } from './routing.module';
import { RootComponent } from './pages/layout';
import { AppService } from './services/app.service';

bootstrapApplication(RootComponent, {
  providers: [AppService, importProvidersFrom(RoutingModule)],
});
