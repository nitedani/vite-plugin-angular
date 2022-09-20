// needs to be first import, it loads the polyfills
import { renderPage } from '@nitedani/vite-plugin-angular/client';
import { HttpClientModule } from '@angular/common/http';
import { AppComponent } from './app/app.component';
import { SharedModule } from './shared.module';

renderPage({
  page: AppComponent,
  // import only on client
  imports: [SharedModule, HttpClientModule],
  // provide only on client
  providers: [],
});
