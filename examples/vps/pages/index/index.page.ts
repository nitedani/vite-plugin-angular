import {
  AfterViewInit,
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { OnApplicationShutdown } from '@nestjs/common';
export { Page };

@Component({
  standalone: true,
  selector: 'my-component',
  template: `<div>Index page works</div>`,
})
class Page implements OnChanges {
  @Input('pageProps') pageProps: any;

  ngOnChanges() {
    console.log(`Running on ${import.meta.env.SSR ? 'server' : 'browser'} `);
    console.log('Page props', this.pageProps);
  }
}
