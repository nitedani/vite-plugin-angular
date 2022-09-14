import { Component, ViewChild, ViewContainerRef } from '@angular/core';

@Component({
  standalone: true,
  template: `<div>
    <div>Wrapper works</div>
    <a href="/about">Go to about page</a>
    <a href="/">Go to index page</a>
    <ng-template #page></ng-template>
  </div> `,
})
export class WrapperPage {
  @ViewChild('page', { static: true, read: ViewContainerRef })
  page: ViewContainerRef;
}
