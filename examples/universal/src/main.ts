import { HttpClientModule } from '@angular/common/http';
import { renderPage } from '@nitedani/vite-plugin-angular/client';
import { AppComponent } from './app/app.component';

renderPage({
  page: AppComponent,
  // import only on client
  imports: [HttpClientModule],
  // provide only on client
  providers: [],
});
