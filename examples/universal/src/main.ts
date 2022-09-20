import { HttpClientModule } from '@angular/common/http';
import { renderPage } from '@nitedani/vite-plugin-angular/client';
import { AppComponent } from './app/app.component';

renderPage({
  page: AppComponent,
  imports: [HttpClientModule],
});
