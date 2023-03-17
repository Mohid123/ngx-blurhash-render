import { NgOptimizedImage } from '@angular/common';
import { NgModule } from '@angular/core';
import { NgxBlurhashComponent } from './ngx-blurhash.component';



@NgModule({
  declarations: [
    NgxBlurhashComponent
  ],
  imports: [
    NgOptimizedImage
  ],
  exports: [
    NgxBlurhashComponent
  ]
})
export class NgxBlurhashModule { }
