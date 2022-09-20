import './style.scss';
import { renderPage } from '@nitedani/vite-plugin-angular/client';
import { AppComponent } from './app/app.component';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { AppService } from './app/app.service';

renderPage({
  page: AppComponent,
  imports: [CommonModule, MatButtonModule],
  providers: [AppService],
});
