import { Component, Input, OnInit } from '@angular/core';

@Component({
  standalone: true,
  template: `<div>Error page works</div>`,
})
export default class Page implements OnInit {
  @Input() pageProps: any;

  ngOnInit() {
    console.log(`Running on ${import.meta.env.SSR ? 'server' : 'browser'} `);
    console.log('Page props', this.pageProps);
  }
}
