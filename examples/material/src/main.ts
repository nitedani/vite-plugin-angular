import './style.scss';
// needs to be first import, it loads the polyfills
import { renderPage } from '@nitedani/vite-plugin-angular/client';
import { AppComponent } from './app/app.component';
import { AppService } from './app/app.service';

renderPage({
  page: AppComponent,
  // provide globally available services
  providers: [AppService],
});
