// needs to be first import, it loads the polyfills
import { renderPage } from '@nitedani/vite-plugin-angular/client';
import { AppComponent } from './app/app.component';
import { SharedModule } from './shared.module';

renderPage({
  page: AppComponent,
  // import only on client
  imports: [SharedModule],
  // provide only on client
  providers: [],
});
