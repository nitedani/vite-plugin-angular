import { Injectable } from '@angular/core';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
}
