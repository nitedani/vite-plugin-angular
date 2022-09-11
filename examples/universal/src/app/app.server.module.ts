import { NgModule } from '@angular/core';
import { ServerModule } from '@angular/platform-server';
import { AppModule } from './app.module';
import { AppComponent } from './app.component';
import { XhrFactory } from '@angular/common';
//@ts-ignore
import * as xhr2 from 'xhr2';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { UniversalInterceptorService } from './modules/universal-interceptor/universal-interceptor.service';
export class ServerXhr implements XhrFactory {
  build(): XMLHttpRequest {
    xhr2.prototype._restrictedHeaders.cookie = false;
    return new xhr2.XMLHttpRequest();
  }
}
@NgModule({
  imports: [AppModule, ServerModule],
  bootstrap: [AppComponent],
  providers: [
    { provide: XhrFactory, useClass: ServerXhr },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: UniversalInterceptorService,
      multi: true,
    },
  ],
})
export class AppServerModule {}
