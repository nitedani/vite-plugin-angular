import { renderPage } from '@nitedani/vite-plugin-angular/client';
import { HttpClientModule } from '@angular/common/http';
import { AppComponent } from './app/app.component';
import { AppService } from './app/app.service';

renderPage({
  page: AppComponent,
  imports: [HttpClientModule],
  providers: [AppService],
});
