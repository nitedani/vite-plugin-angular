import { Component } from '@angular/core';
import { AppService } from './app.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  constructor(private appService: AppService, private httpClient: HttpClient) {
    httpClient.get('/api').subscribe((data) => {
      console.log(data);
    });
    console.log(appService.getHello());
  }
}
