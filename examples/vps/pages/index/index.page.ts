import { Component, Input, OnInit } from '@angular/core';
import { Layout } from 'pages/default.layout';
export { Page, Layout };

@Component({
  standalone: true,
  template: `<div>Index page works</div>`,
})
class Page implements OnInit {
  ngOnInit(): void {
    console.log(`Running on ${import.meta.env.SSR ? 'server' : 'browser'} `);
    console.log('Page props', this.pageProps);
  }
  @Input() pageProps: any;
}
