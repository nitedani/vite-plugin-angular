import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { routes } from './router';
import { RootComponent } from './pages/layout';
import { AppService } from './services/app.service';
import { provideRouter } from '@angular/router';

bootstrapApplication(RootComponent, {
  providers: [AppService, provideRouter(routes)],
});
