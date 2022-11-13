import './style.scss';
import 'zone.js/dist/zone';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { AppService } from './app/app.service';

bootstrapApplication(AppComponent, {
  providers: [AppService],
});
