import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { AppService } from './app.service';

@Component({
  selector: 'heavy-component',
  standalone: true,
  imports: [CommonModule],
  template: `
    HEAVY LOADED:
    <p>{{ title }}</p>
  `,
})
export class HeavyComponent implements OnInit {
  title: string = 'Heavy Component';

  ngOnInit(): void {
    this.title = 'Heavy Component Loaded';
  }
}

@Component({
  standalone: true,
  selector: 'app-component',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [HeavyComponent],
})
export class AppComponent implements OnInit {
  counter = 0;
  appService = inject(AppService);
  httpClient = inject(HttpClient);

  ngOnInit(): void {
    this.httpClient.get('/api').subscribe((data) => {
      console.log(data);
    });
    console.log(this.appService.getHello());
  }

  increment() {
    this.counter++;
  }
}
