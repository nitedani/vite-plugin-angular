import { Component, ViewChild, ViewContainerRef } from '@angular/core';

@Component({
  standalone: true,
  template: `
    <div>Layout works</div>
    <a href="/about">Go to about page</a>
    <a href="/">Go to index page</a>
    <ng-template #page></ng-template>
  `,
})
export class Layout {
  @ViewChild('page', { static: true, read: ViewContainerRef })
  page!: ViewContainerRef;
}
