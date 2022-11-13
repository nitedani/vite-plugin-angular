import { Component } from '@angular/core';

@Component({
  standalone: true,
  template: `
    <div>Layout works</div>
    <a href="/about">Go to about page</a>
    <a href="/">Go to index page</a>
    <ng-content></ng-content>
  `,
})
export class Layout {}
