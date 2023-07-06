import { Component, ViewChild, ViewContainerRef } from '@angular/core';

export interface IDefaultWrapper {
  page: ViewContainerRef;
}

@Component({
  standalone: true,
  template: `<ng-template #page></ng-template>`,
})
export class DefaultWrapper implements IDefaultWrapper {
  @ViewChild('page', { static: true, read: ViewContainerRef })
  page: ViewContainerRef;
}
