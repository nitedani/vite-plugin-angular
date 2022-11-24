import { renderPage } from '@nitedani/vite-plugin-angular/client';
import { provideHttpClient } from '@angular/common/http';
import { AppComponent } from './app/app.component';
import { SharedModule } from './shared.module';

renderPage({
  page: AppComponent,
  imports: [SharedModule],
  providers: [provideHttpClient()],
});
