import { Component } from '@angular/core';
import { AppService } from './app.service';
import { MaterialModule } from './material.module';

@Component({
  standalone: true,
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [MaterialModule],
})
export class AppComponent {
  constructor(private appService: AppService) {
    console.log(appService.getHello());
  }
}
