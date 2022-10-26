import { Inject, Injectable } from '@angular/core';

@Injectable()
export class AppService {
  // pageContext is globally available for injection
  constructor(@Inject('pageContext') pageContext: any) {}
  getHello(): string {
    return `Hello from ${import.meta.env.SSR ? 'server' : 'client'}`;
  }
}
