import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { NgxBlurhashComponent } from 'ngx-blurhash-render';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    NgxBlurhashComponent,
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
