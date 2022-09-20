import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { AppService } from './app.service';

@Component({
  standalone: true,
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  counter = 0;
  constructor(private appService: AppService, private httpClient: HttpClient) {
    httpClient.get('/api').subscribe((data) => {
      console.log(data);
    });
    console.log(appService.getHello());
  }

  increment() {
    this.counter++;
  }
}
