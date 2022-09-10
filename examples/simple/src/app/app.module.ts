import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { AppComponent } from './app.component';
import { AppService } from './app.service';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, CommonModule],
  bootstrap: [AppComponent],
  providers: [AppService],
})
export class AppModule {}
