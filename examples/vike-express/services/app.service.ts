import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

@Injectable()
export class AppService {
  httpClient = inject(HttpClient);
  async getHello() {
    const response = await this.httpClient
      .get<{ message: string }>('/api/hello')
      .toPromise();
    console.log(response?.message);
  }
}
