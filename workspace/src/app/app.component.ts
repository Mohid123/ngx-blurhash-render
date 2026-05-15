import { Component } from '@angular/core';
import { NgxBlurhashComponent, NgxBlurhashDirective } from '../../projects/ngx-blurhash-render/src/public-api';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  imports: [NgxBlurhashComponent, NgxBlurhashDirective],
  styleUrls: ['./app.component.css'],
  standalone: true,
})
export class AppComponent {

  onLoaded(label: string): void {
    console.log(`[ngx-blurhash-render] "${label}" loaded`);
  }

  onError(label: string, event: Event): void {
    console.warn(`[ngx-blurhash-render] "${label}" failed`, event);
  }
}
