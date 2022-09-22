// needs to be first import, it loads the polyfills
import { renderPage } from '@nitedani/vite-plugin-angular/client';
import { RoutingModule } from './routing.module';
import { RootComponent } from './pages/layout';
import { AppService } from './services/app.service';

renderPage({
  page: RootComponent,
  imports: [RoutingModule],
  providers: [AppService],
});
