import { renderPage } from '@nitedani/vite-plugin-angular/client';
import { provideHttpClient } from '@angular/common/http';
import { SharedModule } from './shared.module';
import { RootComponent } from './pages/layout';

renderPage({
  page: RootComponent,
  imports: [SharedModule],
  providers: [provideHttpClient()],
});
