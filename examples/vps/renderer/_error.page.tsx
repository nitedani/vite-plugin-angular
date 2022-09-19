import { Component, Input, OnChanges, OnInit } from '@angular/core';
export { Page };

@Component({
  standalone: true,
  template: `<div>Error page works</div>`,
})
class Page implements OnInit {
  @Input() pageProps: any;

  ngOnInit() {
    console.log(`Running on ${import.meta.env.SSR ? 'server' : 'browser'} `);
    console.log('Page props', this.pageProps);
  }
}
