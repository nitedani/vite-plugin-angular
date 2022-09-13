import {
  Component,
  ComponentRef,
  Input,
  OnChanges,
  reflectComponentType,
  SimpleChanges,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';

@Component({
  standalone: true,
  template: `<div>
    <div>Wrapper works</div>
    <ng-template #page></ng-template>
  </div> `,
})
export class Wrapper implements OnChanges {
  @ViewChild('page', { static: true, read: ViewContainerRef })
  pageTemplateRef: ViewContainerRef;

  #pageRef: ComponentRef<any>;

  @Input() pageProps: any;
  @Input() page: any;

  ngOnChanges(changes) {
    this.mountPage(changes);
  }

  mountPage(changes: SimpleChanges) {
    if (changes.page && this.page) {
      this.#pageRef = this.pageTemplateRef.createComponent(this.page);
    }

    if (changes.page || changes.pageProps) {
      const propsToCheck =
        changes.pageProps?.currentValue || this.pageProps || {};
      const mirror = reflectComponentType(this.page);
      for (const i of mirror.inputs) {
        if (i.propName in propsToCheck || i.templateName in propsToCheck) {
          this.#pageRef.setInput(i.propName, this.pageProps[i.propName]);
        }
        if (i.propName === 'pageProps' || i.templateName === 'pageProps') {
          this.#pageRef.setInput('pageProps', this.pageProps);
        }
      }
    }
  }
}
