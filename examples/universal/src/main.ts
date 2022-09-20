import { renderPage } from '@nitedani/vite-plugin-angular/client'; // <-- needs to be first import
import { AppComponent } from './app/app.component';
import { SharedModule } from './shared.module';

renderPage({
  page: AppComponent,
  // import only on client
  imports: [SharedModule],
  // provide only on client
  providers: [],
});
