import { Injectable } from '@angular/core';

@Injectable()
export class AppService {
  getHello(): string {
    return `Hello from ${import.meta.env.SSR ? 'server' : 'client'}`;
  }
}
