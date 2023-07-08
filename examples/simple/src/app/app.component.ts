import { Component } from '@angular/core';
import { AppService } from './app.service';

@Component({
  standalone: true,
  selector: 'app-component',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  constructor(private appService: AppService) {
    console.log(appService.getHello());
  }
}
